"""TLS module — generate a self-signed cert if missing, ensure transport-tls is configured.
For production, point cert_file/priv_key_file at a real (Let's Encrypt / corporate CA) cert."""
from __future__ import annotations
import datetime
from pathlib import Path
from . import ModuleResult

name = "tls"


def _generate_self_signed(cert_path: Path, key_path: Path, cn: str) -> None:
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, cn),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "AsterOps"),
    ])
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject).issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.utcnow())
        .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=365))
        .add_extension(x509.SubjectAlternativeName([x509.DNSName(cn)]), critical=False)
        .sign(key, hashes.SHA256())
    )
    cert_path.parent.mkdir(parents=True, exist_ok=True)
    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    key_path.write_bytes(key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ))
    cert_path.chmod(0o644)
    key_path.chmod(0o600)


def apply(profile, *, dry_run: bool, backup_dir) -> ModuleResult:
    r = ModuleResult(name=name)
    cfg = profile.tls or {}
    if not cfg.get("enabled", True):
        r.message = "TLS disabled by profile."
        return r
    cert = Path(cfg.get("cert_file", "/etc/asterisk/keys/asterisk.crt"))
    key = Path(cfg.get("priv_key_file", "/etc/asterisk/keys/asterisk.key"))
    r.details["cert_file"] = str(cert)
    r.details["priv_key_file"] = str(key)
    if cert.exists() and key.exists():
        r.message = "TLS material already present."
        return r
    if not cfg.get("generate_self_signed_if_missing", True):
        r.ok = False
        r.message = f"TLS material missing at {cert} / {key} and self-sign disabled."
        return r
    if dry_run:
        r.changed = True
        r.actions.append(f"would generate self-signed cert at {cert}")
        return r
    try:
        _generate_self_signed(cert, key, cfg.get("cn", "asterisk.local"))
        r.changed = True
        r.actions.append(f"generated self-signed cert at {cert}")
    except Exception as exc:  # pragma: no cover - cryptography availability
        r.ok = False
        r.message = f"cert generation failed: {exc}"
    return r
