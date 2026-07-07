import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/_shim";
import { listServers } from "@/lib/servers.functions";
import { callStats } from "@/lib/calls.functions";
import { certExpirySummary, listNotifications } from "@/lib/alerts.functions";
import { ArrowRight, Server, ShieldCheck, PhoneCall, ShieldAlert, Bell, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnboardingCard } from "@/components/onboarding-card";
import { EmptyState } from "@/components/empty-state";

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

  const soonestCert = [...certItems]
    .filter((i: any) => typeof i.days_remaining === "number")
    .sort((a: any, b: any) => a.days_remaining - b.days_remaining)[0];

  const tlsLabel = !soonestCert
    ? "—"
    : soonestCert.severity === "expired"
      ? "Expired"
      : `${soonestCert.days_remaining}d`;
  const tlsTone: KpiTone = !soonestCert
    ? "neutral"
    : ["expired", "critical"].includes(soonestCert.severity)
      ? "err"
      : soonestCert.severity === "warn"
        ? "warn"
        : "ok";

  const serverTone: KpiTone =
    servers.length === 0 ? "neutral" : online === servers.length ? "ok" : online === 0 ? "err" : "warn";

  const isEmpty = servers.length === 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A plain-English snapshot of every Asterisk PBX connected to AsterOps.
          </p>
        </div>
        {!isEmpty && (
          <Link to="/servers">
            <Button size="sm">
              <Server className="mr-2 size-3.5" /> Add another server
            </Button>
          </Link>
        )}
      </header>

      {isEmpty && <OnboardingCard />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Connected servers"
          value={servers.length}
          hint={
            isEmpty
              ? "No PBX has checked in yet."
              : `${online} online · ${pending} pending${servers.length - online - pending > 0 ? ` · ${servers.length - online - pending} offline` : ""}`
          }
          badge={isEmpty ? "Waiting for first agent" : online === servers.length ? "All healthy" : `${online}/${servers.length} online`}
          tone={serverTone}
          icon={Server}
        />
        <Kpi
          label="Recent calls"
          value={statsQ.data?.total24h ?? 0}
          hint={`in the last 24 hours · ${statsQ.data?.answered24h ?? 0} answered · avg ${fmtDuration(statsQ.data?.avgDurationSec ?? 0)}`}
          badge={isEmpty ? "Nothing to show yet" : `${statsQ.data?.encrypted24h ?? 0} encrypted`}
          tone={isEmpty ? "neutral" : "ok"}
          icon={PhoneCall}
        />
        <Kpi
          label="Security posture"
          value={isEmpty ? "—" : (certAlerts.length === 0 ? "Healthy" : `${certAlerts.length} issue${certAlerts.length === 1 ? "" : "s"}`)}
          hint={
            isEmpty
              ? "Run asterops report to see a hardening score."
              : certAlerts.length === 0
                ? "TLS, SRTP, firewall and AMI checks are passing."
                : "One or more servers need attention."
          }
          badge={isEmpty ? "Not scanned" : certAlerts.length === 0 ? "OK" : "Attention"}
          tone={isEmpty ? "neutral" : certAlerts.length === 0 ? "ok" : "warn"}
          icon={ShieldCheck}
        />
        <Kpi
          label="TLS certificates"
          value={tlsLabel}
          hint={
            !soonestCert
              ? "No certificates reported yet."
              : soonestCert.severity === "expired"
                ? `${soonestCert.name} certificate has expired.`
                : `${soonestCert.name} expires soonest.`
          }
          badge={
            tlsTone === "err" ? "Renew now" : tlsTone === "warn" ? "Renew soon" : tlsTone === "ok" ? "All good" : "No data"
          }
          tone={tlsTone}
          icon={KeyRound}
        />
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
            <EmptyState
              icon={CheckCircle2}
              title={isEmpty ? "No certificates yet" : "All certificates healthy"}
              description={
                isEmpty
                  ? "As soon as an agent uploads TLS info, expiring certs will show up here."
                  : "Nothing expiring soon — you're clear."
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {certAlerts.slice(0, 5).map((c: any) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <Link to={`/servers/${c.id}`} className="hover:text-brand">{c.name}</Link>
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
            <EmptyState
              icon={CheckCircle2}
              title="You're all caught up"
              description={
                isEmpty
                  ? "Alerts will appear here once a PBX is connected and the agent detects an issue."
                  : "No unacknowledged alerts across your fleet."
              }
            />
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
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Your servers</h2>
            <p className="mt-1 text-xs text-muted-foreground">Each Asterisk host that has enrolled with AsterOps.</p>
          </div>
          <Link to="/servers">
            <Button variant="ghost" size="sm">All servers <ArrowRight className="ml-1 size-3" /></Button>
          </Link>
        </div>
        {servers.length === 0 ? (
          <EmptyState
            icon={Server}
            title="No servers connected yet"
            description="Follow the three steps above to enroll your first Asterisk PBX. It takes about a minute."
            action={
              <Link to="/servers">
                <Button size="sm">Register a server</Button>
              </Link>
            }
          />
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
                  <td className="px-6 py-3"><Link to={`/servers/${s.id}`} className="text-foreground hover:text-brand">{s.name}</Link></td>
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

type KpiTone = "ok" | "warn" | "err" | "neutral";

function Kpi({
  label,
  value,
  hint,
  badge,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  badge: string;
  tone: KpiTone;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneStyles: Record<KpiTone, { dot: string; text: string; ring: string }> = {
    ok: { dot: "bg-status-ok", text: "text-status-ok", ring: "ring-status-ok/20" },
    warn: { dot: "bg-status-warn", text: "text-status-warn", ring: "ring-status-warn/20" },
    err: { dot: "bg-status-err", text: "text-status-err", ring: "ring-status-err/20" },
    neutral: { dot: "bg-muted-foreground", text: "text-muted-foreground", ring: "ring-border" },
  };
  const t = toneStyles[tone];
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${t.ring} ${t.text}`}>
        <span className={`size-1.5 rounded-full ${t.dot}`} />
        {badge}
      </div>
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

export default DashboardPage;
