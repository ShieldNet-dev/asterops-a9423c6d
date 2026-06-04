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
  await admin.from("notifications").insert({
    server_id: input.serverId,
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    message: input.message,
    meta: input.meta ?? {},
  });
}