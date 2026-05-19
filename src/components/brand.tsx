import { cn } from "@/lib/utils";

/**
 * AsterOps wordmark. "ASTER" in Asterisk red, "OPS" in foreground.
 * No icon — the name IS the logo.
 */
export function Brand({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };
  return (
    <span
      className={cn(
        "font-sans font-bold tracking-tight select-none",
        sizes[size],
        className,
      )}
    >
      <span className="text-brand">ASTER</span>
      <span className="text-foreground">OPS</span>
    </span>
  );
}