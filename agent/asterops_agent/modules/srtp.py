"""SRTP module — record the required policy; pjsip rendering enforces it per endpoint."""
from __future__ import annotations
from . import ModuleResult

name = "srtp"


def apply(profile, *, dry_run, backup_dir) -> ModuleResult:
    cfg = profile.srtp or {}
    return ModuleResult(
        name=name,
        ok=True,
        message=("SRTP required (sdes)" if cfg.get("required", True) else "SRTP optional"),
        details={"required": bool(cfg.get("required", True)), "optimistic": bool(cfg.get("optimistic", False))},
    )
