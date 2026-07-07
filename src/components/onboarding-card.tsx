import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Rocket, ArrowRight, Server, KeyRound, Terminal } from "lucide-react";
import { toast } from "sonner";

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-background">
      <pre className="overflow-x-auto px-4 py-3 pr-12 font-mono text-[12px] leading-relaxed text-foreground">{text}</pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground"
        aria-label="Copy"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

export function OnboardingCard() {
  const origin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : "https://your-asterops.app"),
    [],
  );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Rocket className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Get started — enroll your first Asterisk server</h2>
          <p className="text-sm text-muted-foreground">
            Three short steps. Once your PBX checks in, the dashboard fills with live data automatically.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto hidden font-mono text-[10px] md:inline-flex">
          FIRST-RUN GUIDE
        </Badge>
      </div>

      <ol className="grid gap-5 md:grid-cols-3">
        <Step
          n={1}
          icon={Server}
          title="Register the server"
          body="Give your PBX a name in AsterOps. We'll generate a one-time enrollment token you'll paste on the host."
          action={
            <Link to="/servers">
              <Button size="sm">Register server <ArrowRight className="ml-1 size-3" /></Button>
            </Link>
          }
        />
        <Step
          n={2}
          icon={Terminal}
          title="Install the agent on your PBX"
          body="Run this once on the Asterisk host as root."
          extra={<CopyBlock text={"pip install --upgrade asterops-agent"} />}
        />
        <Step
          n={3}
          icon={KeyRound}
          title="Connect it to this dashboard"
          body="Paste the token from step 1 and this control-plane URL."
          extra={
            <CopyBlock
              text={`export ASTEROPS_URL="${origin}"
export ASTEROPS_AGENT_TOKEN="paste-your-token"
sudo -E asterops run --profile baseline
sudo -E asterops report`}
            />
          }
        />
      </ol>

      <p className="mt-6 text-xs text-muted-foreground">
        Tip: use the <span className="font-mono">baseline</span> profile for a standard PBX,{" "}
        <span className="font-mono">contact-center</span> for heavy call load, or{" "}
        <span className="font-mono">msp-multitenant</span> for shared hosting.
      </p>
    </section>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
  extra,
  action,
}: {
  n: number;
  icon: typeof Server;
  title: string;
  body: string;
  extra?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand/10 font-mono text-[11px] font-semibold text-brand">
          {n}
        </span>
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{body}</p>
      {extra}
      {action}
    </li>
  );
}