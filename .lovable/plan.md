## Goal

Keep AsterOps as the open-source product. Add a Python hardening module that satisfies the uni objectives (TLS/SRTP automation, reports, testing), so instead of using go, use python. Do not keep the Go agent replace with Python and keep dashboard, polish the UI to a serious enterprise look, and leave room to support non-Asterisk VoIP later.

## Scope of this iteration

I'll do this in **three focused passes**, each independently shippable, so we don't break the build:

### Pass 1 — Python hardening module + auto-config (`hardening/`)

New top-level `hardening/` Python package (separate from the Go agent — runs once per server, or on demand from the dashboard via the agent).

```text
hardening/
  asterops_harden/
    __init__.py
    cli.py                  # `asterops-harden run|report|verify|provision`
    config.py               # YAML profile loader (sane defaults)
    profiles/
      baseline.yaml         # TLS-only, SRTP required, fail2ban, iptables, AMI lockdown
      contact-center.yaml
      msp-multitenant.yaml
    modules/
      tls.py                # generate CA + server cert, wire pjsip transport-tls
      srtp.py               # force media_encryption=sdes on all endpoints
      pjsip_autoconfig.py   # auto-generate extensions, trunks, AORs from YAML
      firewall.py           # iptables / nftables rules (SIP/TLS 5061, RTP range)
      fail2ban.py           # asterisk jail
      ami.py                # bind 127.0.0.1, strong secret
      ssh.py                # PermitRootLogin no, key-only
      permissions.py        # /etc/asterisk ownership + modes
    verify/
      test_tls.py           # openssl s_client to 5061, cipher check
      test_srtp.py          # SIP OPTIONS + SDP m= line inspection
      test_firewall.py      # nmap-style port probe
      test_fail2ban.py      # jail status parse
    report/
      collector.py          # gather all module + verify results
      html.py               # Jinja2 -> single-file HTML report
      pdf.py                # weasyprint -> PDF (optional dep)
      json.py               # machine-readable, uploaded to dashboard
  tests/
    test_pjsip_render.py    # golden-file tests for auto-config
    test_profiles.py
    test_cli.py
  pyproject.toml
  README.md
```

Key features:

- **Idempotent**: every module checks state before changing.
- **Dry-run mode**: `--dry-run` prints diffs, changes nothing.
- **Backup**: every changed file copied to `/var/backups/asterops/<ts>/`.
- **Reports**: HTML + JSON, posted back to the dashboard via `agent-report` edge function so the UI can show a "Security Posture" page per server.
- **Auto-config**: `pjsip_autoconfig.py` takes a YAML describing extensions/trunks/dial-plan and emits `pjsip.conf` + `extensions.conf` + `rtp.conf` — same deterministic renderer the Go agent already uses but now replaced using Python not go, ported to Python so it works standalone.

### Pass 2 — Dashboard polish (serious / enterprise look)

Treat this as a real product surface. No layout rewrite of business pages — just visual + structural lift:

- New shared `**AppShell**` with a denser sidebar, top breadcrumb bar, command palette (Cmd-K), and global status pill (fleet health).
- New **Security Posture** page (`/security`) — renders the uploaded hardening reports per server with score, failing checks, remediation hints, download HTML/PDF.
- New **Provisioning** page (`/provisioning`) — UI for the Python auto-config: define extensions/trunks → generate pjsip preview → push to selected server(s).
- Dashboard (`/dashboard`) restructured into sections: **Fleet health · Security posture · Call quality · Recent activity** with consistent card styling.
- Refined design tokens in `src/styles.css`: tighter type scale, mono numerals for stats, single accent (electric blue on near-black), subtle gridlines, no gradient flourish. One distinctive display font + clean sans body — not Inter.
- Marketing site (`src/pages/Index.tsx`) gets trust-building polish: real screenshots of the new dashboard, architecture diagram refresh, customer-evidence placeholders ready to fill.

### Pass 3 — Scalability seam for "other VoIP systems later"

Small but important — done in code now so we're not painted in later:

- Introduce a `VoipPlatform` interface in `src/lib/platforms/` with one implementation: `asterisk.ts`. Server table gets a `platform` column (default `'asterisk'`).
- Python: `hardening/asterops_harden/platforms/` with a base class and `asterisk/` implementation. Adding FreeSWITCH/Kamailio later = new subdir, no core changes.
- Edge functions stay platform-agnostic; payloads carry `platform` field.

DB migration adds `servers.platform text not null default 'asterisk'` only.

## Technical notes

- Python module is delivered as a `pip install asterops-harden` package, runnable as a CLI on any Asterisk host. The existing Go agent will be replaced by Python agent not go. 
- Report upload uses a new `agent-report` edge function (JWT-authenticated like the others) + a `security_reports` table.
- No removal of working features. No backend schema changes beyond `servers.platform` and `security_reports`.
- I will not regenerate the marketing page from scratch — only refine sections and swap in new dashboard screenshots. and add the command to run. How a how to set up in the sidebar in the marketing page and the app logo icon is not showing in the various pages it looks broken pls rectify that. 
- Pls make the GitHUb [readme.md](http://readme.md) file look very very professional that is an important part for any open source project pls make the GitHUb standout and add it to the fooster in the marketing page. 

## What I will NOT do in this iteration

- Build FreeSWITCH/Kamailio support (only leave the seam).
- Add billing no billing because it is completely open source, multi-tenant org switcher, or SSO.
- Touch the Go agent's wire protocol— Python module is independent.

## Order of execution

1. DB migration (`servers.platform`, `security_reports` table + RLS + grants).
2. Python `hardening/` package with auto-config + TLS/SRTP + verify + HTML/JSON report + tests.
3. `agent-report` edge function.
4. Dashboard: design tokens, AppShell, Security Posture page, Provisioning page, dashboard restructure.
5. Marketing page polish with new screenshots.

Confirm and I'll start with step 1 (the migration).