"use client";

import { useMiniPay } from "@/lib/web3/hooks/useMiniPay";
import { CURRENCY_CUSD } from "@/lib/web3/constants";

function shortenAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function Home() {
  const { isMiniPay, isReady, address, isConnected } = useMiniPay();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-6 px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          cbet
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Dream Lotto on Celo — staked in {CURRENCY_CUSD} via MiniPay.
        </p>

        <div className="w-full rounded-2xl border border-black/10 p-5 text-left dark:border-white/15">
          {!isReady ? (
            <p className="text-sm text-zinc-500">Detecting wallet…</p>
          ) : isMiniPay ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                MiniPay detected
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {isConnected
                  ? `Connected: ${shortenAddress(address)}`
                  : "Connecting…"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Open this app inside the MiniPay app to play. MiniPay provides the
              wallet automatically — no connect step needed.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
