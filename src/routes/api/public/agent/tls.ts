import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateAgent, json } from "@/lib/agent-auth.server";

const AckSchema = z.object({
  cert_id: z.string().uuid(),
  state: z.enum(["active", "failed"]),
  fingerprint_sha256: z.string().max(128).optional().nullable(),
  not_after: z.string().datetime().optional().nullable(),
  last_error: z.string().max(2000).optional().nullable(),
});

export const Route = createFileRoute("/api/public/agent/tls")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = await authenticateAgent(request);
        if (!id) return json({ error: "unauthorized" }, 401);
        const { data } = await supabaseAdmin
          .from("tls_certs")
          .select("id, source, domain, le_email, cert_pem")
          .eq("server_id", id.serverId)
          .eq("state", "pending")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        return json({
          cert: data
            ? {
                cert_id: data.id,
                source: data.source,
                domain: data.domain,
                le_email: data.le_email,
                cert_pem: data.cert_pem,
              }
            : null,
        });
      },
      POST: async ({ request }) => {
        const id = await authenticateAgent(request);
        if (!id) return json({ error: "unauthorized" }, 401);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
        const parsed = AckSchema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid payload" }, 400);

        const updates = {
          state: parsed.data.state,
          last_error: parsed.data.last_error ?? null,
          applied_at: parsed.data.state === "active" ? new Date().toISOString() : null,
          fingerprint_sha256:
            parsed.data.state === "active" && parsed.data.fingerprint_sha256
              ? parsed.data.fingerprint_sha256
              : undefined,
          not_after:
            parsed.data.state === "active" && parsed.data.not_after
              ? parsed.data.not_after
              : undefined,
        };
        const { error } = await supabaseAdmin
          .from("tls_certs")
          .update(updates as never)
          .eq("id", parsed.data.cert_id)
          .eq("server_id", id.serverId);
        if (error) return json({ error: error.message }, 500);

        if (parsed.data.state === "active" && parsed.data.not_after) {
          await supabaseAdmin
            .from("servers")
            .update({ cert_expires_at: parsed.data.not_after })
            .eq("id", id.serverId);
          await supabaseAdmin
            .from("tls_certs")
            .update({ state: "superseded" })
            .eq("server_id", id.serverId)
            .eq("state", "active")
            .neq("id", parsed.data.cert_id);
        }

        await supabaseAdmin.from("audit_events").insert({
          server_id: id.serverId,
          action: `tls.${parsed.data.state}`,
          target_type: "tls_cert",
          target_id: parsed.data.cert_id,
          meta: { last_error: parsed.data.last_error ?? null },
        });
        return json({ ok: true });
      },
    },
  },
});