// Client-side stub: the original fired alerts from the server with a
// service-role client + outbound HTTPS. From the browser we cannot reach
// arbitrary webhooks (CORS) nor send email. We instead record an attempt
// row so the operator sees the request in the alert log.
import { supabase } from "@/lib/supabase";

export async function fireAlert(input: {
  serverId: string;
  kind: string;
  severity: "info" | "warn" | "critical";
  title: string;
  message: string;
  meta?: Record<string, unknown>;
}) {
  const { data: notification } = await supabase
    .from("notifications")
    .insert({
      server_id: input.serverId,
      kind: input.kind,
      severity: input.severity,
      title: input.title,
      message: input.message,
      meta: input.meta ?? {},
    } as never)
    .select()
    .single();

  if (notification) {
    await supabase.from("notification_deliveries").insert({
      notification_id: (notification as any).id,
      server_id: input.serverId,
      channel: "webhook",
      target: "client-stub",
      status: "skipped",
      error: "Webhook delivery moved off the dashboard; configure a server-side trigger.",
    } as never);
  }
}