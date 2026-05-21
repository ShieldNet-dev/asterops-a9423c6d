import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateAgent, json } from "@/lib/agent-auth.server";
import { fireAlert } from "@/lib/alerts.server";

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
        const { data: cfg } = await supabaseAdmin
          .from("pjsip_configs")
          .update({
            state: body.state,
            applied_at: body.state === "applied" ? new Date().toISOString() : null,
            notes: body.notes ?? null,
          })
          .eq("id", body.config_id)
          .eq("server_id", id.serverId)
          .select("version")
          .single();

        // Append-only reload event for the health view.
        await supabaseAdmin.from("agent_reloads").insert({
          server_id: id.serverId,
          config_id: body.config_id,
          config_version: cfg?.version ?? null,
          outcome: body.state,
          notes: body.notes ?? null,
        } as never);

        await supabaseAdmin.from("audit_events").insert({
          server_id: id.serverId,
          action: `config.${body.state}`,
          target_type: "pjsip_config",
          target_id: body.config_id,
        });

        if (body.state === "failed") {
          await fireAlert({
            serverId: id.serverId,
            kind: "config.reload_failed",
            severity: "critical",
            title: `PJSIP reload failed (v${cfg?.version ?? "?"})`,
            message: body.notes || "Agent reported pjsip reload failed. The previous config is still in effect.",
            meta: { config_id: body.config_id, version: cfg?.version },
          });
        }
        return json({ ok: true });
      },
    },
  },
});