// AsterOps agent — daemon for an Asterisk host.
//
// Outbound HTTPS only. Implements the /api/public/agent protocol:
//   POST /enroll   — one-time, exchanges enrollment token for long-lived agent token
//   POST /status   — heartbeat (every 30s)
//   GET  /configs  — poll for pending pjsip.conf bundle
//   POST /configs  — ack applied/failed config
//   GET  /tls      — poll for pending cert directive (upload / Let's Encrypt / self-signed)
//   POST /tls      — ack TLS install result with fingerprint + expiry
//   POST /cdr      — batch-stream CDR records from /var/log/asterisk/cdr-csv/Master.csv
//
// Zero-downtime reload: `asterisk -rx 'core reload'` (PJSIP reload preferred)
// is invoked only after files are atomically written via rename(2).
//
// SPDX-License-Identifier: Apache-2.0
package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

const (
	agentVersion   = "0.1.0"
	defaultCfgPath = "/etc/asterops/agent/config.json"
	pjsipPath      = "/etc/asterisk/pjsip.conf"
	certDir        = "/etc/asterisk/keys"
	cdrPath        = "/var/log/asterisk/cdr-csv/Master.csv"
	stateDir       = "/var/lib/asterops"
)

type Config struct {
	DashboardURL    string `json:"dashboard_url"`
	EnrollmentToken string `json:"enrollment_token,omitempty"`
	AgentToken      string `json:"agent_token,omitempty"`
	ServerID        string `json:"server_id,omitempty"`
	Hostname        string `json:"hostname,omitempty"`
	StatusInterval  int    `json:"status_interval_sec,omitempty"`
	ConfigInterval  int    `json:"config_interval_sec,omitempty"`
	CDRInterval     int    `json:"cdr_interval_sec,omitempty"`
}

type Agent struct {
	cfg     *Config
	cfgPath string
	http    *http.Client
	mu      sync.Mutex

	cdrOffset int64
}

func main() {
	cfgPath := flag.String("config", defaultCfgPath, "path to agent config json")
	enroll := flag.Bool("enroll", false, "perform initial enrollment then exit")
	flag.Parse()

	cfg, err := loadConfig(*cfgPath)
	if err != nil {
		log.Fatalf("load config: %v", err)
	}
	if cfg.StatusInterval == 0 {
		cfg.StatusInterval = 30
	}
	if cfg.ConfigInterval == 0 {
		cfg.ConfigInterval = 20
	}
	if cfg.CDRInterval == 0 {
		cfg.CDRInterval = 15
	}
	if cfg.Hostname == "" {
		cfg.Hostname, _ = os.Hostname()
	}

	agent := &Agent{
		cfg:     cfg,
		cfgPath: *cfgPath,
		http: &http.Client{
			Timeout: 30 * time.Second,
		},
	}

	if *enroll || cfg.AgentToken == "" {
		if err := agent.enroll(); err != nil {
			log.Fatalf("enrollment failed: %v", err)
		}
		log.Printf("enrolled successfully as server %s", cfg.ServerID)
		if *enroll {
			return
		}
	}

	if err := os.MkdirAll(stateDir, 0o750); err != nil {
		log.Printf("warn: cannot create state dir: %v", err)
	}
	if b, err := os.ReadFile(filepath.Join(stateDir, "cdr.offset")); err == nil {
		agent.cdrOffset, _ = strconv.ParseInt(strings.TrimSpace(string(b)), 10, 64)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	go runLoop(ctx, time.Duration(cfg.StatusInterval)*time.Second, agent.tickStatus)
	go runLoop(ctx, time.Duration(cfg.ConfigInterval)*time.Second, agent.tickConfig)
	go runLoop(ctx, time.Duration(cfg.ConfigInterval)*time.Second, agent.tickTLS)
	go runLoop(ctx, time.Duration(cfg.CDRInterval)*time.Second, agent.tickCDR)

	log.Printf("asterops-agent %s running. dashboard=%s server=%s", agentVersion, cfg.DashboardURL, cfg.ServerID)
	<-ctx.Done()
	log.Printf("shutting down")
}

func runLoop(ctx context.Context, every time.Duration, fn func(context.Context)) {
	t := time.NewTicker(every)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("loop panic: %v", r)
					}
				}()
				fn(ctx)
			}()
		}
	}
}

