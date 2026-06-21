"""fail2ban module — installs the Asterisk jail snippet."""
from __future__ import annotations
from pathlib import Path
from ..util import write_file, run, which
from . import ModuleResult

name = "fail2ban"

JAIL_TEMPLATE = """[asterisk-iptables]
enabled  = true
filter   = asterisk
action   = iptables-allports[name=ASTERISK, protocol=all]
logpath  = /var/log/asterisk/messages
maxretry = {maxretry}
findtime = {findtime}
bantime  = {bantime}
"""


def apply(profile, *, dry_run, backup_dir) -> ModuleResult:
    r = ModuleResult(name=name)
    cfg = profile.fail2ban or {}
    if not cfg.get("enabled", True):
        r.message = "fail2ban disabled by profile."
        return r
    content = JAIL_TEMPLATE.format(
        maxretry=int(cfg.get("maxretry", 5)),
        findtime=int(cfg.get("findtime", 600)),
        bantime=int(cfg.get("bantime", 86400)),
    )
    path = Path("/etc/fail2ban/jail.d/asterisk.conf")
    r.changed = write_file(path, content, dry_run=dry_run, backup_dir=backup_dir, mode=0o644)
    r.details = {"jail_path": str(path)}
    if dry_run:
        r.actions.append(f"would write {path}")
        return r
    if which("fail2ban-client"):
        run(["systemctl", "enable", "--now", "fail2ban"])
        res = run(["systemctl", "restart", "fail2ban"])
        r.ok = res.ok
        r.message = "fail2ban restarted" if res.ok else res.stderr.strip()
    else:
        r.message = "fail2ban not installed; jail written for later use."
    return r
