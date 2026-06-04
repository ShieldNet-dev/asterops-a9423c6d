import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/_shim";
import { useMemo, useState } from "react";
import { listCalls } from "@/lib/calls.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, ShieldCheck } from "lucide-react";
import { CallsTable } from "./ServerDetail";

function CallsPage() {
  const [src, setSrc] = useState("");
  const [dst, setDst] = useState("");
  const fetch = useServerFn(listCalls);
  const q = useQuery({
    queryKey: ["calls", src, dst],
    queryFn: () => fetch({ data: { src: src || null, dst: dst || null, limit: 200 } }),
  });

  const calls = q.data?.calls ?? [];

  const csvHref = useMemo(() => {
    const header = "start_ts,src,dst,duration,billsec,disposition,encrypted,server_id";
    const rows = calls.map((c: any) =>
      [c.start_ts, c.src, c.dst, c.duration, c.billsec, c.disposition, c.encrypted, c.server_id]
        .map((v) => (v == null ? "" : String(v).replace(/"/g, '""')))
        .map((v) => (v.includes(",") ? `"${v}"` : v))
        .join(","),
    );
    return "data:text/csv;charset=utf-8," + encodeURIComponent([header, ...rows].join("\n"));
  }, [calls]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call audit log</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-3.5" /> Append-only. Records cannot be edited or deleted by anyone.
          </p>
        </div>
        <a href={csvHref} download={`asterops-cdr-${new Date().toISOString().slice(0,10)}.csv`}>
          <Button variant="outline" size="sm" disabled={calls.length === 0}>
            <Download className="mr-2 size-3" /> Export CSV ({calls.length})
          </Button>
        </a>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Source contains</label>
          <Input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="e.g. 1001" className="w-48 font-mono" />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Destination contains</label>
          <Input value={dst} onChange={(e) => setDst(e.target.value)} placeholder="e.g. +44" className="w-48 font-mono" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setSrc(""); setDst(""); }}>Clear</Button>
      </div>

      <CallsTable calls={calls} />
    </div>
  );
}

export default CallsPage;
