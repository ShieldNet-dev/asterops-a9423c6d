#!/usr/bin/env bash
set -euo pipefail
if [[ $EUID -ne 0 ]]; then echo "must run as root" >&2; exit 1; fi
command -v python3 >/dev/null || { echo "python3 required"; exit 1; }
python3 -m pip install --upgrade asterops-agent
install -d -m 0750 /etc/asterops
[[ -f /etc/asterops/agent.env ]] || cat > /etc/asterops/agent.env <<EOF
ASTEROPS_URL=https://your-control-plane.functions.supabase.co
ASTEROPS_AGENT_TOKEN=replace-me
ASTEROPS_PROFILE=baseline
EOF
install -m 0644 "$(dirname "$0")/systemd/asterops-agent.service" /etc/systemd/system/
install -m 0644 "$(dirname "$0")/systemd/asterops-agent.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now asterops-agent.timer
echo "[OK] AsterOps agent installed. Edit /etc/asterops/agent.env then run: asterops run --profile baseline"
