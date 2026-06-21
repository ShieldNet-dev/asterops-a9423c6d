"""Single-file HTML report. No external CSS; safe to email or open offline."""
from __future__ import annotations
from html import escape

CSS = """
:root{--bg:#0c0f17;--card:#141926;--ink:#e7ecf3;--muted:#8b97ad;--ok:#3ddc97;--warn:#f5a524;--err:#ff5a5f;--brand:#ff7a1f;--border:#202637}
*{box-sizing:border-box}body{margin:0;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;background:var(--bg);color:var(--ink)}
.wrap{max-width:960px;margin:0 auto;padding:32px}
.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:24px}
.hdr h1{margin:0;font:700 22px/1.2 ui-sans-serif,system-ui;letter-spacing:-0.01em}.hdr small{color:var(--muted)}
.score{display:flex;gap:16px;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:24px}
.score .num{font:800 56px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--brand)}
.score .lbl{color:var(--muted);text-transform:uppercase;letter-spacing:.15em;font-size:11px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px}
.tile{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px}
.tile .k{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.12em}
.tile .v{font:700 20px/1.2 ui-sans-serif,system-ui;margin-top:6px}
.ok{color:var(--ok)}.warn{color:var(--warn)}.err{color:var(--err)}
.section{background:var(--card);border:1px solid var(--border);border-radius:14px;margin-bottom:18px;overflow:hidden}
.section h2{margin:0;padding:14px 18px;border-bottom:1px solid var(--border);font:600 13px/1 ui-sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
table{width:100%;border-collapse:collapse}td,th{padding:10px 18px;text-align:left;border-bottom:1px solid var(--border);font-size:13px}
th{color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.08em;font-size:11px}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.pill.ok{background:rgba(61,220,151,.12);color:var(--ok)}.pill.warn{background:rgba(245,165,36,.12);color:var(--warn)}.pill.err{background:rgba(255,90,95,.14);color:var(--err)}
footer{margin-top:24px;color:var(--muted);font-size:12px;text-align:center}
"""


def to_html(report) -> str:
    rows_modules = "".join(
        f"<tr><td>{escape(m['name'])}</td><td>{'changed' if m['changed'] else 'no change'}</td>"
        f"<td>{'OK' if m['ok'] else 'FAIL'}</td><td>{escape(m.get('message') or '')}</td></tr>"
        for m in report.modules
    )
    rows_checks = "".join(
        f"<tr><td>{escape(c['name'])}</td>"
        f"<td><span class='pill {'ok' if c['passed'] else (c['severity'] if c['severity'] in ('warn','err') else 'err')}'>"
        f"{'PASS' if c['passed'] else 'FAIL'}</span></td>"
        f"<td>{escape(c['severity'])}</td><td>{escape(c.get('message') or '')}</td></tr>"
        for c in report.checks
    )
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>AsterOps posture report — {escape(report.server_name)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>{CSS}</style></head><body><div class="wrap">
<div class="hdr"><div><h1>AsterOps posture report</h1>
<small>{escape(report.server_name)} · profile <b>{escape(report.profile)}</b> · {escape(report.generated_at)}</small></div>
<div><span class="pill ok">AsterOps {escape(report.agent_version)}</span></div></div>
<div class="score"><div class="num">{report.score}</div>
<div><div class="lbl">Posture score</div>
<div>{report.passed} passed · <span class="warn">{report.warnings} warnings</span> · <span class="err">{report.failed} critical</span></div></div></div>
<div class="grid">
<div class="tile"><div class="k">TLS</div><div class="v {'ok' if report.tls_ok else 'err'}">{'OK' if report.tls_ok else 'FAIL'}</div></div>
<div class="tile"><div class="k">SRTP</div><div class="v {'ok' if report.srtp_ok else 'err'}">{'OK' if report.srtp_ok else 'FAIL'}</div></div>
<div class="tile"><div class="k">Firewall</div><div class="v {'ok' if report.firewall_ok else 'err'}">{'OK' if report.firewall_ok else 'FAIL'}</div></div>
<div class="tile"><div class="k">fail2ban</div><div class="v {'ok' if report.fail2ban_ok else 'err'}">{'OK' if report.fail2ban_ok else 'FAIL'}</div></div>
<div class="tile"><div class="k">AMI</div><div class="v {'ok' if report.ami_locked else 'err'}">{'LOCKED' if report.ami_locked else 'OPEN'}</div></div>
</div>
<div class="section"><h2>Hardening modules</h2><table><thead><tr><th>Module</th><th>State</th><th>Result</th><th>Message</th></tr></thead><tbody>{rows_modules}</tbody></table></div>
<div class="section"><h2>Verification checks</h2><table><thead><tr><th>Check</th><th>Outcome</th><th>Severity</th><th>Message</th></tr></thead><tbody>{rows_checks}</tbody></table></div>
<footer>Generated by AsterOps · open-source VoIP security & operations</footer>
</div></body></html>"""
