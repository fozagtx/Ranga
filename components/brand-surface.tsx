import { cn } from "@/lib/utils";

export function SkyStage({
  children,
  className,
  frameClassName,
}: {
  children: React.ReactNode;
  className?: string;
  frameClassName?: string;
}) {
  return (
    <main className={cn("sky-stage", className)}>
      <div className={cn("sky-frame", frameClassName)}>{children}</div>
    </main>
  );
}

export function BrandMark() {
  return (
    <span aria-hidden="true" className="brand-mark">
      <span />
    </span>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-pill px-5 py-3">
      <BrandMark />
      <span className={compact ? "text-lg font-black" : "brand-wordmark"}>OGPass</span>
    </div>
  );
}

export function SegmentedPill({
  left,
  right,
  active = "right",
}: {
  left: string;
  right: string;
  active?: "left" | "right";
}) {
  return (
    <div className="brand-pill p-1 text-sm font-bold">
      <span className={cn("rounded-full px-5 py-2", active === "left" && "bg-black text-white")}>{left}</span>
      <span className={cn("rounded-full px-5 py-2", active === "right" && "bg-black text-white")}>{right}</span>
    </div>
  );
}
