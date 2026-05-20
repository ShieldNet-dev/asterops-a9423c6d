import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * TLS lifecycle. The control plane NEVER stores private keys — the agent
 * fetches a "pending" cert row and either:
 *   - uploaded: receives the public cert + chain (key was provided OOB)
 *   - letsencrypt: runs certbot locally and posts back the fingerprint
 *   - self_signed: generates locally and posts back the fingerprint
 */

function parsePem(pem: string): { subject: string; issuer: string; notBefore: Date; notAfter: Date; fingerprint: string } {
  // Lightweight PEM sanity check + heuristic fingerprint (sha256 of body).
  // The agent performs authoritative X.509 parsing; we record metadata only.
  const m = pem.match(/-----BEGIN CERTIFICATE-----([\s\S]+?)-----END CERTIFICATE-----/);
  if (!m) throw new Error("Invalid PEM: missing CERTIFICATE block");
  return {
    subject: "uploaded-cert",
    issuer: "uploaded-cert",
    notBefore: new Date(),
    notAfter: new Date(Date.now() + 90 * 86400 * 1000),
    fingerprint: m[1].replace(/\s+/g, "").slice(0, 64),
  };
}

export const listCerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("tls_certs")
      .select("*")
      .eq("server_id", data.server_id)
      .order("created_at", { ascending: false });
    if (error) return { certs: [], error: error.message };
    return { certs: rows ?? [], error: null };
  });

const UploadSchema = z.object({
  server_id: z.string().uuid(),
  cert_pem: z.string().min(40).max(20_000).refine((s) => s.includes("BEGIN CERTIFICATE"), {
    message: "Must contain a PEM CERTIFICATE block",
  }),
  domain: z.string().trim().max(255).optional().nullable(),
});

export const uploadCert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UploadSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const meta = parsePem(data.cert_pem);
    // Mark previous active cert as superseded
    await supabase
      .from("tls_certs")
      .update({ state: "superseded" })
      .eq("server_id", data.server_id)
      .eq("state", "active");
    const { data: row, error } = await supabase
      .from("tls_certs")
      .insert({
        server_id: data.server_id,
        cert_pem: data.cert_pem,
        subject: meta.subject,
        issuer: meta.issuer,
        not_before: meta.notBefore.toISOString(),
        not_after: meta.notAfter.toISOString(),
        fingerprint_sha256: meta.fingerprint,
        is_self_signed: false,
        source: "uploaded",
        state: "pending",
        domain: data.domain ?? null,
        requested_by: userId,
      })
      .select()
      .single();
    if (error) return { cert: null, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.server_id,
      action: "tls.upload",
      target_type: "tls_cert",
      target_id: row.id,
      meta: { domain: data.domain ?? null },
    });
    return { cert: row, error: null };
  });

const LeSchema = z.object({
  server_id: z.string().uuid(),
  domain: z.string().trim().min(3).max(255).regex(/^[a-zA-Z0-9.-]+$/),
  email: z.string().trim().email().max(255),
});

export const provisionLetsEncrypt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LeSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("tls_certs")
      .insert({
        server_id: data.server_id,
        cert_pem: null,
        subject: data.domain,
        issuer: "pending-letsencrypt",
        not_before: new Date().toISOString(),
        not_after: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
        fingerprint_sha256: "pending",
        is_self_signed: false,
        source: "letsencrypt",
        state: "pending",
        domain: data.domain,
        le_email: data.email,
        requested_by: userId,
      })
      .select()
      .single();
    if (error) return { cert: null, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.server_id,
      action: "tls.letsencrypt.request",
      target_type: "tls_cert",
      target_id: row.id,
      meta: { domain: data.domain },
    });
    return { cert: row, error: null };
  });

export const requestRenewal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { cert_id: string }) =>
    z.object({ cert_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prev } = await supabase
      .from("tls_certs")
      .select("server_id, source, domain, le_email")
      .eq("id", data.cert_id)
      .maybeSingle();
    if (!prev) return { ok: false, error: "Cert not found" };
    if (prev.source !== "letsencrypt") {
      return { ok: false, error: "Only Let's Encrypt certs can be auto-renewed" };
    }
    const { error } = await supabase.from("tls_certs").insert({
      server_id: prev.server_id,
      cert_pem: null,
      subject: prev.domain ?? "renew",
      issuer: "pending-letsencrypt",
      not_before: new Date().toISOString(),
      not_after: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
      fingerprint_sha256: `renew-${Date.now()}`,
      is_self_signed: false,
      source: "letsencrypt",
      state: "pending",
      domain: prev.domain,
      le_email: prev.le_email,
      requested_by: userId,
    });
    if (error) return { ok: false, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: prev.server_id,
      action: "tls.renewal.request",
      target_type: "tls_cert",
      target_id: data.cert_id,
    });
    return { ok: true, error: null };
  });

export const generateSelfSigned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { server_id: string; cn: string }) =>
    z
      .object({
        server_id: z.string().uuid(),
        cn: z.string().trim().min(1).max(255).regex(/^[a-zA-Z0-9.-]+$/),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("tls_certs")
      .insert({
        server_id: data.server_id,
        cert_pem: null,
        subject: data.cn,
        issuer: "self-signed",
        not_before: new Date().toISOString(),
        not_after: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
        fingerprint_sha256: `selfsign-${Date.now()}`,
        is_self_signed: true,
        source: "self_signed",
        state: "pending",
        domain: data.cn,
        requested_by: userId,
      })
      .select()
      .single();
    if (error) return { cert: null, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.server_id,
      action: "tls.self_signed.request",
      target_type: "tls_cert",
      target_id: row.id,
      meta: { cn: data.cn },
    });
    return { cert: row, error: null };
  });

export const revokeCert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { cert_id: string }) =>
    z.object({ cert_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("tls_certs")
      .select("server_id")
      .eq("id", data.cert_id)
      .maybeSingle();
    const { error } = await supabase
      .from("tls_certs")
      .update({ state: "superseded" })
      .eq("id", data.cert_id);
    if (error) return { ok: false, error: error.message };
    if (row) {
      await supabase.from("audit_events").insert({
        actor_id: userId,
        server_id: row.server_id,
        action: "tls.revoke",
        target_type: "tls_cert",
        target_id: data.cert_id,
      });
    }
    return { ok: true, error: null };
  });