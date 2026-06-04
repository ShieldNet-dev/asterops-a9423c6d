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

({
  head: () => ({
    meta: [
      { title: "AsterOps — Hardened Control Plane for Asterisk" },
      {
        name: "description",
        content:
          "Open-source control plane for Asterisk PBX fleets. Secure provisioning, enforced encryption, and immutable audit logs — built for operators who run production VoIP.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Brand size="md" />
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#flow" className="transition-colors hover:text-foreground">Call Flow</a>
            <a href="#capabilities" className="transition-colors hover:text-foreground">Capabilities</a>
            <a href="#security" className="transition-colors hover:text-foreground">Security</a>
            <a href="#install" className="transition-colors hover:text-foreground">Deploy</a>
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
            <Link to="/signup"><Button size="sm">Launch Dashboard</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO — calmer, more breathing room */}
      <section className="border-b border-border bg-background pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid max-w-5xl gap-16 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div className="flex flex-col justify-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground">
                <Radio className="size-3.5 text-brand" /> 
                MIT Licensed • Asterisk 18/20/21
              </div>

              <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tighter md:text-6xl lg:text-7xl">
                Run a hardened VoIP fleet<br />without touching a config file.
              </h1>

              <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
                AsterOps is the open-source control plane for serious Asterisk deployments. 
                Secure provisioning, default encryption, and real-time immutable audit logs — 
                built by engineers who debug SIP at 3 AM.
              </p>

              <div className="mt-12 flex flex-wrap items-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="text-base px-8">
                    Launch Dashboard <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <a href="#install">
                  <Button size="lg" variant="ghost" className="text-base px-6">
                    Install the agent
                  </Button>
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-status-ok" /> No inbound ports
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-status-ok" /> TLS 1.3 + SRTP by default
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-status-ok" /> Append-only audit
                </span>
              </div>
            </div>

            <div className="relative">
              <CallPanelMock />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR — subtle technical signals */}
      <section className="border-b border-border bg-surface py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs uppercase tracking-[0.08em] text-muted-foreground md:justify-between">
            <div>Built for production Asterisk</div>
            <div className="hidden md:block">•</div>
            <div>Outbound-only agent (HTTPS)</div>
            <div className="hidden md:block">•</div>
            <div>TLS 1.3 + SRTP enforced</div>
            <div className="hidden md:block">•</div>
            <div>Append-only CDR ledger</div>
            <div className="hidden md:block">•</div>
            <div>MIT Licensed • Self-host friendly</div>
          </div>
        </div>
      </section>

      {/* CALL FLOW — Architecture first */}
      <section id="flow" className="border-b border-border py-24 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Architecture</span>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              Every leg encrypted.<br />Every hop logged.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              AsterOps gives you deterministic, secure control over your entire VoIP fleet from a single pane.
            </p>
          </div>

          <CallFlowDiagram />

          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                Live channels • pbx-fra-01
              </h3>
              <span className="font-mono text-xs text-muted-foreground">47 / 120 active</span>
            </div>
            <ChannelTiles />
          </div>
        </div>
      </section>

      {/* CAPABILITIES — Outcome focused */}
      <section id="capabilities" className="border-b border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Capabilities</span>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              Operational confidence for VoIP fleets
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-background p-8 transition-all hover:border-brand/40 group"
              >
                <div className="mb-6 inline-flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-brand group-hover:border-brand/60">
                  <c.icon className="size-5" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="border-b border-border py-24 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Hardened by default</span>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">
                Security that survives real SIP attacks
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                No exposed management surface. No trust in the PBX itself. Just clean, auditable, encrypted operations.
              </p>
            </div>

            <div className="lg:col-span-3 grid gap-6">
              {[
                ["No inbound ports", "Agent dials out over HTTPS only. Survives strict firewalls and NAT."],
                ["Encrypt everything", "TLS 1.3 signaling + SRTP media enforced on every endpoint."],
                ["Tamper-proof audit", "Append-only ledger. Call records cannot be altered or deleted."],
                ["Zero-trust config", "Private keys never leave the host. Control plane holds only fingerprints."],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-6 rounded-2xl border border-border bg-surface p-6">
                  <div className="mt-1">
                    <ShieldCheck className="size-6 text-brand" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{title}</div>
                    <p className="mt-2 text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / DEPLOY */}
      <section id="install" className="border-b border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">One-command deployment</span>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">
                From zero to secured PBX in under 60 seconds
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Register the host in the dashboard, run the installer, and the agent does the rest — outbound only.
              </p>

              <ul className="mt-10 space-y-6">
                {[
                  "Atomic config apply with automatic rollback",
                  "Real-time CDR streaming begins immediately",
                  "Fail2ban rules, iptables baseline, and AMI lockdown included",
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <CheckCircle2 className="size-5 text-status-ok" />
                    </div>
                    <span className="text-[15px] text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-xl">
              <TerminalInstall />
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 bg-background">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight">
            Bring order and security to your Asterisk fleet
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Open source. No vendor lock-in. Built for operators who value reliability over hype.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="px-10 text-base">Launch Dashboard</Button>
            </Link>
            <a href="https://github.com" target="_blank">
              <Button size="lg" variant="outline" className="px-8 text-base">
                <Github className="mr-2 size-4" /> View on GitHub
              </Button>
            </a>
          </div>

          <div className="mt-8 text-xs text-muted-foreground">
            Self-host • Fork • Contribute • Run your own control plane
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 bg-surface">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Brand size="sm" />
            <span>AsterOps — Open control plane for Asterisk</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <a href="#" className="hover:text-foreground transition-colors">MIT License</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────── Existing visual components (unchanged or lightly improved) ────────────────────── */

function CallFlowDiagram() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface p-8 md:p-12">
      <svg viewBox="0 0 920 320" className="w-full text-foreground" role="img" aria-label="AsterOps call flow">
        {/* Control plane */}
        <FlowNode x={390} y={28} w={160} h={56} label="AsterOps" sub="Control Plane • Outbound HTTPS" highlight />
        
        <line x1="470" y1="84" x2="470" y2="165" className="stroke-border" strokeWidth="2" strokeDasharray="4 3" />

        {/* Nodes */}
        <FlowNode x={60} y={165} w={165} h={95} label="SIP Carrier" sub="TLS 1.3 • SRTP" iconKind="cloud" />
        <FlowNode x={390} y={165} w={150} h={95} label="Asterisk PBX" sub="chan_pjsip" iconKind="server" highlight />
        <FlowNode x={720} y={165} w={165} h={95} label="SIP Endpoint" sub="2001 • Sales" iconKind="phone" />

        {/* Paths */}
        <FlowPath d="M225,200 C 310,200 340,200 390,200" labelTop="SIP/TLS 5061" labelBot="SRTP" />
        <FlowPath d="M540,200 C 630,200 660,200 720,200" labelTop="SIP/TLS 5061" labelBot="SRTP" />

        <g transform="translate(355, 275)">
          <rect width="210" height="34" rx="8" className="fill-background stroke-border" strokeWidth="1.5" />
          <text x="105" y="22" textAnchor="middle" className="fill-current text-[11px] font-mono tracking-wide">
            CDR → Append-only Ledger
          </text>
        </g>
      </svg>
    </div>
  );
}

function FlowNode({
  x, y, w, h, label, sub, iconKind, highlight,
}: {
  x: number; y: number; w: number; h: number;
  label: string; sub?: string;
  iconKind?: "cloud" | "server" | "phone";
  highlight?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={w}
        height={h}
        rx={12}
        className={
          highlight
            ? "fill-brand/10 stroke-brand"
            : "fill-background stroke-border"
        }
        strokeWidth={1.5}
      />
      <text
        x={w / 2}
        y={h / 2 - (sub ? 6 : -4)}
        textAnchor="middle"
        className={`fill-current text-[13px] font-semibold ${highlight ? "text-brand" : ""}`}
      >
        {label}
      </text>
      {sub && (
        <text
          x={w / 2}
          y={h / 2 + 14}
          textAnchor="middle"
          className="fill-current text-[10px] font-mono opacity-60"
        >
          {sub}
        </text>
      )}
      {iconKind && (
        <circle cx={16} cy={16} r={4} className="fill-brand" />
      )}
    </g>
  );
}

function FlowPath({
  d, labelTop, labelBot,
}: { d: string; labelTop?: string; labelBot?: string }) {
  return (
    <g>
      <path d={d} className="stroke-brand" strokeWidth={2} fill="none" />
      {labelTop && (
        <text className="fill-current text-[10px] font-mono opacity-70">
          <textPath href="#none" startOffset="50%" textAnchor="middle">
            {labelTop}
          </textPath>
        </text>
      )}
      {/* Simple absolute labels above/below the midpoint of the path */}
      {labelTop && (
        <text
          x={(parseFloat(d.split(",")[0].replace(/[^\d.-]/g, "")) +
            parseFloat(d.split(" ").pop()!.split(",")[0])) / 2}
          y={188}
          textAnchor="middle"
          className="fill-current text-[10px] font-mono opacity-70"
        >
          {labelTop}
        </text>
      )}
      {labelBot && (
        <text
          x={(parseFloat(d.split(",")[0].replace(/[^\d.-]/g, "")) +
            parseFloat(d.split(" ").pop()!.split(",")[0])) / 2}
          y={218}
          textAnchor="middle"
          className="fill-current text-[10px] font-mono opacity-50"
        >
          {labelBot}
        </text>
      )}
    </g>
  );
}

function ChannelTiles() {
  const channels = [
    { ext: "2001", state: "In call", dur: "02:14", ok: true },
    { ext: "2002", state: "Ringing", dur: "00:03", ok: true },
    { ext: "2003", state: "Idle", dur: "—", ok: true },
    { ext: "2004", state: "In call", dur: "11:48", ok: true },
    { ext: "2005", state: "Registered", dur: "—", ok: true },
    { ext: "2006", state: "In call", dur: "00:47", ok: true },
    { ext: "2007", state: "Idle", dur: "—", ok: true },
    { ext: "2008", state: "In call", dur: "05:21", ok: true },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {channels.map((c) => (
        <div
          key={c.ext}
          className="rounded-xl border border-border bg-background p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold">{c.ext}</span>
            <span className="size-2 rounded-full bg-status-ok" />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{c.state}</div>
          <div className="mt-1 font-mono text-xs text-foreground/80">{c.dur}</div>
        </div>
      ))}
    </div>
  );
}

function CallPanelMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-status-ok animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            pbx-fra-01 • live
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          v47 • TLS 1.3
        </span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Active channels
            </div>
            <div className="font-display text-4xl font-semibold">12</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Encrypted
            </div>
            <div className="font-display text-4xl font-semibold text-brand">
              100%
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono">2001 → +1-415-555-0142</span>
            <span className="font-mono text-status-ok">SRTP</span>
          </div>
          <div className="mt-2 h-8 flex items-end gap-0.5">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-brand/70"
                style={{
                  height: `${20 + Math.abs(Math.sin(i * 0.6)) * 80}%`,
                  opacity: 0.4 + Math.abs(Math.sin(i * 0.9)) * 0.6,
                }}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="font-mono text-lg font-semibold">38ms</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Latency
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="font-mono text-lg font-semibold">4.3</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              MOS
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="font-mono text-lg font-semibold">0.0%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Loss
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const capabilities = [
  { 
    icon: Server, 
    title: "Deterministic Provisioning", 
    desc: "Form-driven PJSIP generation. Always-consistent config with visual diff before deployment." 
  },
  { 
    icon: Lock, 
    title: "Encryption by Default", 
    desc: "TLS 1.3 signaling and SRTP media enforced on every endpoint. No plaintext fallback." 
  },
  { 
    icon: ShieldCheck, 
    title: "Zero Trust Surface", 
    desc: "No inbound management ports. Agent-initiated outbound connections only." 
  },
  { 
    icon: ScrollText, 
    title: "Immutable Audit Trail", 
    desc: "Real-time tamper-proof CDR streaming into an append-only ledger." 
  },
  { 
    icon: GitBranch, 
    title: "Versioned & Rollback", 
    desc: "Every change is versioned. One-click rollback to any previous working state." 
  },
  { 
    icon: Activity, 
    title: "Fleet Observability", 
    desc: "Live channel status, certificate expiry, registration health, and webhook alerts." 
  },
];

function TerminalInstall() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/70" />
            <div className="size-3 rounded-full bg-yellow-500/70" />
            <div className="size-3 rounded-full bg-green-500/70" />
          </div>
          root@pbx-fra-01:~# ./install-asterops.sh
        </div>
      </div>
      <pre className="overflow-auto p-8 font-mono text-sm leading-relaxed text-foreground bg-[#0a0a0a]">
        <span className="text-muted-foreground"># One-time enrollment</span><br />
        curl -sSf https://asterops.dev/install.sh | sudo bash -s -- \<br />
          --token ao_9xK7mP2vL8qR4tY6uI9oP2wQ<br />
          --url https://dash.yourcompany.com<br /><br />
        <span className="text-status-ok">✓ Agent enrolled successfully</span><br />
        <span className="text-status-ok">✓ Pulled PJSIP config v47</span><br />
        <span className="text-status-ok">✓ Asterisk reload complete</span><br />
        <span className="text-status-ok">✓ Streaming 12 active channels...</span>
      </pre>
    </div>
  );
}