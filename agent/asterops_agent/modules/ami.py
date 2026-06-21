"""AMI lockdown — bind manager.conf to loopback."""
from __future__ import annotations
import re
from pathlib import Path
from ..util import write_file
from . import ModuleResult

name = "ami"


def apply(profile, *, dry_run, backup_dir) -> ModuleResult:
    r = ModuleResult(name=name)
    cfg = profile.ami or {}
    if not cfg.get("lockdown", True):
        r.message = "AMI lockdown disabled by profile."
        return r
    p = Path("/etc/asterisk/manager.conf")
    if not p.exists():
        r.ok = True
        r.message = "manager.conf not present (Asterisk may not be installed yet)."
        return r
    original = p.read_text()
    new = re.sub(r"^bindaddr\s*=.*$", f"bindaddr = {cfg.get('bind', '127.0.0.1')}", original, flags=re.M)
    if "bindaddr" not in new:
        new = new.replace("[general]", f"[general]\nbindaddr = {cfg.get('bind', '127.0.0.1')}", 1)
    r.changed = write_file(p, new, dry_run=dry_run, backup_dir=backup_dir, mode=0o640)
    r.details = {"bind": cfg.get("bind", "127.0.0.1")}
    if dry_run and r.changed:
        r.actions.append("would rewrite manager.conf bindaddr")
    return r
