import { createServerFn } from "./_shim";
import { requireSupabaseAuth } from "./_shim";
import { z } from "zod";

const FiltersSchema = z.object({
  server_id: z.string().uuid().optional().nullable(),
  src: z.string().trim().max(80).optional().nullable(),
  dst: z.string().trim().max(80).optional().nullable(),
  disposition: z.enum(["ANSWERED","NO_ANSWER","BUSY","FAILED","REJECTED","CONGESTION","UNKNOWN"]).optional().nullable(),
  since: z.string().datetime().optional().nullable(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listCalls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FiltersSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("call_records")
      .select("*, servers(name)")
      .order("start_ts", { ascending: false })
      .limit(data.limit);
    if (data.server_id) q = q.eq("server_id", data.server_id);
    if (data.src) q = q.ilike("src", `%${data.src}%`);
    if (data.dst) q = q.ilike("dst", `%${data.dst}%`);
    if (data.disposition) q = q.eq("disposition", data.disposition);
    if (data.since) q = q.gte("start_ts", data.since);
    const { data: rows, error } = await q;
    if (error) return { calls: [], error: error.message };
    return { calls: rows ?? [], error: null };
  });

export const callStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: rows } = await supabase
      .from("call_records")
      .select("disposition, encrypted, duration")
      .gte("start_ts", since);
    const total = rows?.length ?? 0;
    let answered = 0, encrypted = 0, totalDuration = 0;
    for (const r of rows ?? []) {
      if (r.disposition === "ANSWERED") answered++;
      if (r.encrypted) encrypted++;
      totalDuration += r.duration ?? 0;
    }
    return {
      total24h: total,
      answered24h: answered,
      encrypted24h: encrypted,
      avgDurationSec: total ? Math.round(totalDuration / total) : 0,
    };
  });