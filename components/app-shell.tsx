"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Database, Fingerprint, LayoutDashboard } from "lucide-react";
import { useChainId } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { ConnectWallet } from "@/components/connect-wallet";
import { cn } from "@/lib/utils";
import { ogChain } from "@/lib/og-chain";
import { BrandLogo, SegmentedPill, SkyStage } from "@/components/brand-surface";

const navItems = [
  { href: "/vault", label: "Overview", icon: LayoutDashboard },
  { href: "/vault/identity", label: "Identity", icon: Fingerprint },
  { href: "/vault/memory", label: "Memory", icon: Database },
  { href: "/vault/compute", label: "Compute", icon: BrainCircuit },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chainId = useChainId();

  return (
    <SkyStage>
      <div className="sky-content min-h-screen px-5 py-5 sm:px-9 sm:py-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/vault" aria-label="OGPass dashboard">
            <BrandLogo compact />
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <SegmentedPill left="Private" right="Owned" />
            <Badge tone={chainId === ogChain.id ? "good" : "warn"}>{chainId === ogChain.id ? ogChain.name : "chain mismatch"}</Badge>
            <ConnectWallet />
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 py-8 lg:grid-cols-[230px_1fr]">
          <nav aria-label="Vault sections" className="white-card h-fit rounded-[2rem] p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  active && "bg-black text-white hover:bg-black hover:text-white",
                )}
              >
                <Icon aria-hidden="true" size={16} />
                {item.label}
              </Link>
            );
          })}
          </nav>
          <main className="min-w-0 pb-28">{children}</main>
        </div>
      </div>
    </SkyStage>
  );
}
