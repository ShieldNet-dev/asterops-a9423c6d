import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let s = "";
  for (const b of arr) s += b.toString(16).padStart(2, "0");
  return `ao_agent_${s}`;
}

export interface AgentIdentity {
  serverId: string;
  ownerId: string;
}

export async function authenticateAgent(
  request: Request,
  admin: SupabaseClient,
): Promise<AgentIdentity | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token || token.length > 200) return null;
  const hash = await sha256Hex(token);
  const { data } = await admin
    .from("servers")
    .select("id, owner_id")
    .eq("agent_token_hash", hash)
    .maybeSingle();
  if (!data) return null;
  return { serverId: data.id as string, ownerId: data.owner_id as string };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

export async function fireAlert(
  admin: SupabaseClient,
  input: {
    serverId: string;
    kind: string;
    severity: "info" | "warn" | "critical";
    title: string;
    message: string;
    meta?: Record<string, unknown>;
  },
) {
  const { data: notification, error } = await admin.from("notifications").insert({
    server_id: input.serverId,
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    message: input.message,
    meta: input.meta ?? {},
  }).select("id, server_id, kind, severity, title, message, meta, created_at").single();
  if (error || !notification) return;

  const { data: server } = await admin
    .from("servers")
    .select("name, webhook_url")
    .eq("id", input.serverId)
    .maybeSingle();
  if (!server?.webhook_url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let status = "failed";
  let statusCode: number | null = null;
  let errorText: string | null = null;
  try {
    const response = await fetch(server.webhook_url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-asterops-event": input.kind },
      body: JSON.stringify({
        id: notification.id,
        event: input.kind,
        severity: input.severity,
        title: input.title,
        message: input.message,
        meta: input.meta ?? {},
        server: { id: input.serverId, name: server.name },
        created_at: notification.created_at,
      }),
      signal: controller.signal,
    });
    statusCode = response.status;
    status = response.ok ? "success" : "failed";
    if (!response.ok) errorText = (await response.text()).slice(0, 1000);
  } catch (e) {
    errorText = e instanceof Error ? e.message.slice(0, 1000) : "Webhook request failed";
  } finally {
    clearTimeout(timeout);
  }
  await admin.from("notification_deliveries").insert({
    notification_id: notification.id,
    server_id: input.serverId,
    channel: "webhook",
    target: server.webhook_url,
    status,
    status_code: statusCode,
    error: errorText,
  });
  if (status === "success") {
    await admin.from("notifications").update({ delivered_webhook: true }).eq("id", notification.id);
  }
}