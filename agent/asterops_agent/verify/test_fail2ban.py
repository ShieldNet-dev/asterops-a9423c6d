from __future__ import annotations
from ..util import run, which
from . import CheckResult

name = "fail2ban.asterisk_jail"


def run_check(profile):
    r = CheckResult(name=name, severity="warn")
    if not which("fail2ban-client"):
        r.message = "fail2ban-client not installed"
        return r
    res = run(["fail2ban-client", "status", "asterisk-iptables"])
    r.passed = res.ok
    r.message = "Asterisk jail active" if r.passed else "Asterisk jail not active"
    return r
