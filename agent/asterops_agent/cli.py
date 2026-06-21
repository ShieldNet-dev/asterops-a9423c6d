"""asterops — command-line entry point."""
from __future__ import annotations
import os
import socket
import sys
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table

from . import __version__
from .config import HardeningProfile, Inventory
from .engine import run_hardening, run_verification
from .modules.pjsip_autoconfig import apply_inventory
from .report.html_report import to_html
from .report.json_report import to_json
from .report.pdf_report import to_pdf
from .report.upload import upload_report

console = Console()


@click.group()
@click.version_option(__version__, prog_name="asterops")
def main():
    """AsterOps — VoIP security hardening, auto-configuration & posture reporting."""


@main.command()
@click.option("--profile", "-p", default="baseline", help="Profile name or path to a YAML file.")
@click.option("--dry-run", is_flag=True, help="Show what would change without modifying the system.")
@click.option("--server-name", default=None, help="Override the hostname recorded in the report.")
@click.option("--report-json", type=click.Path(), default=None)
@click.option("--report-html", type=click.Path(), default=None)
@click.option("--report-pdf", type=click.Path(), default=None)
def run(profile, dry_run, server_name, report_json, report_html, report_pdf):
    """Apply a hardening profile, then verify and produce a posture report."""
    prof = HardeningProfile.load(profile)
    console.rule(f"[bold]AsterOps {__version__}[/] — profile [cyan]{prof.name}[/] {'(dry-run)' if dry_run else ''}")
    report, modules, checks = run_hardening(prof, dry_run=dry_run, server_name=server_name)
    _print_modules(modules)
    _print_checks(checks)
    console.print(f"\n[bold]Posture score:[/] [b]{report.score}[/]/100 — {report.passed} passed · {report.warnings} warnings · {report.failed} critical\n")
    _emit_reports(report, report_json, report_html, report_pdf)


@main.command()
@click.option("--profile", "-p", default="baseline")
def verify(profile):
    """Run only the verification checks — no system changes."""
    prof = HardeningProfile.load(profile)
    checks = run_verification(prof)
    _print_checks(checks)


@main.command()
@click.argument("inventory_file", type=click.Path(exists=True))
@click.option("--target-dir", default=None, help="Override config target directory (defaults to /etc/asterisk).")
@click.option("--dry-run", is_flag=True)
def provision(inventory_file, target_dir, dry_run):
    """Render pjsip.conf / extensions.conf / rtp.conf from a YAML inventory."""
    inv = Inventory.load(inventory_file)
    result = apply_inventory(inv, platform_name="asterisk", dry_run=dry_run, target_dir=target_dir)
    console.print(f"[bold]{result.message}[/]")
    for a in result.actions:
        console.print(f"  • {a}")
    for f in result.details.get("changed", []):
        console.print(f"  [green]changed[/] {f}")


@main.command()
def profiles():
    """List built-in hardening profiles."""
    table = Table("name", "description")
    for name in HardeningProfile.list_builtin():
        prof = HardeningProfile.load(name)
        table.add_row(name, (prof.description or "").strip())
    console.print(table)


@main.command()
@click.option("--profile", "-p", default="baseline")
@click.option("--url", envvar="ASTEROPS_URL", required=True, help="Dashboard control-plane URL (https://<project>.functions.supabase.co).")
@click.option("--token", envvar="ASTEROPS_AGENT_TOKEN", required=True, help="Agent token issued by the dashboard.")
@click.option("--server-name", default=None)
def report(profile, url, token, server_name):
    """Run a scan and POST the JSON + HTML posture report to the dashboard."""
    prof = HardeningProfile.load(profile)
    report, _, _ = run_hardening(prof, dry_run=True, server_name=server_name or socket.gethostname())
    html_text = to_html(report)
    ok = upload_report(report, control_plane_url=url, agent_token=token, report_html=html_text)
    if ok:
        console.print("[green]Report uploaded.[/]")
    else:
        console.print("[red]Report upload failed.[/]")
        sys.exit(1)


def _print_modules(modules):
    table = Table("module", "changed", "ok", "message")
    for m in modules:
        table.add_row(m.name, "yes" if m.changed else "no", "✓" if m.ok else "✗", m.message or "—")
    console.print(table)


def _print_checks(checks):
    table = Table("check", "result", "severity", "message")
    for c in checks:
        table.add_row(c.name, "[green]PASS[/]" if c.passed else "[red]FAIL[/]", c.severity, c.message or "—")
    console.print(table)


def _emit_reports(report, json_path, html_path, pdf_path):
    if json_path:
        Path(json_path).write_text(to_json(report))
        console.print(f"[dim]JSON report → {json_path}[/]")
    html_text = to_html(report) if (html_path or pdf_path) else None
    if html_path and html_text:
        Path(html_path).write_text(html_text)
        console.print(f"[dim]HTML report → {html_path}[/]")
    if pdf_path and html_text:
        ok = to_pdf(html_text, pdf_path)
        console.print(f"[dim]PDF report → {pdf_path}[/]" if ok else "[yellow]PDF not generated (install weasyprint).[/]")


if __name__ == "__main__":
    main()
