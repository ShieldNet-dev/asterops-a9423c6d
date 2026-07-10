import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hasDemoData, resetDemoData, seedDemoData, simulateTick } from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, Pause, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";

export function useHasDemoData() {
  return useQuery({ queryKey: ["demo-present"], queryFn: hasDemoData, refetchOnWindowFocus: false });
}

/**
 * Full onboarding-style demo card — shown on the dashboard when
 * the user has no servers yet, to let them explore the product.
 */
export function DemoPanel() {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const tickRef = useRef<number | null>(null);
  const presentQ = useHasDemoData();

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
  }, []);

  const refreshAll = () => qc.invalidateQueries();

  const startSimulation = () => {
    if (tickRef.current) return;
    setSimulating(true);
    tickRef.current = window.setInterval(async () => {
      try {
        await simulateTick();
        refreshAll();
      } catch {
        /* ignore transient errors during simulation */
      }
    }, 5000);
  };
  const stopSimulation = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    setSimulating(false);
  };

  const onSeed = async () => {
    setSeeding(true);
    try {
      await seedDemoData();
      toast.success("Demo data loaded", { description: "3 servers, calls, certs, and alerts are ready." });
      refreshAll();
      presentQ.refetch();
    } catch (e: any) {
      toast.error("Could not load demo data", { description: e?.message ?? "Unknown error" });
    } finally {
      setSeeding(false);
    }
  };

  const onReset = async () => {
    stopSimulation();
    try {
      const { deleted } = await resetDemoData();
      toast.success(deleted > 0 ? `Removed ${deleted} demo server${deleted > 1 ? "s" : ""}` : "No demo data to remove");
      refreshAll();
      presentQ.refetch();
    } catch (e: any) {
      toast.error("Reset failed", { description: e?.message ?? "Unknown error" });
    }
  };

  const hasDemo = !!presentQ.data;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-dashed border-brand/40 bg-gradient-to-br from-brand/5 via-surface to-surface-2 p-6 md:p-8">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Try AsterOps without an Asterisk server</h2>
            <Badge variant="outline" className="font-mono text-[10px]">DEMO MODE</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Load a realistic sample fleet — 3 PBXs, ~120 recent calls, TLS certificates in different states,
            and a few alerts. Perfect for screenshots, presentations, or exploring every screen before you
            connect a real host. Nothing is sent outside this dashboard.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MiniStat label="Servers" value="3" hint="1 healthy · 1 warn · 1 attention" />
        <MiniStat label="Recent calls" value="~120" hint="over the last 24 hours" />
        <MiniStat label="Alerts" value="4" hint="cert expiry, brute-force, weak AMI" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {!hasDemo ? (
          <Button onClick={onSeed} disabled={seeding} size="sm">
            <Wand2 className="mr-2 size-3.5" />
            {seeding ? "Loading demo…" : "Load demo data"}
          </Button>
        ) : (
          <>
            {simulating ? (
              <Button onClick={stopSimulation} size="sm" variant="secondary">
                <Pause className="mr-2 size-3.5" /> Pause live simulation
              </Button>
            ) : (
              <Button onClick={startSimulation} size="sm">
                <Play className="mr-2 size-3.5" /> Simulate live activity
              </Button>
            )}
            <Button onClick={onReset} size="sm" variant="ghost">
              <RotateCcw className="mr-2 size-3.5" /> Reset demo data
            </Button>
            <span className="ml-1 text-xs text-muted-foreground">
              {simulating ? "New calls, heartbeats and alerts arrive every ~5s." : "Demo fleet loaded. Every page is populated."}
            </span>
          </>
        )}
      </div>
    </section>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

/**
 * Compact strip shown in the top bar / dashboard header while demo data is
 * active. Lets the user toggle live simulation or reset without scrolling.
 */
export function DemoBadge() {
  const qc = useQueryClient();
  const presentQ = useHasDemoData();
  const [simulating, setSimulating] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
  }, []);

  if (!presentQ.data) return null;

  const toggle = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
      setSimulating(false);
      return;
    }
    setSimulating(true);
    tickRef.current = window.setInterval(async () => {
      try {
        await simulateTick();
        qc.invalidateQueries();
      } catch {
        /* ignore */
      }
    }, 5000);
  };

  const reset = async () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
      setSimulating(false);
    }
    await resetDemoData();
    qc.invalidateQueries();
    presentQ.refetch();
    toast.success("Demo data removed");
  };

  return (
    <div className="hidden items-center gap-1 rounded-full border border-brand/40 bg-brand/5 px-2 py-0.5 md:inline-flex">
      <Sparkles className="size-3 text-brand" />
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-brand">Demo</span>
      <button
        type="button"
        onClick={toggle}
        className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-brand/10"
      >
        {simulating ? "Pause" : "Simulate"}
      </button>
      <button
        type="button"
        onClick={reset}
        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
      >
        Reset
      </button>
    </div>
  );
}