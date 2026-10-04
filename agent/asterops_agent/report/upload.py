"""Upload posture report to the AsterOps dashboard via the agent-report edge function."""
from __future__ import annotations
import json
from dataclasses import asdict
from typing import Optional
import requests


def upload_report(report, *, control_plane_url: str, agent_token: str, report_html: Optional[str] = None) -> bool:
    payload = asdict(report)
    if report_html:
        payload["report_html"] = report_html
    url = control_plane_url.rstrip("/") + "/agent-report"
    headers = {"Authorization": f"Bearer {agent_token}", "Content-Type": "application/json"}
    try:
        resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=(5, 30))
        if not 200 <= resp.status_code < 300:
            raise RuntimeError(f"dashboard returned HTTP {resp.status_code}: {resp.text[:300]}")
        return True
    except requests.RequestException as exc:
        raise RuntimeError(f"could not reach dashboard: {exc}") from exc
