"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export interface UseMiniPayResult {
  /** True when the app is running inside the MiniPay dapp browser. */
  isMiniPay: boolean;
  /** True once the MiniPay host has been detected (client-side only). */
  isReady: boolean;
  /** The connected MiniPay wallet address, if any. */
  address?: `0x${string}`;
  /** True while the injected wallet is connected. */
  isConnected: boolean;
}

/**
 * Detects the MiniPay host and auto-connects the injected wallet.
 *
 * MiniPay exposes its provider at `window.ethereum` with `isMiniPay === true`.
 * When detected we eagerly connect the `injected` connector so the rest of the
 * app can read the account without ever showing a connect button — MiniPay
 * treats the connection as implicit.
 *
 * Outside MiniPay (e.g. a normal browser) `isMiniPay` stays false and nothing
 * is auto-connected.
 */
export function useMiniPay(): UseMiniPayResult {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const detected =
      typeof window !== "undefined" && Boolean(window.ethereum?.isMiniPay);
    setIsMiniPay(detected);
    setIsReady(true);

    if (detected && !isConnected) {
      connect({ connector: injected() });
    }
  }, [connect, isConnected]);

  return { isMiniPay, isReady, address, isConnected };
}
