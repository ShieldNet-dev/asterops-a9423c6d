import { Link } from "react-router-dom";
import { useState } from "react";
import { Brand } from "@/components/brand";
import logoUrl from "@/assets/asterops-logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  Cloud,
  FileCode2,
  Github,
  GitBranch,
  HardDrive,
  Lock,
  Menu,
  Network,
  Phone,
  ScrollText,
  Server,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";

const GITHUB_URL = "https://github.com/ShieldNet-dev/AsterOps";

function Index() {
  const [showSecurity, setShowSecurity] = useState(false);

  const revealSecurity = () => {
    setShowSecurity(true);
    window.setTimeout(() => {
      document.getElementById("security-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader onSecurityClick={revealSecurity} />
      <LogoPanel />
      <Hero />
      <ProblemStatement />
      <ArchitectureDiagram />
      <SetupSection />
      <CoreFeatures />
      {showSecurity && <SecurityDetails />}
      <UseCases />
      <DeploymentModels />
      <FAQSection />
      <SiteFooter />
    </div>
  );
}

function SiteHeader({ onSecurityClick }: { onSecurityClick: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Brand size="md" />
        <div className="flex items-center gap-2">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Github className="size-4" /> GitHub
            </Button>
          </a>
          <Link to="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Button>
          </Link>
          <ThemeToggle />
          <SiteMenu onSecurityClick={onSecurityClick} />
        </div>
      </div>
    </header>
  );
}

function SiteMenu({ onSecurityClick }: { onSecurityClick: () => void }) {
  const [open, setOpen] = useState(false);
  const sections = [
    { href: "#problem", label: "Problem", icon: Activity, desc: "Why Asterisk fleets drift" },
    { href: "#architecture", label: "Architecture", icon: Network, desc: "Agent, control plane, PBX" },
    { href: "#setup", label: "Setup", icon: Terminal, desc: "Install and harden quickly" },
    { href: "#features", label: "Features", icon: ShieldCheck, desc: "Provision, audit, rollback" },
    { href: "#use-cases", label: "Use cases", icon: Building2, desc: "Teams AsterOps supports" },
    { href: "#deployment", label: "Deployment", icon: Cloud, desc: "Cloud, self-hosted, hybrid" },
    { href: "#faq", label: "FAQ", icon: BookOpen, desc: "Short answers" },
    { href: "#security-details", label: "Security", icon: Lock, desc: "Security model", action: onSecurityClick },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Menu className="size-4" /> <span className="hidden sm:inline">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="font-display text-lg font-semibold tracking-tight">Explore AsterOps</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Practical pages for operators, developers, and reviewers.
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col p-3">
          {sections.map((section) => {
            const content = (
              <>
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground group-hover:text-foreground">
                  <section.icon className="size-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{section.label}</span>
                  <span className="block text-xs text-muted-foreground">{section.desc}</span>
                </span>
              </>
            );
            const className = "group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface";

            return (
              <a
                key={section.href}
                href={section.href}
                onClick={() => {
                  section.action?.();
                  setOpen(false);
                }}
                className={className}
              >
                {content}
              </a>
            );
          })}
        </nav>
        <div className="mt-2 grid gap-2 border-t border-border px-6 py-5">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Github className="size-4" /> GitHub repository
            </Button>
          </a>
          <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full justify-start gap-2">
              <FileCode2 className="size-4" /> Documentation
            </Button>
          </a>
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button className="w-full justify-start">Open dashboard</Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LogoPanel() {
  return (
    <section className="border-b border-border bg-surface py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-center">
          <img
            src={logoUrl}
            alt="AsterOps"
            className="w-full max-w-4xl rounded-xl border border-border bg-black object-contain shadow-sm"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Apache-2.0 · Python agent · Asterisk first
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
            The control plane for production Asterisk fleets.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            AsterOps provisions, secures, and audits every PBX in your fleet from one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Try the dashboard <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="gap-2">
                <Github className="size-4" /> View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemStatement() {
  const problems = [
    ["Config drift", "Manual edits make PBX behavior hard to track."],
    ["Plain SIP", "Unencrypted signaling and media increase fraud risk."],
    ["Weak audit", "Teams need clear records for changes and calls."],
    ["Exposed admin", "AMI, SSH, and web panels should not face the internet."],
  ];

  return (
    <section id="problem" className="border-b border-border bg-surface py-16 md:py-24">
      <SectionIntro label="Problem" title="Asterisk works well. Fleet operations need structure." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-6 md:grid-cols-2 lg:grid-cols-4">
        {problems.map(([title, body]) => (
          <div key={title} className="rounded-lg border border-border bg-background p-5">
            <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArchitectureDiagram() {
  return (
    <section id="architecture" className="border-b border-border bg-background py-16 md:py-24">
      <SectionIntro
        label="Architecture"
        title="Outbound agent. Signed configs. Central audit."
        body="Each PBX runs a lightweight agent that talks out to AsterOps. No inbound management port is required."
      />
      <div className="mx-auto mt-10 max-w-7xl px-6">
        <div className="overflow-hidden rounded-lg border border-border bg-surface p-5 md:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            <ArchBox icon={Server} title="Asterisk PBX" body="PJSIP · RTP · CDR" />
            <ArchArrow />
            <ArchBox icon={Wrench} title="AsterOps agent" body="Provision · harden · report" />
            <ArchArrow />
            <ArchBox icon={ShieldCheck} title="Control plane" body="Dashboard · audit · rollback" />
          </div>
          <div className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <p className="rounded-md border border-border bg-background p-4">Outbound HTTPS only.</p>
            <p className="rounded-md border border-border bg-background p-4">TLS and SRTP profiles.</p>
            <p className="rounded-md border border-border bg-background p-4">Reports stored for review.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchBox({ icon: Icon, title, body }: { icon: typeof Server; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.8} />
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ArchArrow() {
  return <ArrowRight className="mx-auto hidden size-5 text-muted-foreground md:block" />;
}

function SetupSection() {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Install", desc: "Add the Python agent.", code: "pip install asterops-agent" },
    { title: "Harden", desc: "Apply the baseline profile.", code: "sudo asterops run --profile baseline" },
    { title: "Provision", desc: "Generate Asterisk configs.", code: "sudo asterops provision inventory.yaml" },
    { title: "Report", desc: "Send posture reports.", code: "asterops report --profile baseline" },
  ];

  return (
    <section id="setup" className="border-b border-border bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionIntro label="Setup" title="Install, harden, provision, report." body="Start with one Asterisk host. Scale the same workflow across the fleet." align="left" />
        <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {steps.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStep(index)}
                className={`block w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  step === index ? "border-foreground bg-background" : "border-border bg-background hover:bg-surface-2"
                }`}
              >
                <div className="font-medium text-foreground">{item.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.desc}</div>
              </button>
            ))}
          </aside>
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="border-b border-border bg-surface-2 px-4 py-3 font-mono text-xs text-muted-foreground">
              root@pbx-01
            </div>
            <pre className="px-5 py-6 font-mono text-sm leading-7 text-foreground whitespace-pre-wrap break-words">
              {steps[step].code}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreFeatures() {
  const features = [
    [Server, "Provisioning", "Render pjsip.conf, extensions.conf, and rtp.conf from one inventory."],
    [Lock, "TLS / SRTP", "Apply secure defaults without hand-editing every PBX."],
    [ScrollText, "Reports", "Generate HTML and JSON security reports for review."],
    [GitBranch, "Rollback", "Track config versions and return to the last good state."],
    [Activity, "Monitoring", "Watch registrations, calls, certificates, and agent health."],
    [ShieldCheck, "Access control", "Keep operator actions tied to users and audit events."],
  ] as const;

  return (
    <section id="features" className="border-b border-border bg-background py-16 md:py-24">
      <SectionIntro label="Features" title="The core tools operators need." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(([Icon, title, body]) => (
          <div key={title} className="rounded-lg border border-border bg-surface p-5">
            <Icon className="size-5 text-muted-foreground" strokeWidth={1.8} />
            <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecurityDetails() {
  const items = [
    [Lock, "No inbound admin ports", "Agents connect out over HTTPS."],
    [ShieldCheck, "Encrypted media", "Use TLS and SRTP profiles for SIP traffic."],
    [ScrollText, "Audit trail", "Track user actions, config changes, and reports."],
  ] as const;

  return (
    <section id="security-details" className="border-b border-border bg-surface py-16 md:py-24">
      <SectionIntro label="Security" title="Security model." body="This section is shown from the menu so the main page stays focused." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-6 md:grid-cols-3">
        {items.map(([Icon, title, body]) => (
          <div key={title} className="rounded-lg border border-border bg-background p-5">
            <Icon className="size-5 text-muted-foreground" strokeWidth={1.8} />
            <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    [Phone, "Contact centers", "Keep PBX changes controlled across busy call environments."],
    [Cloud, "ITSPs", "Manage regional Asterisk edges with consistent policy."],
    [Building2, "Enterprise IT", "Standardize branch PBX operations from one place."],
    [HardDrive, "MSPs", "Support customer PBX systems without opening admin ports."],
  ] as const;

  return (
    <section id="use-cases" className="border-b border-border bg-surface py-16 md:py-24">
      <SectionIntro label="Use cases" title="Built for practical VoIP operations." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-6 md:grid-cols-2 lg:grid-cols-4">
        {cases.map(([Icon, title, body]) => (
          <div key={title} className="rounded-lg border border-border bg-background p-5">
            <Icon className="size-5 text-muted-foreground" strokeWidth={1.8} />
            <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeploymentModels() {
  const models = [
    [Cloud, "Managed", "Use the hosted dashboard and install the agent."],
    [HardDrive, "Self-hosted", "Run the control plane inside your own environment."],
    [Building2, "Hybrid", "Use managed access with customer-owned storage where needed."],
  ] as const;

  return (
    <section id="deployment" className="border-b border-border bg-background py-16 md:py-24">
      <SectionIntro label="Deployment" title="Choose the model that fits your environment." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-6 md:grid-cols-3">
        {models.map(([Icon, title, body]) => (
          <div key={title} className="rounded-lg border border-border bg-surface p-5">
            <Icon className="size-5 text-muted-foreground" strokeWidth={1.8} />
            <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  const items = [
    ["Which Asterisk versions are supported?", "Asterisk 18, 20, and 22 with chan_pjsip."],
    ["Does the agent need inbound access?", "No. The agent connects out over HTTPS."],
    ["Can it generate Asterisk configs?", "Yes. It renders PJSIP, extensions, and RTP config from inventory data."],
    ["Is it open source?", "Yes. The project is built around an open-source Asterisk-first agent and dashboard."],
    ["Can it support other VoIP systems later?", "Yes. The platform layer is designed to add more VoIP backends over time."],
  ];

  return (
    <section id="faq" className="border-b border-border bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <SectionIntro label="FAQ" title="Short answers." />
        <div className="mt-10 divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
          {items.map(([question, answer], index) => (
            <FAQItem key={question} question={question} answer={answer} defaultOpen={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left transition-colors hover:bg-surface"
        aria-expanded={open}
      >
        <span className="font-display text-base font-semibold tracking-tight">{question}</span>
        <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm leading-6 text-muted-foreground">{answer}</div>}
    </div>
  );
}

function SectionIntro({
  label,
  title,
  body,
  align = "center",
}: {
  label: string;
  title: string;
  body?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`mx-auto max-w-3xl px-6 ${align === "center" ? "text-center" : "mx-0 text-left"}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-base leading-7 text-muted-foreground">{body}</p>}
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-3">
          <Brand size="sm" />
          <span>Open-source control plane for Asterisk fleets</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Github className="size-3.5" /> GitHub
          </a>
          <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
            Docs
          </a>
          <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
            License
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Index;