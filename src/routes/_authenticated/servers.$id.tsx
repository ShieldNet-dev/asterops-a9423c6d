import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getServer, deleteServer, rotateEnrollmentToken } from "@/lib/servers.functions";
import {
  listEndpoints,
  upsertEndpoint,
  deleteEndpoint,
  previewPjsipConfig,
  renderAndSavePjsipConfig,
  getHardening,
  updateHardening,
  renderHardeningBundle,
} from "@/lib/pjsip.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronLeft, Copy, Plus, Trash2, RefreshCw, Download, Send, Upload, ShieldCheck, AlertTriangle, RotateCcw, Bell, Webhook } from "lucide-react";
import { StatusPill } from "./dashboard";
import {
  listCerts,
  uploadCert,
  provisionLetsEncrypt,
  generateSelfSigned,
  requestRenewal,
  revokeCert,
} from "@/lib/tls.functions";
import { listPjsipVersions, rollbackPjsipConfig } from "@/lib/rollback.functions";
import { updateAlertingConfig, sendTestAlert } from "@/lib/alerts.functions";

export const Route = createFileRoute("/_authenticated/servers/$id")({
  head: () => ({ meta: [{ title: "Server — AsterOps" }] }),
  component: ServerDetail,
});

function ServerDetail() {
  const { id } = useParams({ from: "/_authenticated/servers/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchServer = useServerFn(getServer);
  const removeServer = useServerFn(deleteServer);
  const rotateToken = useServerFn(rotateEnrollmentToken);

  const serverQ = useQuery({
    queryKey: ["server", id],
    queryFn: () => fetchServer({ data: { id } }),
  });
  const server = serverQ.data?.server;

  const [tokenDialog, setTokenDialog] = useState<string | null>(null);

  async function onRotate() {
    const res = await rotateToken({ data: { id } });
    if (res.error) { toast.error(res.error); return; }
    if (res.token) setTokenDialog(res.token);
    qc.invalidateQueries({ queryKey: ["server", id] });
  }

  async function onDelete() {
    if (!confirm("Delete this server and all of its data? This cannot be undone.")) return;
    const res = await removeServer({ data: { id } });
    if (res.error) { toast.error(res.error); return; }
    toast.success("Server deleted");
    navigate({ to: "/servers" });
  }

  if (serverQ.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!server) return <div className="text-sm text-muted-foreground">Server not found.</div>;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/servers" className="mb-3 inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-3" /> All servers
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{server.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <StatusPill status={server.status} />
              <span className="font-mono">{server.hostname ?? "no hostname"}</span>
              {server.region && <Badge variant="outline" className="font-mono">{server.region}</Badge>}
              {server.asterisk_version && <span>Asterisk {server.asterisk_version}</span>}
              {server.agent_version && <span>Agent {server.agent_version}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRotate}>
              <RefreshCw className="mr-2 size-3" /> Rotate enrollment token
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-status-err hover:text-status-err">
              <Trash2 className="mr-2 size-3" /> Delete
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pjsip">
        <TabsList>
          <TabsTrigger value="pjsip">PJSIP</TabsTrigger>
          <TabsTrigger value="security">TLS &amp; SRTP</TabsTrigger>
          <TabsTrigger value="hardening">Hardening</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
        </TabsList>
        <TabsContent value="pjsip" className="mt-6">
          <PjsipPanel serverId={id} />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecurityPanel serverId={id} certExpiresAt={server.cert_expires_at} />
        </TabsContent>
        <TabsContent value="hardening" className="mt-6">
          <HardeningPanel serverId={id} />
        </TabsContent>
        <TabsContent value="alerts" className="mt-6">
          <AlertsPanel
            serverId={id}
            webhookUrl={(server as any).webhook_url ?? null}
            alertEmail={(server as any).alert_email ?? null}
            warnDays={(server as any).cert_warn_days ?? 14}
            criticalDays={(server as any).cert_critical_days ?? 3}
          />
        </TabsContent>
        <TabsContent value="calls" className="mt-6">
          <ServerCallsPanel serverId={id} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!tokenDialog} onOpenChange={(o) => { if (!o) setTokenDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New enrollment token</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded border border-border bg-background">
            <pre className="overflow-x-auto p-3 font-mono text-xs">{tokenDialog}</pre>
          </div>
          <p className="text-xs text-muted-foreground">
            Shown only once. The previously enrolled agent token is now invalid.
          </p>
          <DialogFooter>
            <Button onClick={() => { navigator.clipboard.writeText(tokenDialog ?? ""); toast.success("Copied"); }}>
              <Copy className="mr-2 size-3" /> Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- PJSIP panel ---------------- */

function PjsipPanel({ serverId }: { serverId: string }) {
  const qc = useQueryClient();
  const fetchEndpoints = useServerFn(listEndpoints);
  const preview = useServerFn(previewPjsipConfig);
  const upsert = useServerFn(upsertEndpoint);
  const remove = useServerFn(deleteEndpoint);
  const save = useServerFn(renderAndSavePjsipConfig);

  const endpointsQ = useQuery({
    queryKey: ["endpoints", serverId],
    queryFn: () => fetchEndpoints({ data: { server_id: serverId } }),
  });
  const previewQ = useQuery({
    queryKey: ["pjsip-preview", serverId, endpointsQ.data?.endpoints.length, endpointsQ.data?.trunks.length],
    queryFn: () => preview({ data: { server_id: serverId } }),
    enabled: !!endpointsQ.data,
  });

  const [extension, setExtension] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tls, setTls] = useState(true);
  const [srtp, setSrtp] = useState(true);

  async function add() {
    const res = await upsert({
      data: {
        server_id: serverId,
        endpoint: {
          extension,
          display_name: displayName || null,
          context: "from-internal",
          codecs: ["ulaw", "alaw", "g722", "opus"],
          transport: tls ? "transport-tls" : "transport-udp",
          tls_required: tls,
          srtp_required: srtp,
          max_contacts: 1,
        },
      },
    });
    if (res.error) { toast.error(res.error); return; }
    setExtension(""); setDisplayName("");
    qc.invalidateQueries({ queryKey: ["endpoints", serverId] });
    toast.success("Endpoint saved");
  }

  async function deploy() {
    const res = await save({ data: { server_id: serverId } });
    if (res.error) { toast.error(res.error); return; }
    toast.success(`Config v${res.config?.version} queued for agent`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Add endpoint</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ext">Extension</Label>
                <Input id="ext" value={extension} onChange={(e) => setExtension(e.target.value)} placeholder="1001" className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dn">Display name</Label>
                <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Sales" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
              <Label htmlFor="tls" className="cursor-pointer">Enforce TLS transport</Label>
              <Switch id="tls" checked={tls} onCheckedChange={setTls} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
              <Label htmlFor="srtp" className="cursor-pointer">Require SRTP (SDES)</Label>
              <Switch id="srtp" checked={srtp} onCheckedChange={setSrtp} />
            </div>
            <Button onClick={add} disabled={!extension} className="w-full">
              <Plus className="mr-2 size-4" /> Add endpoint
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground">Endpoints</div>
          {endpointsQ.data?.endpoints.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No endpoints yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-border">
                {endpointsQ.data?.endpoints.map((e) => (
                  <tr key={e.id}>
                    <td className="px-6 py-3 font-mono">{e.extension}</td>
                    <td className="px-6 py-3 text-muted-foreground">{e.display_name ?? "—"}</td>
                    <td className="px-6 py-3 text-xs">
                      {e.tls_required && <Badge variant="outline" className="mr-1 font-mono text-[10px]">TLS</Badge>}
                      {e.srtp_required && <Badge variant="outline" className="font-mono text-[10px]">SRTP</Badge>}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Delete endpoint ${e.extension}?`)) return;
                          await remove({ data: { id: e.id } });
                          qc.invalidateQueries({ queryKey: ["endpoints", serverId] });
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <span className="font-mono text-xs text-muted-foreground">pjsip.conf — rendered preview</span>
          <div className="flex items-center gap-2">
            <RollbackButton serverId={serverId} />
            <Button size="sm" onClick={deploy}>
              <Send className="mr-2 size-3" /> Deploy to agent
            </Button>
          </div>
        </div>
        <pre className="max-h-[600px] overflow-auto bg-background p-5 font-mono text-xs leading-relaxed text-foreground">
          {previewQ.data?.rendered ?? "Loading…"}
        </pre>
        <VersionsList serverId={serverId} />
      </div>
    </div>
  );
}

/* ---------------- Rollback ---------------- */

function RollbackButton({ serverId }: { serverId: string }) {
  const qc = useQueryClient();
  const fetchVersions = useServerFn(listPjsipVersions);
  const rollback = useServerFn(rollbackPjsipConfig);
  const q = useQuery({
    queryKey: ["pjsip-versions", serverId],
    queryFn: () => fetchVersions({ data: { server_id: serverId } }),
  });
  const applied = (q.data?.versions ?? []).filter((v: any) => v.state === "applied");
  const previous = applied[1] ?? null;

  async function onClick() {
    if (!previous) { toast.error("No previously-applied version to roll back to"); return; }
    if (!confirm(`Roll back to pjsip.conf v${previous.version}? The agent will reload Asterisk on next poll.`)) return;
    const res = await rollback({ data: { server_id: serverId, target_version_id: previous.id } });
    if (res.error) { toast.error(res.error); return; }
    toast.success(`Rollback queued (new v${res.new_version})`);
    qc.invalidateQueries({ queryKey: ["pjsip-versions", serverId] });
    qc.invalidateQueries({ queryKey: ["pjsip-preview", serverId] });
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={!previous}>
      <RotateCcw className="mr-2 size-3" /> Rollback{previous ? ` to v${previous.version}` : ""}
    </Button>
  );
}

function VersionsList({ serverId }: { serverId: string }) {
  const qc = useQueryClient();
  const fetchVersions = useServerFn(listPjsipVersions);
  const rollback = useServerFn(rollbackPjsipConfig);
  const q = useQuery({
    queryKey: ["pjsip-versions", serverId],
    queryFn: () => fetchVersions({ data: { server_id: serverId } }),
    refetchInterval: 15_000,
  });
  const versions = q.data?.versions ?? [];
  if (versions.length === 0) return null;
  return (
    <div className="border-t border-border">
      <div className="px-6 py-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Version history</div>
      <ul className="divide-y divide-border max-h-[260px] overflow-y-auto">
        {versions.map((v: any) => (
          <li key={v.id} className="flex items-center justify-between px-6 py-2 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-foreground">v{v.version}</span>
              <span className={`uppercase ${
                v.state === "applied" ? "text-status-ok" :
                v.state === "failed" ? "text-status-err" :
                v.state === "pending" ? "text-status-warn" : "text-muted-foreground"
              }`}>{v.state}</span>
              <span className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
              {v.notes && <span className="text-muted-foreground italic">· {v.notes}</span>}
            </div>
            {v.state === "applied" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!confirm(`Roll back to v${v.version}?`)) return;
                  const res = await rollback({ data: { server_id: serverId, target_version_id: v.id } });
                  if (res.error) { toast.error(res.error); return; }
                  toast.success(`Rollback queued (new v${res.new_version})`);
                  qc.invalidateQueries({ queryKey: ["pjsip-versions", serverId] });
                }}
              >
                <RotateCcw className="size-3" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Alerts panel ---------------- */

function AlertsPanel({
  serverId,
  webhookUrl,
  alertEmail,
  warnDays,
  criticalDays,
}: {
  serverId: string;
  webhookUrl: string | null;
  alertEmail: string | null;
  warnDays: number;
  criticalDays: number;
}) {
  const qc = useQueryClient();
  const update = useServerFn(updateAlertingConfig);
  const test = useServerFn(sendTestAlert);
  const [webhook, setWebhook] = useState(webhookUrl ?? "");
  const [email, setEmail] = useState(alertEmail ?? "");
  const [warn, setWarn] = useState(warnDays);
  const [critical, setCritical] = useState(criticalDays);

  async function save() {
    const res = await update({
      data: {
        server_id: serverId,
        webhook_url: webhook.trim() || null,
        alert_email: email.trim() || null,
        cert_warn_days: warn,
        cert_critical_days: critical,
      },
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success("Alert settings saved");
    qc.invalidateQueries({ queryKey: ["server", serverId] });
  }

  async function testNow() {
    const res = await test({ data: { server_id: serverId } });
    if (res.error) { toast.error(res.error); return; }
    toast.success("Test alert dispatched");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-brand" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Real-time alert delivery</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          AsterOps posts a JSON payload to your webhook whenever a TLS provisioning or
          PJSIP reload fails on this server. Email is included in the payload for downstream relays.
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="wh">Webhook URL (https)</Label>
            <div className="flex gap-2">
              <Input
                id="wh"
                type="url"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://hooks.example.com/asterops"
                className="font-mono text-xs"
              />
              <Button variant="outline" onClick={testNow} disabled={!webhook}>
                <Webhook className="mr-2 size-3" /> Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Compatible with Slack, Discord, n8n, Make, custom HTTPS endpoints.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="em">Alert email (included in webhook payload)</Label>
            <Input
              id="em"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="oncall@example.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="warn">Cert WARN threshold (days)</Label>
              <Input id="warn" type="number" min={1} max={180} value={warn} onChange={(e) => setWarn(parseInt(e.target.value || "0", 10))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crit">Cert CRITICAL threshold (days)</Label>
              <Input id="crit" type="number" min={1} max={60} value={critical} onChange={(e) => setCritical(parseInt(e.target.value || "0", 10))} />
            </div>
          </div>

          <Button onClick={save}>Save settings</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Webhook payload</h3>
        <pre className="mt-3 overflow-x-auto rounded-md bg-background p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
{`POST <your-webhook>
content-type: application/json
x-asterops-event: tls.provision_failed

{
  "id": "…",
  "server": { "id": "…", "name": "pbx-fra-01" },
  "kind": "tls.provision_failed",
  "severity": "critical",
  "title": "TLS certificate provisioning failed",
  "message": "certbot: dns-01 challenge failed",
  "meta": { "cert_id": "…" },
  "timestamp": "2026-05-21T09:14:22.000Z"
}`}
        </pre>
      </div>
    </div>
  );
}

/* ---------------- Security panel ---------------- */

function SecurityPanel({ serverId, certExpiresAt }: { serverId: string; certExpiresAt: string | null }) {
  const qc = useQueryClient();
  const fetchCerts = useServerFn(listCerts);
  const upload = useServerFn(uploadCert);
  const provisionLE = useServerFn(provisionLetsEncrypt);
  const selfSign = useServerFn(generateSelfSigned);
  const renew = useServerFn(requestRenewal);
  const revoke = useServerFn(revokeCert);

  const certsQ = useQuery({
    queryKey: ["certs", serverId],
    queryFn: () => fetchCerts({ data: { server_id: serverId } }),
    refetchInterval: 10_000,
  });

  const [mode, setMode] = useState<"upload" | "letsencrypt" | "self_signed">("letsencrypt");
  const [pem, setPem] = useState("");
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");

  const expiresMs = certExpiresAt ? new Date(certExpiresAt).getTime() - Date.now() : null;
  const expiryBadge =
    expiresMs == null
      ? { color: "text-muted-foreground", text: "Not provisioned" }
      : expiresMs < 0
      ? { color: "text-status-err", text: "EXPIRED" }
      : expiresMs < 7 * 86400000
      ? { color: "text-status-err", text: `Expires in ${Math.ceil(expiresMs / 86400000)} days` }
      : expiresMs < 30 * 86400000
      ? { color: "text-status-warn", text: `Expires in ${Math.ceil(expiresMs / 86400000)} days` }
      : { color: "text-status-ok", text: `Expires in ${Math.ceil(expiresMs / 86400000)} days` };

  async function submit() {
    if (mode === "upload") {
      if (!pem.includes("BEGIN CERTIFICATE")) { toast.error("Paste a PEM CERTIFICATE block"); return; }
      const res = await upload({ data: { server_id: serverId, cert_pem: pem, domain: domain || null } });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Certificate queued. Agent will install on next poll.");
      setPem("");
    } else if (mode === "letsencrypt") {
      if (!domain || !email) { toast.error("Domain and email required"); return; }
      const res = await provisionLE({ data: { server_id: serverId, domain, email } });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Let's Encrypt request queued. Agent will run certbot.");
    } else {
      if (!domain) { toast.error("CN required"); return; }
      const res = await selfSign({ data: { server_id: serverId, cn: domain } });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Self-signed cert queued. Agent will generate locally.");
    }
    qc.invalidateQueries({ queryKey: ["certs", serverId] });
  }

  const certs = certsQ.data?.certs ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Active certificate</h3>
          <ShieldCheck className="size-4 text-muted-foreground" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Status" value={certExpiresAt ? "Active" : "None"} />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Expiry</div>
            <div className={`mt-1 font-mono text-sm ${expiryBadge.color}`}>{expiryBadge.text}</div>
          </div>
          <Field label="Last seen by agent" value={certExpiresAt ? new Date(certExpiresAt).toLocaleString() : "—"} />
        </div>
        {expiresMs != null && expiresMs < 14 * 86400000 && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-status-warn/30 bg-status-warn/5 p-3 text-xs text-status-warn">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Certificate is approaching expiry. Trigger a Let's Encrypt renewal below — the agent will reload Asterisk with zero call drops.</span>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Private keys never leave the host — AsterOps stores the public fingerprint and lifecycle only.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Provision certificate</h3>
        <div className="mt-4 flex gap-2">
          {([
            ["letsencrypt", "Let's Encrypt (auto-renew)"],
            ["upload", "Upload PEM"],
            ["self_signed", "Self-signed"],
          ] as const).map(([k, label]) => (
            <Button
              key={k}
              size="sm"
              variant={mode === k ? "default" : "outline"}
              onClick={() => setMode(k)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {mode !== "upload" && (
            <div className="space-y-1">
              <Label htmlFor="dom">{mode === "self_signed" ? "Common name (CN)" : "Domain (FQDN)"}</Label>
              <Input id="dom" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="sip.example.com" className="font-mono" />
            </div>
          )}
          {mode === "letsencrypt" && (
            <div className="space-y-1">
              <Label htmlFor="em">ACME contact email</Label>
              <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ops@example.com" />
              <p className="text-xs text-muted-foreground">
                The agent runs certbot locally over HTTP-01 (port 80 must be reachable) and reloads
                Asterisk via <code className="font-mono">core reload</code> — no call interruptions.
              </p>
            </div>
          )}
          {mode === "upload" && (
            <>
              <div className="space-y-1">
                <Label htmlFor="dom2">Domain (optional)</Label>
                <Input id="dom2" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="sip.example.com" className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pem">Certificate PEM (cert + chain, public only)</Label>
                <Textarea
                  id="pem"
                  value={pem}
                  onChange={(e) => setPem(e.target.value)}
                  rows={8}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the public certificate (and chain) only. The private key stays on the host — drop it at
                  <code className="ml-1 font-mono">/etc/asterisk/keys/asterisk.key</code> (mode 0600) before submitting.
                </p>
              </div>
            </>
          )}
          <Button onClick={submit}>
            <Upload className="mr-2 size-4" />
            {mode === "letsencrypt" ? "Request Let's Encrypt cert" : mode === "upload" ? "Upload to agent" : "Generate self-signed"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground">
          Certificate history
        </div>
        {certs.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">No certificates yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Domain</th>
                <th className="px-6 py-3 font-medium">State</th>
                <th className="px-6 py-3 font-medium">Expires</th>
                <th className="px-6 py-3 font-medium">Fingerprint</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {certs.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-6 py-3 uppercase">{c.source}</td>
                  <td className="px-6 py-3 text-muted-foreground">{c.domain ?? "—"}</td>
                  <td className="px-6 py-3">
                    <CertStatePill state={c.state} />
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{c.not_after ? new Date(c.not_after).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground truncate max-w-[160px]">{c.fingerprint_sha256?.slice(0, 16) ?? "—"}</td>
                  <td className="px-6 py-3 text-right space-x-2">
                    {c.state === "active" && c.source === "letsencrypt" && (
                      <Button size="sm" variant="ghost" onClick={async () => {
                        const res = await renew({ data: { cert_id: c.id } });
                        if (res.error) toast.error(res.error); else toast.success("Renewal queued");
                        qc.invalidateQueries({ queryKey: ["certs", serverId] });
                      }}>
                        <RefreshCw className="size-3" />
                      </Button>
                    )}
                    {c.state !== "superseded" && (
                      <Button size="sm" variant="ghost" className="text-status-err" onClick={async () => {
                        if (!confirm("Mark this cert as superseded?")) return;
                        const res = await revoke({ data: { cert_id: c.id } });
                        if (res.error) toast.error(res.error); else toast.success("Revoked");
                        qc.invalidateQueries({ queryKey: ["certs", serverId] });
                      }}>
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">SRTP enforcement</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          SRTP is enforced per-endpoint via the PJSIP tab. Generated <code className="font-mono text-xs">pjsip.conf</code>
          sets <code className="font-mono text-xs">media_encryption=sdes</code> and disables optimistic encryption.
        </p>
      </div>
    </div>
  );
}

function CertStatePill({ state }: { state: string }) {
  const map: Record<string, string> = {
    pending: "text-status-warn",
    active: "text-status-ok",
    failed: "text-status-err",
    superseded: "text-muted-foreground",
  };
  return <span className={`uppercase ${map[state] ?? "text-muted-foreground"}`}>{state}</span>;
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: "warn" | "err" }) {
  const color = highlight === "warn" ? "text-status-warn" : highlight === "err" ? "text-status-err" : "text-foreground";
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-sm ${color}`}>{value}</div>
    </div>
  );
}

/* ---------------- Hardening panel ---------------- */

function HardeningPanel({ serverId }: { serverId: string }) {
  const qc = useQueryClient();
  const fetchH = useServerFn(getHardening);
  const update = useServerFn(updateHardening);
  const render = useServerFn(renderHardeningBundle);
  const q = useQuery({ queryKey: ["hardening", serverId], queryFn: () => fetchH({ data: { server_id: serverId } }) });
  const h = q.data?.hardening;

  async function toggle(field: keyof NonNullable<typeof h>, value: boolean) {
    if (!h) return;
    const res = await update({
      data: {
        server_id: serverId,
        fail2ban_enabled: h.fail2ban_enabled,
        iptables_enabled: h.iptables_enabled,
        ami_lockdown: h.ami_lockdown,
        tls_only: h.tls_only,
        srtp_only: h.srtp_only,
        ssh_hardening: h.ssh_hardening,
        rtp_port_start: h.rtp_port_start,
        rtp_port_end: h.rtp_port_end,
        [field]: value,
      },
    });
    if (res.error) { toast.error(res.error); return; }
    qc.invalidateQueries({ queryKey: ["hardening", serverId] });
  }

  async function downloadBundle() {
    const res = await render({ data: { server_id: serverId } });
    const blob = new Blob([res.script], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `asterops-hardening-${serverId.slice(0, 8)}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!h) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const toggles = [
    { key: "tls_only", label: "TLS-only transports", desc: "Disable plain UDP/TCP SIP transports." },
    { key: "srtp_only", label: "SRTP-only media", desc: "Reject calls without SRTP encryption." },
    { key: "fail2ban_enabled", label: "fail2ban jail", desc: "Auto-ban brute-force SIP registration attempts." },
    { key: "iptables_enabled", label: "Firewall (iptables)", desc: "Default deny; allow SSH, SIP/TLS, RTP range." },
    { key: "ami_lockdown", label: "AMI lockdown", desc: "Bind Asterisk Manager Interface to localhost." },
    { key: "ssh_hardening", label: "SSH hardening", desc: "Disable root login + password auth in sshd_config." },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground">Hardening profile</div>
        <div className="divide-y divide-border">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-sm font-medium text-foreground">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
              <Switch
                checked={Boolean(h[t.key as keyof typeof h])}
                onCheckedChange={(v) => toggle(t.key as keyof typeof h, v)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Generated bundle</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Download the hardening shell script. Review, then run as root on the host.
            </p>
          </div>
          <Button onClick={downloadBundle}>
            <Download className="mr-2 size-4" /> Download .sh
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Per-server calls panel ---------------- */

import { listCalls } from "@/lib/calls.functions";

function ServerCallsPanel({ serverId }: { serverId: string }) {
  const fetch = useServerFn(listCalls);
  const q = useQuery({
    queryKey: ["server-calls", serverId],
    queryFn: () => fetch({ data: { server_id: serverId, limit: 50 } }),
  });
  return <CallsTable calls={q.data?.calls ?? []} />;
}

export function CallsTable({ calls }: { calls: any[] }) {
  if (calls.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-muted-foreground">
        No call records yet. Once an agent enrolls and streams CDRs, they appear here.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-6 py-3 font-medium">Timestamp</th>
            <th className="px-6 py-3 font-medium">Source</th>
            <th className="px-6 py-3 font-medium">Destination</th>
            <th className="px-6 py-3 font-medium">Duration</th>
            <th className="px-6 py-3 font-medium">Enc</th>
            <th className="px-6 py-3 font-medium">Disposition</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-mono text-xs">
          {calls.map((c) => (
            <tr key={c.id}>
              <td className="px-6 py-3 text-muted-foreground">{new Date(c.start_ts).toLocaleString()}</td>
              <td className="px-6 py-3 text-foreground">{c.src ?? "—"}</td>
              <td className="px-6 py-3 text-foreground">{c.dst ?? "—"}</td>
              <td className="px-6 py-3">{fmtDur(c.duration)}</td>
              <td className={`px-6 py-3 ${c.encrypted ? "text-status-ok" : "text-muted-foreground"}`}>{c.encrypted ? "TLS/SRTP" : "—"}</td>
              <td className={`px-6 py-3 ${c.disposition === "ANSWERED" ? "text-status-ok" : c.disposition === "FAILED" || c.disposition === "REJECTED" ? "text-status-err" : "text-muted-foreground"}`}>{c.disposition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60); const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}