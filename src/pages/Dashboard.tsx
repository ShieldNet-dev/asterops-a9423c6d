import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/_shim";
import { listServers } from "@/lib/servers.functions";
import { callStats } from "@/lib/calls.functions";
import { certExpirySummary, listNotifications } from "@/lib/alerts.functions";
import { ArrowRight, Server, ShieldCheck, PhoneCall, Lock, ShieldAlert, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

({
  head: () => ({ meta: [{ title: "Dashboard — AsterOps" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchServers = useServerFn(listServers);
  const fetchStats = useServerFn(callStats);
  const fetchCerts = useServerFn(certExpirySummary);
  const fetchNotes = useServerFn(listNotifications);

  const serversQ = useQuery({ queryKey: ["servers"], queryFn: () => fetchServers() });
  const statsQ = useQuery({ queryKey: ["call-stats"], queryFn: () => fetchStats() });
  const certsQ = useQuery({ queryKey: ["cert-summary"], queryFn: () => fetchCerts(), refetchInterval: 60_000 });
  const notesQ = useQuery({
    queryKey: ["notifications", true],
    queryFn: () => fetchNotes({ data: { only_unacked: true } }),
    refetchInterval: 30_000,
  });

  const servers = serversQ.data?.servers ?? [];
  const online = servers.filter((s) => s.status === "online").length;
  const pending = servers.filter((s) => s.status === "pending").length;

  const certItems = certsQ.data?.items ?? [];
  const certAlerts = certItems.filter((i: any) => ["critical", "expired", "warn"].includes(i.severity));
  const notes = (notesQ.data?.notifications ?? []).slice(0, 6);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fleet-wide status across all registered Asterisk hosts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Servers" value={servers.length} icon={Server} sub={`${online} online · ${pending} pending`} />
        <StatCard label="Calls (24h)" value={statsQ.data?.total24h ?? 0} icon={PhoneCall} sub={`${statsQ.data?.answered24h ?? 0} answered`} />
        <StatCard label="Encrypted (24h)" value={statsQ.data?.encrypted24h ?? 0} icon={Lock} sub="TLS / SRTP" />
        <StatCard label="Avg duration" value={fmtDuration(statsQ.data?.avgDurationSec ?? 0)} icon={ShieldCheck} sub="last 24h" />
      </div>

      {/* Alerts row */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <ShieldAlert className="size-4" /> Certificate expiry
            </div>
            <Link to="/alerts"><Button variant="ghost" size="sm">All alerts <ArrowRight className="ml-1 size-3" /></Button></Link>
          </div>
          {certAlerts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">All certificates healthy.</div>
          ) : (
            <ul className="divide-y divide-border">
              {certAlerts.slice(0, 5).map((c: any) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <Link to="/servers/$id" params={{ id: c.id }} className="hover:text-brand">{c.name}</Link>
                  <span className={`font-mono text-xs ${c.severity === "warn" ? "text-status-warn" : "text-status-err"}`}>
                    {c.severity === "expired" ? "EXPIRED" : `${c.days_remaining}d remaining`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Bell className="size-4" /> Unacknowledged alerts
            </div>
            <Link to="/alerts"><Button variant="ghost" size="sm">Open <ArrowRight className="ml-1 size-3" /></Button></Link>
          </div>
          {notes.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No open alerts.</div>
          ) : (
            <ul className="divide-y divide-border">
              {notes.map((n: any) => (
                <li key={n.id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-foreground">{n.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {n.servers?.name ? `${n.servers.name} · ` : ""}{new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className={`shrink-0 font-mono text-[10px] ${
                    n.severity === "critical" ? "text-status-err" : n.severity === "warn" ? "text-status-warn" : "text-muted-foreground"
                  }`}>{n.severity}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent servers</h2>
          <Link to="/servers">
            <Button variant="ghost" size="sm">All servers <ArrowRight className="ml-1 size-3" /></Button>
          </Link>
        </div>
        {servers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No servers yet.</p>
            <Link to="/servers">
              <Button className="mt-4">Register your first server</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Hostname</th>
                <th className="px-6 py-3 font-medium">Asterisk</th>
                <th className="px-6 py-3 font-medium text-right">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {servers.slice(0, 6).map((s) => (
                <tr key={s.id} className="hover:bg-surface-2/40">
                  <td className="px-6 py-3"><StatusPill status={s.status} /></td>
                  <td className="px-6 py-3"><Link to="/servers/$id" params={{ id: s.id }} className="text-foreground hover:text-brand">{s.name}</Link></td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s.hostname ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s.asterisk_version ?? "—"}</td>
                  <td className="px-6 py-3 text-right text-xs text-muted-foreground">{s.last_seen_at ? new Date(s.last_seen_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    online: { color: "bg-status-ok", label: "ONLINE" },
    pending: { color: "bg-status-warn", label: "PENDING" },
    degraded: { color: "bg-status-warn", label: "DEGRADED" },
    offline: { color: "bg-muted-foreground", label: "OFFLINE" },
  };
  const s = map[status] ?? map.offline;
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
      <span className={`size-1.5 rounded-full ${s.color}`} />
      {s.label}
    </span>
  );
}

function fmtDuration(sec: number): string {
  if (sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}