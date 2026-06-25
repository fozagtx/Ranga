"use client";

import { useMemo, useState } from "react";
import { keccak256, toHex } from "viem";
import { CheckCircle2, ExternalLink, Fingerprint } from "lucide-react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { ogPassAgentIdAbi } from "@/lib/contracts/ogpass-agent-id-abi";
import { publicEnv } from "@/lib/env/public";
import { isHexBytes32 } from "@/lib/utils";

export default function IdentityPage() {
  const { address } = useAccount();
  const [description, setDescription] = useState("");
  const [genesisMemory, setGenesisMemory] = useState("");
  const [lookupTokenId, setLookupTokenId] = useState("");
  const contractAddress = publicEnv.agentIdContractAddress as `0x${string}`;
  const contractReady = Boolean(contractAddress);
  const tokenId = lookupTokenId ? BigInt(lookupTokenId) : undefined;
  const identityHash = useMemo(() => {
    if (!address || !description.trim() || !genesisMemory.trim()) {
      return "";
    }
    const payload = JSON.stringify({
      app: "OGPass",
      version: 1,
      owner: address,
      label: description.trim(),
      memory: genesisMemory.trim(),
    });
    return keccak256(toHex(new TextEncoder().encode(payload)));
  }, [address, description, genesisMemory]);

  const nextToken = useReadContract({
    address: contractAddress,
    abi: ogPassAgentIdAbi,
    functionName: "nextTokenId",
    query: { enabled: contractReady },
  });

  const owner = useReadContract({
    address: contractAddress,
    abi: ogPassAgentIdAbi,
    functionName: "ownerOf",
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: contractReady && Boolean(tokenId) },
  });

  const data = useReadContract({
    address: contractAddress,
    abi: ogPassAgentIdAbi,
    functionName: "intelligentDataOf",
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: contractReady && Boolean(tokenId) },
  });

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const canMint = useMemo(() => Boolean(address && contractReady && description.trim() && genesisMemory.trim() && isHexBytes32(identityHash)), [
    address,
    contractReady,
    description,
    genesisMemory,
    identityHash,
  ]);

  function mint() {
    if (!address || !canMint) return;
    if (nextToken.data) {
      setLookupTokenId(nextToken.data.toString());
    }
    writeContract({
      address: contractAddress,
      abi: ogPassAgentIdAbi,
      functionName: "mintAgent",
      args: [
        address,
        [
          {
            dataDescription: description,
            dataHash: identityHash as `0x${string}`,
          },
        ],
      ],
    });
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="brand-display flex items-center gap-3 text-[clamp(3.25rem,5.8vw,5.9rem)]">
          <Fingerprint aria-hidden="true" size={34} />
          Agent Passport
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-black/55">
          Mint the owner-controlled identity for your companion. The first memory becomes a local commitment, then the
          passport is anchored to your wallet on 0G Chain.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Panel className="white-card space-y-4">
          <div>
            <h2 className="font-bold">Create passport</h2>
            {nextToken.data ? (
              <p className="text-sm text-muted-foreground">Next on-chain token ID: {nextToken.data.toString()}</p>
            ) : nextToken.isPending ? (
              <p className="text-sm text-muted-foreground">Reading contract state from 0G...</p>
            ) : null}
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Passport label
            <Input value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            First private memory
            <Textarea value={genesisMemory} onChange={(event) => setGenesisMemory(event.target.value)} />
          </label>
          {identityHash ? (
            <div className="rounded-[1.3rem] border border-border bg-white/70 p-4">
              <div className="text-xs font-bold uppercase text-muted-foreground">Commitment hash</div>
              <div className="mt-1 break-all font-mono text-xs">{identityHash}</div>
            </div>
          ) : null}
          <Button type="button" onClick={mint} disabled={!canMint || isPending || receipt.isLoading}>
            Mint passport
          </Button>
          {hash ? <TxLink hash={hash} /> : null}
          {receipt.isSuccess ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 aria-hidden="true" size={16} />
              Confirmed on-chain.
            </p>
          ) : null}
          {error ? <ErrorBox message={error.message} /> : null}
        </Panel>

        <Panel className="glass-panel space-y-4">
          <h2 className="font-bold">Passport lookup</h2>
          <label className="grid gap-2 text-sm font-semibold">
            Token ID
            <Input value={lookupTokenId} onChange={(event) => setLookupTokenId(event.target.value.replace(/\D/g, ""))} />
          </label>
          {tokenId ? (
            <>
              {owner.isPending ? <p className="text-sm text-muted-foreground">Reading owner from 0G...</p> : null}
              {owner.error ? <ErrorBox message="Token not found on this contract." /> : null}
              {owner.data ? (
                <div className="rounded-[1.3rem] border border-border bg-white/70 p-4">
                  <div className="text-xs font-bold uppercase text-muted-foreground">Owner</div>
                  <div className="mt-1 break-all font-mono text-xs">{owner.data}</div>
                </div>
              ) : null}
              {data.isPending ? <p className="text-sm text-muted-foreground">Reading memory commitments...</p> : null}
              {data.data?.length ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-muted-foreground">Memory commitments</div>
                  {data.data.map((item, index) => (
                    <div key={`${item.dataHash}-${index}`} className="rounded-[1.3rem] border border-border bg-white/70 p-4">
                      <div className="text-sm font-semibold">{item.dataDescription}</div>
                      <div className="mt-1 break-all font-mono text-xs text-muted-foreground">{item.dataHash}</div>
                    </div>
                  ))}
                </div>
              ) : data.isSuccess ? (
                <p className="text-sm text-muted-foreground">This token has no memory commitments.</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Passport details appear here after a token is selected.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function TxLink({ hash }: { hash: `0x${string}` }) {
  const href = `${publicEnv.ogExplorerUrl.replace(/\/$/, "")}/tx/${hash}`;
  return (
    <a className="inline-flex items-center gap-2 break-all font-mono text-xs text-primary" href={href} target="_blank" rel="noreferrer">
      {hash}
      <ExternalLink aria-hidden="true" size={13} />
    </a>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</div>;
}
