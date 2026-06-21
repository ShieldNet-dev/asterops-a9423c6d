import { cn } from "@/lib/utils";
import logoUrl from "@/assets/asterops-logo.png";

/**
 * AsterOps brand. Uses the official logo lockup (orange compass mark + wordmark)
 * on a black chip so it reads correctly in both light and dark themes.
 */
export function Brand({
  className,
  size = "md",
  variant = "chip",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** "chip" = logo on black pill (safe anywhere). "bare" = raw logo on its own (use on dark surfaces). */
  variant?: "chip" | "bare";
}) {
  const heights = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-14",
  } as const;
  const img = (
    <img
      src={logoUrl}
      alt="AsterOps"
      className={cn(heights[size], "w-auto select-none")}
      draggable={false}
    />
  );
  if (variant === "bare") {
    return <span className={cn("inline-flex items-center", className)}>{img}</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg bg-black px-2.5 py-1.5",
        className,
      )}
    >
      {img}
    </span>
  );
}