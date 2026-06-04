import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/_shim";
import { fleetHealth } from "@/lib/agent-health.functions";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, PhoneCall, Clock, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

function AgentsPage() {
  const fetchHealth = useServerFn(fleetHealth);
  const q = useQuery({
    queryKey: ["fleet-health"],
    queryFn: () => fetchHealth(),
    refetchInterval: 15_000,
  });

  const servers = q.data?.servers ?? [];
  const reloads = q.data?.reloads ?? [];

  const live = servers.filter((s: any) => s.heartbeat === "live").length;
  const stale = servers.filter((s: any) => s.heartbeat === "stale").length;
  const down = servers.filter((s: any) => s.heartbeat === "down" || s.heartbeat === "never").length;
  const activeCalls = servers.reduce((acc: number, s: any) => acc + (s.active_calls ?? 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Agent health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live heartbeat, active channels and recent reload outcomes across every enrolled agent.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Live" value={live} color="text-status-ok" icon={Activity} />
        <Stat label="Stale" value={stale} color="text-status-warn" icon={Clock} />
        <Stat label="Down" value={down} color="text-status-err" icon={XCircle} />
        <Stat label="Active calls" value={activeCalls} color="text-foreground" icon={PhoneCall} />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Agents
        </div>
        {servers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">No agents enrolled.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Server</th>
                <th className="px-6 py-3 font-medium">Heartbeat</th>
                <th className="px-6 py-3 font-medium">Agent</th>
                <th className="px-6 py-3 font-medium">Asterisk</th>
                <th className="px-6 py-3 font-medium text-right">Active calls</th>
                <th className="px-6 py-3 font-medium">Last config apply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {servers.map((s: any) => (
                <tr key={s.id} className="hover:bg-surface-2/40">
                  <td className="px-6 py-3">
                    <Link to="/servers/$id" params={{ id: s.id }} className="flex items-center gap-2 hover:text-brand">
                      <Server className="size-3.5 text-muted-foreground" />
                      <span>{s.name}</span>
                    </Link>
                    <div className="font-mono text-[11px] text-muted-foreground">{s.hostname ?? "—"}</div>
                  </td>
                  <td className="px-6 py-3"><HeartbeatPill state={s.heartbeat} age={s.heartbeat_age_sec} /></td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s.agent_version ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s.asterisk_version ?? "—"}</td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">{s.active_calls ?? 0}</td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">
                    {s.last_applied_at ? (
                      <>
                        <span className="text-foreground">v{s.last_applied_version}</span>
                        <span className="ml-2">{new Date(s.last_applied_at).toLocaleString()}</span>
                      </>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent reload outcomes</div>
          <span className="text-[11px] text-muted-foreground">last 60 events</span>
        </div>
        {reloads.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No reload events recorded yet. Agents will report here on every config apply.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">When</th>
                <th className="px-6 py-3 font-medium">Server</th>
                <th className="px-6 py-3 font-medium">Version</th>
                <th className="px-6 py-3 font-medium">Outcome</th>
                <th className="px-6 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {reloads.map((r: any) => {
                const srv = servers.find((s: any) => s.id === r.server_id);
                return (
                  <tr key={r.id} className="hover:bg-surface-2/40">
                    <td className="px-6 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      {srv ? (
                        <Link to="/servers/$id" params={{ id: srv.id }} className="hover:text-brand">{srv.name}</Link>
                      ) : r.server_id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-3">v{r.config_version ?? "—"}</td>
                    <td className="px-6 py-3"><OutcomePill outcome={r.outcome} /></td>
                    <td className="px-6 py-3 text-muted-foreground truncate max-w-[420px]">{r.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${color}`} />
      </div>
      <div className={`mt-3 font-mono text-3xl font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function HeartbeatPill({ state, age }: { state: string; age: number | null }) {
  const map: Record<string, { color: string; label: string }> = {
    live: { color: "bg-status-ok", label: "LIVE" },
    stale: { color: "bg-status-warn", label: "STALE" },
    down: { color: "bg-status-err", label: "DOWN" },
    never: { color: "bg-muted-foreground", label: "NEVER SEEN" },
  };
  const m = map[state] ?? map.never;
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs">
      <span className={`size-1.5 rounded-full ${m.color}`} />
      <span className="text-foreground">{m.label}</span>
      {age != null && <span className="text-muted-foreground">· {fmtAge(age)}</span>}
    </span>
  );
}

function OutcomePill({ outcome }: { outcome: string }) {
  if (outcome === "applied")
    return <Badge variant="outline" className="border-status-ok/40 font-mono text-[10px] text-status-ok"><CheckCircle2 className="mr-1 size-3" /> APPLIED</Badge>;
  if (outcome === "rollback")
    return <Badge variant="outline" className="border-status-warn/40 font-mono text-[10px] text-status-warn"><RotateCcw className="mr-1 size-3" /> ROLLBACK</Badge>;
  return <Badge variant="outline" className="border-status-err/40 font-mono text-[10px] text-status-err"><XCircle className="mr-1 size-3" /> FAILED</Badge>;
}

function fmtAge(sec: number): string {
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}