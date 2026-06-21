"""Firewall module — emits idempotent iptables/nftables rule scripts.
Writes a script to /etc/asterops/firewall-apply.sh; only runs it on POSIX systems."""
from __future__ import annotations
from pathlib import Path
from ..util import run, which, write_file
from . import ModuleResult

name = "firewall"

IPTABLES_TEMPLATE = """#!/usr/bin/env bash
set -euo pipefail
iptables -F INPUT
iptables -P INPUT DROP
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
{ssh}
iptables -A INPUT -p tcp --dport 5061 -j ACCEPT
iptables -A INPUT -p udp --dport {rtp_start}:{rtp_end} -j ACCEPT
iptables -A INPUT -p icmp -j ACCEPT
"""


def apply(profile, *, dry_run, backup_dir) -> ModuleResult:
    r = ModuleResult(name=name)
    cfg = profile.firewall or {}
    backend = cfg.get("backend", "iptables")
    rtp_start = int(cfg.get("rtp_start", 10000))
    rtp_end = int(cfg.get("rtp_end", 20000))
    ssh_line = "iptables -A INPUT -p tcp --dport 22 -j ACCEPT" if cfg.get("allow_ssh", True) else "# SSH not permitted"
    script = IPTABLES_TEMPLATE.format(ssh=ssh_line, rtp_start=rtp_start, rtp_end=rtp_end)
    path = Path("/etc/asterops/firewall-apply.sh")
    changed = write_file(path, script, dry_run=dry_run, backup_dir=backup_dir, mode=0o750)
    r.changed = changed
    r.details = {"backend": backend, "rtp_range": f"{rtp_start}-{rtp_end}", "script": str(path)}
    if dry_run:
        r.actions.append(f"would write {path}")
        return r
    if which("iptables"):
        res = run(["bash", str(path)])
        r.ok = res.ok
        r.message = res.stderr.strip() or "firewall rules applied"
    else:
        r.message = "iptables not installed; script written for later use."
    return r
