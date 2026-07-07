import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Wrench, Copy, Info } from "lucide-react";
import { toast } from "sonner";

type Endpoint = { extension: string; display_name: string; codecs: string };
type Trunk = { name: string; host: string; username: string };

export default function ProvisioningPage() {
  const [serverName, setServerName] = useState("hq-pbx-01");
  const [rtpStart, setRtpStart] = useState(10000);
  const [rtpEnd, setRtpEnd] = useState(20000);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    { extension: "1001", display_name: "Reception", codecs: "opus,ulaw,alaw" },
    { extension: "1002", display_name: "Support", codecs: "opus,ulaw,alaw" },
  ]);
  const [trunks, setTrunks] = useState<Trunk[]>([]);

  const inventoryYaml = useMemo(
    () => buildInventoryYaml({ serverName, rtpStart, rtpEnd, endpoints, trunks }),
    [serverName, rtpStart, rtpEnd, endpoints, trunks],
  );
  const pjsipPreview = useMemo(
    () => buildPjsipPreview({ serverName, endpoints, trunks }),
    [serverName, endpoints, trunks],
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Provisioning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define your extensions and trunks, then push deterministic Asterisk config to any server in your fleet.
        </p>
      </header>

      {endpoints.length === 0 && trunks.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/40 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" />
          <div>
            <div className="font-medium text-foreground">Start with the sample inventory below</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Edit the extensions and trunks on the left, then copy the generated <span className="font-mono">inventory.yaml</span>
              {" "}or paste the apply command onto your PBX. Nothing is pushed until you run it there.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="size-4" /> Inventory</CardTitle>
            <CardDescription>TLS-only, SRTP-required defaults. Saved as YAML and fed to <code className="font-mono">asterops provision</code>.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Server name"><Input value={serverName} onChange={(e) => setServerName(e.target.value)} /></Field>
              <Field label="RTP start"><Input type="number" value={rtpStart} onChange={(e) => setRtpStart(Number(e.target.value))} /></Field>
              <Field label="RTP end"><Input type="number" value={rtpEnd} onChange={(e) => setRtpEnd(Number(e.target.value))} /></Field>
            </div>

            <section>
              <SectionHeader title="Extensions" onAdd={() => setEndpoints([...endpoints, { extension: "", display_name: "", codecs: "opus,ulaw" }])} />
              <div className="space-y-2">
                {endpoints.map((e, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <Field className="col-span-3" label="Ext"><Input value={e.extension} onChange={(ev) => updateAt(setEndpoints, endpoints, i, { extension: ev.target.value })} /></Field>
                    <Field className="col-span-4" label="Name"><Input value={e.display_name} onChange={(ev) => updateAt(setEndpoints, endpoints, i, { display_name: ev.target.value })} /></Field>
                    <Field className="col-span-4" label="Codecs"><Input value={e.codecs} onChange={(ev) => updateAt(setEndpoints, endpoints, i, { codecs: ev.target.value })} /></Field>
                    <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setEndpoints(endpoints.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionHeader title="Trunks" onAdd={() => setTrunks([...trunks, { name: "", host: "", username: "" }])} />
              <div className="space-y-2">
                {trunks.map((t, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <Field className="col-span-3" label="Name"><Input value={t.name} onChange={(ev) => updateAt(setTrunks, trunks, i, { name: ev.target.value })} /></Field>
                    <Field className="col-span-5" label="Host"><Input value={t.host} onChange={(ev) => updateAt(setTrunks, trunks, i, { host: ev.target.value })} /></Field>
                    <Field className="col-span-3" label="User"><Input value={t.username} onChange={(ev) => updateAt(setTrunks, trunks, i, { username: ev.target.value })} /></Field>
                    <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setTrunks(trunks.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                {trunks.length === 0 && <p className="text-xs text-muted-foreground">No SIP trunks yet.</p>}
              </div>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated artifacts</CardTitle>
            <CardDescription>Copy these into your repo or pipe them to the agent.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="yaml" className="w-full">
              <TabsList>
                <TabsTrigger value="yaml">inventory.yaml</TabsTrigger>
                <TabsTrigger value="pjsip">pjsip.conf preview</TabsTrigger>
                <TabsTrigger value="cmd">Apply command</TabsTrigger>
              </TabsList>
              <TabsContent value="yaml"><CodeBlock text={inventoryYaml} /></TabsContent>
              <TabsContent value="pjsip"><CodeBlock text={pjsipPreview} /></TabsContent>
              <TabsContent value="cmd"><CodeBlock text={"# save inventory.yaml locally, then\nasterops provision inventory.yaml --dry-run\nsudo asterops provision inventory.yaml\nsudo asterisk -rx 'pjsip reload'"} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      <Button variant="ghost" size="sm" onClick={onAdd}><Plus className="size-3.5 mr-1" /> Add</Button>
    </div>
  );
}

function CodeBlock({ text }: { text: string }) {
  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className="absolute right-2 top-2 z-10"
        onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}>
        <Copy className="size-3.5" />
      </Button>
      <pre className="rounded-lg bg-surface-2 p-4 text-xs font-mono overflow-x-auto max-h-[480px]">{text}</pre>
    </div>
  );
}

function updateAt<T>(setter: (v: T[]) => void, arr: T[], i: number, patch: Partial<T>) {
  const next = arr.slice();
  next[i] = { ...arr[i], ...patch };
  setter(next);
}

function buildInventoryYaml({ serverName, rtpStart, rtpEnd, endpoints, trunks }: { serverName: string; rtpStart: number; rtpEnd: number; endpoints: Endpoint[]; trunks: Trunk[] }) {
  const lines = [
    `server_name: ${serverName}`,
    `tls_only: true`,
    `rtp_start: ${rtpStart}`,
    `rtp_end: ${rtpEnd}`,
    `endpoints:`,
    ...endpoints.flatMap((e) => [
      `  - extension: "${e.extension}"`,
      `    display_name: "${e.display_name}"`,
      `    codecs: [${e.codecs.split(",").map((c) => c.trim()).filter(Boolean).join(", ")}]`,
      `    tls_required: true`,
      `    srtp_required: true`,
    ]),
    `trunks:`,
    ...trunks.flatMap((t) => [
      `  - name: ${t.name}`,
      `    host: ${t.host}`,
      `    port: 5061`,
      `    username: ${t.username}`,
      `    transport: transport-tls`,
      `    srtp_required: true`,
    ]),
  ];
  return lines.join("\n") + "\n";
}

function buildPjsipPreview({ serverName, endpoints, trunks }: { serverName: string; endpoints: Endpoint[]; trunks: Trunk[] }) {
  const sorted = [...endpoints].sort((a, b) => a.extension.localeCompare(b.extension));
  const out = [
    `; pjsip.conf — generated by AsterOps for ${serverName}`,
    `[transport-tls]`,
    `type=transport`,
    `protocol=tls`,
    `bind=0.0.0.0:5061`,
    `method=tlsv1_2`,
    ``,
  ];
  for (const e of sorted) {
    out.push(
      `[${e.extension}]`,
      `type=endpoint`,
      `context=from-internal`,
      `disallow=all`,
      `allow=${e.codecs.split(",").map((c) => c.trim()).filter(Boolean).join(",")}`,
      `auth=${e.extension}-auth`,
      `aors=${e.extension}`,
      `transport=transport-tls`,
      `media_encryption=sdes`,
      ``,
    );
  }
  for (const t of trunks) {
    out.push(
      `[${t.name}]`,
      `type=endpoint`,
      `context=from-trunk`,
      `transport=transport-tls`,
      `media_encryption=sdes`,
      ``,
    );
  }
  return out.join("\n");
}
