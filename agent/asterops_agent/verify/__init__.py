"""Verifiers — non-destructive checks that probe the running system to confirm hardening."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class CheckResult:
    name: str
    passed: bool = False
    severity: str = "info"  # info | warn | critical
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)


from . import test_tls, test_srtp, test_firewall, test_fail2ban, test_ami  # noqa

CHECKS = [test_tls, test_srtp, test_firewall, test_fail2ban, test_ami]
