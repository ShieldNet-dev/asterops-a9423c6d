import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/_shim";
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
import { Plus, Copy, Server } from "lucide-react";
import { StatusPill } from "./Dashboard";
import { EmptyState } from "@/components/empty-state";

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
          <EmptyState
            icon={Server}
            title="No servers registered yet"
            description="Add your first Asterisk PBX to AsterOps. You'll get a one-time enrollment token and a short install command to run on the host."
            action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" /> Register your first server</Button>}
            hint="Takes about a minute per server."
          />
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
                    <Link to={`/servers/${s.id}`} className="text-foreground hover:text-brand">{s.name}</Link>
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
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
  const controlPlane = projectId
    ? `https://${projectId}.functions.supabase.co`
    : `${origin}/functions/v1`;
  const cmd = `# 1. Install the AsterOps agent on your Asterisk host
#    (Ubuntu / Debian — the package is not on PyPI yet, install from source)
sudo apt-get update
sudo apt-get install -y python3-pip git
git clone https://github.com/ShieldNet-dev/asterops-a9423c6d.git
cd asterops-a9423c6d/agent
sudo pip3 install --break-system-packages .

# 2. Point it at this control plane and your enrollment token
export ASTEROPS_URL="${controlPlane}"
export ASTEROPS_AGENT_TOKEN="${token}"

# 3. Run a hardening + posture scan; the server will appear online here
sudo -E asterops run --profile baseline
sudo -E asterops report --url "$ASTEROPS_URL" --token "$ASTEROPS_AGENT_TOKEN"`;
  return (
    <>
      <DialogHeader>
        <DialogTitle>Server created</DialogTitle>
        <DialogDescription>
          Run these commands on your Asterisk host. The enrollment token is shown only once — copy it now.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-md border border-border bg-background">
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground">{cmd}</pre>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { navigator.clipboard.writeText(cmd); toast.success("Copied install commands"); }}
          >
            <Copy className="mr-2 size-3" /> Copy commands
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { navigator.clipboard.writeText(token); toast.success("Copied enrollment token"); }}
          >
            <Copy className="mr-2 size-3" /> Copy token only
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          No Asterisk host handy? You can still explore the dashboard — this server will stay in{" "}
          <span className="font-mono">pending</span> until an agent checks in.
        </p>
      </div>
      <DialogFooter>
        <Link to={`/servers/${serverId}`}>
          <Button onClick={onClose}>Open server</Button>
        </Link>
      </DialogFooter>
    </>
  );
}

export default ServersPage;
