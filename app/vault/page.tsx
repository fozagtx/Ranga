"use client";

import Link from "next/link";
import { ArrowRight, Cpu, Database, Fingerprint, ShieldCheck } from "lucide-react";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { publicEnv } from "@/lib/env/public";
import { truncateMiddle } from "@/lib/utils";

export default function VaultOverviewPage() {
  const { address } = useAccount();
  const contractAddress = publicEnv.agentIdContractAddress;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="brand-display text-[clamp(3.25rem,5.8vw,5.9rem)]">Agent passport</h1>
          {address ? (
            <p className="mt-3 text-sm font-bold text-black/55">
              Connected wallet: <span className="font-mono">{truncateMiddle(address, 8)}</span>
            </p>
          ) : null}
        </div>
        <Badge tone="good">live wallet session</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionPanel
          icon={<Fingerprint size={18} />}
          title="Own the passport"
          body="Mint the on-chain Agentic ID that carries your companion's private continuity across apps and providers."
          href="/vault/identity"
        />
        <ActionPanel
          icon={<Database size={18} />}
          title="Seal memory capsules"
          body="Turn private context into encrypted capsules, upload them with your wallet, and anchor the storage root."
          href="/vault/memory"
        />
        <ActionPanel
          icon={<Cpu size={18} />}
          title="Recall through compute"
          body="Choose a live 0G Direct provider, fund it from your wallet, and use selected memory as private context."
          href="/vault/compute"
        />
        <Panel className="glass-panel">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck size={18} className="text-primary" />
            Contract
          </div>
          <div className="mt-3 break-all font-mono text-xs text-muted-foreground">
            {contractAddress || "Contract configuration required"}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ActionPanel({
  icon,
  title,
  body,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Panel className="white-card">
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
      <Button asChild className="mt-4 pr-2" variant="outline">
        <Link href={href}>
          Open
          <span className="yellow-dot h-8 w-8">
            <ArrowRight aria-hidden="true" size={16} />
          </span>
        </Link>
      </Button>
    </Panel>
  );
}
