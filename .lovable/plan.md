# Demo Mode — showcase AsterOps without a real Asterisk PBX

Goal: let you click one button and instantly populate the dashboard with realistic servers, calls, TLS certs, alerts, audit events, and posture data so every screen looks "live" for your professor demo and screenshots. No Asterisk, no VM, no agent required.

## How it will work (user experience)

1. A new **"Demo mode"** section appears at the top of the dashboard when your account has zero servers (and inside Settings once seeded).
2. One button: **"Load demo data"** — seeds 3 fake servers, ~120 call records, TLS certs (one healthy, one expiring soon, one expired), a few unacked alerts, audit history, and provisioning inventory.
3. A companion button **"Simulate live activity"** — every ~5s a background tick advances state: new calls appear, an agent goes offline, an alert fires, TLS days-remaining tick down. Perfect for a live demo / screen recording.
4. A **"Reset demo data"** button wipes everything the demo created (tagged rows only — your real data is untouched).
5. A subtle **"DEMO"** ribbon in the app shell whenever demo data is present, so screenshots are honest.

## What gets seeded (realistic, professor-friendly)

- **3 servers**: `pbx-hq-01` (online, healthy), `pbx-branch-eu` (online, TLS expiring in 12d), `pbx-lab-02` (degraded, expired cert + fail2ban warning).
- **Calls**: ~120 CDR rows across 24h with realistic extensions, durations, SRTP flags, answered/missed mix.
- **TLS certs**: three rows matching the servers, one expired, one 12d, one 240d.
- **Alerts / notifications**: 4 unacked (cert expiring, cert expired, brute-force blocked, AMI weak password), 6 acked.
- **Audit events**: enrollment, config push, rollback, profile change.
- **Provisioning inventory**: 8 endpoints + 2 trunks on `pbx-hq-01`.
- **Posture check results**: mixed pass/warn/fail across TLS, SRTP, firewall, AMI, fail2ban.

## Technical approach

- **New edge function** `demo-seed` (service-role, JWT-verified for the calling user):
  - `action: "seed"` — inserts rows tagged `is_demo = true` scoped to `auth.uid()` as owner.
  - `action: "tick"` — advances one simulation step (new call row, decrement TLS days by 1, flip a status, maybe raise an alert).
  - `action: "reset"` — deletes all rows where `is_demo = true` for this user.
- **Migration**: add `is_demo boolean default false` to `servers`, `call_records`, `tls_certs`, `notifications`, `audit_events`, `endpoints`, `trunks`, `pjsip_configs`, `agent_reloads`. Existing RLS policies keep working; demo rows behave like any other row the user owns.
- **Frontend**:
  - `src/components/demo-panel.tsx` — the seed / simulate / reset UI (shown on Dashboard when empty, and as a small strip in the header once demo data exists).
  - `src/lib/demo.functions.ts` — thin wrappers around the edge function.
  - `src/components/app-shell.tsx` — add a small "DEMO" chip when the current user has any `is_demo` row.
  - `useQuery` invalidation after each tick so KPIs, tables, alerts update visibly.
- Simulation loop runs client-side (`setInterval` calling `tick`) so you can start/stop it from the UI — no cron needed.

## What won't change

- No changes to the real agent flow, real enrollment, or existing edge functions.
- Real (non-demo) rows are never touched by seed/reset.
- No new secrets; uses existing Lovable Cloud auth.

## Deliverables

1. Migration adding `is_demo` flag + indexes.
2. `demo-seed` edge function (seed / tick / reset).
3. `DemoPanel` component + `demo.functions.ts`.
4. Dashboard + AppShell integration (empty-state CTA, header chip, reset button).
5. README note explaining Demo Mode for your report.

After you approve, I'll implement it end-to-end. Then you just click **Load demo data → Simulate live activity** and screenshot every page.
