# AsterOps Agent

The AsterOps agent is a small daemon that runs on each Asterisk host and connects out
to your AsterOps dashboard. It:

1. Enrolls itself using a one-time token from the dashboard.
2. Polls for pending pjsip.conf updates and applies them via asterisk -rx 'pjsip reload'.
3. Tails /var/log/asterisk/cdr-csv/Master.csv and streams CDR records to the dashboard.
4. Reports heartbeat, agent version, Asterisk version, and TLS cert expiry.

All traffic is outbound HTTPS — no inbound ports are required, the agent works
behind NAT or restrictive firewalls.

## HTTP API

All endpoints are at /api/public/agent/* and require Authorization: Bearer <agent_token>.

- POST /api/public/agent/enroll  — exchange the one-time enrollment token for a long-lived agent token (the enrollment token is invalidated immediately).
- POST /api/public/agent/status  — heartbeat; reports agent_version, asterisk_version, active_calls, cert_expires_at.
- GET  /api/public/agent/configs — returns the latest pending pjsip.conf bundle (or null).
- POST /api/public/agent/configs — acknowledge a config after applying ({ config_id, state, notes? }).
- POST /api/public/agent/cdr     — batch-stream up to 500 CDR records; idempotent by (server_id, uniqueid).

## Reference implementation

A production-grade Go agent ships in this directory:

    agent/
      main.go                          # single-file daemon (~500 LOC)
      go.mod
      systemd/asterops-agent.service   # hardened systemd unit
      install.sh                       # one-shot installer + enrollment

Quick install on the Asterisk host (root):

    curl -fsSL https://raw.githubusercontent.com/asterops/asterops/main/agent/install.sh \
      | sudo bash -s -- \
          --dashboard https://your-dashboard.example.com \
          --token   ao_xxxxxxxxxxxxxxxxxxxxxx

The installer builds the binary, writes `/etc/asterops/agent/config.json`,
enrolls with the dashboard (consuming the one-time enrollment token), and
enables the `asterops-agent` systemd service.

### TLS lifecycle

The agent also implements `GET/POST /api/public/agent/tls` to support:

- **Uploaded PEM** — operator pastes a cert in the dashboard; agent writes
  it to `/etc/asterisk/keys/asterisk.crt` and reloads Asterisk.
- **Let's Encrypt** — agent runs `certbot certonly --standalone` for the
  requested domain, symlinks the live cert into `/etc/asterisk/keys/`, and
  reports the resulting fingerprint + `not_after` back to the dashboard.
  Renewals are requested from the dashboard ("Renew" button) and the agent
  runs the same flow with `--keep-until-expiring`.
- **Self-signed** — agent generates an ECDSA P-256 cert locally for the
  given CN.

All reloads use `asterisk -rx 'core reload'` after the new files are written
atomically via `rename(2)`, so in-progress calls are not dropped.

Contributions welcome.

## Security model

- The enrollment token is single-use and consumed on first enroll.
- The long-lived agent token is stored only as a SHA-256 hash in the dashboard database.
- TLS private keys for Asterisk never leave the host. The dashboard tracks only the
  public certificate fingerprint and expiry.
- Operators can rotate the enrollment token at any time, which invalidates the existing
  agent token and forces re-enrollment.
