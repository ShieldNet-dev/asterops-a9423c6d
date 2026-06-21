from __future__ import annotations
import json
from dataclasses import asdict


def to_json(report) -> str:
    return json.dumps(asdict(report), indent=2, sort_keys=True)
