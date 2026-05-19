import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ScrollText, Server, Terminal, GitBranch, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AsterOps — Secure VoIP Provisioning & PBX Orchestration" },
      {
        name: "description",
        content:
          "Open-source control plane for Asterisk PBX fleets. Automate PJSIP configuration, enforce TLS/SRTP encryption, and stream immutable call audit logs in real time.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Brand size="md" />
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Capabilities</a>
            <a href="#agent" className="transition-colors hover:text-foreground">Agent</a>
            <a href="#audit" className="transition-colors hover:text-foreground">Audit log</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        {/* Hero */}
        <section className="py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-status-ok" />
              Open source · MIT licensed
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">
              Orchestrate your Asterisk fleet{" "}
              <span className="text-brand">with confidence.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              A control plane for production VoIP infrastructure. Provision PJSIP endpoints,
              enforce TLS/SRTP encryption, and stream immutable call audit logs from every
              PBX in your fleet — all from one dashboard.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg">Launch dashboard</Button>
              </Link>
              <a href="#agent">
                <Button size="lg" variant="outline">Install the agent</Button>
              </a>
            </div>
          </div>
        </section>

        {/* Capability grid */}
        <section id="features" className="border-t border-border py-20">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Capabilities
          </h2>
          <p className="mb-12 text-2xl font-semibold text-foreground">
            Everything you need to run secure PBX infrastructure.
          </p>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
            {[
              {
                icon: Server,
                title: "PJSIP provisioning",
                desc: "Form-driven config builder renders deterministic pjsip.conf with endpoints, trunks, and codecs.",
              },
              {
                icon: Lock,
                title: "TLS + SRTP enforcement",
                desc: "TLS-only transports and SDES SRTP by default. Cert expiry tracked per server.",
              },
              {
                icon: ShieldCheck,
                title: "Security hardening",
                desc: "Generated fail2ban jails, firewall rules, and AMI lockdown scripts — ready to apply.",
              },
              {
                icon: ScrollText,
                title: "Immutable call audit",
                desc: "Real-time CDR streaming. Append-only ledger — call records can never be edited or deleted.",
              },
              {
                icon: Terminal,
                title: "Lightweight host agent",
                desc: "Single binary on each PBX. Outbound-only HTTPS — works behind NAT.",
              },
              {
                icon: GitBranch,
                title: "Versioned configs",
                desc: "Every config push is versioned with a diff. Rollback to any prior version.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-surface p-6">
                <f.icon className="mb-4 size-5 text-brand" strokeWidth={1.5} />
                <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Install agent */}
        <section id="agent" className="border-t border-border py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Get started
              </h2>
              <p className="mb-6 text-2xl font-semibold text-foreground">
                Install the agent on any Asterisk host.
              </p>
              <p className="text-muted-foreground">
                Register your server in the dashboard, copy the enrollment token, then run the
                installer. The agent connects out — no inbound ports required.
              </p>
              <ol className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-mono text-brand">01</span>
                  Create an account and register your first server
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-brand">02</span>
                  Copy the one-time enrollment token
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-brand">03</span>
                  Run the install command on your Asterisk box
                </li>
              </ol>
            </div>
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2 font-mono text-xs text-muted-foreground">
                <span>~ install.sh</span>
                <span className="text-brand">root@pbx-fra-01</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-foreground">
{`# 1. register the server in the dashboard, copy the
#    one-time enrollment token (starts with ao_…)

curl -sSf https://asterops.io/install.sh \\
  | sudo bash -s -- \\
      --token ao_xxxxxxxxxxxxxxxxxxxxxxxxxxx \\
      --url   https://your-asterops.lovable.app

# 2. that's it. the agent registers, pulls the
#    pending config, and streams call records.`}
              </pre>
            </div>
          </div>
        </section>

        {/* Audit log preview */}
        <section id="audit" className="border-t border-border py-20">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Immutable call audit
          </h2>
          <p className="mb-8 text-2xl font-semibold text-foreground">
            Every call. Every server. Append-only.
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Timestamp</th>
                  <th className="px-6 py-3 font-medium">Source</th>
                  <th className="px-6 py-3 font-medium">Destination</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                  <th className="px-6 py-3 font-medium">Encryption</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {[
                  ["2026-05-19 14:02:11", "+1 555 0102", "2001 (Sales)", "04:12", "TLS/SRTP", "ANSWERED", "ok"],
                  ["2026-05-19 13:58:45", "+1 415 2201", "Trunk-Main", "00:45", "—", "NO ANSWER", "muted"],
                  ["2026-05-19 13:55:02", "Unknown ID", "Admin-EXT", "—", "—", "REJECTED", "err"],
                  ["2026-05-19 13:42:19", "+44 20 7946", "9000 (Support)", "12:01", "TLS/SRTP", "ANSWERED", "ok"],
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-surface-2/40">
                    <td className="px-6 py-3 text-muted-foreground">{r[0]}</td>
                    <td className="px-6 py-3 text-foreground">{r[1]}</td>
                    <td className="px-6 py-3 text-foreground">{r[2]}</td>
                    <td className="px-6 py-3">{r[3]}</td>
                    <td className={`px-6 py-3 ${r[4] === "TLS/SRTP" ? "text-status-ok" : "text-muted-foreground"}`}>{r[4]}</td>
                    <td className={`px-6 py-3 ${r[6] === "ok" ? "text-status-ok" : r[6] === "err" ? "text-status-err" : "text-muted-foreground"}`}>
                      <span className="flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${r[6] === "ok" ? "bg-status-ok" : r[6] === "err" ? "bg-status-err" : "bg-muted-foreground"}`} />
                        {r[5]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Brand size="sm" />
            <span>· open-source PBX orchestration</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">GitHub</a>
            <a href="#" className="transition-colors hover:text-foreground">Security policy</a>
            <a href="#" className="transition-colors hover:text-foreground">License (MIT)</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
