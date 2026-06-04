
# Migrate AsterOps to plain Vite SPA + Supabase, deploy on Vercel

## Goal

Strip TanStack Start entirely. End state:

- `vite build` → `dist/` static SPA
- `vercel.json` is a one-liner SPA rewrite (or removed; Vercel auto-detects Vite)
- All backend logic lives in Supabase (RLS for reads/writes, Edge Functions for privileged + agent endpoints)
- Go agents call Supabase Edge Function URLs, not the app's `/api/...`

## What gets removed

- `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@vercel/node`
- `src/router.tsx`, `src/server.ts`, `src/start.ts`, `src/routeTree.gen.ts`
- All of `src/routes/` (replaced by `src/pages/` + `App.tsx` with `react-router-dom`)
- All `*.functions.ts` and `*.server.ts` (logic moves to client+RLS or edge functions)
- `api/index.mjs`, `.npmrc` workaround, `VERCEL.md` rewrite
- `src/integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `client.server.ts` (server-only files)
- `wrangler.jsonc` (already gone)

## What gets added

- `react-router-dom` v6
- `src/App.tsx` with `<BrowserRouter>` + routes
- `src/pages/` mirroring current routes (Index, Login, Signup, Dashboard, Agents, Alerts, AlertLog, Audit, Calls, Servers list/detail)
- `src/components/ProtectedRoute.tsx` (replaces `_authenticated.tsx` layout gate)
- `src/main.tsx` (Vite SPA entry)
- `index.html` at project root (Vite SPA shell)
- New Supabase Edge Functions (one per legacy server route + privileged server fn):
  - `agent-enroll`, `agent-status`, `agent-cdr`, `agent-configs`, `agent-tls` (called by Go agents — shared-secret auth in headers)
  - `tls-issue`, `rollback-execute`, `alerts-evaluate`, `pjsip-render` (called by SPA via `supabase.functions.invoke`)
- For pure data reads/writes (alerts list, audit log, calls list, servers CRUD, agent-health read, rbac check), drop the wrapper entirely — call `supabase.from(...).select()` directly from React Query hooks. RLS already enforces who can read what.

## Migration order (single PR, but staged in commits)

1. **Install + scaffold**: add `react-router-dom`, create `index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts` rewrite (drop tanstackStart plugin, keep react + tailwind + path alias).
2. **Page shells**: copy every route component body from `src/routes/**` into `src/pages/**`. Strip `createFileRoute`, `Route.useLoaderData`, `Route.useParams`, `Link` from `@tanstack/react-router`. Use `useParams`, `useNavigate`, `<Link>` from `react-router-dom`.
3. **Data layer**: replace every `createServerFn` import + `useServerFn` call with either:
   - `useQuery({ queryFn: () => supabase.from('x').select(...) })` for reads
   - `useMutation` with `supabase.from('x').insert/update/delete` for writes
   - `supabase.functions.invoke('fn-name', { body })` for privileged ops
4. **Edge functions**: port `src/routes/api/public/agent/*.ts` and the privileged server fns (`tls`, `rollback`, `alerts.evaluate`, `pjsip.render`) into `supabase/functions/<name>/index.ts`. Reuse `pjsip-renderer.ts` and the validation schemas verbatim — they're framework-agnostic.
5. **Auth**: replace `auth-middleware`/`auth-attacher` with `supabase.auth.getSession()` in React, and `Authorization: Bearer <jwt>` headers (auto-added by `supabase.functions.invoke`). Edge functions verify the JWT via `supabase.auth.getUser(token)`.
6. **Cleanup**: delete TanStack files, uninstall TanStack packages, delete `api/index.mjs`, delete `.npmrc`, simplify `vercel.json` to `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
7. **Update agent docs**: `agent/README.md` + `agent/install.sh` config — point `--dashboard` URL to the Supabase Functions base URL (e.g. `https://tqpeidaigcjuulxaruml.supabase.co/functions/v1`).

## Technical details

### Routes mapping (react-router-dom)

```text
/                        → pages/Index.tsx           (public)
/login                   → pages/Login.tsx           (public)
/signup                  → pages/Signup.tsx          (public)
/dashboard               → pages/Dashboard.tsx       (protected)
/agents                  → pages/Agents.tsx          (protected)
/alerts                  → pages/Alerts.tsx          (protected)
/alert-log               → pages/AlertLog.tsx       (protected)
/audit                   → pages/Audit.tsx           (protected)
/calls                   → pages/Calls.tsx           (protected)
/servers                 → pages/ServersIndex.tsx    (protected)
/servers/:id             → pages/ServerDetail.tsx    (protected)
*                        → pages/NotFound.tsx
```

### Edge function auth pattern

- **SPA-invoked** (`supabase.functions.invoke`): JWT auto-attached → inside fn, `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get('Authorization')! } } })` for RLS-scoped queries, OR a service-role client for admin work after verifying `has_role(uid, 'admin')`.
- **Agent-invoked** (Go agents): keep current shared-secret model from `agent-auth.server.ts` (HMAC signature header). Edge function verifies, then uses service-role client.

### vite.config.ts (final)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

### vercel.json (final)

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## Risks / things to confirm

1. **Go agents will need redeploy** with the new Supabase Functions URL. Existing deployed agents pointing at `*.lovable.app` will stop working until reconfigured.
2. **`pjsip.functions.ts` + `tls.functions.ts`** do real work (config rendering, cert generation). The Node `crypto` APIs they use work fine in Deno edge functions, but I'll need to verify any Node-specific imports.
3. **`alerts.server.ts`** does evaluation that probably needs to run on a schedule. Today it's invoked from a server fn; on Supabase that'd be a `pg_cron` job hitting the edge function. I'll set that up.
4. **Lovable preview will stop working** (already true after the previous migration). All testing happens via `vite dev` locally + Vercel preview deploys.

## What I need from you

Confirm and I'll execute the full migration in one go. After that, you'll need to:

- Redeploy the Go agents with the new Supabase Functions URL
- Trigger a fresh Vercel deploy (it'll just work — no `.npmrc`, no `api/`, no peer-deps hacks)
