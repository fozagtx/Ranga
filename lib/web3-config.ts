"use client";

import { QueryClient } from "@tanstack/react-query";
import { getDefaultConnectors } from "connectkit";
import { createConfig, http } from "wagmi";
import { ogChain } from "@/lib/og-chain";

export const wagmiConfig = createConfig({
  chains: [ogChain],
  connectors: getDefaultConnectors({
    app: {
      name: "OGPass",
      description: "Portable private ERC-7857 memory passport for AI agents on 0G.",
      url: "https://ogpass-fawuzantechs-projects.vercel.app",
      icon: "https://ogpass-fawuzantechs-projects.vercel.app/icon.png",
    },
    enableAaveAccount: true,
  }),
  transports: {
    [ogChain.id]: http(ogChain.rpcUrls.default.http[0]),
  },
  ssr: true,
});

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
