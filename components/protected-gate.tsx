"use client";

import { AlertCircle, Cable, LockKeyhole, RotateCcw } from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { publicEnv, publicEnvIssues } from "@/lib/env/public";
import { ogChain } from "@/lib/og-chain";
import { SkyStage } from "@/components/brand-surface";
import { RedirectDisconnectedWallet } from "@/components/wallet-route-effects";

export function ProtectedGate({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const envIssues = publicEnvIssues();

  if (!isConnected) {
    return (
      <>
        <RedirectDisconnectedWallet />
        <GatePanel
          icon={<LockKeyhole aria-hidden="true" size={18} />}
          title="Opening connect site"
          body="Wallet disconnected. Sending you to the private wallet gate."
        >
          <div className="text-sm font-semibold text-muted-foreground">Redirecting to /connect</div>
        </GatePanel>
      </>
    );
  }

  if (envIssues.length > 0) {
    return (
      <GatePanel
        icon={<AlertCircle aria-hidden="true" size={18} />}
        title="Configuration blocked"
        body="Required public configuration is missing. Live wallet, contract, storage, and compute actions are disabled."
      >
        <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {envIssues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </GatePanel>
    );
  }

  if (chainId !== publicEnv.ogChainId) {
    return (
      <GatePanel
        icon={<Cable aria-hidden="true" size={18} />}
        title="Wrong chain"
        body={`Switch to ${ogChain.name} (${ogChain.id}) before using protected actions.`}
      >
        <Button type="button" onClick={() => switchChain({ chainId: ogChain.id })} disabled={isPending}>
          <RotateCcw aria-hidden="true" size={16} />
          Switch chain
        </Button>
      </GatePanel>
    );
  }

  return <>{children}</>;
}

function GatePanel({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <SkyStage>
      <div className="sky-content mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
        <Panel className="glass-panel w-full">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary">{icon}</div>
          <div>
            <h1 className="brand-display text-3xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
        {children}
        </Panel>
      </div>
    </SkyStage>
  );
}
