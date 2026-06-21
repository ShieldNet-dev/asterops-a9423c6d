"""File permissions for /etc/asterisk."""
from __future__ import annotations
import os
from pathlib import Path
from . import ModuleResult

name = "permissions"


def apply(profile, *, dry_run, backup_dir) -> ModuleResult:
    r = ModuleResult(name=name)
    cfg = profile.permissions or {}
    if not cfg.get("enforce", True):
        r.message = "permissions enforcement disabled."
        return r
    root = Path("/etc/asterisk")
    if not root.exists():
        r.message = "/etc/asterisk not present; skipping."
        return r
    mode = int(str(cfg.get("conf_mode", "0640")), 8)
    changed = 0
    for f in root.rglob("*.conf"):
        try:
            cur = f.stat().st_mode & 0o777
            if cur != mode:
                if not dry_run:
                    os.chmod(f, mode)
                changed += 1
        except OSError:
            pass
    r.changed = changed > 0
    r.details = {"files_adjusted": changed, "conf_mode": oct(mode)}
    r.message = f"adjusted {changed} files" if changed else "permissions already correct"
    return r
