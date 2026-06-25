import { type Chain } from "viem";
import { publicEnv } from "@/lib/env/public";

export const ogChain = {
  id: publicEnv.ogChainId || 16602,
  name: publicEnv.ogNetwork ? `0G ${publicEnv.ogNetwork}` : "0G Chain",
  nativeCurrency: {
    decimals: 18,
    name: "0G",
    symbol: "0G",
  },
  rpcUrls: {
    default: {
      http: [publicEnv.ogRpcUrl || "https://evmrpc-testnet.0g.ai"],
    },
  },
  blockExplorers: publicEnv.ogExplorerUrl
    ? {
        default: {
          name: "0G Chain Scan",
          url: publicEnv.ogExplorerUrl,
        },
      }
    : undefined,
  testnet: publicEnv.ogNetwork !== "mainnet",
} as const satisfies Chain;
