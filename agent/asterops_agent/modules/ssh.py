"""SSH hardening — disable root login and password auth."""
from __future__ import annotations
import re
from pathlib import Path
from ..util import write_file, run, which
from . import ModuleResult

name = "ssh"


def _set(text, key, value):
    pat = re.compile(rf"^#?\s*{key}\s+.*$", re.M)
    line = f"{key} {value}"
    if pat.search(text):
        return pat.sub(line, text)
    return text.rstrip() + f"\n{line}\n"


def apply(profile, *, dry_run, backup_dir) -> ModuleResult:
    r = ModuleResult(name=name)
    cfg = profile.ssh or {}
    p = Path("/etc/ssh/sshd_config")
    if not p.exists():
        r.message = "sshd_config not present; skipping."
        return r
    original = p.read_text()
    new = _set(original, "PermitRootLogin", "no" if not cfg.get("permit_root_login", False) else "yes")
    new = _set(new, "PasswordAuthentication", "no" if not cfg.get("password_authentication", False) else "yes")
    r.changed = write_file(p, new, dry_run=dry_run, backup_dir=backup_dir, mode=0o600)
    if dry_run:
        if r.changed:
            r.actions.append("would harden sshd_config")
        return r
    if r.changed and which("systemctl"):
        run(["systemctl", "restart", "sshd"])
    r.message = "sshd hardened" if r.changed else "sshd already hardened"
    return r
