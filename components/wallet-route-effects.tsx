"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export function RedirectConnectedWallet({ to = "/vault" }: { to?: string }) {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      router.replace(to);
    }
  }, [isConnected, router, to]);

  return null;
}

export function RedirectDisconnectedWallet({ to = "/connect" }: { to?: string }) {
  const router = useRouter();
  const { status } = useAccount();

  useEffect(() => {
    if (status === "disconnected") {
      router.replace(to);
    }
  }, [router, status, to]);

  return null;
}
