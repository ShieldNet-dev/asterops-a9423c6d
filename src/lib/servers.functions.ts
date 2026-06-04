import { createServerFn } from "./_shim";
import { requireSupabaseAuth } from "./_shim";
import { z } from "zod";

function randomToken(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let s = "";
  for (const b of arr) s += b.toString(16).padStart(2, "0");
  return `ao_${s}`;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const ServerCreateSchema = z.object({
  name: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9 _.-]+$/),
  hostname: z.string().trim().max(255).optional().nullable(),
  region: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});

export const listServers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("servers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return { servers: [], error: error.message };
    return { servers: data ?? [], error: null };
  });

export const getServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: server, error } = await supabase
      .from("servers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { server: null, error: error.message };
    return { server, error: null };
  });

export const createServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ServerCreateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const token = randomToken();
    const tokenHash = await sha256Hex(token);

    const { data: server, error } = await supabase
      .from("servers")
      .insert({
        owner_id: userId,
        name: data.name,
        hostname: data.hostname ?? null,
        region: data.region ?? null,
        description: data.description ?? null,
        enrollment_token_hash: tokenHash,
        status: "pending",
      })
      .select()
      .single();

    if (error) return { server: null, enrollmentToken: null, error: error.message };

    // seed default hardening profile
    await supabase.from("hardening_profiles").insert({ server_id: server.id });

    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: server.id,
      action: "server.create",
      target_type: "server",
      target_id: server.id,
      meta: { name: data.name },
    });

    return { server, enrollmentToken: token, error: null };
  });

export const rotateEnrollmentToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const token = randomToken();
    const tokenHash = await sha256Hex(token);
    const { error } = await supabase
      .from("servers")
      .update({ enrollment_token_hash: tokenHash, agent_token_hash: null, status: "pending" })
      .eq("id", data.id);
    if (error) return { token: null, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.id,
      action: "server.rotate_enrollment_token",
      target_type: "server",
      target_id: data.id,
    });
    return { token, error: null };
  });

export const deleteServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("servers").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    await supabase.from("audit_events").insert({
      actor_id: userId,
      action: "server.delete",
      target_type: "server",
      target_id: data.id,
    });
    return { ok: true, error: null };
  });