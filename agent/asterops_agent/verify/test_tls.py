from __future__ import annotations
import socket, ssl
from . import CheckResult

name = "tls.handshake"


def run_check(profile, host="127.0.0.1", port=5061):
    r = CheckResult(name=name, severity="critical")
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with socket.create_connection((host, port), timeout=3) as raw:
            with ctx.wrap_socket(raw, server_hostname=host) as s:
                r.passed = True
                r.message = f"TLS handshake OK ({s.version()}, {s.cipher()[0]})"
                r.details = {"version": s.version(), "cipher": s.cipher()[0]}
    except Exception as exc:
        r.passed = False
        r.message = f"TLS handshake failed: {exc}"
    return r
