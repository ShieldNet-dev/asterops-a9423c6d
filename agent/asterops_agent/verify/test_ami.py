from __future__ import annotations
import re
from pathlib import Path
from . import CheckResult

name = "ami.loopback_only"


def run_check(profile):
    r = CheckResult(name=name, severity="critical")
    p = Path("/etc/asterisk/manager.conf")
    if not p.exists():
        r.passed = False
        r.message = "manager.conf missing"
        return r
    m = re.search(r"^bindaddr\s*=\s*(\S+)", p.read_text(), flags=re.M)
    bind = m.group(1) if m else "0.0.0.0"
    r.passed = bind in {"127.0.0.1", "::1", "localhost"}
    r.message = f"AMI bound to {bind}"
    r.details = {"bind": bind}
    return r
