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

A minimal Python reference agent (~250 LOC) will live in this directory:

    agent/
      asterops_agent.py     # main loop
      systemd/
        asterops-agent.service
      install.sh

Contributions welcome.

## Security model

- The enrollment token is single-use and consumed on first enroll.
- The long-lived agent token is stored only as a SHA-256 hash in the dashboard database.
- TLS private keys for Asterisk never leave the host. The dashboard tracks only the
  public certificate fingerprint and expiry.
- Operators can rotate the enrollment token at any time, which invalidates the existing
  agent token and forces re-enrollment.
