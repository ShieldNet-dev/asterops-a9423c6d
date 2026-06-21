import {
  adminClient,
  authenticateAgent,
  corsHeaders,
  fireAlert,
  json,
} from "../_shared/agent-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const admin = adminClient();
  const id = await authenticateAgent(req, admin);
  if (!id) return json({ error: "unauthorized" }, 401);

  const body = (await req.json().catch(() => null)) as
    | {
        profile?: string;
        score?: number;
        passed?: number;
        failed?: number;
        warnings?: number;
        tls_ok?: boolean;
        srtp_ok?: boolean;
        firewall_ok?: boolean;
        fail2ban_ok?: boolean;
        ami_locked?: boolean;
        checks?: unknown[];
        modules?: unknown[];
        agent_version?: string;
        report_html?: string;
      }
    | null;

  if (!body || typeof body.score !== "number") {
    return json({ error: "invalid payload" }, 400);
  }
  const score = Math.max(0, Math.min(100, Math.round(body.score)));

  const { data: inserted, error } = await admin
    .from("security_reports")
    .insert({
      server_id: id.serverId,
      profile: body.profile ?? "baseline",
      score,
      passed: body.passed ?? 0,
      failed: body.failed ?? 0,
      warnings: body.warnings ?? 0,
      tls_ok: !!body.tls_ok,
      srtp_ok: !!body.srtp_ok,
      firewall_ok: !!body.firewall_ok,
      fail2ban_ok: !!body.fail2ban_ok,
      ami_locked: !!body.ami_locked,
      results: { checks: body.checks ?? [], modules: body.modules ?? [] },
      report_html: body.report_html ?? null,
      agent_version: body.agent_version ?? null,
    })
    .select("id")
    .single();

  if (error) return json({ error: error.message }, 500);

  await admin.from("audit_events").insert({
    server_id: id.serverId,
    action: "security.report_uploaded",
    target_type: "security_report",
    target_id: inserted.id,
    meta: { score, profile: body.profile ?? "baseline" },
  });

  if (score < 60 || body.failed && body.failed > 0) {
    await fireAlert(admin, {
      serverId: id.serverId,
      kind: "security.posture_low",
      severity: score < 40 ? "critical" : "warn",
      title: `Security posture ${score}/100`,
      message: `Latest AsterOps scan reported ${body.failed ?? 0} critical and ${body.warnings ?? 0} warning checks.`,
      meta: { score, profile: body.profile ?? "baseline" },
    });
  }

  return json({ ok: true, id: inserted.id });
});