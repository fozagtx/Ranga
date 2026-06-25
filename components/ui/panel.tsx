import { cn } from "@/lib/utils";

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-[2rem] border border-border bg-card/90 p-5 shadow-sm", className)}>{children}</section>;
}
