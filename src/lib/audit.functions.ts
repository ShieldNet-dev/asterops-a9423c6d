import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const FiltersSchema = z.object({
  server_id: z.string().uuid().optional().nullable(),
  actor_id: z.string().uuid().optional().nullable(),
  action: z.string().trim().max(80).optional().nullable(),
  role: z.enum(["admin", "operator", "viewer"]).optional().nullable(),
  since: z.string().datetime().optional().nullable(),
  until: z.string().datetime().optional().nullable(),
  limit: z.number().int().min(1).max(1000).default(200),
});

export const listAuditEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FiltersSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Check admin via has_role; non-admins still see events they touched or
    // events on their own servers (enforced by RLS regardless).
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");

    // Resolve role filter to the set of actor ids carrying that role
    // (admin-only filter; ignored for non-admins).
    let actorIdSet: string[] | null = null;
    if (data.role && isAdmin) {
      const { data: ru } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", data.role);
      actorIdSet = (ru ?? []).map((r: any) => r.user_id as string);
      if (actorIdSet.length === 0) actorIdSet = ["00000000-0000-0000-0000-000000000000"]; // empty match
    }

    let q = supabase
      .from("audit_events")
      .select("id, created_at, actor_id, server_id, action, target_type, target_id, meta, servers(name)")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.server_id) q = q.eq("server_id", data.server_id);
    if (data.actor_id) q = q.eq("actor_id", data.actor_id);
    if (data.action) q = q.ilike("action", `%${data.action}%`);
    if (actorIdSet) q = q.in("actor_id", actorIdSet);
    if (data.since) q = q.gte("created_at", data.since);
    if (data.until) q = q.lte("created_at", data.until);
    const { data: rows, error } = await q;
    if (error) return { events: [], isAdmin, error: error.message };
    return { events: rows ?? [], isAdmin, error: null };
  });