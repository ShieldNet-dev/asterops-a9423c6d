# Production AsterOps implementation plan

## Goal
Convert AsterOps from a demo-capable prototype into a production-only control plane for Vercel + Lovable Cloud. The dashboard will show only real fleet state, and every agent operation will have a complete, observable path from an Ubuntu host to the dashboard.

## User-visible outcome
- No demo panel, demo badge, seed/reset controls, simulated calls, or demo-tagged data paths remain in the production app.
- The dashboard clearly distinguishes pending enrollment, live, stale, and offline servers using real heartbeats.
- Operators can enroll an agent, receive security reports and CDRs, queue configuration/TLS work, and see success or failure in the dashboard.
- Configured HTTPS webhooks receive real alert payloads. Every attempt is recorded against the originating certificate, TLS, SRTP, security, or reload alert.
- Friendly setup, loading, empty, permission, and backend-error states remain available without hiding operational failures.

## Implementation steps

1. **Establish a clean production baseline**
   - Wait for Lovable Cloud to become active, then verify the live schema, policies, grants, and edge-function health before applying database changes.
   - Remove the demo client library and its UI consumers from the dashboard and app shell. Do not delete or modify real customer rows; demo-tag cleanup will not be run as part of the conversion.
   - Preserve the real onboarding card and production empty states so a new account is guided to its first server.

2. **Harden database access and data integrity**
   - Add a forward migration with explicit Data API grants for every public table used by the SPA and service-role edge functions; the existing migration inventory has RLS policies but no grant statements.
   - Recheck ownership policies for servers and every server-child table, immutable call/audit/delivery records, and agent-only writes performed through edge functions.
   - Add or confirm constraints and indexes needed for server heartbeat lookups, notification delivery attempts, CDR time-range queries, and filtered audit exports.
   - Keep the current single-account ownership model; do not introduce team roles or shared workspaces in this pass.
   - Make client data functions return actionable errors consistently instead of converting failed production queries into empty success states.

3. **Replace alert stubs with real webhook delivery**
   - Add a server-side delivery path used by agent-generated alerts and the dashboard’s test-alert action; the browser will never call arbitrary webhook URLs directly.
   - Validate and normalize configured HTTPS destinations, send a bounded JSON payload containing alert identity, severity, source kind, server, message, and metadata, and enforce request timeouts.
   - Record queued/attempted/succeeded/failed outcomes, response status, error text, timestamps, and attempt number in `notification_deliveries`; retain the notification relationship so certificate/TLS/SRTP/reload failures are traceable.
   - Add bounded retry/backoff for transient failures and make delivery idempotent for a notification/channel/attempt. Update the parent notification’s delivery summary only after the result is known.
   - Update the Alert Log UI and test action to show the real result, not the current `client-stub`/`skipped` record.

4. **Complete the agent lifecycle**
   - Add a first-class `asterops enroll` command that exchanges the one-time enrollment token for an agent token, writes the local configuration with restrictive permissions, and refuses to overwrite an existing identity without an explicit rotation.
   - Support both installation modes: documented GitHub source installation from `ShieldNet-dev/asterops-a9423c6d` and a release/publishing workflow for the Python package. Keep source installation usable even before the package is published.
   - Add reliable agent configuration loading for the control-plane URL and token, structured request timeouts, response validation, useful CLI errors, and safe handling of interrupted enrollment/reporting.
   - Implement the missing production collectors and workers: periodic heartbeat/status, batched Asterisk CDR upload with deduplication, pending PJSIP config fetch/apply acknowledgement, and pending TLS request handling with safe certificate validation and reload reporting.
   - Make the systemd service/timer use the installed agent consistently and document upgrade/rollback behavior.

5. **Detect stale and offline servers**
   - Add a scheduled server-health watchdog that evaluates `last_seen_at`, transitions servers to stale/degraded/offline according to explicit thresholds, and creates deduplicated alerts on state changes.
   - Ensure a later heartbeat restores the server to online and records the transition in audit history.
   - Surface last check-in time and the reason for each non-live status in Fleet, Dashboard, and server detail views.

6. **Finish production UI behavior**
   - Remove all simulation-related imports, queries, copy, status badges, and controls.
   - Keep KPI calculations, calls, certificates, security posture, alerts, provisioning, and audit views backed only by current database rows.
   - Add visible retry/error states for failed queries and mutations, while keeping empty states for genuinely empty production accounts.
   - Ensure audit CSV export uses exactly the table’s active server, actor/role, action, and time filters, with no demo-only fields.
   - Keep the existing light-first visual system and professional single-color text treatment intact while making status meaning clear through labels and semantic badges.

7. **Vercel + Lovable Cloud release readiness**
   - Verify the SPA build, Vercel rewrite behavior for React Router deep links, and required public Vite environment variables.
   - Verify edge functions use runtime-managed secrets only and never expose service credentials to the browser or agent.
   - Add a concise deployment and operations runbook covering Cloud activation, migrations, function health, Vercel environment configuration, agent enrollment, webhook testing, upgrades, and incident diagnosis.

## Technical validation

- Run the existing Python agent tests and add coverage for enrollment, HTTP error handling, CDR batching/deduplication, webhook delivery outcomes, heartbeat transitions, and production cleanup safeguards.
- Run TypeScript typechecking, lint, and the Vite production build.
- With Lovable Cloud active, verify RLS/grants through authenticated owner and unauthenticated/other-owner checks.
- Exercise the complete path: create server → enroll Ubuntu agent → heartbeat online → upload report/CDR → queue config/TLS work → acknowledge success/failure → create alert → deliver webhook → inspect delivery log → stop heartbeat → observe offline transition.
- Verify a fresh Vercel deployment loads `/`, `/login`, `/signup`, `/dashboard`, and nested routes after refresh.
