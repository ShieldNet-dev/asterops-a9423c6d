"""Auto-config — render pjsip.conf / extensions.conf / rtp.conf from a YAML inventory."""
from __future__ import annotations
from pathlib import Path
from ..util import write_file
from ..platforms import get_platform
from . import ModuleResult

name = "pjsip_autoconfig"


def apply_inventory(inventory, *, platform_name="asterisk", dry_run=False, backup_dir=None, target_dir=None) -> ModuleResult:
    r = ModuleResult(name=name)
    platform = get_platform(platform_name)
    target = Path(target_dir or platform.config_dir())
    files = platform.files_to_write(inventory)
    changed = []
    for fname, content in files.items():
        path = target / fname
        if write_file(path, content, dry_run=dry_run, backup_dir=backup_dir, mode=0o640):
            changed.append(str(path))
    r.changed = bool(changed)
    r.details = {"files": list(files.keys()), "changed": changed, "target_dir": str(target)}
    r.message = f"rendered {len(files)} config file(s)" + (f", {len(changed)} changed" if changed else ", no changes")
    if dry_run:
        r.actions.extend(f"would write {p}" for p in changed)
    return r
