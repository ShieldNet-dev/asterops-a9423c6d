"""Golden tests for the Asterisk renderer — deterministic output is the contract."""
from asterops_agent.config import Inventory, Endpoint, Trunk
from asterops_agent.platforms import get_platform


def _inv():
    return Inventory(
        server_name="test-pbx",
        tls_only=True,
        endpoints=[
            Endpoint(extension="1001", display_name="A", codecs=["ulaw"]),
            Endpoint(extension="1000", display_name="B", codecs=["opus", "ulaw"]),
        ],
        trunks=[Trunk(name="t1", host="1.2.3.4", username="u")],
    )


def test_deterministic_pjsip():
    p = get_platform("asterisk")
    a = p.render_signalling_config(_inv())
    b = p.render_signalling_config(_inv())
    assert a == b


def test_endpoint_sorted():
    out = get_platform("asterisk").render_signalling_config(_inv())
    assert out.index("[1000]") < out.index("[1001]")


def test_tls_only_omits_udp():
    out = get_platform("asterisk").render_signalling_config(_inv())
    assert "transport-tls" in out
    assert "transport-udp" not in out


def test_srtp_required_is_sdes():
    out = get_platform("asterisk").render_signalling_config(_inv())
    assert "media_encryption=sdes" in out
