import { Link } from "react-router-dom";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShieldCheck,
  ScrollText,
  Server,
  GitBranch,
  Lock,
  ArrowRight,
  Github,
  Radio,
  Activity,
  CheckCircle2,
  Cloud,
  Building2,
  HardDrive,
  Network,
  AlertTriangle,
  Quote,
  ChevronDown,
  PlayCircle,
  Phone,
  Globe2,
} from "lucide-react";
import { useState } from "react";

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <ProductScreenshot />
      <ProblemStatement />
      <ArchitectureDiagram />
      <CoreFeatures />
      <SecuritySection />
      <UseCases />
      <Testimonials />
      <DeploymentModels />
      <FAQSection />
      <SetupSection />
      <DemoCTA />
      <SiteFooter />
    </div>
  );
}

/* ─────────────── Header / Footer ─────────────── */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Brand size="md" />
        <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#product" className="transition-colors hover:text-foreground">Product</a>
          <a href="#architecture" className="transition-colors hover:text-foreground">Architecture</a>
          <a href="#security" className="transition-colors hover:text-foreground">Security</a>
          <a href="#deployment" className="transition-colors hover:text-foreground">Deployment</a>
          <a href="#setup" className="transition-colors hover:text-foreground">Setup</a>
          <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <a href="https://github.com/asterops/asterops" target="_blank" rel="noreferrer" className="hidden md:inline-flex" aria-label="GitHub">
            <Button variant="ghost" size="sm"><Github className="size-4" /></Button>
          </a>
          <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <a href="#demo"><Button size="sm">Book a demo</Button></a>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-3">
          <Brand size="sm" />
          <span>Open control plane for Asterisk fleets</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a href="https://github.com/asterops/asterops" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"><Github className="size-3.5" /> GitHub</a>
          <a href="#security" className="transition-colors hover:text-foreground">Security</a>
          <a href="https://github.com/asterops/asterops/blob/main/LICENSE" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">Apache-2.0</a>
          <a href="https://github.com/asterops/asterops#quick-start" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">Docs</a>
          <a href="#setup" className="transition-colors hover:text-foreground">Setup</a>
          <a href="#demo" className="transition-colors hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────── 1. Hero ─────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_hsl(var(--brand)/0.08),_transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Radio className="size-3.5 text-brand" />
            MIT Licensed · Asterisk 18 / 20 / 21 · TLS 1.3 + SRTP
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tighter md:text-6xl lg:text-7xl">
            The control plane for
            <br />
            <span className="text-brand">production Asterisk fleets.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            AsterOps provisions, secures, and audits every PBX in your fleet from one dashboard —
            without exposing inbound ports, plaintext SIP, or a single hand-edited config file.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="#demo">
              <Button size="lg" className="px-8 text-base">
                Book a 20-min demo <ArrowRight className="ml-2 size-4" />
              </Button>
            </a>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="px-8 text-base">
                Try the dashboard
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-status-ok" /> No inbound ports</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-status-ok" /> TLS 1.3 + SRTP enforced</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-status-ok" /> Append-only audit ledger</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 2. Product Screenshot ─────────────── */

