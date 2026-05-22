import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { server_id?: string | null; only_unacked?: boolean }) =>
    z
      .object({
        server_id: z.string().uuid().optional().nullable(),
        only_unacked: z.boolean().optional().default(false),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("notifications")
      .select("id, server_id, kind, severity, title, message, meta, acknowledged_at, created_at, delivered_webhook, servers(name)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.server_id) q = q.eq("server_id", data.server_id);
    if (data.only_unacked) q = q.is("acknowledged_at", null);
    const { data: rows, error } = await q;
    if (error) return { notifications: [], error: error.message };
    return { notifications: rows ?? [], error: null };
  });

export const acknowledgeNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: userId } as never)
      .eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  });

/**
 * Cert expiry summary — gives the dashboard a single source of truth across
 * the user's whole fleet, respecting each server's individual thresholds.
 */
export const certExpirySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: servers } = await context.supabase
      .from("servers")
      .select("id, name, cert_expires_at, cert_warn_days, cert_critical_days");
    const now = Date.now();
    const items = (servers ?? []).map((s: any) => {
      const exp = s.cert_expires_at ? new Date(s.cert_expires_at).getTime() : null;
      const days = exp == null ? null : Math.ceil((exp - now) / 86400000);
      let severity: "ok" | "warn" | "critical" | "expired" | "none" = "none";
      if (days == null) severity = "none";
      else if (days < 0) severity = "expired";
      else if (days <= (s.cert_critical_days ?? 3)) severity = "critical";
      else if (days <= (s.cert_warn_days ?? 14)) severity = "warn";
      else severity = "ok";
      return {
        id: s.id,
        name: s.name,
        cert_expires_at: s.cert_expires_at,
        days_remaining: days,
        warn_days: s.cert_warn_days,
        critical_days: s.cert_critical_days,
        severity,
      };
    });
    return { items };
  });

const AlertingSchema = z.object({
  server_id: z.string().uuid(),
  webhook_url: z
    .string()
    .trim()
    .max(2000)
    .url("Must be a valid https URL")
    .refine((v) => v.startsWith("https://"), "Webhook URL must use https")
    .optional()
    .nullable(),
  alert_email: z.string().trim().email().max(255).optional().nullable(),
  cert_warn_days: z.number().int().min(1).max(180),
  cert_critical_days: z.number().int().min(1).max(60),
});

export const updateAlertingConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AlertingSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("servers")
      .update({
        webhook_url: data.webhook_url || null,
        alert_email: data.alert_email || null,
        cert_warn_days: data.cert_warn_days,
        cert_critical_days: data.cert_critical_days,
      } as never)
      .eq("id", data.server_id);
    if (error) return { ok: false, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.server_id,
      action: "alerting.update",
      target_type: "server",
      target_id: data.server_id,
      meta: { has_webhook: !!data.webhook_url, has_email: !!data.alert_email },
    });
    return { ok: true, error: null };
  });

/**
 * Send a sample alert through the configured webhook so the operator can
 * confirm the endpoint accepts AsterOps payloads.
 */
export const sendTestAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: server } = await supabase
      .from("servers")
      .select("webhook_url")
      .eq("id", data.server_id)
      .maybeSingle();
    if (!server?.webhook_url) return { ok: false, error: "No webhook configured" };
    const { fireAlert } = await import("./alerts.server");
    await fireAlert({
      serverId: data.server_id,
      kind: "test.ping",
      severity: "info",
      title: "AsterOps test alert",
      message: "If you can read this, your webhook is wired up correctly.",
      meta: { triggered_by: userId },
    });
    return { ok: true, error: null };
  });

/**
 * List webhook/email delivery attempts joined with their originating
 * notification (kind, severity, title, originating server). One row per
 * attempt — attempted/success/failed/skipped — so operators can see exactly
 * which cert/TLS/SRTP/reload alert failed to deliver and why.
 */
export const listAlertDeliveries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        server_id: z.string().uuid().optional().nullable(),
        channel: z.enum(["webhook", "email"]).optional().nullable(),
        status: z.enum(["attempted", "success", "failed", "skipped"]).optional().nullable(),
        limit: z.number().int().min(1).max(500).default(200),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("notification_deliveries")
      .select(
        "id, notification_id, server_id, channel, target, status, status_code, error, attempted_at, servers(name), notifications(kind, severity, title, message)",
      )
      .order("attempted_at", { ascending: false })
      .limit(data.limit);
    if (data.server_id) q = q.eq("server_id", data.server_id);
    if (data.channel) q = q.eq("channel", data.channel);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) return { deliveries: [], error: error.message };
    return { deliveries: rows ?? [], error: null };
  });