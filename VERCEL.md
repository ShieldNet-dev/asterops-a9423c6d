# Vercel Deployment

This project was migrated off Cloudflare Workers to deploy on Vercel.
The Lovable in-app preview and `asterops.lovable.app` will no longer build.

## One-time setup

1. Push this repo to GitHub.
2. Import it into Vercel (https://vercel.com/new). Framework Preset: **Other**.
3. In **Settings → Environment Variables**, add (Production + Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - Any other secrets your server functions read via `process.env.*`
     (e.g. webhook secrets, alert email/webhook credentials).
4. Trigger a deploy.

## How it works

- `vite build` produces `dist/client/` (static assets) and `dist/server/server.js` (SSR handler).
- `vercel.json` serves `dist/client` statically and rewrites everything else to `api/index`.
- `api/index.mjs` is a Node serverless function that bridges Node `req/res`
  to the Web Fetch `Request/Response` API and delegates to `src/server.ts`'s
  exported `{ fetch }` handler.

## Agent reconfiguration

After deploy, update every Go agent's `--dashboard` URL (in
`/etc/asterops/agent/config.json`) to the Vercel URL, then restart:

```
systemctl restart asterops-agent
```