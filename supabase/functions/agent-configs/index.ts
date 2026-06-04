import {
  adminClient,
  authenticateAgent,
  corsHeaders,
  fireAlert,
  json,
} from "../_shared/agent-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const id = await authenticateAgent(req, admin);
  if (!id) return json({ error: "unauthorized" }, 401);

  if (req.method === "GET") {
    const { data: pending } = await admin
      .from("pjsip_configs")
      .select("id, version, rendered_text, state, created_at")
      .eq("server_id", id.serverId)
      .eq("state", "pending")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    return json({ config: pending ?? null });
  }

  if (req.method === "POST") {
    const body = (await req.json().catch(() => null)) as
      | { config_id?: string; state?: "applied" | "failed"; notes?: string }
      | null;
    if (!body?.config_id || !body.state) return json({ error: "invalid payload" }, 400);

    const { data: cfg } = await admin
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

    await admin.from("agent_reloads").insert({
      server_id: id.serverId,
      config_id: body.config_id,
      config_version: cfg?.version ?? null,
      outcome: body.state,
      notes: body.notes ?? null,
    });

    await admin.from("audit_events").insert({
      server_id: id.serverId,
      action: `config.${body.state}`,
      target_type: "pjsip_config",
      target_id: body.config_id,
    });

    if (body.state === "failed") {
      await fireAlert(admin, {
        serverId: id.serverId,
        kind: "config.reload_failed",
        severity: "critical",
        title: `PJSIP reload failed (v${cfg?.version ?? "?"})`,
        message:
          body.notes ||
          "Agent reported pjsip reload failed. The previous config is still in effect.",
        meta: { config_id: body.config_id, version: cfg?.version },
      });
    }
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
});