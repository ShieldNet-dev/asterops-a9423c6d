import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

/**
 * Resolve a server by its agent bearer token. Returns null if the token is
 * missing, malformed, or no matching server exists.
 */
export async function authenticateAgent(request: Request): Promise<AgentIdentity | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token || token.length > 200) return null;
  const hash = await sha256Hex(token);
  const { data } = await supabaseAdmin
    .from("servers")
    .select("id, owner_id")
    .eq("agent_token_hash", hash)
    .maybeSingle();
  if (!data) return null;
  return { serverId: data.id, ownerId: data.owner_id };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}