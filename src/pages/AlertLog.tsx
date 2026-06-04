import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/_shim";
import { useState } from "react";
import { listAlertDeliveries } from "@/lib/alerts.functions";
import { listServers } from "@/lib/servers.functions";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, CircleDashed, MinusCircle, Send } from "lucide-react";

const STATUS_META: Record<string, { label: string; tone: string; Icon: any }> = {
  attempted: { label: "Attempted", tone: "text-muted-foreground", Icon: CircleDashed },
  success:   { label: "Success",   tone: "text-status-ok",       Icon: CheckCircle2 },
  failed:    { label: "Failed",    tone: "text-status-err",      Icon: XCircle },
  skipped:   { label: "Skipped",   tone: "text-status-warn",     Icon: MinusCircle },
};

function AlertLogPage() {
  const fetchDeliveries = useServerFn(listAlertDeliveries);
  const fetchServers = useServerFn(listServers);

  const [serverId, setServerId] = useState("all");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");

  const serversQ = useQuery({ queryKey: ["servers"], queryFn: () => fetchServers() });
  const q = useQuery({
    queryKey: ["alert-deliveries", serverId, channel, status],
    queryFn: () =>
      fetchDeliveries({
        data: {
          server_id: serverId === "all" ? null : serverId,
          channel: channel === "all" ? null : (channel as "webhook" | "email"),
          status: status === "all" ? null : (status as any),
          limit: 300,
        },
      }),
    refetchInterval: 15000,
  });

  const deliveries = q.data?.deliveries ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alert delivery log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every webhook and email attempt — tied to the originating cert, TLS/SRTP, or reload event.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-3">
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
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Channel</label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="attempted">Attempted</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {deliveries.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No delivery attempts match these filters.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">When</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Channel</th>
                <th className="px-6 py-3 font-medium">Alert</th>
                <th className="px-6 py-3 font-medium">Server</th>
                <th className="px-6 py-3 font-medium">Target</th>
                <th className="px-6 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {deliveries.map((d: any) => {
                const meta = STATUS_META[d.status] ?? STATUS_META.attempted;
                const Icon = meta.Icon;
                const note = d.notifications ?? {};
                return (
                  <tr key={d.id} className="hover:bg-surface-2/40">
                    <td className="px-6 py-3 font-mono text-muted-foreground">
                      {new Date(d.attempted_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 font-mono ${meta.tone}`}>
                        <Icon className="size-3.5" /> {meta.label}
                        {d.status_code ? <span className="text-muted-foreground">·{d.status_code}</span> : null}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Send className="size-3" /> {d.channel}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-foreground">{note.title ?? "(unknown)"}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {note.kind} · {note.severity}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {d.server_id ? (
                        <Link to="/servers/$id" params={{ id: d.server_id }} className="hover:text-brand">
                          {d.servers?.name ?? d.server_id.slice(0, 8)}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-3 font-mono text-muted-foreground">
                      <span className="block max-w-[18rem] truncate" title={d.target ?? ""}>
                        {d.target ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-muted-foreground">
                      <span className="block max-w-[20rem] truncate" title={d.error ?? note.message ?? ""}>
                        {d.error ?? note.message ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Delivery rows are append-only and cannot be edited or deleted. Auto-refreshes every 15s.
      </p>
      <Badge variant="outline" className="hidden">placeholder</Badge>
    </div>
  );
}

export default AlertLogPage;
