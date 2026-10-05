import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders, adminClient, fireAlert, json } from "../_shared/agent-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } },
  );
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null) as { server_id?: unknown } | null;
  if (typeof body?.server_id !== "string") return json({ error: "invalid payload" }, 400);

  const admin = adminClient();
  const { data: server } = await admin
    .from("servers")
    .select("id, webhook_url")
    .eq("id", body.server_id)
    .eq("owner_id", userData.user.id)
    .maybeSingle();
  if (!server) return json({ error: "server not found" }, 404);
  if (!server.webhook_url) return json({ error: "No webhook configured" }, 400);

  const delivery = await fireAlert(admin, {
    serverId: server.id,
    kind: "test.ping",
    severity: "info",
    title: "AsterOps test alert",
    message: "If you can read this, your webhook is wired up correctly.",
    meta: { triggered_by: userData.user.id },
  });
  return json(delivery, delivery.ok ? 200 : 502);
});