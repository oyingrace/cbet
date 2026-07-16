'use client';

import { useApp } from '@/lib/context/AppContext';

/**
 * Gates the app to the MiniPay host. While detecting, shows a spinner. If the
 * app is opened outside MiniPay, shows guidance instead of the game — cbet is a
 * MiniPay Mini App and needs MiniPay's wallet to function.
 */
export default function MiniPayGate({ children }) {
  const { isReady, isMiniPay } = useApp();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dream-blue border-t-transparent" />
      </div>
    );
  }

  if (!isMiniPay) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-dark-bg-primary p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">cbet</h1>
        <p className="max-w-sm text-gray-600 dark:text-dark-text-secondary">
          Open cbet inside the <span className="font-semibold">MiniPay</span> app
          to play. MiniPay provides your Celo wallet and cUSD balance
          automatically — no connect step needed.
        </p>
      </div>
    );
  }

  return children;
}
