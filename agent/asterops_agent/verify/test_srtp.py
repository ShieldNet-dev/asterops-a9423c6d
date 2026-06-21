from __future__ import annotations
from pathlib import Path
from . import CheckResult

name = "srtp.policy"


def run_check(profile):
    r = CheckResult(name=name, severity="critical")
    p = Path("/etc/asterisk/pjsip.conf")
    if not p.exists():
        r.passed = False
        r.message = "pjsip.conf not found"
        return r
    text = p.read_text()
    bad = "media_encryption=no" in text
    sdes = "media_encryption=sdes" in text
    r.passed = sdes and not bad
    r.message = "SRTP enforced on endpoints" if r.passed else "Found unencrypted media policy in pjsip.conf"
    r.details = {"sdes": sdes, "unencrypted": bad}
    return r
