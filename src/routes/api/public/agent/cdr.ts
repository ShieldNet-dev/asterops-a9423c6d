import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateAgent, json } from "@/lib/agent-auth.server";

const CdrSchema = z.object({
  uniqueid: z.string().min(1).max(80),
  linkedid: z.string().max(80).optional().nullable(),
  src: z.string().max(80).optional().nullable(),
  dst: z.string().max(80).optional().nullable(),
  channel: z.string().max(120).optional().nullable(),
  dst_channel: z.string().max(120).optional().nullable(),
  lastapp: z.string().max(80).optional().nullable(),
  lastdata: z.string().max(255).optional().nullable(),
  duration: z.number().int().min(0).max(86400 * 7).default(0),
  billsec: z.number().int().min(0).max(86400 * 7).default(0),
  disposition: z
    .enum(["ANSWERED","NO_ANSWER","BUSY","FAILED","REJECTED","CONGESTION","UNKNOWN"])
    .default("UNKNOWN"),
  amaflags: z.string().max(40).optional().nullable(),
  accountcode: z.string().max(80).optional().nullable(),
  encrypted: z.boolean().default(false),
  start_ts: z.string().datetime(),
  answer_ts: z.string().datetime().optional().nullable(),
  end_ts: z.string().datetime().optional().nullable(),
});

const BatchSchema = z.object({
  records: z.array(CdrSchema).min(1).max(500),
});

export const Route = createFileRoute("/api/public/agent/cdr")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = await authenticateAgent(request);
        if (!id) return json({ error: "unauthorized" }, 401);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
        const parsed = BatchSchema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid payload" }, 400);

        const rows = parsed.data.records.map((r) => ({ ...r, server_id: id.serverId }));
        const { error } = await supabaseAdmin
          .from("call_records")
          .upsert(rows, { onConflict: "server_id,uniqueid", ignoreDuplicates: true });
        if (error) return json({ error: error.message }, 500);
        return json({ accepted: rows.length });
      },
    },
  },
});