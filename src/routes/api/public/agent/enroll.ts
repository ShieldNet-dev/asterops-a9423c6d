import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sha256Hex, randomToken, json } from "@/lib/agent-auth.server";

const Schema = z.object({
  enrollment_token: z.string().min(8).max(200),
  agent_version: z.string().max(40).optional(),
  asterisk_version: z.string().max(40).optional(),
  hostname: z.string().max(255).optional(),
});

export const Route = createFileRoute("/api/public/agent/enroll")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid json" }, 400);
        }
        const parsed = Schema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid payload" }, 400);

        const enrollHash = await sha256Hex(parsed.data.enrollment_token);
        const { data: server } = await supabaseAdmin
          .from("servers")
          .select("id, owner_id")
          .eq("enrollment_token_hash", enrollHash)
          .maybeSingle();
        if (!server) return json({ error: "invalid enrollment token" }, 401);

        const agentToken = randomToken();
        const agentHash = await sha256Hex(agentToken);

        await supabaseAdmin
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

        await supabaseAdmin.from("audit_events").insert({
          actor_id: null,
          server_id: server.id,
          action: "agent.enroll",
          meta: { agent_version: parsed.data.agent_version ?? null },
        });

        return json({ agent_token: agentToken, server_id: server.id });
      },
    },
  },
});