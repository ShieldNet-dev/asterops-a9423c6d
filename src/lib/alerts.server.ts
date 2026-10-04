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

  return notification;
}