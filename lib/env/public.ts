import { getAddress, isAddress } from "viem";

function numberFromEnv(value: string | undefined) {
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

const rawContractAddress = process.env.NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS ?? "";

export const publicEnv = {
  ogNetwork: process.env.NEXT_PUBLIC_OG_NETWORK ?? "",
  ogChainId: numberFromEnv(process.env.NEXT_PUBLIC_OG_CHAIN_ID),
  ogRpcUrl: process.env.NEXT_PUBLIC_OG_RPC_URL ?? "",
  ogExplorerUrl: process.env.NEXT_PUBLIC_OG_EXPLORER_URL ?? "",
  ogStorageIndexerRpc: process.env.NEXT_PUBLIC_OG_STORAGE_INDEXER_RPC ?? "",
  agentIdContractAddress: isAddress(rawContractAddress) ? getAddress(rawContractAddress) : "",
};

export function publicEnvIssues() {
  const issues: string[] = [];
  if (!publicEnv.ogNetwork) issues.push("NEXT_PUBLIC_OG_NETWORK");
  if (!publicEnv.ogChainId) issues.push("NEXT_PUBLIC_OG_CHAIN_ID");
  if (!publicEnv.ogRpcUrl) issues.push("NEXT_PUBLIC_OG_RPC_URL");
  if (!publicEnv.ogExplorerUrl) issues.push("NEXT_PUBLIC_OG_EXPLORER_URL");
  if (!publicEnv.ogStorageIndexerRpc) issues.push("NEXT_PUBLIC_OG_STORAGE_INDEXER_RPC");
  if (!publicEnv.agentIdContractAddress) issues.push("NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS");
  return issues;
}

export function hasPublicWalletConfig() {
  return Boolean(publicEnv.ogChainId && publicEnv.ogRpcUrl);
}
