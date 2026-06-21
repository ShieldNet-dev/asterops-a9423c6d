"""Aggregate module + verify results into a posture report."""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Dict, List


@dataclass
class PostureReport:
    server_name: str
    profile: str
    platform: str
    agent_version: str
    generated_at: str
    score: int
    passed: int
    failed: int
    warnings: int
    tls_ok: bool
    srtp_ok: bool
    firewall_ok: bool
    fail2ban_ok: bool
    ami_locked: bool
    modules: List[Dict[str, Any]] = field(default_factory=list)
    checks: List[Dict[str, Any]] = field(default_factory=list)


SEVERITY_WEIGHT = {"critical": 30, "warn": 10, "info": 5}


def build_report(*, server_name, profile, platform, agent_version, module_results, check_results) -> PostureReport:
    passed = sum(1 for c in check_results if c.passed)
    failed = sum(1 for c in check_results if not c.passed and c.severity == "critical")
    warnings = sum(1 for c in check_results if not c.passed and c.severity == "warn")
    total_weight = sum(SEVERITY_WEIGHT.get(c.severity, 5) for c in check_results) or 1
    lost = sum(SEVERITY_WEIGHT.get(c.severity, 5) for c in check_results if not c.passed)
    score = max(0, min(100, round(100 * (1 - lost / total_weight))))

    def _check(name_substr):
        return next((c for c in check_results if name_substr in c.name and c.passed), None) is not None

    return PostureReport(
        server_name=server_name,
        profile=profile,
        platform=platform,
        agent_version=agent_version,
        generated_at=datetime.utcnow().isoformat() + "Z",
        score=score,
        passed=passed,
        failed=failed,
        warnings=warnings,
        tls_ok=_check("tls"),
        srtp_ok=_check("srtp"),
        firewall_ok=_check("firewall"),
        fail2ban_ok=_check("fail2ban"),
        ami_locked=_check("ami"),
        modules=[asdict(m) for m in module_results],
        checks=[asdict(c) for c in check_results],
    )
