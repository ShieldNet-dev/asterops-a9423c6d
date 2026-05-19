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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronLeft, Copy, Plus, Trash2, RefreshCw, Download, Send } from "lucide-react";
import { StatusPill } from "./dashboard";

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
          <Button size="sm" onClick={deploy}>
            <Send className="mr-2 size-3" /> Deploy to agent
          </Button>
        </div>
        <pre className="max-h-[600px] overflow-auto bg-background p-5 font-mono text-xs leading-relaxed text-foreground">
          {previewQ.data?.rendered ?? "Loading…"}
        </pre>
      </div>
    </div>
  );
}

/* ---------------- Security panel ---------------- */

function SecurityPanel({ serverId, certExpiresAt }: { serverId: string; certExpiresAt: string | null }) {
  void serverId;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">TLS certificate</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Status" value={certExpiresAt ? "Active" : "Not provisioned"} />
          <Field
            label="Expires"
            value={certExpiresAt ? new Date(certExpiresAt).toLocaleString() : "—"}
            highlight={certExpiresAt ? (new Date(certExpiresAt).getTime() - Date.now() < 14 * 86400000 ? "warn" : undefined) : undefined}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Certificate keys are generated and stored locally by the agent. AsterOps only
          tracks the public fingerprint and expiry — your private keys never leave the
          host. Agents can be configured to renew via Let's Encrypt or an internal CA.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">SRTP enforcement</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          SRTP enforcement is configured per-endpoint. Toggle <code className="rounded bg-background px-1 py-0.5 font-mono text-xs">Require SRTP</code> on the PJSIP tab. When enabled, the generated <code className="font-mono text-xs">pjsip.conf</code> sets <code className="font-mono text-xs">media_encryption=sdes</code> and <code className="font-mono text-xs">media_encryption_optimistic=no</code>.
        </p>
      </div>
    </div>
  );
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