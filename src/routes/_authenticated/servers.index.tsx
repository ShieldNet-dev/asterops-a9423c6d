import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listServers, createServer } from "@/lib/servers.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";
import { StatusPill } from "./dashboard";

export const Route = createFileRoute("/_authenticated/servers/")({
  head: () => ({ meta: [{ title: "Servers — AsterOps" }] }),
  component: ServersPage,
});

function ServersPage() {
  const fetch = useServerFn(listServers);
  const create = useServerFn(createServer);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["servers"], queryFn: () => fetch() });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [hostname, setHostname] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null);
  const [createdServerId, setCreatedServerId] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: () => create({ data: { name, hostname, region, description } }),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return; }
      setEnrollmentToken(res.enrollmentToken);
      setCreatedServerId(res.server?.id ?? null);
      qc.invalidateQueries({ queryKey: ["servers"] });
    },
  });

  function reset() {
    setName(""); setHostname(""); setRegion(""); setDescription("");
    setEnrollmentToken(null); setCreatedServerId(null); setOpen(false);
  }

  const servers = q.data?.servers ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registered Asterisk hosts. Each runs the AsterOps agent.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 size-4" /> Register server
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {servers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">No servers registered yet.</p>
            <Button className="mt-4" onClick={() => setOpen(true)}>Register your first server</Button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Hostname</th>
                <th className="px-6 py-3 font-medium">Region</th>
                <th className="px-6 py-3 font-medium">Agent</th>
                <th className="px-6 py-3 font-medium">Asterisk</th>
                <th className="px-6 py-3 font-medium text-right">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {servers.map((s) => (
                <tr key={s.id} className="hover:bg-surface-2/40">
                  <td className="px-6 py-3"><StatusPill status={s.status} /></td>
                  <td className="px-6 py-3">
                    <Link to="/servers/$id" params={{ id: s.id }} className="text-foreground hover:text-brand">{s.name}</Link>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s.hostname ?? "—"}</td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">{s.region ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s.agent_version ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s.asterisk_version ?? "—"}</td>
                  <td className="px-6 py-3 text-right text-xs text-muted-foreground">{s.last_seen_at ? new Date(s.last_seen_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); else setOpen(true); }}>
        <DialogContent>
          {!enrollmentToken ? (
            <>
              <DialogHeader>
                <DialogTitle>Register a server</DialogTitle>
                <DialogDescription>
                  We'll generate a one-time enrollment token. Run the install
                  command on your Asterisk host to connect it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Server name</Label>
                  <Input id="name" placeholder="pbx-fra-01" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="hostname">Hostname (optional)</Label>
                    <Input id="hostname" placeholder="pbx-fra-01.internal" value={hostname} onChange={(e) => setHostname(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input id="region" placeholder="EU-WEST-1" value={region} onChange={(e) => setRegion(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Production PBX, primary trunk to Level3" rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={reset}>Cancel</Button>
                <Button onClick={() => m.mutate()} disabled={!name || m.isPending}>
                  {m.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <EnrollmentReveal token={enrollmentToken} serverId={createdServerId!} onClose={reset} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EnrollmentReveal({ token, serverId, onClose }: { token: string; serverId: string; onClose: () => void }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-asterops.lovable.app";
  const cmd = `curl -sSf https://asterops.io/install.sh \\
  | sudo bash -s -- \\
      --token ${token} \\
      --url ${origin}`;
  return (
    <>
      <DialogHeader>
        <DialogTitle>Server created</DialogTitle>
        <DialogDescription>
          Run this on your Asterisk host. The enrollment token is shown only once.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-md border border-border bg-background">
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground">{cmd}</pre>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { navigator.clipboard.writeText(cmd); toast.success("Copied install command"); }}
        >
          <Copy className="mr-2 size-3" /> Copy command
        </Button>
      </div>
      <DialogFooter>
        <Link to="/servers/$id" params={{ id: serverId }}>
          <Button onClick={onClose}>Open server</Button>
        </Link>
      </DialogFooter>
    </>
  );
}