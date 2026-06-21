"""Hardening modules. Each module exposes `name` and `apply(profile, *, dry_run, backup_dir) -> ModuleResult`.
Modules MUST be idempotent and safe to run repeatedly."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class ModuleResult:
    name: str
    changed: bool = False
    ok: bool = True
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    actions: List[str] = field(default_factory=list)


from . import tls, srtp, firewall, fail2ban, ami, ssh, permissions, pjsip_autoconfig  # noqa

REGISTRY = {
    "tls": tls, "srtp": srtp, "firewall": firewall, "fail2ban": fail2ban,
    "ami": ami, "ssh": ssh, "permissions": permissions,
}
ORDER = ["permissions", "tls", "srtp", "ami", "firewall", "fail2ban", "ssh"]
