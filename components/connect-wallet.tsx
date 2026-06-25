"use client";

import { ConnectKitButton } from "connectkit";
import { ArrowUpRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectWallet() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, isConnecting }) => (
        <Button onClick={show} disabled={isConnecting} type="button" className="group pr-1.5">
          <Wallet aria-hidden="true" size={16} />
          {isConnected ? truncatedAddress : "Connect wallet"}
          <span className="yellow-dot h-8 w-8 group-hover:rotate-12">
            <ArrowUpRight aria-hidden="true" size={16} />
          </span>
        </Button>
      )}
    </ConnectKitButton.Custom>
  );
}
