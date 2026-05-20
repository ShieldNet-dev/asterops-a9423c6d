#!/usr/bin/env bash
# AsterOps agent installer.
#
# Usage:
#   curl -fsSL https://asterops.dev/install.sh | sudo bash -s -- \
#       --dashboard https://your-dashboard.lovable.app \
#       --token   ao_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
#
# Requires Go 1.22+ to build from source, OR a prebuilt binary at /tmp/asterops-agent.
set -euo pipefail

DASHBOARD=""
ENROLL_TOKEN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dashboard) DASHBOARD="$2"; shift 2 ;;
    --token)     ENROLL_TOKEN="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "Run as root." >&2; exit 1
fi
if [[ -z "$DASHBOARD" || -z "$ENROLL_TOKEN" ]]; then
  echo "Both --dashboard and --token are required." >&2; exit 1
fi

install -d -m 0750 /etc/asterops/agent
install -d -m 0750 /var/lib/asterops

if [[ -x /tmp/asterops-agent ]]; then
  install -m 0755 /tmp/asterops-agent /usr/local/bin/asterops-agent
else
  echo "[*] Building agent from source"
  command -v go >/dev/null || { echo "Go 1.22+ required" >&2; exit 1; }
  TMPDIR="$(mktemp -d)"
  trap 'rm -rf "$TMPDIR"' EXIT
  cp "$(dirname "$0")"/*.go "$(dirname "$0")"/go.mod "$TMPDIR/"
  ( cd "$TMPDIR" && CGO_ENABLED=0 go build -o /usr/local/bin/asterops-agent . )
fi

cat > /etc/asterops/agent/config.json <<EOF
{
  "dashboard_url": "${DASHBOARD%/}",
  "enrollment_token": "${ENROLL_TOKEN}",
  "status_interval_sec": 30,
  "config_interval_sec": 20,
  "cdr_interval_sec": 15
}
EOF
chmod 0600 /etc/asterops/agent/config.json

echo "[*] Enrolling…"
/usr/local/bin/asterops-agent --config /etc/asterops/agent/config.json --enroll

install -m 0644 "$(dirname "$0")/systemd/asterops-agent.service" /etc/systemd/system/asterops-agent.service
systemctl daemon-reload
systemctl enable --now asterops-agent.service

echo "[OK] asterops-agent is running. Tail logs with: journalctl -u asterops-agent -f"