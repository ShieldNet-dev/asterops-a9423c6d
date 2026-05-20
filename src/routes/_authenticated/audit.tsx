import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { listAuditEvents } from "@/lib/audit.functions";
import { listServers } from "@/lib/servers.functions";
import { getMyRole } from "@/lib/rbac.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, ShieldCheck, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit log — AsterOps" }] }),
  component: AuditPage,
});

function AuditPage() {
  const fetchEvents = useServerFn(listAuditEvents);
  const fetchServers = useServerFn(listServers);
  const fetchRole = useServerFn(getMyRole);

  const roleQ = useQuery({ queryKey: ["my-role"], queryFn: () => fetchRole() });
  const serversQ = useQuery({ queryKey: ["servers"], queryFn: () => fetchServers() });

  const [serverId, setServerId] = useState<string>("all");
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");

  const q = useQuery({
    queryKey: ["audit", serverId, actorId, action, since, until],
    queryFn: () =>
      fetchEvents({
        data: {
          server_id: serverId === "all" ? null : serverId,
          actor_id: actorId || null,
          action: action || null,
          since: since ? new Date(since).toISOString() : null,
          until: until ? new Date(until).toISOString() : null,
          limit: 500,
        },
      }),
  });

  const events = q.data?.events ?? [];
  const isAdmin = roleQ.data?.isAdmin ?? false;

  const csvHref = useMemo(() => {
    const header = "created_at,action,actor_id,server_id,server_name,target_type,target_id,meta";
    const rows = events.map((e: any) =>
      [
        e.created_at,
        e.action,
        e.actor_id ?? "",
        e.server_id ?? "",
        e.servers?.name ?? "",
        e.target_type ?? "",
        e.target_id ?? "",
        JSON.stringify(e.meta ?? {}),
      ]
        .map((v) => String(v).replace(/"/g, '""'))
        .map((v) => (v.includes(",") || v.includes('"') ? `"${v}"` : v))
        .join(","),
    );
    return "data:text/csv;charset=utf-8," + encodeURIComponent([header, ...rows].join("\n"));
  }, [events]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Append-only. Cannot be edited or deleted by anyone — including admins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Badge variant="outline" className="font-mono text-[10px] text-brand">
              ADMIN — fleet-wide view
            </Badge>
          ) : (
            <Badge variant="outline" className="font-mono text-[10px]">
              <Lock className="mr-1 size-3" /> Scoped to your servers
            </Badge>
          )}
          <a
            href={csvHref}
            download={`asterops-audit-${new Date().toISOString().slice(0, 10)}.csv`}
          >
            <Button variant="outline" size="sm" disabled={events.length === 0}>
              <Download className="mr-2 size-3" /> Export CSV ({events.length})
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-5">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Server</label>
          <Select value={serverId} onValueChange={setServerId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All servers</SelectItem>
              {(serversQ.data?.servers ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Action contains</label>
          <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="tls / pjsip / endpoint" className="font-mono" />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Actor (user id)</label>
          <Input
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            placeholder={isAdmin ? "uuid…" : "(admins only)"}
            disabled={!isAdmin}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Since</label>
          <Input type="datetime-local" value={since} onChange={(e) => setSince(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Until</label>
          <Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {events.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No audit events match these filters.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Server</th>
                <th className="px-6 py-3 font-medium">Actor</th>
                <th className="px-6 py-3 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {events.map((e: any) => (
                <tr key={e.id} className="hover:bg-surface-2/40">
                  <td className="px-6 py-3 text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-6 py-3 text-foreground">{e.action}</td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {e.server_id ? (
                      <Link to="/servers/$id" params={{ id: e.server_id }} className="hover:text-brand">
                        {e.servers?.name ?? e.server_id.slice(0, 8)}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{e.actor_id ? e.actor_id.slice(0, 8) : "system"}</td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {e.target_type ? `${e.target_type}${e.target_id ? `:${e.target_id.slice(0, 8)}` : ""}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}