/* ---------------- HTTP helpers ---------------- */

func (a *Agent) do(ctx context.Context, method, path string, body any, out any) error {
	var rd io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		rd = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, a.cfg.DashboardURL+path, rd)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if a.cfg.AgentToken != "" {
		req.Header.Set("Authorization", "Bearer "+a.cfg.AgentToken)
	}
	req.Header.Set("User-Agent", "asterops-agent/"+agentVersion)
	resp, err := a.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	rb, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if resp.StatusCode >= 400 {
		return fmt.Errorf("%s %s: HTTP %d: %s", method, path, resp.StatusCode, string(rb))
	}
	if out != nil && len(rb) > 0 {
		return json.Unmarshal(rb, out)
	}
	return nil
}

/* ---------------- Enroll ---------------- */

func (a *Agent) enroll() error {
	if a.cfg.EnrollmentToken == "" {
		return errors.New("no enrollment_token in config — paste the one-time token issued by the dashboard")
	}
	asteriskVer := detectAsteriskVersion()
	var out struct {
		AgentToken string `json:"agent_token"`
		ServerID   string `json:"server_id"`
	}
	err := a.do(context.Background(), "POST", "/api/public/agent/enroll", map[string]any{
		"enrollment_token": a.cfg.EnrollmentToken,
		"agent_version":    agentVersion,
		"asterisk_version": asteriskVer,
		"hostname":         a.cfg.Hostname,
	}, &out)
	if err != nil {
		return err
	}
	a.cfg.AgentToken = out.AgentToken
	a.cfg.ServerID = out.ServerID
	a.cfg.EnrollmentToken = ""
	return saveConfig(a.cfgPath, a.cfg)
}

/* ---------------- Status heartbeat ---------------- */

func (a *Agent) tickStatus(ctx context.Context) {
	body := map[string]any{
		"agent_version":    agentVersion,
		"asterisk_version": detectAsteriskVersion(),
		"active_calls":     activeCallCount(),
	}
	if exp, ok := certExpiryNotAfter(); ok {
		body["cert_expires_at"] = exp.UTC().Format(time.RFC3339)
	}
	if err := a.do(ctx, "POST", "/api/public/agent/status", body, nil); err != nil {
		log.Printf("status: %v", err)
	}
}

/* ---------------- Config polling ---------------- */

func (a *Agent) tickConfig(ctx context.Context) {
	var resp struct {
		Config *struct {
			ID           string `json:"id"`
			Version      int    `json:"version"`
			RenderedText string `json:"rendered_text"`
		} `json:"config"`
	}
	if err := a.do(ctx, "GET", "/api/public/agent/configs", nil, &resp); err != nil {
		log.Printf("configs poll: %v", err)
		return
	}
	if resp.Config == nil {
		return
	}
	log.Printf("applying pjsip.conf v%d", resp.Config.Version)
	state, notes := "applied", ""
	if err := writeAtomic(pjsipPath, []byte(resp.Config.RenderedText), 0o640); err != nil {
		state, notes = "failed", "write: "+err.Error()
	} else if err := asteriskReload("pjsip reload"); err != nil {
		state, notes = "failed", "reload: "+err.Error()
	}
	_ = a.do(ctx, "POST", "/api/public/agent/configs", map[string]any{
		"config_id": resp.Config.ID,
		"state":     state,
		"notes":     notes,
	}, nil)
}

/* ---------------- TLS polling ---------------- */

