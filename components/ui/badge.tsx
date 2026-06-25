import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
  className?: string;
}) {
  const tones = {
    neutral: "border-border bg-white text-muted-foreground",
    good: "border-emerald-700/20 bg-emerald-50 text-emerald-800",
    warn: "border-amber-700/20 bg-amber-50 text-amber-900",
    bad: "border-red-700/20 bg-red-50 text-red-800",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}
