# AsterOps Agent (Python)

The Python agent ships the security-hardening, auto-configuration and posture-reporting engine for AsterOps. Asterisk is the first supported platform, with a pluggable interface for FreeSWITCH, Kamailio and others.

## Install

```bash
pip install asterops-agent
# optional PDF reports
pip install "asterops-agent[pdf]"
```

## Quick start

```bash
# list built-in profiles
asterops profiles

# dry-run the baseline hardening
sudo asterops run --profile baseline --dry-run

# apply baseline hardening and write a posture report
sudo asterops run --profile baseline \
    --report-json /tmp/posture.json \
    --report-html /tmp/posture.html

# only run the verification checks (no system changes)
sudo asterops verify

# generate Asterisk configs from a YAML inventory
sudo asterops provision agent/asterops_agent/example-inventory.yaml --dry-run

# scan + upload posture report to the AsterOps dashboard
asterops report \
    --url https://<your-control-plane>/functions/v1 \
    --token "$ASTEROPS_AGENT_TOKEN"
```

## What it does

- **TLS**: ensures `/etc/asterisk/keys/asterisk.{crt,key}` exist (self-signs if missing) and writes a `transport-tls` block bound to 5061.
- **SRTP**: forces `media_encryption=sdes` on every rendered endpoint.
- **Firewall**: writes idempotent iptables rules — drops UDP/TCP SIP, allows only TLS 5061 + your RTP range.
- **fail2ban**: installs an Asterisk jail with sensible defaults.
- **AMI lockdown**: binds `manager.conf` to loopback.
- **SSH**: disables root login and password auth.
- **Permissions**: enforces `0640` on `/etc/asterisk/*.conf`.
- **Auto-config**: deterministic renderer for `pjsip.conf`, `extensions.conf`, `rtp.conf` from a YAML inventory.
- **Verify**: TLS handshake probe, SRTP policy audit, firewall reachability, fail2ban jail status, AMI bind check.
- **Reports**: machine-readable JSON, single-file HTML, optional PDF, uploadable to the AsterOps dashboard.

## Profiles

| Profile | Use case |
| --- | --- |
| `baseline` | Sane opinionated defaults — TLS-only, SRTP required, fail2ban, AMI lockdown. |
| `contact-center` | Larger RTP range and stricter fail2ban thresholds. |
| `msp-multitenant` | Tighter bans and stricter file permissions for managed-service hosts. |

Custom profile? Point `--profile` at any YAML file.

## Multi-platform roadmap

The engine talks to VoIP stacks through `asterops_agent.platforms.VoipPlatform`. To add a new platform, drop a subdirectory under `platforms/` and register it in `PLATFORMS`. The CLI, profiles, verification and reporting layers stay untouched.

## Development

```bash
pip install -e ".[dev]"
pytest -q
```
