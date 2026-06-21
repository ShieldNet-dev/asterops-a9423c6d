from dataclasses import asdict
from asterops_agent.report.collector import build_report
from asterops_agent.modules import ModuleResult
from asterops_agent.verify import CheckResult


def test_score_all_pass():
    m = [ModuleResult(name="tls", changed=False, ok=True)]
    c = [
        CheckResult(name="tls.handshake", passed=True, severity="critical"),
        CheckResult(name="srtp.policy", passed=True, severity="critical"),
        CheckResult(name="firewall.x", passed=True, severity="warn"),
    ]
    r = build_report(server_name="h", profile="baseline", platform="asterisk",
                     agent_version="0.1.0", module_results=m, check_results=c)
    assert r.score == 100 and r.failed == 0
    assert r.tls_ok and r.srtp_ok and r.firewall_ok


def test_score_critical_fail():
    c = [CheckResult(name="tls.handshake", passed=False, severity="critical")]
    r = build_report(server_name="h", profile="baseline", platform="asterisk",
                     agent_version="0.1.0", module_results=[], check_results=c)
    assert r.score == 0 and r.failed == 1
