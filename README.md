<div align="center">

# AsterOps

<div align="left">
An Open-source Centralized Management System, automating security hardening integration, configurations and Security Audit for Asterisk servers.

<div align="center">
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![React](https://img.shields.io/badge/dashboard-React_18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Asterisk](https://img.shields.io/badge/asterisk-18%20%7C%2020%20%7C%2022-F5821F.svg)](https://www.asterisk.org)
[![Status](https://img.shields.io/badge/status-beta-orange.svg)](#roadmap)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-3ddc97.svg)](#contributing)

</div>

---

## Why AsterOps?

Running Asterisk in production should not require hand-rolled bash scripts, ad-hoc cron jobs, and a screenshot folder of `pjsip show endpoints`. **AsterOps** is the open-source operations layer that voice engineers and MSPs actually want: a hardened Python agent that lives on each PBX, a small React control plane that visualises the fleet, and a deterministic configuration engine that turns YAML into byte-identical Asterisk config every time.

It started as a final-year university project on automated VoIP security hardening — and it stays a real product after that, because the problem doesn't graduate.

## Highlights

- 🔒 **Hardening engine** — TLS 1.2, SRTP-SDES, `fail2ban`, `iptables`/`nftables`, AMI lockdown, SSH lockdown, file-permission enforcement. Idempotent. Backed up. Dry-run by default.
- 🧠 **Auto-configuration** — define your extensions and trunks in YAML, get deterministic `pjsip.conf` / `extensions.conf` / `rtp.conf` (same input, same bytes, every time).
- 📊 **Posture reports** — JSON + single-file HTML (optional PDF). Score 0–100, per-check pass/fail, remediation hints. Uploaded to the dashboard for fleet-wide visibility.
- 🛰️ **Control plane** — React dashboard with a sidebar app shell, fleet view, security posture view, provisioning workspace, call records, audit log, and alerting.
- 🔌 **Pluggable platforms** — Asterisk first; FreeSWITCH, Kamailio, OpenSIPS slot in behind a small `VoipPlatform` interface.
- 🧪 **Tested** — golden-file tests for the renderer, profile loader tests, scoring tests.

## Architecture

```text
                  ┌─────────────────────────────┐
                  │      AsterOps Dashboard     │   React + Vite SPA, deployable to
                  │   (fleet, posture, calls)   │   Vercel / Netlify / anywhere static
                  └────────────┬────────────────┘
                               │ HTTPS (JWT-auth)
                  ┌────────────▼────────────────┐
                  │  Control plane edge funcs   │   Hosted (Lovable Cloud / Supabase)
                  │  Postgres + RLS + storage   │
                  └────────────▲────────────────┘
                               │ HTTPS (per-agent token)
   ┌───────────────────────────┼───────────────────────────┐
   │                           │                           │
┌──▼──────────────┐    ┌───────▼─────────┐        ┌────────▼────────┐
│ AsterOps agent  │    │ AsterOps agent  │  ...   │ AsterOps agent  │
│  (Python CLI)   │    │  (Python CLI)   │        │  (Python CLI)   │
│ ┌─────────────┐ │    │                 │        │                 │
│ │ Hardening   │ │    │  Asterisk PBX   │        │  Asterisk PBX   │
│ │ Auto-config │ │    │  (SIP/TLS 5061) │        │  (SIP/TLS 5061) │
│ │ Verify      │ │    │                 │        │                 │
│ │ Reporter    │ │    │                 │        │                 │
│ └─────────────┘ │    │                 │        │                 │
└─────────────────┘    └─────────────────┘        └─────────────────┘
```

## Quick start

### 1. Install the agent on your PBX

```bash
pip install asterops-agent
sudo asterops profiles                # list built-in profiles
sudo asterops run --profile baseline --dry-run
sudo asterops run --profile baseline
```

### 2. Auto-configure your PBX from YAML

```yaml
# inventory.yaml
server_name: hq-pbx-01
tls_only: true
rtp_start: 10000
rtp_end: 20000

endpoints:
  - extension: "1001"
    display_name: "Reception"
    codecs: [opus, ulaw, alaw]
    tls_required: true
    srtp_required: true

trunks:
  - name: telnyx-primary
    host: sip.telnyx.com
    port: 5061
    username: my-trunk-user
    transport: transport-tls
    srtp_required: true
```

```bash
sudo asterops provision inventory.yaml --dry-run
sudo asterops provision inventory.yaml
sudo asterisk -rx 'pjsip reload'
```

### 3. Upload posture reports to the dashboard

```bash
export ASTEROPS_URL=https://your-control-plane/functions/v1
export ASTEROPS_AGENT_TOKEN=...
asterops report --profile baseline
```

## Run the dashboard locally

```bash
bun install         # or: npm install
bun run dev         # http://localhost:8080
```

Deployable as a plain Vite SPA to Vercel, Netlify, Cloudflare Pages, or any static host. The dashboard talks to a hosted Supabase-compatible control plane (Lovable Cloud is the easiest option; bring-your-own Supabase works too).

## Repository layout

```text
asterops/
├── agent/                       # Python agent — pip install asterops-agent
│   ├── asterops_agent/
│   │   ├── modules/             # tls, srtp, firewall, fail2ban, ami, ssh, permissions, pjsip_autoconfig
│   │   ├── verify/              # non-destructive checks (TLS handshake, AMI bind, jail status, …)
│   │   ├── report/              # JSON, single-file HTML, optional PDF, dashboard upload
│   │   ├── platforms/           # asterisk/  ← add freeswitch/kamailio next to it
│   │   └── profiles/            # baseline.yaml, contact-center.yaml, msp-multitenant.yaml
│   ├── tests/                   # pytest suite
│   └── pyproject.toml
├── src/                         # React dashboard (Vite + TypeScript + Tailwind)
│   ├── pages/
│   ├── components/app-shell.tsx
│   └── lib/
├── supabase/functions/          # control-plane edge functions
└── README.md
```

## Profiles

| Profile           | Use case                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `baseline`        | Sane opinionated defaults — TLS-only, SRTP required, fail2ban, AMI lockdown |
| `contact-center`  | Larger RTP range, stricter fail2ban thresholds                              |
| `msp-multitenant` | Tighter bans, stricter file permissions, nftables                           |

Bring your own — `--profile path/to/custom.yaml`.

## Security model

- The dashboard never SSHs into your PBX. Every change is initiated by the agent on the host itself, with full local audit.
- Each agent authenticates with a per-server bearer token. Tokens are stored hashed (SHA-256) on the control plane.
- Posture-report data is scoped by Row-Level Security to the organisation that owns the server. Service-role access is restricted to edge functions.
- The hardening engine is idempotent and writes a timestamped backup of every file it touches under `/var/backups/asterops/`.

## Roadmap

- [ ] FreeSWITCH platform adapter
- [ ] Kamailio / OpenSIPS platform adapters
- [ ] Let's Encrypt cert provisioning helper
- [ ] CDR ingestion & call-quality scoring
- [ ] Multi-tenant orgs & SSO
- [ ] Helm chart for the control plane

## Contributing

Issues and PRs are welcome — small, focused changes get reviewed fastest.

```bash
# Python agent
cd agent
pip install -e ".[dev]"
pytest -q

# Dashboard
bun install
bun run dev
```

Please run the agent test suite (`pytest -q`) and the dashboard build (`bun run build`) before opening a PR.

## License

Apache-2.0 © AsterOps contributors. See [LICENSE](LICENSE).

---

<div align="center">
<sub>Built with care for voice engineers who would rather ship features than babysit <code>pjsip.conf</code>.</sub>
</div>
