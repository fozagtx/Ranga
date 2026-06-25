"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, RefreshCcw, Send, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { publicEnv } from "@/lib/env/public";
import { truncateMiddle } from "@/lib/utils";

type ModelRecord = {
  provider: string;
  model: string;
  url: string;
  verifiability: string;
  status?: string;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ComputePage() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [providerAddress, setProviderAddress] = useState("");
  const [prompt, setPrompt] = useState("");
  const [memoryContext, setMemoryContext] = useState("");
  const [answer, setAnswer] = useState("");
  const [rawMeta, setRawMeta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedService = models.find((item) => item.provider === providerAddress);

  const canSend = useMemo(() => Boolean(providerAddress.trim() && prompt.trim()), [providerAddress, prompt]);

  async function loadModels() {
    setError("");
    setLoading(true);
    try {
      const { createZGComputeNetworkReadOnlyBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      const broker = await createZGComputeNetworkReadOnlyBroker(publicEnv.ogRpcUrl, publicEnv.ogChainId);
      const services = await broker.inference.listServiceWithDetail(0, 50, false);
      const liveModels = services.map((service) => ({
        provider: service.provider,
        model: service.modelInfo?.name ?? service.model,
        url: service.url,
        verifiability: service.verifiability,
        status: service.healthMetrics?.status,
      }));
      setModels(liveModels);
      if (!providerAddress && liveModels[0]?.provider) {
        setProviderAddress(liveModels[0].provider);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load 0G provider catalog.");
    } finally {
      setLoading(false);
    }
  }

  async function sendPrompt() {
    setError("");
    setAnswer("");
    setRawMeta("");
    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
      }

      const [{ createZGComputeNetworkBroker }, { BrowserProvider }] = await Promise.all([
        import("@0gfoundation/0g-compute-ts-sdk"),
        import("ethers"),
      ]);
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const broker = await createZGComputeNetworkBroker(signer);
      const service = await broker.inference.getServiceMetadata(providerAddress);
      const messages = [
        {
          role: "system",
          content:
            "You are a private AI companion inside OGPass. Treat user-provided memory context as confidential and do not claim access to data that was not provided in this request.",
        },
        ...(memoryContext.trim()
          ? [
              {
                role: "user",
                content: `Private memory context:\n${memoryContext.trim()}`,
              },
            ]
          : []),
        {
          role: "user",
          content: prompt,
        },
      ];
      const headers = await broker.inference.getRequestHeaders(providerAddress, prompt);
      const response = await fetch(`${service.endpoint.replace(/\/$/, "")}/v1/proxy/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          model: service.model,
          messages,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(JSON.stringify(payload));
      }
      const content = payload.response?.choices?.[0]?.message?.content;
      const directContent = payload.choices?.[0]?.message?.content;
      setAnswer(typeof directContent === "string" ? directContent : typeof content === "string" ? content : JSON.stringify(payload));
      const chatId = response.headers.get("ZG-Res-Key") ?? payload.id;
      const verified = await broker.inference.processResponse(providerAddress, chatId, JSON.stringify(payload.usage ?? {}));
      setRawMeta(JSON.stringify({ provider: providerAddress, model: service.model, chatId, verified, usage: payload.usage ?? null }, null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "0G Direct inference failed.");
    } finally {
      setLoading(false);
    }
  }

  async function fundProvider() {
    setError("");
    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
      }
      const [{ createZGComputeNetworkBroker }, { BrowserProvider }] = await Promise.all([
        import("@0gfoundation/0g-compute-ts-sdk"),
        import("ethers"),
      ]);
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const broker = await createZGComputeNetworkBroker(signer);
      await broker.ledger.transferFund(providerAddress, "inference", BigInt(1) * BigInt(10 ** 18));
      setRawMeta(JSON.stringify({ provider: providerAddress, providerSubAccountFunded: "1 0G transfer submitted" }, null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Provider funding failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="brand-display flex items-center gap-3 text-[clamp(3.25rem,5.8vw,5.9rem)]">
          <BrainCircuit aria-hidden="true" size={34} />
          Agent recall
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-black/55">
          Ask your companion with selected private context. Providers are discovered through 0G Direct and requests are
          signed by your connected wallet.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="white-card space-y-4">
          <p className="text-sm text-muted-foreground">Load live providers, fund one from your wallet, then run recall without an app-owned compute proxy.</p>
          <div className="flex items-end gap-2">
            <label className="grid flex-1 gap-2 text-sm font-semibold">
              Provider
              <Input value={providerAddress} onChange={(event) => setProviderAddress(event.target.value)} list="og-models" />
            </label>
            <Button type="button" variant="outline" onClick={loadModels} disabled={loading}>
              <RefreshCcw aria-hidden="true" size={16} />
            </Button>
          </div>
          <datalist id="og-models">
            {models.map((item) => (
              <option key={item.provider} value={item.provider}>
                {item.model}
              </option>
            ))}
          </datalist>
          {selectedService ? (
            <div className="rounded-[1.3rem] border border-border bg-white/70 p-4 text-sm">
              <div className="font-bold">{selectedService.model}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{truncateMiddle(selectedService.provider, 10)}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {selectedService.verifiability}
                {selectedService.status ? ` / ${selectedService.status}` : ""}
              </div>
            </div>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold">
            Memory context for this recall
            <Textarea value={memoryContext} onChange={(event) => setMemoryContext(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Prompt
            <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </label>
          <Button type="button" onClick={sendPrompt} disabled={!canSend || loading}>
            <Send aria-hidden="true" size={16} />
            Run recall
          </Button>
          <Button type="button" variant="outline" onClick={fundProvider} disabled={!providerAddress || loading}>
            <WalletCards aria-hidden="true" size={16} />
            Fund selected provider
          </Button>
          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
        </Panel>

        <Panel className="glass-panel space-y-4">
          <h2 className="font-bold">Response</h2>
          {answer ? (
            <div className="min-h-40 whitespace-pre-wrap rounded-[1.5rem] border border-border bg-white/70 p-4 text-sm leading-6">
              {answer}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No compute response in this browser session.</p>
          )}
          {rawMeta ? (
            <div>
              <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">TEE / trace metadata</div>
              <pre className="max-h-72 overflow-auto rounded-[1.5rem] border border-border bg-foreground p-4 text-xs text-background">
                {rawMeta}
              </pre>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
