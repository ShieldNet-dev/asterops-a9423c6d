import { supabase } from "@/lib/supabase";

const DEMO_TAG = "[DEMO]";
const DEMO_NAMES = ["pbx-hq-01", "pbx-branch-eu", "pbx-lab-02"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function uid(): string {
  return Math.random().toString(36).slice(2, 12);
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

async function listDemoServers(userId: string) {
  const { data } = await supabase
    .from("servers")
    .select("*")
    .eq("owner_id", userId)
    .like("description", `${DEMO_TAG}%`);
  return data ?? [];
}

export async function hasDemoData(): Promise<boolean> {
  const userId = await currentUserId();
  const rows = await listDemoServers(userId);
  return rows.length > 0;
}

export async function resetDemoData(): Promise<{ deleted: number }> {
  const userId = await currentUserId();
  const servers = await listDemoServers(userId);
  if (servers.length === 0) return { deleted: 0 };
  const ids = servers.map((s: any) => s.id);
  // notifications have no cascade FK — delete first
  await supabase.from("notifications").delete().in("server_id", ids);
  await supabase.from("servers").delete().in("id", ids);
  return { deleted: ids.length };
}

export async function seedDemoData(): Promise<{ ok: true }> {
  const userId = await currentUserId();
  // Idempotent: wipe first
  await resetDemoData();

  const now = Date.now();
  const iso = (offsetSec: number) => new Date(now + offsetSec * 1000).toISOString();

  // ----- Servers -----
  const serverRows = [
    {
      owner_id: userId,
      name: DEMO_NAMES[0],
      hostname: "pbx-hq-01.corp.local",
      region: "eu-west",
      description: `${DEMO_TAG} Headquarters PBX — healthy fleet leader`,
      status: "online" as const,
      agent_version: "0.4.2",
      asterisk_version: "20.4.0",
      active_calls: 7,
      last_seen_at: iso(-30),
      cert_expires_at: iso(60 * 60 * 24 * 240),
    },
    {
      owner_id: userId,
      name: DEMO_NAMES[1],
      hostname: "pbx-branch-eu.corp.local",
      region: "eu-central",
      description: `${DEMO_TAG} Branch office PBX — TLS renewal due`,
      status: "online" as const,
      agent_version: "0.4.2",
      asterisk_version: "20.3.1",
      active_calls: 2,
      last_seen_at: iso(-90),
      cert_expires_at: iso(60 * 60 * 24 * 12),
    },
    {
      owner_id: userId,
      name: DEMO_NAMES[2],
      hostname: "pbx-lab-02.corp.local",
      region: "us-east",
      description: `${DEMO_TAG} Lab PBX — attention required`,
      status: "degraded" as const,
      agent_version: "0.4.1",
      asterisk_version: "18.20.0",
      active_calls: 0,
      last_seen_at: iso(-60 * 25),
      cert_expires_at: iso(-60 * 60 * 24 * 3),
    },
  ];
  const { data: servers, error: sErr } = await supabase
    .from("servers")
    .insert(serverRows)
    .select();
  if (sErr || !servers) throw sErr ?? new Error("insert servers failed");

  const [hq, branch, lab] = servers;

  // ----- TLS certs -----
  await supabase.from("tls_certs").insert([
    {
      server_id: hq.id,
      subject: "CN=pbx-hq-01.corp.local",
      issuer: "CN=Let's Encrypt R3",
      fingerprint_sha256: `demo:${uid()}`,
      not_after: iso(60 * 60 * 24 * 240),
      not_before: iso(-60 * 60 * 24 * 30),
      is_self_signed: false,
      state: "active",
      source: "letsencrypt",
      domain: "pbx-hq-01.corp.local",
      applied_at: iso(-60 * 60 * 24 * 30),
    },
    {
      server_id: branch.id,
      subject: "CN=pbx-branch-eu.corp.local",
      issuer: "CN=Let's Encrypt R3",
      fingerprint_sha256: `demo:${uid()}`,
      not_after: iso(60 * 60 * 24 * 12),
      not_before: iso(-60 * 60 * 24 * 78),
      is_self_signed: false,
      state: "active",
      source: "letsencrypt",
      domain: "pbx-branch-eu.corp.local",
      applied_at: iso(-60 * 60 * 24 * 78),
    },
    {
      server_id: lab.id,
      subject: "CN=pbx-lab-02.corp.local",
      issuer: "CN=Internal CA",
      fingerprint_sha256: `demo:${uid()}`,
      not_after: iso(-60 * 60 * 24 * 3),
      not_before: iso(-60 * 60 * 24 * 400),
      is_self_signed: true,
      state: "active",
      source: "uploaded",
      domain: "pbx-lab-02.corp.local",
      applied_at: iso(-60 * 60 * 24 * 400),
    },
  ]);

  // ----- Endpoints & trunks on HQ -----
  const extensions = ["1001", "1002", "1003", "1004", "1010", "1011", "2001", "2002"];
  const names = ["Reception", "Sales — Alex", "Sales — Priya", "Support L1", "Support L2", "Engineering", "CEO", "CFO"];
  await supabase.from("endpoints").insert(
    extensions.map((ext, i) => ({
      server_id: hq.id,
      extension: ext,
      display_name: names[i],
      context: "from-internal",
      codecs: ["opus", "g722", "ulaw", "alaw"],
      transport: "transport-tls",
      tls_required: true,
      srtp_required: true,
      max_contacts: i < 2 ? 2 : 1,
    })),
  );
  await supabase.from("trunks").insert([
    {
      server_id: hq.id,
      name: "twilio-primary",
      provider: "Twilio",
      host: "sip.twilio.com",
      port: 5061,
      username: "demo_ao_hq",
      transport: "transport-tls",
      srtp_required: true,
    },
    {
      server_id: hq.id,
      name: "voxbone-backup",
      provider: "Voxbone",
      host: "sip.voxbone.com",
      port: 5060,
      username: "demo_ao_hq_bkp",
      transport: "transport-tcp",
      srtp_required: false,
    },
  ]);

  // ----- pjsip_configs + agent_reloads on HQ -----
  const { data: cfg } = await supabase
    .from("pjsip_configs")
    .insert({
      server_id: hq.id,
      version: 1,
      state: "applied",
      rendered_text: "; DEMO pjsip.conf\n[transport-tls]\ntype=transport\nprotocol=tls\nbind=0.0.0.0:5061\n",
      notes: "Initial baseline profile — TLS + SRTP",
      created_by: userId,
      applied_at: iso(-60 * 60 * 24 * 2),
    })
    .select()
    .single();
  if (cfg) {
    await supabase.from("agent_reloads").insert([
      { server_id: hq.id, config_id: cfg.id, config_version: 1, outcome: "applied", notes: "PJSIP reload OK (0 errors)" },
    ]);
  }

  // ----- Calls (~120 across 24h) -----
  const callRows: any[] = [];
  const srcExts = extensions;
  const dstNumbers = ["+441234567890", "+33112223344", "+15551234567", "1001", "1002", "2001", "911"];
  for (let i = 0; i < 120; i++) {
    const srv = rand([hq, hq, hq, branch, lab]); // weight HQ
    const startOffset = -randInt(60, 60 * 60 * 24);
    const answered = Math.random() > 0.15;
    const dur = answered ? randInt(15, 600) : 0;
    const billsec = answered ? Math.max(1, dur - randInt(0, 5)) : 0;
    callRows.push({
      server_id: srv.id,
      uniqueid: `demo.${srv.id.slice(0, 6)}.${now}.${i}`,
      linkedid: `demo.${srv.id.slice(0, 6)}.${now}.${i}`,
      src: rand(srcExts),
      dst: rand(dstNumbers),
      channel: `PJSIP/${rand(srcExts)}-0000${i.toString(16)}`,
      lastapp: "Dial",
      duration: dur,
      billsec,
      disposition: answered ? "ANSWERED" : rand(["NO ANSWER", "BUSY", "FAILED"]),
      encrypted: srv.id !== lab.id,
      start_ts: iso(startOffset),
      answer_ts: answered ? iso(startOffset + randInt(1, 6)) : null,
      end_ts: iso(startOffset + dur + randInt(0, 3)),
    });
  }
  // insert in chunks
  for (let i = 0; i < callRows.length; i += 60) {
    await supabase.from("call_records").insert(callRows.slice(i, i + 60));
  }

  // ----- Notifications -----
  await supabase.from("notifications").insert([
    {
      server_id: branch.id,
      kind: "cert.expiring",
      severity: "warn",
      title: "TLS certificate expires in 12 days",
      message: "pbx-branch-eu.corp.local certificate should be renewed soon.",
    },
    {
      server_id: lab.id,
      kind: "cert.expired",
      severity: "critical",
      title: "TLS certificate has expired",
      message: "pbx-lab-02.corp.local certificate expired 3 days ago. Endpoints may reject the connection.",
    },
    {
      server_id: lab.id,
      kind: "auth.bruteforce",
      severity: "critical",
      title: "Brute-force attempt blocked",
      message: "fail2ban banned 92.63.194.15 after 8 failed SIP REGISTERs in 60s.",
      meta: { ip: "92.63.194.15", attempts: 8 },
    },
    {
      server_id: lab.id,
      kind: "ami.weak_password",
      severity: "warn",
      title: "AMI account uses a weak password",
      message: "The 'admin' Asterisk Manager account password is under 12 chars.",
    },
    // a few acked ones for history
    {
      server_id: hq.id,
      kind: "config.applied",
      severity: "info",
      title: "Baseline profile applied",
      message: "pjsip.conf reloaded successfully (0 errors).",
      acknowledged_at: iso(-60 * 60 * 24),
      acknowledged_by: userId,
    },
    {
      server_id: hq.id,
      kind: "agent.reconnected",
      severity: "info",
      title: "Agent reconnected",
      message: "AsterOps agent v0.4.2 reconnected after 42s downtime.",
      acknowledged_at: iso(-60 * 60 * 20),
      acknowledged_by: userId,
    },
  ]);

  // ----- Audit events -----
  await supabase.from("audit_events").insert([
    { actor_id: userId, server_id: hq.id, action: "server.create", target_type: "server", target_id: hq.id, meta: { demo: true } },
    { actor_id: userId, server_id: branch.id, action: "server.create", target_type: "server", target_id: branch.id, meta: { demo: true } },
    { actor_id: userId, server_id: lab.id, action: "server.create", target_type: "server", target_id: lab.id, meta: { demo: true } },
    { actor_id: userId, server_id: hq.id, action: "pjsip.publish", target_type: "config", meta: { version: 1, demo: true } },
    { actor_id: userId, server_id: hq.id, action: "pjsip.apply", target_type: "config", meta: { version: 1, outcome: "applied", demo: true } },
    { actor_id: userId, server_id: hq.id, action: "profile.change", target_type: "server", target_id: hq.id, meta: { from: "custom", to: "baseline", demo: true } },
    { actor_id: userId, server_id: branch.id, action: "tls.request", target_type: "cert", meta: { domain: "pbx-branch-eu.corp.local", demo: true } },
    { actor_id: userId, server_id: lab.id, action: "alert.ack", target_type: "notification", meta: { kind: "auth.bruteforce", demo: true } },
  ]);

  return { ok: true };
}

// ----- Live simulation tick -----
export async function simulateTick(): Promise<void> {
  const userId = await currentUserId();
  const servers = await listDemoServers(userId);
  if (servers.length === 0) return;

  const srv = rand(servers as any[]);
  const now = Date.now();
  const iso = (offsetSec: number) => new Date(now + offsetSec * 1000).toISOString();

  // 1) insert a fresh call
  const answered = Math.random() > 0.15;
  const dur = answered ? randInt(10, 300) : 0;
  const extensions = ["1001", "1002", "1003", "1004", "1010", "2001"];
  const dsts = ["+441234567890", "+15551234567", "1001", "1002", "2001"];
  await supabase.from("call_records").insert({
    server_id: srv.id,
    uniqueid: `demo.tick.${now}.${Math.floor(Math.random() * 10000)}`,
    src: rand(extensions),
    dst: rand(dsts),
    channel: `PJSIP/${rand(extensions)}-live`,
    lastapp: "Dial",
    duration: dur,
    billsec: answered ? Math.max(1, dur - 2) : 0,
    disposition: answered ? "ANSWERED" : rand(["NO ANSWER", "BUSY"]),
    encrypted: srv.status !== "degraded",
    start_ts: iso(-dur - 2),
    answer_ts: answered ? iso(-dur) : null,
    end_ts: iso(0),
  });

  // 2) refresh server heartbeat + active_calls
  await supabase
    .from("servers")
    .update({
      last_seen_at: new Date().toISOString(),
      active_calls: Math.max(0, (srv.active_calls ?? 0) + randInt(-1, 2)),
    })
    .eq("id", srv.id);

  // 3) occasionally raise an alert
  if (Math.random() < 0.15) {
    const events = [
      { kind: "auth.bruteforce", severity: "critical", title: "Brute-force attempt blocked", message: `fail2ban banned ${randInt(1, 255)}.${randInt(1, 255)}.${randInt(1, 255)}.${randInt(1, 255)} after repeated SIP REGISTERs.` },
      { kind: "call.spike", severity: "warn", title: "Unusual outbound call volume", message: "Outbound calls +38% vs. baseline in the last 5 min." },
      { kind: "agent.heartbeat", severity: "info", title: "Agent checked in", message: `${srv.name} agent heartbeat received.` },
    ];
    const ev = rand(events);
    await supabase.from("notifications").insert({
      server_id: srv.id,
      kind: ev.kind,
      severity: ev.severity,
      title: ev.title,
      message: ev.message,
    });
  }
}