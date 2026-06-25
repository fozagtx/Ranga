"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { WagmiProvider } from "wagmi";
import { createQueryClient, wagmiConfig } from "@/lib/web3-config";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          mode="light"
          customTheme={{
            "--ck-font-family": "var(--font-sans)",
            "--ck-border-radius": "8px",
            "--ck-primary-button-background": "hsl(var(--primary))",
            "--ck-primary-button-color": "hsl(var(--primary-foreground))",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
