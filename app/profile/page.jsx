'use client';

import useSWR from 'swr';
import Header from '@/components/header';
import Navigation from '@/components/navigation';
import { useApp } from '@/lib/context/AppContext';
import { walletFetch } from '@/lib/web3/apiClient';
import { useUsdtBalance } from '@/lib/web3/hooks/useUsdtBalance';
import { formatUsdt } from '@/lib/web3/format';

export default function ProfilePage() {
  const { address } = useApp();
  const { balance } = useUsdtBalance();

  const { data: bets, isLoading } = useSWR(
    address ? ['/api/user/bets', address] : null,
    async ([url]) => {
      const res = await walletFetch(address, `${url}?limit=100`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    }
  );

  const totalBets = bets?.length || 0;
  const totalStaked = bets?.reduce((s, b) => s + (b.amount || 0), 0) || 0;
  const totalWon = bets?.reduce((s, b) => s + (b.status === 'won' ? b.payout || 0 : 0), 0) || 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <Header />
      <div className="flex-grow p-4 pb-24">
        <h1 className="text-xl font-bold dark:text-dark-text-primary mb-4">Profile</h1>

        <div className="rounded-2xl border dark:border-dark-bg-secondary bg-white dark:bg-dark-bg-secondary p-4 mb-4">
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-1">Wallet</p>
          <p className="font-mono text-sm break-all text-gray-900 dark:text-dark-text-primary">
            {address || 'Not connected'}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[72px] rounded-2xl bg-gray-100 dark:bg-dark-bg-secondary animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="USDT balance" value={`${formatUsdt(balance)} USDT`} />
            <Stat label="Total bets" value={String(totalBets)} />
            <Stat label="Total staked" value={`${formatUsdt(totalStaked)} USDT`} />
            <Stat label="Total won" value={`${formatUsdt(totalWon)} USDT`} positive />
          </div>
        )}
      </div>
      <Navigation activePage="me" />
    </div>
  );
}

function Stat({ label, value, positive }) {
  return (
    <div className="rounded-2xl border dark:border-dark-bg-secondary bg-white dark:bg-dark-bg-primary p-4">
      <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{label}</p>
      <p
        className={`text-lg font-bold mt-1 ${
          positive ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-dark-text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
