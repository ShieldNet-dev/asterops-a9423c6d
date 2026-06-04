import { z } from "https://esm.sh/zod@3.23.8";
import {
  adminClient,
  corsHeaders,
  json,
  randomToken,
  sha256Hex,
} from "../_shared/agent-auth.ts";

const Schema = z.object({
  enrollment_token: z.string().min(8).max(200),
  agent_version: z.string().max(40).optional(),
  asterisk_version: z.string().max(40).optional(),
  hostname: z.string().max(255).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid payload" }, 400);

  const admin = adminClient();
  const enrollHash = await sha256Hex(parsed.data.enrollment_token);
  const { data: server } = await admin
    .from("servers")
    .select("id, owner_id")
    .eq("enrollment_token_hash", enrollHash)
    .maybeSingle();
  if (!server) return json({ error: "invalid enrollment token" }, 401);

  const agentToken = randomToken();
  const agentHash = await sha256Hex(agentToken);

  await admin
    .from("servers")
    .update({
      agent_token_hash: agentHash,
      enrollment_token_hash: null,
      agent_version: parsed.data.agent_version ?? null,
      asterisk_version: parsed.data.asterisk_version ?? null,
      hostname: parsed.data.hostname ?? null,
      status: "online",
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", server.id);

  await admin.from("audit_events").insert({
    actor_id: null,
    server_id: server.id,
    action: "agent.enroll",
    meta: { agent_version: parsed.data.agent_version ?? null },
  });

  return json({ agent_token: agentToken, server_id: server.id });
});