func (a *Agent) tickTLS(ctx context.Context) {
	var resp struct {
		Cert *struct {
			CertID  string `json:"cert_id"`
			Source  string `json:"source"`
			Domain  string `json:"domain"`
			LeEmail string `json:"le_email"`
			CertPEM string `json:"cert_pem"`
		} `json:"cert"`
	}
	if err := a.do(ctx, "GET", "/api/public/agent/tls", nil, &resp); err != nil {
		log.Printf("tls poll: %v", err)
		return
	}
	if resp.Cert == nil {
		return
	}
	log.Printf("processing TLS directive %s (source=%s domain=%s)", resp.Cert.CertID, resp.Cert.Source, resp.Cert.Domain)

	ack := map[string]any{"cert_id": resp.Cert.CertID, "state": "active"}
	var fp string
	var notAfter time.Time
	var err error

	switch resp.Cert.Source {
	case "uploaded":
		fp, notAfter, err = installUploadedCert(resp.Cert.CertPEM)
	case "letsencrypt":
		fp, notAfter, err = runCertbot(resp.Cert.Domain, resp.Cert.LeEmail)
	case "self_signed":
		fp, notAfter, err = generateSelfSigned(resp.Cert.Domain)
	default:
		err = fmt.Errorf("unknown cert source: %s", resp.Cert.Source)
	}

	if err != nil {
		ack["state"] = "failed"
		ack["last_error"] = err.Error()
		log.Printf("tls install failed: %v", err)
	} else {
		ack["fingerprint_sha256"] = fp
		ack["not_after"] = notAfter.UTC().Format(time.RFC3339)
		// zero-downtime: PJSIP TLS transport picks up new files via reload
		if rerr := asteriskReload("core reload"); rerr != nil {
			ack["state"] = "failed"
			ack["last_error"] = "reload after cert install: " + rerr.Error()
			log.Printf("tls reload failed: %v", rerr)
		} else {
			log.Printf("tls installed, fingerprint=%s expires=%s", fp[:16], notAfter)
		}
	}
	_ = a.do(ctx, "POST", "/api/public/agent/tls", ack, nil)
}

func installUploadedCert(certPEM string) (string, time.Time, error) {
	if !strings.Contains(certPEM, "BEGIN CERTIFICATE") {
		return "", time.Time{}, errors.New("payload missing CERTIFICATE block")
	}
	if err := os.MkdirAll(certDir, 0o750); err != nil {
		return "", time.Time{}, err
	}
	crt := filepath.Join(certDir, "asterisk.crt")
	if err := writeAtomic(crt, []byte(certPEM), 0o644); err != nil {
		return "", time.Time{}, err
	}
	return parseCertMeta(crt)
}

func runCertbot(domain, email string) (string, time.Time, error) {
	if domain == "" || email == "" {
		return "", time.Time{}, errors.New("letsencrypt requires domain + email")
	}
	if _, err := exec.LookPath("certbot"); err != nil {
		return "", time.Time{}, fmt.Errorf("certbot not installed: %w", err)
	}
	cmd := exec.Command("certbot", "certonly",
		"--standalone",
		"--non-interactive",
		"--agree-tos",
		"--email", email,
		"-d", domain,
		"--keep-until-expiring",
	)
	if out, err := cmd.CombinedOutput(); err != nil {
		return "", time.Time{}, fmt.Errorf("certbot: %v: %s", err, string(out))
	}
	live := filepath.Join("/etc/letsencrypt/live", domain)
	if err := symlinkInto(certDir, filepath.Join(live, "fullchain.pem"), "asterisk.crt"); err != nil {
		return "", time.Time{}, err
	}
	if err := symlinkInto(certDir, filepath.Join(live, "privkey.pem"), "asterisk.key"); err != nil {
		return "", time.Time{}, err
	}
	return parseCertMeta(filepath.Join(certDir, "asterisk.crt"))
}

