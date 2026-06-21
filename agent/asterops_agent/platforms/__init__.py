"""Pluggable VoIP platform interface.

Add a new directory under `platforms/` (e.g. `freeswitch/`, `kamailio/`) and
register it in `PLATFORMS` to support another stack without touching the
hardening engine.
"""
from __future__ import annotations

from .base import VoipPlatform
from .asterisk import AsteriskPlatform

PLATFORMS: dict[str, type[VoipPlatform]] = {
    "asterisk": AsteriskPlatform,
}


def get_platform(name: str) -> VoipPlatform:
    key = (name or "asterisk").lower()
    if key not in PLATFORMS:
        raise ValueError(
            f"Unsupported platform '{name}'. Available: {', '.join(sorted(PLATFORMS))}"
        )
    return PLATFORMS[key]()


__all__ = ["VoipPlatform", "AsteriskPlatform", "PLATFORMS", "get_platform"]