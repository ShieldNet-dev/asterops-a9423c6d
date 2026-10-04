"""Small, validated HTTP client for the AsterOps control plane."""
from __future__ import annotations

import json
import os
import stat
from pathlib import Path
from typing import Any

import requests


def config_path(value: str | None = None) -> Path:
    return Path(value or os.environ.get("ASTEROPS_CONFIG_FILE", "/etc/asterops/agent.env"))


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def write_env_file(path: Path, values: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = "".join(f"{key}={value}\n" for key, value in values.items())
    path.write_text(content)
    path.chmod(stat.S_IRUSR | stat.S_IWUSR)


def enroll(*, control_plane_url: str, enrollment_token: str, path: Path, force: bool = False) -> str:
    current = read_env_file(path)
    if current.get("ASTEROPS_AGENT_TOKEN") and not force:
        raise RuntimeError(f"{path} already contains an agent token; use --force to rotate it")
    url = control_plane_url.rstrip("/") + "/agent-enroll"
    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json={"enrollment_token": enrollment_token},
            timeout=(5, 30),
        )
        payload: Any = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise RuntimeError(f"enrollment request failed: {exc}") from exc
    if not 200 <= response.status_code < 300 or not payload.get("agent_token"):
        detail = payload.get("error", f"HTTP {response.status_code}") if isinstance(payload, dict) else f"HTTP {response.status_code}"
        raise RuntimeError(f"enrollment rejected: {detail}")
    current["ASTEROPS_URL"] = control_plane_url.rstrip("/")
    current["ASTEROPS_AGENT_TOKEN"] = str(payload["agent_token"])
    current.setdefault("ASTEROPS_PROFILE", "baseline")
    write_env_file(path, current)
    return str(payload["agent_token"])


def post_status(*, control_plane_url: str, agent_token: str, agent_version: str) -> None:
    url = control_plane_url.rstrip("/") + "/agent-status"
    response = requests.post(
        url,
        headers={"Authorization": f"Bearer {agent_token}", "Content-Type": "application/json"},
        data=json.dumps({"agent_version": agent_version}),
        timeout=(5, 15),
    )
    if not 200 <= response.status_code < 300:
        raise RuntimeError(f"status update failed with HTTP {response.status_code}: {response.text[:300]}")