func generateSelfSigned(cn string) (string, time.Time, error) {
	if cn == "" {
		return "", time.Time{}, errors.New("self_signed requires CN")
	}
	if err := os.MkdirAll(certDir, 0o750); err != nil {
		return "", time.Time{}, err
	}
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return "", time.Time{}, err
	}
	serial, _ := rand.Int(rand.Reader, big.NewInt(1<<62))
	tmpl := &x509.Certificate{
		SerialNumber:          serial,
		Subject:               pkix.Name{CommonName: cn},
		NotBefore:             time.Now().Add(-time.Minute),
		NotAfter:              time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth},
		BasicConstraintsValid: true,
		DNSNames:              []string{cn},
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &priv.PublicKey, priv)
	if err != nil {
		return "", time.Time{}, err
	}
	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
	keyBytes, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		return "", time.Time{}, err
	}
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyBytes})
	if err := writeAtomic(filepath.Join(certDir, "asterisk.crt"), certPEM, 0o644); err != nil {
		return "", time.Time{}, err
	}
	if err := writeAtomic(filepath.Join(certDir, "asterisk.key"), keyPEM, 0o600); err != nil {
		return "", time.Time{}, err
	}
	sum := sha256.Sum256(der)
	return hex.EncodeToString(sum[:]), tmpl.NotAfter, nil
}

func parseCertMeta(path string) (string, time.Time, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return "", time.Time{}, err
	}
	block, _ := pem.Decode(raw)
	if block == nil {
		return "", time.Time{}, errors.New("no PEM block in " + path)
	}
	c, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", time.Time{}, err
	}
	sum := sha256.Sum256(c.Raw)
	return hex.EncodeToString(sum[:]), c.NotAfter, nil
}

func symlinkInto(dir, target, name string) error {
	link := filepath.Join(dir, name)
	_ = os.Remove(link)
	return os.Symlink(target, link)
}

func certExpiryNotAfter() (time.Time, bool) {
	_, t, err := parseCertMeta(filepath.Join(certDir, "asterisk.crt"))
	if err != nil {
		return time.Time{}, false
	}
	return t, true
}

/* ---------------- CDR streaming ---------------- */

// CDR fields per /etc/asterisk/cdr.conf default Master.csv layout.
var cdrFields = []string{
	"accountcode", "src", "dst", "dcontext", "clid", "channel", "dstchannel",
	"lastapp", "lastdata", "start", "answer", "end", "duration", "billsec",
	"disposition", "amaflags", "uniqueid", "userfield",
}

func (a *Agent) tickCDR(ctx context.Context) {
	f, err := os.Open(cdrPath)
	if err != nil {
		return
	}
	defer f.Close()
	if _, err := f.Seek(a.cdrOffset, io.SeekStart); err != nil {
		a.cdrOffset = 0
		f.Seek(0, io.SeekStart)
	}
	r := csv.NewReader(f)
	r.FieldsPerRecord = -1
	var batch []map[string]any
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("cdr read: %v", err)
			break
		}
		rec := map[string]any{}
		for i, v := range row {
			if i >= len(cdrFields) {
				break
			}
			rec[cdrFields[i]] = v
		}
		dur, _ := strconv.Atoi(strings.TrimSpace(fmt.Sprint(rec["duration"])))
		bill, _ := strconv.Atoi(strings.TrimSpace(fmt.Sprint(rec["billsec"])))
		entry := map[string]any{
			"uniqueid":    fmt.Sprint(rec["uniqueid"]),
			"src":         fmt.Sprint(rec["src"]),
			"dst":         fmt.Sprint(rec["dst"]),
			"channel":     fmt.Sprint(rec["channel"]),
			"dst_channel": fmt.Sprint(rec["dstchannel"]),
			"lastapp":     fmt.Sprint(rec["lastapp"]),
			"lastdata":    fmt.Sprint(rec["lastdata"]),
			"duration":    dur,
			"billsec":     bill,
			"disposition": normalizeDisposition(fmt.Sprint(rec["disposition"])),
			"amaflags":    fmt.Sprint(rec["amaflags"]),
			"accountcode": fmt.Sprint(rec["accountcode"]),
			"encrypted":   detectEncryptedChannel(fmt.Sprint(rec["channel"]), fmt.Sprint(rec["dstchannel"])),
			"start_ts":    parseCDRTime(fmt.Sprint(rec["start"])),
		}
		if a := parseCDRTime(fmt.Sprint(rec["answer"])); a != "" {
			entry["answer_ts"] = a
		}
		if e := parseCDRTime(fmt.Sprint(rec["end"])); e != "" {
			entry["end_ts"] = e
		}
		if entry["uniqueid"] == "" {
			continue
		}
		batch = append(batch, entry)
		if len(batch) >= 500 {
			a.flushCDR(ctx, batch)
			batch = batch[:0]
		}
	}
	if len(batch) > 0 {
		a.flushCDR(ctx, batch)
	}
	off, _ := f.Seek(0, io.SeekCurrent)
	a.cdrOffset = off
	_ = os.WriteFile(filepath.Join(stateDir, "cdr.offset"), []byte(strconv.FormatInt(off, 10)), 0o640)
}

