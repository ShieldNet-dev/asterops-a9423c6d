import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Download, ExternalLink, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

type Report = {
  id: string;
  server_id: string;
  profile: string;
  score: number;
  passed: number;
  failed: number;
  warnings: number;
  tls_ok: boolean;
  srtp_ok: boolean;
  firewall_ok: boolean;
  fail2ban_ok: boolean;
  ami_locked: boolean;
  report_html: string | null;
  agent_version: string | null;
  created_at: string;
  servers?: { id: string; name: string } | null;
};

export default function SecurityPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("security_reports")
      .select("*, servers ( id, name )")
      .order("created_at", { ascending: false })
      .limit(50);
    setReports((data ?? []) as Report[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const latest = new Map<string, Report>();
  for (const r of reports) if (!latest.has(r.server_id)) latest.set(r.server_id, r);
  const latestList = Array.from(latest.values());
  const avg = latestList.length
    ? Math.round(latestList.reduce((s, r) => s + r.score, 0) / latestList.length)
    : null;

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Security posture</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest hardening scans uploaded by the AsterOps agent on each PBX.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`size-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <StatTile label="Fleet score" value={avg !== null ? `${avg}/100` : "—"} accent={avg !== null && avg < 60 ? "err" : avg !== null && avg < 85 ? "warn" : "ok"} />
        <StatTile label="Servers scanned" value={latestList.length} />
        <StatTile label="Critical findings" value={latestList.reduce((s, r) => s + r.failed, 0)} accent="err" />
        <StatTile label="Warnings" value={latestList.reduce((s, r) => s + r.warnings, 0)} accent="warn" />
      </div>

      {latestList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={ShieldCheck}
              title="No security scans yet"
              description="Once an enrolled agent uploads its first posture report, each PBX gets a hardening score and clear pass/fail cards for TLS, SRTP, firewall, fail2ban and AMI."
              hint="Run `asterops report` on the host to send the first scan."
            />
            <pre className="mt-4 rounded-lg bg-surface-2 p-4 text-xs font-mono overflow-x-auto">{`pip install asterops-agent
sudo asterops run --profile baseline
asterops report`}</pre>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {latestList.map((r) => <ReportCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: "ok" | "warn" | "err" }) {
  const color = accent === "err" ? "text-status-err" : accent === "warn" ? "text-status-warn" : accent === "ok" ? "text-status-ok" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function ReportCard({ r }: { r: Report }) {
  const scoreColor = r.score < 60 ? "text-status-err" : r.score < 85 ? "text-status-warn" : "text-status-ok";
  function download() {
    if (!r.report_html) return;
    const blob = new Blob([r.report_html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asterops-${r.servers?.name ?? r.server_id}-${r.id.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            {r.score >= 85 ? <ShieldCheck className="size-4 text-status-ok" /> : <ShieldAlert className={`size-4 ${scoreColor}`} />}
            {r.servers?.name ?? r.server_id.slice(0, 8)}
          </CardTitle>
          <CardDescription className="font-mono text-[11px]">
            profile <b>{r.profile}</b> · {new Date(r.created_at).toLocaleString()} {r.agent_version && `· agent ${r.agent_version}`}
          </CardDescription>
        </div>
        <div className={`font-mono text-3xl font-semibold tabular-nums ${scoreColor}`}>{r.score}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2 text-center">
          <Check label="TLS" ok={r.tls_ok} />
          <Check label="SRTP" ok={r.srtp_ok} />
          <Check label="FW" ok={r.firewall_ok} />
          <Check label="F2B" ok={r.fail2ban_ok} />
          <Check label="AMI" ok={r.ami_locked} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-3 text-muted-foreground">
            <span>{r.passed} passed</span>
            <span className="text-status-warn">{r.warnings} warn</span>
            <span className="text-status-err">{r.failed} critical</span>
          </div>
          <div className="flex items-center gap-1">
            {r.servers?.id && (
              <Link to={`/servers/${r.servers.id}`}>
                <Button variant="ghost" size="sm"><ExternalLink className="size-3.5 mr-1" /> Server</Button>
              </Link>
            )}
            <Button variant="outline" size="sm" disabled={!r.report_html} onClick={download}>
              <Download className="size-3.5 mr-1" /> HTML
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`rounded-md border p-2 text-[11px] font-mono ${ok ? "border-status-ok/30 text-status-ok bg-status-ok/5" : "border-status-err/30 text-status-err bg-status-err/5"}`}>
      <div className="font-semibold">{label}</div>
      <div className="text-[10px] opacity-80">{ok ? "OK" : "FAIL"}</div>
    </div>
  );
}