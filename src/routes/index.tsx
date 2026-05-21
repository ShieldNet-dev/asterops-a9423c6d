import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShieldCheck,
  ScrollText,
  Server,
  Terminal,
  GitBranch,
  Lock,
  PhoneCall,
  ArrowRight,
  Github,
  Radio,
  Activity,
  CheckCircle2,
} from "lucide-react";

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
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Brand size="md" />
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#capabilities" className="transition-colors hover:text-foreground">Capabilities</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#install" className="transition-colors hover:text-foreground">Install</a>
            <a href="#audit" className="transition-colors hover:text-foreground">Audit</a>
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <a
              href="https://github.com"
              className="hidden md:inline-flex"
              aria-label="GitHub"
            >
              <Button variant="ghost" size="sm"><Github className="size-4" /></Button>
            </a>
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/signup"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div className="absolute inset-0 bg-radial-brand" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.05fr_1fr] md:items-center md:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
              <Radio className="size-3" /> Open-source · MIT · for Asterisk 18 / 20 / 21
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Provision, harden and audit your{" "}
              <span className="text-brand">VoIP fleet</span>{" "}
              without touching a config file.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              AsterOps is a control plane for production Asterisk PBX servers.
              Generate <span className="font-mono text-foreground">pjsip.conf</span> from a form,
              enforce TLS&nbsp;1.3 + SRTP on every endpoint, and stream tamper-proof
              call records — from one dashboard, across every host.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="shadow-lg shadow-brand/20">
                  Launch dashboard <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <a href="#install">
                <Button size="lg" variant="outline">Install the agent</Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-status-ok" /> PJSIP &amp; chan_pjsip</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-status-ok" /> TLS 1.3 / SRTP-SDES</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-status-ok" /> Let's Encrypt automation</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-status-ok" /> Append-only CDR</span>
            </div>
          </div>

          {/* VoIP-themed visual: live call panel */}
          <CallPanelMock />
        </div>
      </section>

      {/* METRICS STRIP */}
      <section className="border-b border-border bg-surface-2/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
          {[
            ["TLS-encrypted", "100%", "of generated transports"],
            ["Config drift", "0 ms", "deterministic renderer"],
            ["Audit retention", "∞", "append-only ledger"],
            ["Inbound ports", "0", "agent dials out over HTTPS"],
          ].map(([k, v, sub]) => (
            <div key={k} className="bg-background px-6 py-8">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{k}</div>
              <div className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">{v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Capabilities</span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
            Everything a VoIP operator needs in one console
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built around how SIP actually fails in production — expired certificates,
            silent reload failures, brute-force registrations, missing audit trails.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5"
            >
              <div className="mb-5 inline-flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <c.icon className="size-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — pipeline */}
      <section id="how" className="border-t border-border bg-surface-2/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">How it works</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
              From form input to a reloaded PBX in seconds
            </h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-4">
            {pipeline.map((step, i) => (
              <li key={step.t} className="relative rounded-2xl border border-border bg-surface p-6">
                <div className="mb-3 font-mono text-xs text-brand">STEP 0{i + 1}</div>
                <h3 className="font-display text-base font-semibold">{step.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
                {i < 3 && (
                  <ArrowRight className="absolute right-3 top-1/2 hidden size-4 -translate-y-1/2 text-border md:block" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* INSTALL */}
      <section id="install" className="border-t border-border py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Get started</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
              One command. One outbound connection.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Register a server in the dashboard, copy the one-time enrollment token,
              and run the installer on the box. The agent registers itself, pulls
              the pending PJSIP bundle, and starts streaming CDRs back. No inbound
              firewall changes — ever.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                "Outbound HTTPS only — survives NAT and corporate firewalls",
                "Atomic config writes with automatic rollback on apply failure",
                "Private keys stay on the host — control plane only stores fingerprints",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-ok" />
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-foreground/5">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-status-err/70" />
                <span className="size-2.5 rounded-full bg-status-warn/70" />
                <span className="size-2.5 rounded-full bg-status-ok/70" />
              </div>
              <span className="font-mono text-muted-foreground">root@pbx-fra-01 ~ install.sh</span>
              <span />
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
<span className="text-muted-foreground"># 1. register the server in the dashboard,</span>{"\n"}
<span className="text-muted-foreground">#    copy the one-time enrollment token</span>{"\n\n"}
<span className="text-foreground">curl</span> -sSf https://asterops.dev/install.sh \{"\n"}
{"  | "}<span className="text-foreground">sudo bash</span> -s -- \{"\n"}
{"      "}<span className="text-brand">--token</span> ao_xxxxxxxxxxxxxxxxxxxxxxxxx \{"\n"}
{"      "}<span className="text-brand">--url</span>   https://your-asterops.app{"\n\n"}
<span className="text-status-ok">✓ agent enrolled · pulled pjsip.conf v3 · reload OK</span>{"\n"}
<span className="text-status-ok">✓ streaming CDR · 4 active channels</span>
            </pre>
          </div>
        </div>
      </section>

      {/* AUDIT PREVIEW */}
      <section id="audit" className="border-t border-border bg-surface-2/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Live call audit</span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
                Every call. Every server. Append-only.
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Database-level RLS blocks <span className="font-mono">UPDATE</span> and{" "}
              <span className="font-mono">DELETE</span> on call records — even for admins.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-foreground/5">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
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
                  ["14:02:11", "+1 555 0102", "2001 (Sales)", "04:12", "TLS · SRTP", "ANSWERED", "ok"],
                  ["13:58:45", "+1 415 2201", "Trunk-Main", "00:45", "—", "NO ANSWER", "muted"],
                  ["13:55:02", "Unknown ID", "Admin-EXT", "—", "—", "REJECTED", "err"],
                  ["13:42:19", "+44 20 7946", "9000 (Support)", "12:01", "TLS · SRTP", "ANSWERED", "ok"],
                  ["13:31:08", "2034 (Eng)", "+33 1 8688", "07:33", "TLS · SRTP", "ANSWERED", "ok"],
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-surface-2/60">
                    <td className="px-6 py-3 text-muted-foreground">{r[0]}</td>
                    <td className="px-6 py-3 text-foreground">{r[1]}</td>
                    <td className="px-6 py-3 text-foreground">{r[2]}</td>
                    <td className="px-6 py-3">{r[3]}</td>
                    <td className={`px-6 py-3 ${r[4] !== "—" ? "text-status-ok" : "text-muted-foreground"}`}>{r[4]}</td>
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
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface px-8 py-12 text-center shadow-xl shadow-brand/5 md:px-12">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Bring order to your PBX fleet.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Run AsterOps yourself or fork the source. No phone-home, no telemetry,
            no per-seat fees — just open infrastructure for VoIP teams that take security seriously.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup"><Button size="lg">Create an account</Button></Link>
            <a href="https://github.com">
              <Button size="lg" variant="outline"><Github className="mr-2 size-4" /> View on GitHub</Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
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

const capabilities = [
  { icon: Server, title: "PJSIP provisioning", desc: "Form-driven builder renders deterministic pjsip.conf with endpoints, trunks, codecs and contexts. Diff before deploy." },
  { icon: Lock, title: "TLS + SRTP enforcement", desc: "TLS 1.3 transports and SDES SRTP enforced per endpoint. Optimistic encryption disabled by default." },
  { icon: ShieldCheck, title: "Security hardening", desc: "Generated fail2ban jails, iptables rules, AMI lockdown and SSH baseline — apply with a single shell script." },
  { icon: ScrollText, title: "Immutable call audit", desc: "Real-time CDR streaming. Database-enforced append-only ledger — records cannot be edited or deleted." },
  { icon: GitBranch, title: "Versioned configs + rollback", desc: "Every push is a numbered version. Roll back to any previously-applied bundle with one click." },
  { icon: Activity, title: "Health & alerting", desc: "Heartbeats, active-call counts, cert expiry, reload outcomes — wired to webhooks for real-time alerts." },
];

const pipeline = [
  { t: "Define endpoints", d: "Extensions, trunks, codecs, contexts — captured in a form." },
  { t: "Render config", d: "Deterministic pjsip.conf with TLS + SRTP enforced." },
  { t: "Agent applies", d: "Atomic write + pjsip reload. Failure triggers rollback." },
  { t: "Stream CDR", d: "Call records flow back into the append-only audit ledger." },
];

function CallPanelMock() {
  const calls = [
    { from: "+1 555 0102", to: "2001", state: "TALKING", dur: "02:17", enc: true },
    { from: "+44 20 7946", to: "9000", state: "TALKING", dur: "11:43", enc: true },
    { from: "Unknown",     to: "Admin", state: "REJECTED", dur: "00:01", enc: false },
    { from: "2034",        to: "+33 1 8688", state: "RINGING", dur: "—",  enc: true },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-radial-brand blur-2xl opacity-60" aria-hidden />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-foreground/10">
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex size-2.5 items-center justify-center">
              <span className="absolute inline-flex size-full rounded-full bg-status-ok/40 animate-pulse-ring" />
              <span className="relative inline-flex size-2 rounded-full bg-status-ok" />
            </span>
            <span className="font-mono text-xs text-muted-foreground">pbx-fra-01 · Asterisk 20.7</span>
          </div>
          <span className="font-mono text-[11px] text-brand">4 active</span>
        </div>
        <div className="divide-y divide-border">
          {calls.map((c) => (
            <div key={c.from + c.to} className="flex items-center gap-4 px-5 py-3.5 text-sm">
              <PhoneCall className="size-4 text-brand shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs">
                  <span className="text-foreground">{c.from}</span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="text-foreground">{c.to}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                  <span className={c.enc ? "text-status-ok" : "text-muted-foreground"}>
                    {c.enc ? "TLS · SRTP" : "—"}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-mono text-muted-foreground">{c.dur}</span>
                </div>
              </div>
              {c.state === "TALKING" ? (
                <Waveform />
              ) : (
                <span className={`font-mono text-[10px] uppercase tracking-wider ${
                  c.state === "REJECTED" ? "text-status-err" : "text-status-warn"
                }`}>
                  {c.state}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 border-t border-border bg-surface-2 text-center">
          {[
            ["Calls 24h", "1,284"],
            ["Encrypted", "100%"],
            ["Cert OK", "84d"],
          ].map(([k, v]) => (
            <div key={k} className="px-3 py-3">
              <div className="font-mono text-sm font-semibold text-foreground">{v}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Waveform() {
  return (
    <div className="flex h-5 items-center gap-[2px]">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-brand animate-wave"
          style={{ height: "100%", animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}
