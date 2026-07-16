'use client';

import useSWR from 'swr';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Navigation from '@/components/navigation';
import { useApp } from '@/lib/context/AppContext';
import { formatCusd } from '@/lib/web3/format';

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load leaderboard');
  return json.data;
};

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');

export default function LeaderboardPage() {
  const router = useRouter();
  const { address } = useApp();
  const { data, isLoading } = useSWR('/api/leaderboard', fetcher, {
    dedupingInterval: 60 * 1000,
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <Header />
      <div className="flex-grow p-4 pb-24">
        <div className="flex items-center justify-center mb-4 relative">
          <button onClick={() => router.push('/home')} aria-label="Back" className="absolute left-0">
            <ChevronLeft className="text-gray-700 dark:text-white" size={22} />
          </button>
          <h1 className="text-xl font-bold dark:text-dark-text-primary">Leaderboard</h1>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-dark-bg-secondary animate-pulse" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
            No winners yet. Be the first on the board!
          </p>
        ) : (
          <div className="space-y-2">
            {data.map((row) => {
              const isMe = address && row.walletAddress?.toLowerCase() === address.toLowerCase();
              return (
                <div
                  key={row.rank}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isMe
                      ? 'border-dream-yellow bg-yellow-50 dark:bg-yellow-500/10'
                      : 'border-transparent bg-white dark:bg-dark-bg-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-dream-blue text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {row.rank}
                    </span>
                    <span className="font-mono text-sm text-gray-800 dark:text-dark-text-primary truncate">
                      {short(row.walletAddress)} {isMe && '(you)'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-500 shrink-0">
                    {formatCusd(row.totalWon)} cUSD
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Navigation activePage="leaderboard" />
    </div>
  );
}
