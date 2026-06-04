import { z } from "https://esm.sh/zod@3.23.8";
import {
  adminClient,
  authenticateAgent,
  corsHeaders,
  json,
} from "../_shared/agent-auth.ts";

const Schema = z.object({
  agent_version: z.string().max(40).optional(),
  asterisk_version: z.string().max(40).optional(),
  active_calls: z.number().int().min(0).max(100000).optional(),
  cert_expires_at: z.string().datetime().optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const admin = adminClient();
  const id = await authenticateAgent(req, admin);
  if (!id) return json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid payload" }, 400);

  await admin
    .from("servers")
    .update({
      agent_version: parsed.data.agent_version ?? undefined,
      asterisk_version: parsed.data.asterisk_version ?? undefined,
      active_calls: parsed.data.active_calls ?? undefined,
      cert_expires_at: parsed.data.cert_expires_at ?? undefined,
      status: "online",
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", id.serverId);

  return json({ ok: true });
});