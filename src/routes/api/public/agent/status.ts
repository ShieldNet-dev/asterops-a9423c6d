import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateAgent, json } from "@/lib/agent-auth.server";

const Schema = z.object({
  agent_version: z.string().max(40).optional(),
  asterisk_version: z.string().max(40).optional(),
  active_calls: z.number().int().min(0).max(100000).optional(),
  cert_expires_at: z.string().datetime().optional().nullable(),
});

export const Route = createFileRoute("/api/public/agent/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = await authenticateAgent(request);
        if (!id) return json({ error: "unauthorized" }, 401);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
        const parsed = Schema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid payload" }, 400);
        await supabaseAdmin
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
      },
    },
  },
});