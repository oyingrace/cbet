'use client';

import { useState } from 'react';
import Header from '@/components/header';
import Navigation from '@/components/navigation';
import { useApp } from '@/lib/context/AppContext';
import { useCusdBalance } from '@/lib/web3/hooks/useCusdBalance';
import { formatCusd } from '@/lib/web3/format';

export default function WalletPage() {
  const { address } = useApp();
  const { balance, isLoading } = useCusdBalance();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <Header />
      <div className="flex-grow p-4 pb-24">
        <h1 className="text-xl font-bold dark:text-dark-text-primary mb-4">Wallet</h1>

        <div className="rounded-2xl p-6 mb-4 lotto-gradient text-white">
          <p className="text-sm opacity-90">cUSD balance</p>
          <p className="text-3xl font-extrabold mt-1">
            {isLoading ? '…' : `${formatCusd(balance)} cUSD`}
          </p>
        </div>

        <div className="rounded-2xl border dark:border-dark-bg-secondary bg-white dark:bg-dark-bg-secondary p-4">
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-1">
            Your MiniPay address
          </p>
          <p className="font-mono text-sm break-all text-gray-900 dark:text-dark-text-primary">
            {address || 'Not connected'}
          </p>
          <button
            onClick={copyAddress}
            disabled={!address}
            className="mt-3 w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium disabled:opacity-50"
          >
            {copied ? 'Copied!' : 'Copy address'}
          </button>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-3">
            To top up, receive cUSD to this address in MiniPay.
          </p>
        </div>
      </div>
      <Navigation activePage="wallet" />
    </div>
  );
}
