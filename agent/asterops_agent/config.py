"""YAML profile + inventory loader.

A *profile* describes which hardening modules to run and their parameters.
An *inventory* describes the PBX extensions, trunks and dialplan that
`asterops provision` will render into Asterisk config files.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

PROFILES_DIR = Path(__file__).parent / "profiles"


@dataclass
class HardeningProfile:
    name: str
    description: str = ""
    platform: str = "asterisk"
    tls: Dict[str, Any] = field(default_factory=dict)
    srtp: Dict[str, Any] = field(default_factory=dict)
    firewall: Dict[str, Any] = field(default_factory=dict)
    fail2ban: Dict[str, Any] = field(default_factory=dict)
    ami: Dict[str, Any] = field(default_factory=dict)
    ssh: Dict[str, Any] = field(default_factory=dict)
    permissions: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def load(cls, name_or_path: str) -> "HardeningProfile":
        p = Path(name_or_path)
        if not p.exists():
            p = PROFILES_DIR / f"{name_or_path}.yaml"
        if not p.exists():
            raise FileNotFoundError(f"Profile not found: {name_or_path}")
        data = yaml.safe_load(p.read_text()) or {}
        return cls(
            name=data.get("name", p.stem),
            description=data.get("description", ""),
            platform=data.get("platform", "asterisk"),
            tls=data.get("tls", {}) or {},
            srtp=data.get("srtp", {}) or {},
            firewall=data.get("firewall", {}) or {},
            fail2ban=data.get("fail2ban", {}) or {},
            ami=data.get("ami", {}) or {},
            ssh=data.get("ssh", {}) or {},
            permissions=data.get("permissions", {}) or {},
        )

    @classmethod
    def list_builtin(cls) -> List[str]:
        return sorted(p.stem for p in PROFILES_DIR.glob("*.yaml"))


@dataclass
class Endpoint:
    extension: str
    display_name: Optional[str] = None
    context: str = "from-internal"
    codecs: List[str] = field(default_factory=lambda: ["ulaw", "alaw", "opus"])
    transport: str = "transport-tls"
    tls_required: bool = True
    srtp_required: bool = True
    max_contacts: int = 1
    secret: Optional[str] = None


@dataclass
class Trunk:
    name: str
    host: str
    port: int = 5061
    username: Optional[str] = None
    transport: str = "transport-tls"
    srtp_required: bool = True


@dataclass
class Inventory:
    server_name: str
    tls_only: bool = True
    cert_file: str = "/etc/asterisk/keys/asterisk.crt"
    priv_key_file: str = "/etc/asterisk/keys/asterisk.key"
    endpoints: List[Endpoint] = field(default_factory=list)
    trunks: List[Trunk] = field(default_factory=list)
    rtp_start: int = 10000
    rtp_end: int = 20000

    @classmethod
    def load(cls, path: str | Path) -> "Inventory":
        data = yaml.safe_load(Path(path).read_text()) or {}
        return cls(
            server_name=data.get("server_name", "asterisk"),
            tls_only=bool(data.get("tls_only", True)),
            cert_file=data.get("cert_file", "/etc/asterisk/keys/asterisk.crt"),
            priv_key_file=data.get("priv_key_file", "/etc/asterisk/keys/asterisk.key"),
            rtp_start=int(data.get("rtp_start", 10000)),
            rtp_end=int(data.get("rtp_end", 20000)),
            endpoints=[Endpoint(**e) for e in (data.get("endpoints") or [])],
            trunks=[Trunk(**t) for t in (data.get("trunks") or [])],
        )