"""Shared helpers: idempotent file writes, backups, command runner."""
from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional, Sequence

BACKUP_ROOT = Path("/var/backups/asterops")


@dataclass
class CommandResult:
    code: int
    stdout: str
    stderr: str

    @property
    def ok(self) -> bool:
        return self.code == 0


def make_backup_dir() -> Path:
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%SZ")
    out = BACKUP_ROOT / ts
    out.mkdir(parents=True, exist_ok=True)
    return out


def write_file(path, content, *, dry_run=False, backup_dir=None, mode=0o640):
    p = Path(path)
    existing = p.read_text() if p.exists() else None
    if existing == content:
        return False
    if dry_run:
        return True
    if existing is not None and backup_dir is not None:
        rel = str(p).lstrip("/").replace("/", "_")
        (backup_dir / rel).write_text(existing)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)
    os.chmod(p, mode)
    return True


def run(cmd, *, check=False, timeout=30):
    try:
        proc = subprocess.run(list(cmd), check=False, capture_output=True, text=True, timeout=timeout)
        result = CommandResult(proc.returncode, proc.stdout or "", proc.stderr or "")
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        result = CommandResult(127, "", f"{type(exc).__name__}: {exc}")
    if check and not result.ok:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{result.stderr}")
    return result


def which(binary):
    return shutil.which(binary)