function ProductScreenshot() {
  return (
    <section id="product" className="border-b border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">The dashboard</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Every PBX in your fleet, on one screen.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Live channel counts, certificate health, registration status, and CDR streams —
            without SSH'ing into a single box.
          </p>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-brand/15 via-brand/5 to-transparent blur-2xl" />
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  const servers = [
    { name: "pbx-fra-01", region: "eu-central", ch: 47, cap: 120, mos: 4.3, status: "ok" as const },
    { name: "pbx-iad-02", region: "us-east", ch: 89, cap: 200, mos: 4.4, status: "ok" as const },
    { name: "pbx-sin-01", region: "ap-south", ch: 12, cap: 80, mos: 4.1, status: "warn" as const },
    { name: "pbx-lhr-03", region: "eu-west", ch: 64, cap: 150, mos: 4.5, status: "ok" as const },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-red-500/70" />
          <div className="size-3 rounded-full bg-yellow-500/70" />
          <div className="size-3 rounded-full bg-green-500/70" />
        </div>
        <div className="ml-4 flex-1 rounded-md border border-border bg-background px-3 py-1 font-mono text-xs text-muted-foreground">
          dash.asterops.io / fleet
        </div>
      </div>
      <div className="grid grid-cols-12 gap-px bg-border">
        {/* Sidebar */}
        <aside className="col-span-12 bg-surface p-5 md:col-span-3">
          <div className="mb-6"><Brand size="sm" /></div>
          <nav className="space-y-1 text-sm">
            {[
              ["Fleet", true],
              ["Servers", false],
              ["Calls", false],
              ["Alerts", false],
              ["Audit log", false],
              ["Agents", false],
            ].map(([label, active]) => (
              <div
                key={label as string}
                className={
                  active
                    ? "rounded-md bg-brand/10 px-3 py-2 font-medium text-brand"
                    : "rounded-md px-3 py-2 text-muted-foreground"
                }
              >
                {label as string}
              </div>
            ))}
          </nav>
        </aside>
        {/* Main */}
        <main className="col-span-12 space-y-6 bg-background p-6 md:col-span-9">
          {/* Stat row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Active calls", "212"],
              ["Fleet uptime", "99.99%"],
              ["Encrypted", "100%"],
              ["Avg MOS", "4.36"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border bg-surface p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="mt-1 font-display text-2xl font-semibold">{v}</div>
              </div>
            ))}
          </div>
          {/* Server table */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-12 gap-2 border-b border-border bg-surface px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">Server</div>
              <div className="col-span-2">Region</div>
              <div className="col-span-3">Channels</div>
              <div className="col-span-2">MOS</div>
              <div className="col-span-1 text-right">Status</div>
            </div>
            {servers.map((s) => (
              <div key={s.name} className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0">
                <div className="col-span-4 flex items-center gap-2 font-mono">
                  <Server className="size-4 text-muted-foreground" /> {s.name}
                </div>
                <div className="col-span-2 text-muted-foreground">{s.region}</div>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface">
                      <div className="h-full bg-brand" style={{ width: `${(s.ch / s.cap) * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{s.ch}/{s.cap}</span>
                  </div>
                </div>
                <div className="col-span-2 font-mono">{s.mos}</div>
                <div className="col-span-1 flex justify-end">
                  <span
                    className={
                      s.status === "ok"
                        ? "size-2.5 rounded-full bg-status-ok"
                        : "size-2.5 rounded-full bg-status-warn"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Waveform */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground">Live call · 2001 → +1-415-555-0142 · SRTP</span>
              <span className="font-mono text-status-ok">38ms · MOS 4.4 · 0.0% loss</span>
            </div>
            <div className="flex h-12 items-end gap-0.5">
              {Array.from({ length: 96 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-brand/70"
                  style={{
                    height: `${20 + Math.abs(Math.sin(i * 0.5)) * 80}%`,
                    opacity: 0.35 + Math.abs(Math.sin(i * 0.9)) * 0.65,
                  }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─────────────── 3. Problem Statement ─────────────── */

function ProblemStatement() {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Hand-edited configs drift.",
      body: "One engineer tweaks pjsip.conf at 2 AM, nobody else knows. Multiply by 30 PBXes and you have a fleet you can't reason about.",
    },
    {
      icon: Lock,
      title: "Most SIP traffic is still plaintext.",
      body: "UDP/5060 + RTP is the default. Toll fraud, eavesdropping, and registration hijacks cost operators millions every year.",
    },
    {
      icon: ScrollText,
      title: "Audit trails are an afterthought.",
      body: "CDRs sit in local MySQL, get rotated, get tampered with. When the regulator or the customer asks, you can't prove what happened.",
    },
    {
      icon: Network,
      title: "Inbound management is a backdoor.",
      body: "AMI, SSH, web UIs exposed to the internet are the #1 way Asterisk boxes get owned. NAT and firewalls only make it worse.",
    },
  ];
  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">The problem</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Running Asterisk at scale is a security and operations nightmare.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Asterisk is brilliant software. Operating a fleet of it in 2026 is not.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {problems.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-surface p-7">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background text-brand">
                <p.icon className="size-5" strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 4. Architecture Diagram ─────────────── */

function ArchitectureDiagram() {
  return (
    <section id="architecture" className="border-b border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Architecture</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Outbound-only agent. Encrypted by default. Signed and auditable.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            The agent on each PBX dials home over HTTPS. Nothing inbound. Nothing in plaintext. Nothing untraceable.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border bg-background p-6 md:p-10">
          <svg viewBox="0 0 980 420" className="w-full text-foreground" role="img" aria-label="AsterOps architecture diagram">
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" className="fill-brand" />
              </marker>
            </defs>

            {/* Control plane */}
            <ArchNode x={380} y={20} w={220} h={70} title="AsterOps Control Plane" sub="Dashboard · API · Audit Ledger" highlight />

            {/* Operator */}
            <ArchNode x={40} y={32} w={150} h={48} title="Operator" sub="Browser · SSO" />
            <ArchLine d="M190,56 L380,56" arrow label="HTTPS · TLS 1.3" />

            {/* Region 1 */}
            <ArchNode x={80} y={180} w={170} h={56} title="Agent · pbx-fra-01" sub="Outbound HTTPS" />
            <ArchNode x={80} y={260} w={170} h={56} title="Asterisk PBX" sub="chan_pjsip · 18/20/21" />
            <ArchLine d="M165,236 L165,260" arrow />
            <ArchLine d="M250,208 C 320,208 360,140 470,90" arrow label="mTLS · gRPC/HTTPS" />

            {/* Region 2 */}
            <ArchNode x={400} y={180} w={170} h={56} title="Agent · pbx-iad-02" sub="Outbound HTTPS" />
            <ArchNode x={400} y={260} w={170} h={56} title="Asterisk PBX" sub="chan_pjsip" />
            <ArchLine d="M485,236 L485,260" arrow />
            <ArchLine d="M485,180 L485,90" arrow label="mTLS · gRPC/HTTPS" />

            {/* Region 3 */}
            <ArchNode x={720} y={180} w={170} h={56} title="Agent · pbx-sin-01" sub="Outbound HTTPS" />
            <ArchNode x={720} y={260} w={170} h={56} title="Asterisk PBX" sub="chan_pjsip" />
            <ArchLine d="M805,236 L805,260" arrow />
            <ArchLine d="M720,208 C 660,208 600,140 510,90" arrow label="mTLS · gRPC/HTTPS" />

            {/* SIP edges */}
            <ArchNode x={80} y={350} w={170} h={48} title="SIP Carriers / Endpoints" sub="SIP/TLS 5061 · SRTP" />
            <ArchNode x={400} y={350} w={170} h={48} title="SIP Carriers / Endpoints" sub="SIP/TLS 5061 · SRTP" />
            <ArchNode x={720} y={350} w={170} h={48} title="SIP Carriers / Endpoints" sub="SIP/TLS 5061 · SRTP" />
            <ArchLine d="M165,350 L165,316" arrow />
            <ArchLine d="M485,350 L485,316" arrow />
            <ArchLine d="M805,350 L805,316" arrow />
          </svg>
        </div>
        <div className="mt-8 grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="font-semibold text-foreground">Agent dials home</div>
            <div className="mt-1">No inbound ports on the PBX. Works behind NAT, firewalls, and air-gapped DMZs.</div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="font-semibold text-foreground">mTLS + signed configs</div>
            <div className="mt-1">Every config push is signed and verified on the host before reload.</div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="font-semibold text-foreground">Append-only ledger</div>
            <div className="mt-1">CDRs and audit events stream into hash-chained storage. Tamper evidence built in.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchNode({
  x, y, w, h, title, sub, highlight,
}: { x: number; y: number; w: number; h: number; title: string; sub?: string; highlight?: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={w}
        height={h}
        rx={12}
        className={highlight ? "fill-brand/10 stroke-brand" : "fill-surface stroke-border"}
        strokeWidth={1.5}
      />
      <text x={w / 2} y={sub ? h / 2 - 4 : h / 2 + 4} textAnchor="middle" className={`fill-current text-[13px] font-semibold ${highlight ? "text-brand" : ""}`}>
        {title}
      </text>
      {sub && (
        <text x={w / 2} y={h / 2 + 14} textAnchor="middle" className="fill-current text-[10px] font-mono opacity-60">
          {sub}
        </text>
      )}
    </g>
  );
}

function ArchLine({ d, label, arrow }: { d: string; label?: string; arrow?: boolean }) {
  return (
    <g>
      <path
        d={d}
        className="stroke-brand"
        strokeWidth={1.6}
        fill="none"
        strokeDasharray="5 4"
        markerEnd={arrow ? "url(#arr)" : undefined}
      />
      {label && (
        <text className="fill-current text-[10px] font-mono opacity-70">
          <textPath href="#none">{label}</textPath>
        </text>
      )}
    </g>
  );
}

/* ─────────────── 5. Core Features ─────────────── */

function CoreFeatures() {
  const features = [
    { icon: Server, title: "Deterministic provisioning", desc: "Form-driven PJSIP generation with visual diff and atomic apply." },
    { icon: Lock, title: "Encryption by default", desc: "TLS 1.3 signaling and SRTP media enforced on every endpoint." },
    { icon: ShieldCheck, title: "Zero-trust surface", desc: "Outbound-only agent. No AMI, no SSH, no web UI exposed." },
    { icon: ScrollText, title: "Immutable audit ledger", desc: "Hash-chained CDR and config events. Tamper-evident by design." },
    { icon: GitBranch, title: "Versioned + rollback", desc: "Every change is signed, versioned, and one-click reversible." },
    { icon: Activity, title: "Fleet observability", desc: "Live channels, registration health, cert expiry, webhook alerts." },
  ];
  return (
    <section id="features" className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Core features</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Operational confidence, built into the platform.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-surface p-7 transition-all hover:border-brand/40">
              <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background text-brand group-hover:border-brand/60">
                <f.icon className="size-5" strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 6. Security ─────────────── */

function SecuritySection() {
  return (
    <section id="security" className="border-b border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Security</span>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              Hardened for real SIP attacks.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              No exposed management surface. No trust in the PBX itself. Every config push and call record is signed, verified, and logged.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-status-ok" /> SOC 2 controls (in audit)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-status-ok" /> GDPR data-residency options</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-status-ok" /> Coordinated disclosure policy</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-status-ok" /> Reproducible agent builds</li>
            </ul>
          </div>
          <div className="grid gap-5 lg:col-span-3">
            {[
              ["No inbound ports", "Agent dials out over HTTPS only. Survives strict firewalls, NAT, and air-gapped DMZs."],
              ["Encrypt everything", "TLS 1.3 signaling and SRTP media enforced. No plaintext SIP, ever."],
              ["Tamper-proof audit", "Hash-chained append-only ledger. Call records and config changes cannot be silently altered."],
              ["Zero-trust config", "Private keys never leave the host. Control plane stores only fingerprints and signed manifests."],
              ["Least-privilege roles", "Granular RBAC scoped to fleet, region, and PBX. Every action attributable."],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-5 rounded-2xl border border-border bg-background p-6">
                <ShieldCheck className="mt-0.5 size-6 shrink-0 text-brand" />
                <div>
                  <div className="font-semibold">{title}</div>
                  <p className="mt-1.5 text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 7. Use Cases ─────────────── */

function UseCases() {
  const cases = [
    {
      icon: Phone,
      tag: "Contact centers",
      title: "1,000+ seat contact centers",
      body: "Run hundreds of concurrent SRTP calls per node with live MOS, jitter, and packet-loss visibility. Roll bad dial-plan changes back in one click.",
    },
    {
      icon: Globe2,
      tag: "Telecom operators",
      title: "ITSPs and wholesale carriers",
      body: "Manage multi-region Asterisk edges, enforce TLS to upstream carriers, and prove every CDR with a cryptographic audit trail.",
    },
    {
      icon: Building2,
      tag: "Enterprise IT",
      title: "Multi-site enterprise PBX",
      body: "Replace fragile cluster-of-VMs setups with a single dashboard. SSO + RBAC for every branch, signed config for every change.",
    },
    {
      icon: HardDrive,
      tag: "MSPs",
      title: "Managed service providers",
      body: "Onboard a customer PBX in under a minute. Tenant-isolated fleets, per-customer audit exports, and zero inbound exposure on customer sites.",
    },
  ];
  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Use cases</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Built for teams that can't afford a bad call.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {cases.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-surface p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background text-brand">
                  <c.icon className="size-5" strokeWidth={1.8} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{c.tag}</span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 8. Testimonials ─────────────── */

function Testimonials() {
  const quotes = [
    {
      quote:
        "We replaced three home-grown bash scripts and a wiki page with AsterOps. Onboarding a new PBX went from a half-day to under a minute.",
      name: "Mara K.",
      role: "Head of Voice Infrastructure",
      company: "Mid-market ITSP",
    },
    {
      quote:
        "The append-only audit was the unlock for us. When compliance asks who changed dial-plan v42, we have a signed answer in five seconds.",
      name: "David S.",
      role: "Director of Platform Engineering",
      company: "Contact-center SaaS",
    },
    {
      quote:
        "First control plane I've seen that takes 'no inbound ports' seriously. Our SOC team approved it without the usual six-week back-and-forth.",
      name: "Priya N.",
      role: "CISO",
      company: "Regulated FS operator",
    },
  ];
  return (
    <section className="border-b border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Testimonials</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            What operators are saying.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Quotes from design-partner engagements. Logos and full case studies on request under NDA.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <figure key={q.name} className="flex h-full flex-col rounded-2xl border border-border bg-background p-7">
              <Quote className="size-6 text-brand" />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground">
                "{q.quote}"
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4 text-sm">
                <div className="font-semibold">{q.name}</div>
                <div className="text-muted-foreground">{q.role} · {q.company}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 9. Deployment Models ─────────────── */

function DeploymentModels() {
  const models = [
    {
      icon: Cloud,
      tag: "Managed cloud",
      title: "AsterOps Cloud",
      body: "We host the control plane. You install the agent. Zero infra to run, signed by us, multi-region by default.",
      points: ["EU, US, APAC regions", "99.9% SLA", "SSO + SCIM included"],
    },
    {
      icon: Building2,
      tag: "Self-hosted",
      title: "Self-hosted on-prem",
      body: "Run the control plane inside your VPC or data center. MIT-licensed core. You own the keys and the ledger.",
      points: ["Helm chart + Docker Compose", "Air-gap supported", "BYO database & object store"],
    },
    {
      icon: HardDrive,
      tag: "Hybrid",
      title: "Hybrid / dedicated",
      body: "Managed dashboard with a dedicated tenant. Ledger and CDR storage stay in your account for residency and audit.",
      points: ["Bring-your-own bucket", "Customer-managed KMS", "Per-region data pinning"],
    },
  ];
  return (
    <section id="deployment" className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Deployment</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Deploy it however your security team likes it.
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {models.map((m) => (
            <div key={m.title} className="flex h-full flex-col rounded-2xl border border-border bg-surface p-7">
              <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background text-brand">
                <m.icon className="size-5" strokeWidth={1.8} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{m.tag}</span>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">{m.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{m.body}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {m.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-status-ok" />
                    <span className="text-muted-foreground">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 10. FAQ ─────────────── */

function FAQSection() {
  const items = [
    {
      q: "Which Asterisk versions are supported?",
      a: "Asterisk 18 LTS, 20 LTS, and 21 on Linux (Debian, Ubuntu, RHEL, Rocky, Alma). chan_pjsip only — we do not provision chan_sip.",
    },
    {
      q: "Does the agent need inbound ports?",
      a: "No. The agent opens a single outbound HTTPS (TLS 1.3) connection to the control plane. Nothing inbound is required, and the agent works behind NAT and strict egress firewalls.",
    },
    {
      q: "Where do CDRs and audit logs live?",
      a: "On AsterOps Cloud, CDRs and audit events live in a hash-chained append-only ledger in your chosen region. Self-hosted and hybrid customers can pin the ledger to their own S3-compatible bucket and KMS.",
    },
    {
      q: "What happens if the control plane is unreachable?",
      a: "Calls keep flowing. The agent caches the last signed config and continues to record CDRs locally. When connectivity returns, events are replayed into the ledger in order.",
    },
    {
      q: "Is the code open source?",
      a: "The agent and the control-plane core are MIT licensed. Enterprise add-ons (SSO/SCIM, multi-region ledger replication, premium support) are commercial.",
    },
    {
      q: "How do you handle secrets and private keys?",
      a: "Private keys never leave the PBX host. The control plane stores fingerprints and signed manifests only. Customer-managed KMS is supported on hybrid and self-hosted deployments.",
    },
  ];
  return (
    <section id="faq" className="border-b border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">FAQ</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Questions operators ask us first.
          </h2>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {items.map((it, i) => (
            <FAQItem key={i} q={it.q} a={it.a} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-surface"
        aria-expanded={open}
      >
        <span className="font-display text-base font-semibold tracking-tight">{q}</span>
        <ChevronDown
          className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">{a}</div>
      )}
    </div>
  );
}

/* ─────────────── 11. Demo CTA ─────────────── */

function DemoCTA() {
  return (
    <section id="demo" className="relative overflow-hidden bg-background py-24 md:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_hsl(var(--brand)/0.10),_transparent_60%)]" />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 flex justify-center">
          <Brand size="xl" />
        </div>
        <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          See AsterOps run your fleet in 20 minutes.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          We'll walk through your current Asterisk setup, install the agent on one PBX live, and show you the dashboard, ledger, and rollback flow end-to-end.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href="mailto:demo@asterops.io?subject=AsterOps%20demo">
            <Button size="lg" className="px-10 text-base">
              Book a demo <ArrowRight className="ml-2 size-4" />
            </Button>
          </a>
          <a href="#product">
            <Button size="lg" variant="outline" className="px-8 text-base">
              <PlayCircle className="mr-2 size-4" /> Watch the 90-sec tour
            </Button>
          </a>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          Or email <a href="mailto:hello@asterops.io" className="underline-offset-4 hover:underline">hello@asterops.io</a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Setup / How to install ─────────────── */

function SetupSection() {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "1. Install the agent",
      desc: "One-line install on any Debian/Ubuntu/RHEL host running Asterisk.",
      code: "pip install asterops-agent",
    },
    {
      title: "2. Apply the baseline",
      desc: "TLS-only, SRTP-required, fail2ban, firewall, AMI lockdown — all idempotent.",
      code: "sudo asterops run --profile baseline --dry-run\nsudo asterops run --profile baseline",
    },
    {
      title: "3. Auto-configure your PBX",
      desc: "Render pjsip.conf / extensions.conf / rtp.conf from a single YAML.",
      code: "sudo asterops provision inventory.yaml\nsudo asterisk -rx 'pjsip reload'",
    },
    {
      title: "4. Upload posture reports",
      desc: "Push HTML + JSON security reports into your AsterOps dashboard.",
      code: "export ASTEROPS_URL=https://your-control-plane/functions/v1\nexport ASTEROPS_AGENT_TOKEN=...\nasterops report --profile baseline",
    },
  ];
  return (
    <section id="setup" className="relative border-y border-border bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Setup</div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            From zero to hardened PBX in four commands.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Open source. Python. Apache-2.0. Runs on the box you already have.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-1">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`block w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  i === step
                    ? "border-brand bg-brand-soft text-foreground"
                    : "border-border bg-background hover:bg-surface-2"
                }`}
              >
                <div className="font-medium">{s.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
              </button>
            ))}
          </aside>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="size-2.5 rounded-full bg-status-err/70" />
                <span className="size-2.5 rounded-full bg-status-warn/70" />
                <span className="size-2.5 rounded-full bg-status-ok/70" />
                <span className="ml-3">root@pbx-01 ~ #</span>
              </div>
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigator.clipboard.writeText(steps[step].code)}
              >
                Copy
              </button>
            </div>
            <pre className="px-6 py-6 text-sm font-mono leading-relaxed text-foreground whitespace-pre-wrap break-words">{steps[step].code}</pre>
            <div className="border-t border-border bg-surface-2 px-6 py-4 text-xs text-muted-foreground">
              Full docs &amp; profiles on GitHub →{" "}
              <a className="text-brand hover:underline" href="https://github.com/asterops/asterops" target="_blank" rel="noreferrer">
                github.com/asterops/asterops
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Index;