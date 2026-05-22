import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AlertSeverity = "info" | "warn" | "critical";

export interface AlertInput {
  serverId: string;
  kind: string;
  severity: AlertSeverity;
  title: string;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * Persist a notification, then fan it out to the server's configured
 * webhook (fire-and-forget) and stamp delivery flags. Webhook delivery is
 * best-effort — failures are logged but do not block.
 */
export async function fireAlert(input: AlertInput): Promise<void> {
  const { data: server } = await supabaseAdmin
    .from("servers")
    .select("id, name, webhook_url, alert_email")
    .eq("id", input.serverId)
    .maybeSingle();

  const { data: note } = await supabaseAdmin
    .from("notifications")
    .insert({
      server_id: input.serverId,
      kind: input.kind,
      severity: input.severity,
      title: input.title,
      message: input.message ?? null,
      meta: (input.meta ?? {}) as never,
    } as never)
    .select("id")
    .single();

  if (!note) return;

  const logDelivery = async (row: {
    channel: "webhook" | "email";
    target: string | null;
    status: "attempted" | "success" | "failed" | "skipped";
    status_code?: number | null;
    error?: string | null;
  }) => {
    await supabaseAdmin.from("notification_deliveries").insert({
      notification_id: note.id,
      server_id: input.serverId,
      channel: row.channel,
      target: row.target,
      status: row.status,
      status_code: row.status_code ?? null,
      error: row.error ?? null,
    } as never);
  };

  // Email channel — not wired to an SMTP provider in OSS build; record skip.
  if (server?.alert_email) {
    await logDelivery({
      channel: "email",
      target: server.alert_email,
      status: "skipped",
      error: "SMTP provider not configured in this deployment",
    });
  }

  if (!server?.webhook_url) return;

  const payload = {
    id: note.id,
    server: { id: server.id, name: server.name },
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    message: input.message ?? null,
    meta: input.meta ?? {},
    timestamp: new Date().toISOString(),
  };

  await logDelivery({ channel: "webhook", target: server.webhook_url, status: "attempted" });

  try {
    const res = await fetch(server.webhook_url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "AsterOps-Alerter/1",
        "x-asterops-event": input.kind,
      },
      body: JSON.stringify(payload),
      // Avoid hanging the request — Workers fetch supports AbortController.
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      await supabaseAdmin
        .from("notifications")
        .update({ delivered_webhook: true } as never)
        .eq("id", note.id);
      await logDelivery({
        channel: "webhook",
        target: server.webhook_url,
        status: "success",
        status_code: res.status,
      });
    } else {
      await logDelivery({
        channel: "webhook",
        target: server.webhook_url,
        status: "failed",
        status_code: res.status,
        error: `HTTP ${res.status} ${res.statusText}`,
      });
    }
  } catch (err) {
    console.error("[alerts] webhook delivery failed", err);
    await logDelivery({
      channel: "webhook",
      target: server.webhook_url,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}