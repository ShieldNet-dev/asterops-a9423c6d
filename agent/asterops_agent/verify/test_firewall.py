from __future__ import annotations
from ..util import run, which
from . import CheckResult

name = "firewall.sip_udp_blocked"


def run_check(profile):
    r = CheckResult(name=name, severity="warn")
    if not which("iptables"):
        r.passed = False
        r.message = "iptables not installed"
        return r
    res = run(["iptables", "-S", "INPUT"])
    blocked = "5060" not in res.stdout and "-P INPUT DROP" in res.stdout
    r.passed = blocked
    r.message = "SIP UDP/TCP not exposed at the firewall" if blocked else "SIP UDP/TCP appears reachable"
    return r
