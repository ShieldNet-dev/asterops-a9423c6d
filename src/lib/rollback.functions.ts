import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listPjsipVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { server_id: string }) =>
    z.object({ server_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("pjsip_configs")
      .select("id, version, state, applied_at, created_at, notes, rendered_text")
      .eq("server_id", data.server_id)
      .order("version", { ascending: false })
      .limit(20);
    if (error) return { versions: [], error: error.message };
    return { versions: rows ?? [], error: null };
  });

/**
 * Roll back to a previously-applied pjsip.conf. We do NOT mutate the
 * historical row — we insert a new version that copies the target's text
 * and queue it as 'pending' for the agent. This keeps the audit ledger
 * fully linear: every state transition is a new row.
 */
export const rollbackPjsipConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { server_id: string; target_version_id?: string | null }) =>
    z
      .object({
        server_id: z.string().uuid(),
        target_version_id: z.string().uuid().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let target;
    if (data.target_version_id) {
      const { data: row } = await supabase
        .from("pjsip_configs")
        .select("id, version, rendered_text")
        .eq("id", data.target_version_id)
        .eq("server_id", data.server_id)
        .maybeSingle();
      target = row;
    } else {
      // Default = previous successfully-applied version (skip current pending).
      const { data: rows } = await supabase
        .from("pjsip_configs")
        .select("id, version, rendered_text, state")
        .eq("server_id", data.server_id)
        .eq("state", "applied")
        .order("version", { ascending: false })
        .limit(2);
      target = (rows ?? [])[1] ?? (rows ?? [])[0] ?? null;
    }

    if (!target) return { ok: false, error: "No previous applied version to roll back to" };

    const { data: latest } = await supabase
      .from("pjsip_configs")
      .select("version")
      .eq("server_id", data.server_id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (latest?.version ?? 0) + 1;

    const { data: inserted, error } = await supabase
      .from("pjsip_configs")
      .insert({
        server_id: data.server_id,
        version: nextVersion,
        rendered_text: target.rendered_text,
        state: "pending",
        created_by: userId,
        notes: `rollback to v${target.version}`,
      })
      .select()
      .single();
    if (error) return { ok: false, error: error.message };

    await supabase.from("audit_events").insert({
      actor_id: userId,
      server_id: data.server_id,
      action: "pjsip.rollback",
      target_type: "pjsip_config",
      target_id: inserted.id,
      meta: { from_version: target.version, new_version: nextVersion },
    });
    return { ok: true, error: null, new_version: nextVersion };
  });