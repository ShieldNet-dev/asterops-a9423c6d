"""Optional PDF report — requires `pip install asterops-agent[pdf]` (weasyprint)."""
from __future__ import annotations


def to_pdf(html_text: str, out_path: str) -> bool:
    try:
        from weasyprint import HTML
    except Exception:
        return False
    HTML(string=html_text).write_pdf(out_path)
    return True
