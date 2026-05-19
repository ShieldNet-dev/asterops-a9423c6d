import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateAgent, json } from "@/lib/agent-auth.server";

export const Route = createFileRoute("/api/public/agent/configs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = await authenticateAgent(request);
        if (!id) return json({ error: "unauthorized" }, 401);
        const { data: pending } = await supabaseAdmin
          .from("pjsip_configs")
          .select("id, version, rendered_text, state, created_at")
          .eq("server_id", id.serverId)
          .eq("state", "pending")
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();
        return json({ config: pending ?? null });
      },
      POST: async ({ request }) => {
        const id = await authenticateAgent(request);
        if (!id) return json({ error: "unauthorized" }, 401);
        const body = (await request.json().catch(() => null)) as
          | { config_id?: string; state?: "applied" | "failed"; notes?: string }
          | null;
        if (!body?.config_id || !body.state) return json({ error: "invalid payload" }, 400);
        await supabaseAdmin
          .from("pjsip_configs")
          .update({
            state: body.state,
            applied_at: body.state === "applied" ? new Date().toISOString() : null,
            notes: body.notes ?? null,
          })
          .eq("id", body.config_id)
          .eq("server_id", id.serverId);
        await supabaseAdmin.from("audit_events").insert({
          server_id: id.serverId,
          action: `config.${body.state}`,
          target_type: "pjsip_config",
          target_id: body.config_id,
        });
        return json({ ok: true });
      },
    },
  },
});