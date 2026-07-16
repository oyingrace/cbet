'use client';

import { useApp } from '@/lib/context/AppContext';

/**
 * Gates the app on having a wallet connection.
 *
 * - Inside MiniPay: the wallet auto-connects, so this renders the app straight
 *   through (no connect button — the connection is implicit).
 * - Outside MiniPay: shows a "Connect Wallet" button until an injected wallet
 *   is connected, then renders the app. This keeps cbet usable/testable in a
 *   normal browser while remaining MiniPay-first.
 */
export default function MiniPayGate({ children }) {
  const { isReady, isMiniPay, isConnected, isConnecting, connectWallet } = useApp();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dream-blue border-t-transparent" />
      </div>
    );
  }

  if (isConnected) {
    return children;
  }

  // Inside MiniPay the auto-connect is still settling — show a spinner rather
  // than a connect button (MiniPay never needs one).
  if (isMiniPay) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dream-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-gray-50 dark:bg-dark-bg-primary p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">cbet</h1>
      <p className="max-w-sm text-gray-600 dark:text-dark-text-secondary">
        For the best experience, open cbet inside the{' '}
        <span className="font-semibold">MiniPay</span> app — your wallet connects
        automatically. In a normal browser, connect a wallet to play.
      </p>
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold disabled:opacity-60"
      >
        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    </div>
  );
}
