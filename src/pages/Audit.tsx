import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/_shim";
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

({
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
  const [role, setRole] = useState<string>("all");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");

  const q = useQuery({
    queryKey: ["audit", serverId, actorId, action, role, since, until],
    queryFn: () =>
      fetchEvents({
        data: {
          server_id: serverId === "all" ? null : serverId,
          actor_id: actorId || null,
          action: action || null,
          role: role === "all" ? null : (role as "admin" | "operator" | "viewer"),
          since: since ? new Date(since).toISOString() : null,
          until: until ? new Date(until).toISOString() : null,
          limit: 500,
        },
      }),
  });

  const events = q.data?.events ?? [];
  const isAdmin = roleQ.data?.isAdmin ?? false;

  // CSV reflects EXACTLY the rows currently shown (after every active filter).
  const csvBlob = useMemo(() => {
    const header = [
      "created_at", "action", "actor_id", "actor_role",
      "server_id", "server_name", "target_type", "target_id", "meta",
    ];
    const escape = (v: unknown) => {
      const s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
      const safe = s.replace(/"/g, '""');
      return /[",\n\r]/.test(safe) ? `"${safe}"` : safe;
    };
    const serverName = serverId === "all"
      ? "all"
      : (serversQ.data?.servers ?? []).find((s) => s.id === serverId)?.name ?? serverId;
    // Preamble documents the exact filter scope used for this export.
    const preamble = [
      `# AsterOps audit export`,
      `# exported_at=${new Date().toISOString()}`,
      `# scope.server=${serverName}`,
      `# scope.user_role=${role}`,
      `# scope.action=${action || "*"}`,
      `# scope.actor_id=${actorId || "*"}`,
      `# scope.since=${since ? new Date(since).toISOString() : "*"}`,
      `# scope.until=${until ? new Date(until).toISOString() : "*"}`,
      `# row_count=${events.length}`,
    ];
    const rows = events.map((e: any) =>
      [
        e.created_at, e.action,
        e.actor_id ?? "", e.actor_role ?? "",
        e.server_id ?? "", e.servers?.name ?? "",
        e.target_type ?? "", e.target_id ?? "", e.meta ?? {},
      ]
        .map(escape)
        .join(","),
    );
    return [...preamble, header.join(","), ...rows].join("\r\n");
  }, [events, serverId, role, action, actorId, since, until, serversQ.data]);

  function exportCsv() {
    const blob = new Blob([csvBlob], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const scope = serverId === "all" ? "all" : (serversQ.data?.servers ?? []).find((s) => s.id === serverId)?.name ?? "scoped";
    a.href = url;
    a.download = `asterops-audit_${scope}_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
          <Button variant="outline" size="sm" disabled={events.length === 0} onClick={exportCsv}>
            <Download className="mr-2 size-3" /> Export CSV ({events.length})
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-6">
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
          <label className="text-xs uppercase tracking-wider text-muted-foreground">User role</label>
          <Select value={role} onValueChange={setRole} disabled={!isAdmin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
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
                <th className="px-6 py-3 font-medium">Role</th>
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
                  <td className="px-6 py-3 text-muted-foreground">{e.actor_role ?? "—"}</td>
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