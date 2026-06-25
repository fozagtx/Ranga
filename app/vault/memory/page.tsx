"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Database, ExternalLink, KeyRound, UploadCloud } from "lucide-react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { encryptMemory, generateVaultKeyHex } from "@/lib/crypto/client";
import { ogPassAgentIdAbi } from "@/lib/contracts/ogpass-agent-id-abi";
import { publicEnv } from "@/lib/env/public";
import { isHexBytes32 } from "@/lib/utils";

type UploadResult = {
  rootHash: string;
  txHash: string;
  treeRootHash: string;
  bytes: number;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function MemoryPage() {
  const [tokenId, setTokenId] = useState("");
  const [description, setDescription] = useState("");
  const [vaultKey, setVaultKey] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [encrypted, setEncrypted] = useState<Awaited<ReturnType<typeof encryptMemory>> | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const contractAddress = publicEnv.agentIdContractAddress as `0x${string}`;
  const { data: hash, writeContract, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const tokenBigInt = useMemo(() => (tokenId ? BigInt(tokenId) : undefined), [tokenId]);
  const canEncrypt = Boolean(description.trim() && plaintext.trim() && /^0x[a-fA-F0-9]{64}$/.test(vaultKey));
  const canUpload = Boolean(encrypted);
  const canAnchor = Boolean(tokenBigInt && uploadResult && encrypted && isHexBytes32(encrypted.dataHash));
  const hasReceipt = Boolean(encrypted || uploadResult || hash);

  async function encrypt() {
    setError("");
    setStatus("Encrypting locally");
    try {
      const aad = JSON.stringify({
        app: "OGPass",
        tokenId: tokenId || null,
        description,
      });
      const result = await encryptMemory(plaintext, vaultKey, aad);
      setEncrypted(result);
      setStatus("Encrypted in browser");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Encryption failed");
      setStatus("");
    }
  }

  async function upload() {
    if (!encrypted) return;
    setError("");
    setStatus("Waiting for wallet signature");
    try {
      if (!window.ethereum) {
        throw new Error("Wallet provider not found.");
      }

      const [{ Blob: ZgBlob, Indexer }, { BrowserProvider }] = await Promise.all([
        import("@0gfoundation/0g-storage-ts-sdk"),
        import("ethers"),
      ]);
      const bytes = base64ToBytes(encrypted.envelopeBase64);
      const browserFile = new File([bytes], `${encrypted.dataHash}.ogpass.json`, {
        type: "application/vnd.ogpass.encrypted+json",
      });
      const zgBlob = new ZgBlob(browserFile);
      const [tree, treeError] = await zgBlob.merkleTree();
      if (treeError || !tree) {
        throw new Error(treeError?.message ?? "0G Merkle tree creation failed.");
      }

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const indexer = new Indexer(publicEnv.ogStorageIndexerRpc);

      setStatus("Uploading ciphertext to 0G Storage");
      const [result, uploadError] = await indexer.upload(zgBlob, publicEnv.ogRpcUrl, signer, {
        finalityRequired: true,
      });
      if (uploadError) {
        throw uploadError;
      }

      const rootHash = "rootHash" in result ? result.rootHash : result.rootHashes[0];
      const txHash = "txHash" in result ? result.txHash : result.txHashes[0];
      const treeRootHash = tree.rootHash();
      if (!rootHash || !txHash || !treeRootHash) {
        throw new Error("0G Storage upload completed without a full receipt.");
      }
      setUploadResult({
        rootHash,
        txHash,
        treeRootHash,
        bytes: bytes.length,
      });
      setStatus("0G Storage upload confirmed");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "0G Storage upload failed.");
      setStatus("");
    }
  }

  function anchor() {
    if (!tokenBigInt || !uploadResult || !encrypted) return;
    writeContract({
      address: contractAddress,
      abi: ogPassAgentIdAbi,
      functionName: "anchorMemory",
      args: [tokenBigInt, description, encrypted.dataHash, uploadResult.rootHash, encrypted.ciphertextHash],
    });
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="brand-display flex items-center gap-3 text-[clamp(3.25rem,5.8vw,5.9rem)]">
          <Database aria-hidden="true" size={34} />
          Memory capsules
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-black/55">
          Seal durable context for your agent passport. Plaintext stays in the browser; 0G Storage receives ciphertext
          signed by your connected wallet.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Panel className="white-card space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Token ID
              <Input value={tokenId} onChange={(event) => setTokenId(event.target.value.replace(/\D/g, ""))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Capsule label
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Vault key
            <div className="flex gap-2">
              <Input value={vaultKey} onChange={(event) => setVaultKey(event.target.value)} spellCheck={false} />
              <Button type="button" variant="outline" onClick={() => setVaultKey(generateVaultKeyHex())}>
                <KeyRound aria-hidden="true" size={16} />
                Generate
              </Button>
            </div>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Private memory
            <Textarea value={plaintext} onChange={(event) => setPlaintext(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={encrypt} disabled={!canEncrypt}>
              Encrypt
            </Button>
            <Button type="button" onClick={upload} disabled={!canUpload}>
              <UploadCloud aria-hidden="true" size={16} />
              Upload capsule
            </Button>
            <Button type="button" onClick={anchor} disabled={!canAnchor || isPending || receipt.isLoading}>
              Anchor to passport
            </Button>
          </div>
          {status ? <p className="text-sm font-semibold text-primary">{status}</p> : null}
          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
          {receipt.isSuccess ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 aria-hidden="true" size={16} />
              Memory anchor confirmed.
            </p>
          ) : null}
        </Panel>

        <Panel className="glass-panel space-y-4">
          <h2 className="font-bold">Capsule receipt</h2>
          {hasReceipt ? (
            <>
              <Result label="Data hash" value={encrypted?.dataHash} />
              <Result label="Ciphertext hash" value={encrypted?.ciphertextHash} />
              <Result label="0G root hash" value={uploadResult?.rootHash} />
              <Result label="0G upload tx" value={uploadResult?.txHash} href={uploadResult ? `${publicEnv.ogExplorerUrl.replace(/\/$/, "")}/tx/${uploadResult.txHash}` : undefined} />
              <Result label="Anchor tx" value={hash} href={hash ? `${publicEnv.ogExplorerUrl.replace(/\/$/, "")}/tx/${hash}` : undefined} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No sealed memory in this browser session.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function Result({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null;

  return (
    <div className="rounded-[1.3rem] border border-border bg-white/70 p-4">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      {href ? (
        <a className="mt-1 inline-flex items-center gap-2 break-all font-mono text-xs text-primary" href={href} target="_blank" rel="noreferrer">
          {value}
          <ExternalLink aria-hidden="true" size={13} />
        </a>
      ) : (
        <div className="mt-1 break-all font-mono text-xs">{value}</div>
      )}
    </div>
  );
}
