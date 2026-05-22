import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShieldCheck,
  ScrollText,
  Server,
  GitBranch,
  Lock,
  PhoneCall,
  ArrowRight,
  Github,
  Radio,
  Activity,
  CheckCircle2,
  Cloud,
  Headphones,
  Cable,
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
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Brand size="md" />
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#capabilities" className="transition-colors hover:text-foreground">Capabilities</a>
            <a href="#flow" className="transition-colors hover:text-foreground">Call flow</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#install" className="transition-colors hover:text-foreground">Install</a>
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

      {/* HERO — flat surface, no gradient, no tile background. */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.05fr_1fr] md:items-center md:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <Radio className="size-3 text-brand" /> Open-source · MIT · Asterisk 18 / 20 / 21
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Run a hardened VoIP fleet without touching a config file.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              AsterOps is an open control plane for production Asterisk PBX servers.
              Generate <span className="font-mono text-foreground">pjsip.conf</span> from a form,
              enforce TLS&nbsp;1.3 + SRTP on every SIP endpoint, and stream tamper-proof
              call records — across every host, from one dashboard.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg">
                  Launch dashboard <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <a href="#install">
                <Button size="lg" variant="outline">Install the agent</Button>
              </a>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-status-ok" /> PJSIP &amp; chan_pjsip</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-status-ok" /> TLS 1.3 / SRTP-SDES</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-status-ok" /> Let's Encrypt automation</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-status-ok" /> Append-only CDR</span>
            </div>
          </div>

          <CallPanelMock />
        </div>
      </section>

      {/* METRICS STRIP — flat, single color. */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          {[
            ["TLS-encrypted", "100%", "of generated transports"],
            ["Config drift", "0 ms", "deterministic renderer"],
            ["Audit retention", "∞", "append-only ledger"],
            ["Inbound ports", "0", "agent dials out over HTTPS"],
          ].map(([k, v, sub]) => (
            <div key={k} className="px-6 py-8">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{k}</div>
              <div className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">{v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CALL FLOW DIAGRAM */}
      <section id="flow" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Call path</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
              Every leg encrypted. Every hop logged.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Inbound and outbound SIP traffic terminates on TLS, RTP media is
              wrapped in SRTP, and each call leg lands in an append-only CDR
              ledger streamed back to the control plane.
            </p>
          </div>
          <CallFlowDiagram />

          {/* Channel status tiles */}
          <div className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Live channel status · pbx-fra-01
              </h3>
              <span className="font-mono text-xs text-muted-foreground">42 / 120 channels</span>
            </div>
            <ChannelTiles />
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="border-b border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Capabilities</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
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
                className="group rounded-2xl border border-border bg-background p-6 transition-colors hover:border-brand/50"
              >
                <div className="mb-5 inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-brand transition-colors group-hover:border-brand/40">
                  <c.icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — pipeline */}
      <section id="how" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">How it works</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
              From form input to a reloaded PBX in seconds
            </h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-4">
            {pipeline.map((step, i) => (
              <li key={step.t} className="relative rounded-2xl border border-border bg-surface p-6">
                <div className="mb-3 font-mono text-xs text-brand">STEP 0{i + 1}</div>
                <h3 className="font-display text-base font-semibold text-foreground">{step.t}</h3>
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
      <section id="install" className="border-b border-border bg-surface py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Get started</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
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

          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-status-err/70" />
                <span className="size-2.5 rounded-full bg-status-warn/70" />
                <span className="size-2.5 rounded-full bg-status-ok/70" />
              </div>
              <span className="font-mono text-muted-foreground">root@pbx-fra-01 ~ install.sh</span>
              <span />
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-foreground">
<span className="text-muted-foreground"># 1. register the server in the dashboard,</span>{"\n"}
<span className="text-muted-foreground">#    copy the one-time enrollment token</span>{"\n\n"}
curl -sSf https://asterops.dev/install.sh \{"\n"}
{"  | sudo bash -s -- \\"}{"\n"}
{"      --token ao_xxxxxxxxxxxxxxxxxxxxxxxxx \\"}{"\n"}
{"      --url   https://your-asterops.app"}{"\n\n"}
<span className="text-status-ok">✓ agent enrolled · pulled pjsip.conf v3 · reload OK</span>{"\n"}
<span className="text-status-ok">✓ streaming CDR · 4 active channels</span>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface px-8 py-12 text-center md:px-12">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
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

      <footer className="py-10">
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

/* ───────────── VoIP call flow diagram ───────────── */

function CallFlowDiagram() {
  // Four nodes: SIP carrier → Asterisk PBX → SIP phone, with AsterOps control plane above.
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface p-6 md:p-10">
      <svg
        viewBox="0 0 920 320"
        className="w-full text-foreground"
        role="img"
        aria-label="VoIP call flow: SIP carrier to Asterisk PBX to SIP endpoint, with AsterOps control plane"
      >
        {/* Control plane node (top center) */}
        <FlowNode x={400} y={28} w={140} h={56} label="AsterOps control plane" sub="HTTPS · outbound" />

        {/* Dashed control links from control plane down to PBX */}
        <line x1="470" y1="84" x2="470" y2="170" className="stroke-border animate-dash" strokeWidth="1.5" />

        {/* SIP carrier (left) */}
        <FlowNode x={30} y={150} w={170} h={92} label="SIP carrier" sub="TLS 1.3 · SDES SRTP" iconKind="cloud" />

        {/* PBX (middle) */}
        <FlowNode x={400} y={150} w={140} h={92} label="Asterisk PBX" sub="chan_pjsip" iconKind="server" highlight />

        {/* Endpoint (right) */}
        <FlowNode x={720} y={150} w={170} h={92} label="SIP endpoint" sub="2001 · Sales" iconKind="phone" />

        {/* Signaling/media paths */}
        <FlowPath d="M200,180 C 290,180 320,180 400,180" labelTop="SIP/TLS · port 5061" labelBot="SRTP · audio" />
        <FlowPath d="M540,180 C 620,180 650,180 720,180" labelTop="SIP/TLS · port 5061" labelBot="SRTP · audio" />

        {/* CDR ledger label */}
        <g transform="translate(360, 268)">
          <rect width="200" height="32" rx="8" className="fill-background stroke-border" strokeWidth="1" />
          <text x="100" y="20" textAnchor="middle" className="fill-current text-[11px] font-mono" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            CDR → append-only ledger
          </text>
        </g>
        <line x1="470" y1="242" x2="470" y2="268" className="stroke-border" strokeWidth="1" />
      </svg>
    </div>
  );
}

function FlowNode({
  x, y, w, h, label, sub, iconKind, highlight = false,
}: {
  x: number; y: number; w: number; h: number;
  label: string; sub?: string;
  iconKind?: "cloud" | "server" | "phone";
  highlight?: boolean;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        width={w}
        height={h}
        rx="12"
        className={`fill-background ${highlight ? "stroke-brand" : "stroke-border"}`}
        strokeWidth={highlight ? 1.5 : 1}
      />
      <foreignObject x="12" y="10" width={w - 24} height={h - 20}>
        <div className="flex h-full items-center gap-3">
          {iconKind === "cloud" && <Cloud className="size-5 shrink-0 text-brand" />}
          {iconKind === "server" && <Server className="size-5 shrink-0 text-brand" />}
          {iconKind === "phone" && <Headphones className="size-5 shrink-0 text-brand" />}
          {!iconKind && <Cable className="size-5 shrink-0 text-brand" />}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight text-foreground">{label}</div>
            {sub && <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{sub}</div>}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

function FlowPath({ d, labelTop, labelBot }: { d: string; labelTop?: string; labelBot?: string }) {
  return (
    <g>
      <path d={d} className="fill-none stroke-brand" strokeWidth="1.5" />
      <circle r="4" className="fill-brand">
        <animateMotion dur="2.6s" repeatCount="indefinite" path={d} />
      </circle>
      <circle r="3" className="fill-brand/60">
        <animateMotion dur="2.6s" begin="1.3s" repeatCount="indefinite" path={d} />
      </circle>
      {labelTop && (
        <PathLabel d={d} text={labelTop} offset={-12} />
      )}
      {labelBot && (
        <PathLabel d={d} text={labelBot} offset={20} />
      )}
    </g>
  );
}

function PathLabel({ d, text, offset }: { d: string; text: string; offset: number }) {
  // Place a label at the geometric midpoint of a path's bounding box.
  // For our cubic paths in CallFlowDiagram, the midpoint y is ~180.
  // Cheap approach: parse first M to anchor x to center between M start and end.
  const m = /M([\d.]+),([\d.]+).*?(\d{2,3}),(\d{2,3})\s*$/.exec(d);
  if (!m) return null;
  const x1 = parseFloat(m[1]);
  const x2 = parseFloat(m[3]);
  const y = parseFloat(m[2]);
  return (
    <text
      x={(x1 + x2) / 2}
      y={y + offset}
      textAnchor="middle"
      className="fill-muted-foreground"
      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}
    >
      {text}
    </text>
  );
}

/* ───────────── Channel status tiles ───────────── */

function ChannelTiles() {
  // Deterministic mock — first N busy, next M ringing, rest idle.
  const total = 48;
  const tiles = Array.from({ length: total }, (_, i) => {
    if (i < 18) return "talking";
    if (i < 22) return "ringing";
    if (i === 23) return "error";
    return "idle";
  });
  const legend = [
    { k: "talking", label: "Talking", cls: "bg-status-ok" },
    { k: "ringing", label: "Ringing", cls: "bg-status-warn animate-tile" },
    { k: "error",   label: "Failed",  cls: "bg-status-err" },
    { k: "idle",    label: "Idle",    cls: "bg-muted" },
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="grid grid-cols-12 gap-1.5 sm:grid-cols-[repeat(16,minmax(0,1fr))] md:grid-cols-[repeat(24,minmax(0,1fr))]">
        {tiles.map((t, i) => {
          const cls =
            t === "talking" ? "bg-status-ok"
              : t === "ringing" ? "bg-status-warn animate-tile"
              : t === "error"   ? "bg-status-err"
              : "bg-muted";
          return (
            <div
              key={i}
              title={`ch-${(i + 1).toString().padStart(3, "0")} · ${t}`}
              className={`h-6 rounded-sm border border-border/60 ${cls}`}
            />
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        {legend.map((l) => (
          <span key={l.k} className="inline-flex items-center gap-2">
            <span className={`size-2.5 rounded-sm ${l.cls}`} /> {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Hero side panel: live calls ───────────── */

function CallPanelMock() {
  const calls = [
    { from: "+1 555 0102", to: "2001",        state: "TALKING",  dur: "02:17", enc: true },
    { from: "+44 20 7946", to: "9000",        state: "TALKING",  dur: "11:43", enc: true },
    { from: "Unknown",     to: "Admin",       state: "REJECTED", dur: "00:01", enc: false },
    { from: "2034",        to: "+33 1 8688",  state: "RINGING",  dur: "—",     enc: true },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
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
            <PhoneCall className="size-4 shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-mono text-xs text-foreground">
                {c.from}
                <span className="mx-2 text-muted-foreground">→</span>
                {c.to}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className={c.enc ? "text-status-ok" : ""}>
                  {c.enc ? "TLS · SRTP" : "no encryption"}
                </span>
                <span>·</span>
                <span className="font-mono">{c.dur}</span>
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
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-background text-center">
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
