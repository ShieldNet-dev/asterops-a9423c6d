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

  if (!server?.webhook_url || !note) return;

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
    }
  } catch (err) {
    console.error("[alerts] webhook delivery failed", err);
  }
}