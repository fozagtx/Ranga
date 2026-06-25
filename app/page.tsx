"use client";

import Link from "next/link";
import { ArrowUpRight, Cpu, Database, Fingerprint, ShieldCheck } from "lucide-react";
import { BrandLogo, SegmentedPill, SkyStage } from "@/components/brand-surface";
import { ConnectWallet } from "@/components/connect-wallet";
import { EnvStatus } from "@/components/env-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env/public";
import { truncateMiddle } from "@/lib/utils";
import { RedirectConnectedWallet } from "@/components/wallet-route-effects";

export default function HomePage() {
  return (
    <SkyStage>
      <RedirectConnectedWallet />
      <div className="sky-content flex min-h-screen flex-col px-5 py-5 sm:px-9 sm:py-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <BrandLogo />
          <nav className="hidden gap-9 text-base font-bold lg:flex">
            <a href="#memory" className="hover:opacity-60">
              Passport
            </a>
            <a href="#identity" className="hover:opacity-60">
              Ownership
            </a>
            <a href="#compute" className="hover:opacity-60">
              Recall
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <SegmentedPill left="Private" right="Owned" />
            <ConnectWallet />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 xl:grid-cols-[0.78fr_1.24fr_0.88fr]">
          <div className="ambient-rise order-2 max-w-sm space-y-6 xl:order-1">
            <FeatureCard />
            <ReadinessCard />
          </div>

          <div className="ambient-rise order-1 mx-auto max-w-3xl text-center xl:order-2">
            <Badge tone="neutral" className="mb-8 bg-white/80">
              Portable private agent passport
            </Badge>
            <h1 className="brand-display text-[clamp(3.45rem,6.7vw,7.7rem)]">
              Give your AI memory
              <br />
              it can actually own.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base font-bold leading-7 text-black/58">
              OGPass turns your wallet into the control point for an AI companion: an Agentic ID on 0G Chain,
              encrypted memory capsules on 0G Storage, and wallet-signed 0G Compute recall.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <Button asChild className="group h-14 pl-7 pr-2 text-base">
                <Link href="/connect">
                  Create passport
                  <span className="yellow-dot h-10 w-10 group-hover:rotate-12">
                    <ArrowUpRight aria-hidden="true" size={20} />
                  </span>
                </Link>
              </Button>
              <a href="#memory" className="text-base font-bold text-black/68 hover:text-black">
                See the ownership loop
              </a>
            </div>
          </div>

          <div className="ambient-rise order-3 max-w-md xl:ml-auto">
            <LoopPanel />
          </div>
        </section>
      </div>
    </SkyStage>
  );
}

function FeatureCard() {
  return (
    <article id="memory" className="white-card overflow-hidden rounded-[2.35rem] p-4">
      <div className="rounded-[1.8rem] bg-[#edf5f7] p-5">
        <div className="mb-4 flex items-center justify-between text-sm font-bold">
          <span className="inline-flex items-center gap-2">
            <Database aria-hidden="true" size={15} />
            Passport flow
          </span>
          <span className="text-black/45">owned</span>
        </div>
        <div className="grid gap-3">
          <FlowStep label="Mint agent passport" tone="black" />
          <FlowStep label="Seal memory capsule" tone="yellow" />
          <FlowStep label="Recall with 0G Direct" tone="green" />
        </div>
      </div>
      <div className="px-5 py-6 text-center">
        <h2 className="text-2xl font-black leading-tight">The agent follows the owner, not the platform</h2>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/connect">Connect wallet</Link>
        </Button>
      </div>
    </article>
  );
}

function FlowStep({ label, tone }: { label: string; tone: "black" | "yellow" | "green" }) {
  const tones = {
    black: "bg-black text-white",
    yellow: "bg-[#ffcf3f] text-black",
    green: "bg-[#20c86b] text-white",
  };
  return (
    <div className="flex items-center justify-between rounded-full bg-white/78 p-2 pl-4">
      <span className="text-sm font-bold">{label}</span>
      <span className={`h-8 w-8 rounded-full ${tones[tone]}`} />
    </div>
  );
}

function ReadinessCard() {
  return (
    <article className="white-card rounded-[2rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-black/45">Readiness</div>
          <div className="brand-display mt-1 text-5xl">real</div>
        </div>
        <span className="yellow-dot">
          <ArrowUpRight aria-hidden="true" size={18} />
        </span>
      </div>
      <div className="mt-6">
        <EnvStatus />
      </div>
    </article>
  );
}

function LoopPanel() {
  const contractDetail = publicEnv.agentIdContractAddress ? truncateMiddle(publicEnv.agentIdContractAddress, 7) : "contract configuration required";
  const storageDetail = publicEnv.ogStorageIndexerRpc ? "0G Storage indexer configured" : "storage configuration required";

  return (
    <article className="glass-panel rounded-[2.25rem] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-black">Agent passport loop</h2>
        <span className="text-3xl leading-none">...</span>
      </div>
      <LoopRow icon={<Fingerprint size={18} />} title="Own the passport" detail={contractDetail} />
      <LoopRow icon={<Database size={18} />} title="Seal memory capsules" detail={storageDetail} />
      <LoopRow icon={<Cpu size={18} />} title="Recall through compute" detail="wallet-signed 0G Direct calls" />
      <LoopRow icon={<ShieldCheck size={18} />} title="Keep continuity portable" detail="identity and memory are not app-locked" />
    </article>
  );
}

function LoopRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-black/10 py-4 last:border-b-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-black">{title}</div>
        <div className="truncate text-sm text-black/52">{detail}</div>
      </div>
    </div>
  );
}
