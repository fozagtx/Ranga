"use client";

import Link from "next/link";
import { ArrowLeft, Cable, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandLogo, SegmentedPill, SkyStage } from "@/components/brand-surface";
import { ConnectWallet } from "@/components/connect-wallet";
import { EnvStatus } from "@/components/env-status";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env/public";
import { RedirectConnectedWallet } from "@/components/wallet-route-effects";

export default function ConnectPage() {
  const chainValue = publicEnv.ogNetwork && publicEnv.ogChainId ? `${publicEnv.ogNetwork} / ${publicEnv.ogChainId}` : "Chain configuration required";
  const contractValue = publicEnv.agentIdContractAddress || "Contract configuration required";

  return (
    <SkyStage>
      <RedirectConnectedWallet />
      <div className="sky-content flex min-h-screen flex-col px-5 py-5 sm:px-9 sm:py-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" aria-label="Back to landing">
            <BrandLogo />
          </Link>
          <SegmentedPill left="Visitor" right="Wallet" />
        </header>

        <section className="mx-auto grid flex-1 w-full max-w-6xl items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="ambient-rise white-card rounded-[2.5rem] p-7">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white">
              <LockKeyhole aria-hidden="true" size={26} />
            </div>
            <h1 className="brand-display text-[clamp(3.6rem,7vw,7rem)]">Connect to open your vault</h1>
            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-black/60">
              Wallet connection is the front door. Private memory, uploads, compute, and Agentic ID writes remain locked
              until your wallet and 0G chain are live.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ConnectWallet />
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft aria-hidden="true" size={16} />
                  Landing
                </Link>
              </Button>
            </div>
          </div>

          <div className="ambient-rise space-y-5">
            <div className="glass-panel rounded-[2.25rem] p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-black">Access requirements</h2>
                <EnvStatus />
              </div>
              <ConnectRequirement icon={<Cable size={18} />} title="0G chain" value={chainValue} />
              <ConnectRequirement icon={<ShieldCheck size={18} />} title="Agent contract" value={contractValue} />
              <ConnectRequirement icon={<LockKeyhole size={18} />} title="Wallet signature" value="Storage and compute actions are signed by the connected wallet" />
            </div>
            <div className="white-card rounded-[2rem] p-6">
              <div className="flower-motif mr-4" />
              <p className="mt-4 text-2xl font-black leading-tight">
                Disconnecting from the app sends protected routes back here, keeping the dashboard out of view.
              </p>
            </div>
          </div>
        </section>
      </div>
    </SkyStage>
  );
}

function ConnectRequirement({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-black/10 py-4 last:border-b-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-black">{title}</div>
        <div className="break-all text-sm text-black/52">{value}</div>
      </div>
    </div>
  );
}