func (a *Agent) flushCDR(ctx context.Context, batch []map[string]any) {
	if err := a.do(ctx, "POST", "/api/public/agent/cdr", map[string]any{"records": batch}, nil); err != nil {
		log.Printf("cdr post: %v", err)
	}
}

func parseCDRTime(s string) string {
	s = strings.TrimSpace(s)
	if s == "" || s == "0000-00-00 00:00:00" {
		return ""
	}
	for _, layout := range []string{"2006-01-02 15:04:05", time.RFC3339} {
		if t, err := time.ParseInLocation(layout, s, time.Local); err == nil {
			return t.UTC().Format(time.RFC3339)
		}
	}
	return ""
}

func normalizeDisposition(s string) string {
	switch strings.ToUpper(strings.TrimSpace(s)) {
	case "ANSWERED", "NO ANSWER", "NO_ANSWER", "BUSY", "FAILED", "REJECTED", "CONGESTION":
		s = strings.ReplaceAll(strings.ToUpper(strings.TrimSpace(s)), " ", "_")
		return s
	}
	return "UNKNOWN"
}

func detectEncryptedChannel(a, b string) bool {
	x := strings.ToLower(a + " " + b)
	return strings.Contains(x, "tls") || strings.Contains(x, "tcp/tls") || strings.Contains(x, "srtp")
}

/* ---------------- Asterisk shell helpers ---------------- */

func detectAsteriskVersion() string {
	out, err := exec.Command("asterisk", "-V").Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

func activeCallCount() int {
	out, err := exec.Command("asterisk", "-rx", "core show channels count").Output()
	if err != nil {
		return 0
	}
	sc := bufio.NewScanner(bytes.NewReader(out))
	for sc.Scan() {
		line := sc.Text()
		if strings.Contains(line, "active call") {
			parts := strings.Fields(line)
			if len(parts) > 0 {
				n, _ := strconv.Atoi(parts[0])
				return n
			}
		}
	}
	return 0
}

func asteriskReload(cmd string) error {
	out, err := exec.Command("asterisk", "-rx", cmd).CombinedOutput()
	if err != nil {
		return fmt.Errorf("%v: %s", err, string(out))
	}
	return nil
}

/* ---------------- Config I/O ---------------- */

func loadConfig(path string) (*Config, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var c Config
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, err
	}
	if c.DashboardURL == "" {
		return nil, errors.New("config missing dashboard_url")
	}
	c.DashboardURL = strings.TrimRight(c.DashboardURL, "/")
	return &c, nil
}

func saveConfig(path string, c *Config) error {
	b, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		return err
	}
	return writeAtomic(path, b, 0o600)
}

func writeAtomic(path string, data []byte, mode os.FileMode) error {
	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".tmp-*")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Chmod(mode); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmp.Name(), path)
}

// Unused but kept so the binary embeds a usage hint when run with --help.
var _ = base64.StdEncoding