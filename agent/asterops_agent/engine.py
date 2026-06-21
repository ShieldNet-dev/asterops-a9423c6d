"""Hardening engine — orchestrates module apply + verify + report."""
from __future__ import annotations
import socket
from . import __version__
from .config import HardeningProfile
from .modules import REGISTRY, ORDER, ModuleResult
from .verify import CHECKS, CheckResult
from .report.collector import build_report
from .util import make_backup_dir


def run_hardening(profile: HardeningProfile, *, dry_run: bool = False, server_name: str | None = None):
    backup_dir = None if dry_run else make_backup_dir()
    module_results: list[ModuleResult] = []
    for key in ORDER:
        mod = REGISTRY[key]
        try:
            module_results.append(mod.apply(profile, dry_run=dry_run, backup_dir=backup_dir))
        except Exception as exc:
            module_results.append(ModuleResult(name=mod.name, ok=False, message=f"crash: {exc}"))
    check_results = run_verification(profile)
    report = build_report(
        server_name=server_name or socket.gethostname(),
        profile=profile.name,
        platform=profile.platform,
        agent_version=__version__,
        module_results=module_results,
        check_results=check_results,
    )
    return report, module_results, check_results


def run_verification(profile: HardeningProfile) -> list[CheckResult]:
    results: list[CheckResult] = []
    for check in CHECKS:
        try:
            results.append(check.run_check(profile))
        except Exception as exc:
            results.append(CheckResult(name=getattr(check, "name", "?"), passed=False, severity="warn", message=f"check crashed: {exc}"))
    return results
