import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/_shim";
import { useState } from "react";
import { listNotifications, acknowledgeNotification, certExpirySummary } from "@/lib/alerts.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

function AlertsPage() {
  const qc = useQueryClient();
  const fetchNotes = useServerFn(listNotifications);
  const fetchCerts = useServerFn(certExpirySummary);
  const ackFn = useServerFn(acknowledgeNotification);
  const [unackOnly, setUnackOnly] = useState(true);

  const notesQ = useQuery({
    queryKey: ["notifications", unackOnly],
    queryFn: () => fetchNotes({ data: { only_unacked: unackOnly } }),
    refetchInterval: 20_000,
  });
  const certsQ = useQuery({
    queryKey: ["cert-summary"],
    queryFn: () => fetchCerts(),
    refetchInterval: 60_000,
  });

  const ack = useMutation({
    mutationFn: (id: string) => ackFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Acknowledged");
    },
  });

  const notes = notesQ.data?.notifications ?? [];
  const expiring = (certsQ.data?.items ?? []).filter((i: any) =>
    ["critical", "expired", "warn"].includes(i.severity),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time notifications: certificate expiry, reload failures and TLS provisioning issues.
        </p>
      </div>

      {/* Cert expiry */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Certificates approaching expiry</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Thresholds are configurable per server under the server's <span className="font-mono">Alerts</span> tab.
            </div>
          </div>
          <ShieldAlert className="size-4 text-status-warn" />
        </div>
        {expiring.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All certificates are healthy"
            description="Nothing is expiring soon. We'll warn you here well before any TLS certificate needs renewal."
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Server</th>
                <th className="px-6 py-3 font-medium">Days remaining</th>
                <th className="px-6 py-3 font-medium">Expires</th>
                <th className="px-6 py-3 font-medium">Threshold</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expiring.map((i: any) => (
                <tr key={i.id}>
                  <td className="px-6 py-3">
                    <Link to={`/servers/${i.id}`} className="font-medium hover:text-brand">{i.name}</Link>
                  </td>
                  <td className={`px-6 py-3 font-mono ${
                    i.severity === "expired" || i.severity === "critical" ? "text-status-err" : "text-status-warn"
                  }`}>
                    {i.severity === "expired" ? "EXPIRED" : `${i.days_remaining}d`}
                  </td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">{i.cert_expires_at ? new Date(i.cert_expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">warn {i.warn_days}d · crit {i.critical_days}d</td>
                  <td className="px-6 py-3 text-right">
                    <Link to={`/servers/${i.id}`}>
                      <Button size="sm" variant="outline">Open</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Notifications */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Bell className="size-4 text-muted-foreground" />
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notification feed</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={unackOnly ? "default" : "outline"} onClick={() => setUnackOnly(true)}>Unacknowledged</Button>
            <Button size="sm" variant={!unackOnly ? "default" : "outline"} onClick={() => setUnackOnly(false)}>All</Button>
          </div>
        </div>
        {notes.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={unackOnly ? "You're all caught up" : "No notifications yet"}
            description={
              unackOnly
                ? "There's nothing to acknowledge right now. New alerts will pop up here in real time."
                : "Once an agent detects a certificate warning, reload failure, or TLS issue, you'll see it here."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {notes.map((n: any) => (
              <li key={n.id} className="flex items-start gap-4 px-6 py-4">
                <SeverityIcon severity={n.severity} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-foreground">{n.title}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">{n.kind}</Badge>
                    {n.servers?.name && (
                      <Link to={`/servers/${n.server_id}`} className="font-mono text-xs text-muted-foreground hover:text-brand">
                        {n.servers.name}
                      </Link>
                    )}
                    {n.delivered_webhook && (
                      <span className="text-[10px] text-status-ok">· webhook delivered</span>
                    )}
                  </div>
                  {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                  <div className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.acknowledged_at ? (
                  <Button size="sm" variant="ghost" onClick={() => ack.mutate(n.id)} disabled={ack.isPending}>
                    <Check className="mr-1 size-3" /> Ack
                  </Button>
                ) : (
                  <span className="text-[10px] text-muted-foreground">acked</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-status-err/10 text-status-err"><ShieldAlert className="size-4" /></span>;
  if (severity === "warn")
    return <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-status-warn/10 text-status-warn"><AlertTriangle className="size-4" /></span>;
  return <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><Info className="size-4" /></span>;
}

export default AlertsPage;
