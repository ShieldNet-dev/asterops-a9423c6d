from asterops_agent.config import HardeningProfile


def test_builtin_profiles_load():
    for name in ("baseline", "contact-center", "msp-multitenant"):
        prof = HardeningProfile.load(name)
        assert prof.platform == "asterisk"
        assert prof.tls and prof.srtp
