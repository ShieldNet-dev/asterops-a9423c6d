import { z } from "https://esm.sh/zod@3.23.8";
import {
  adminClient,
  authenticateAgent,
  corsHeaders,
  json,
} from "../_shared/agent-auth.ts";

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
    .enum(["ANSWERED", "NO_ANSWER", "BUSY", "FAILED", "REJECTED", "CONGESTION", "UNKNOWN"])
    .default("UNKNOWN"),
  amaflags: z.string().max(40).optional().nullable(),
  accountcode: z.string().max(80).optional().nullable(),
  encrypted: z.boolean().default(false),
  start_ts: z.string().datetime(),
  answer_ts: z.string().datetime().optional().nullable(),
  end_ts: z.string().datetime().optional().nullable(),
});

const BatchSchema = z.object({ records: z.array(CdrSchema).min(1).max(500) });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const admin = adminClient();
  const id = await authenticateAgent(req, admin);
  if (!id) return json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const parsed = BatchSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid payload" }, 400);

  const rows = parsed.data.records.map((r) => ({ ...r, server_id: id.serverId }));
  const { error } = await admin
    .from("call_records")
    .upsert(rows, { onConflict: "server_id,uniqueid", ignoreDuplicates: true });
  if (error) return json({ error: error.message }, 500);
  return json({ accepted: rows.length });
});