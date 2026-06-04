import { createServerFn } from "./_shim";
import { requireSupabaseAuth } from "./_shim";
import { z } from "zod";

export const fleetHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: servers } = await context.supabase
      .from("servers")
      .select("id, name, hostname, status, last_seen_at, agent_version, asterisk_version, active_calls, cert_expires_at, cert_warn_days, cert_critical_days");

    const ids = (servers ?? []).map((s: any) => s.id);
    if (ids.length === 0) return { servers: [], reloads: [] };

    const [reloadsRes, appliedRes] = await Promise.all([
      context.supabase
        .from("agent_reloads")
        .select("id, server_id, config_version, outcome, notes, created_at")
        .in("server_id", ids)
        .order("created_at", { ascending: false })
        .limit(60),
      context.supabase
        .from("pjsip_configs")
        .select("server_id, version, applied_at")
        .in("server_id", ids)
        .eq("state", "applied")
        .order("applied_at", { ascending: false }),
    ]);

    const lastApplied = new Map<string, { version: number; applied_at: string }>();
    for (const row of (appliedRes.data ?? []) as any[]) {
      if (!lastApplied.has(row.server_id) && row.applied_at) {
        lastApplied.set(row.server_id, { version: row.version, applied_at: row.applied_at });
      }
    }

    const now = Date.now();
    const enriched = (servers ?? []).map((s: any) => {
      const lastSeen = s.last_seen_at ? new Date(s.last_seen_at).getTime() : null;
      const heartbeatAge = lastSeen == null ? null : Math.floor((now - lastSeen) / 1000);
      let heartbeat: "live" | "stale" | "down" | "never" = "never";
      if (heartbeatAge == null) heartbeat = "never";
      else if (heartbeatAge < 60) heartbeat = "live";
      else if (heartbeatAge < 600) heartbeat = "stale";
      else heartbeat = "down";
      const applied = lastApplied.get(s.id);
      return {
        ...s,
        heartbeat,
        heartbeat_age_sec: heartbeatAge,
        last_applied_version: applied?.version ?? null,
        last_applied_at: applied?.applied_at ?? null,
      };
    });

    return { servers: enriched, reloads: reloadsRes.data ?? [] };
  });

export const recentReloads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("agent_reloads")
      .select("id, config_version, outcome, notes, created_at")
      .eq("server_id", data.server_id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return { reloads: [], error: error.message };
    return { reloads: rows ?? [], error: null };
  });