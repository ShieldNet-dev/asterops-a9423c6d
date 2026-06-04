import { z } from "https://esm.sh/zod@3.23.8";
import {
  adminClient,
  authenticateAgent,
  corsHeaders,
  fireAlert,
  json,
} from "../_shared/agent-auth.ts";

const AckSchema = z.object({
  cert_id: z.string().uuid(),
  state: z.enum(["active", "failed"]),
  fingerprint_sha256: z.string().max(128).optional().nullable(),
  not_after: z.string().datetime().optional().nullable(),
  last_error: z.string().max(2000).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const id = await authenticateAgent(req, admin);
  if (!id) return json({ error: "unauthorized" }, 401);

  if (req.method === "GET") {
    const { data } = await admin
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
  }

  if (req.method === "POST") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid json" }, 400);
    }
    const parsed = AckSchema.safeParse(body);
    if (!parsed.success) return json({ error: "invalid payload" }, 400);

    const updates: Record<string, unknown> = {
      state: parsed.data.state,
      last_error: parsed.data.last_error ?? null,
      applied_at: parsed.data.state === "active" ? new Date().toISOString() : null,
    };
    if (parsed.data.state === "active" && parsed.data.fingerprint_sha256) {
      updates.fingerprint_sha256 = parsed.data.fingerprint_sha256;
    }
    if (parsed.data.state === "active" && parsed.data.not_after) {
      updates.not_after = parsed.data.not_after;
    }

    const { error } = await admin
      .from("tls_certs")
      .update(updates)
      .eq("id", parsed.data.cert_id)
      .eq("server_id", id.serverId);
    if (error) return json({ error: error.message }, 500);

    if (parsed.data.state === "active" && parsed.data.not_after) {
      await admin
        .from("servers")
        .update({ cert_expires_at: parsed.data.not_after })
        .eq("id", id.serverId);
      await admin
        .from("tls_certs")
        .update({ state: "superseded" })
        .eq("server_id", id.serverId)
        .eq("state", "active")
        .neq("id", parsed.data.cert_id);
    }

    await admin.from("audit_events").insert({
      server_id: id.serverId,
      action: `tls.${parsed.data.state}`,
      target_type: "tls_cert",
      target_id: parsed.data.cert_id,
      meta: { last_error: parsed.data.last_error ?? null },
    });

    if (parsed.data.state === "failed") {
      await fireAlert(admin, {
        serverId: id.serverId,
        kind: "tls.failed",
        severity: "critical",
        title: "TLS cert install failed",
        message: parsed.data.last_error || "Agent reported TLS cert install failed.",
        meta: { cert_id: parsed.data.cert_id },
      });
    }
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
});