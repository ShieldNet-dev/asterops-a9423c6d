import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "light" | "dark";

function getInitial(): Mode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("asterops-theme") as Mode | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(mode: Mode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    const m = getInitial();
    setMode(m);
    apply(m);
  }, []);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    apply(next);
    window.localStorage.setItem("asterops-theme", next);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={className}
    >
      {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}