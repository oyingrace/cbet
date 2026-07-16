'use client';

import useSWR from 'swr';
import { useApp } from '@/lib/context/AppContext';
import { walletFetch } from '@/lib/web3/apiClient';
import { formatCusd } from '@/lib/web3/format';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  won: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400',
};

/** Compact list of the player's recent bets. */
export default function BetHistory({ limit = 10 }) {
  const { address } = useApp();

  const { data, isLoading } = useSWR(
    address ? ['/api/user/bets', address, limit] : null,
    async ([url]) => {
      const res = await walletFetch(address, `${url}?limit=${limit}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load bets');
      return json.data;
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-gray-100 dark:bg-dark-bg-secondary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-3">
        No bets yet. Pick a game to place your first bet.
      </p>
    );
  }

  return (
    <div className="space-y-2 mt-3">
      {data.map((bet) => (
        <div
          key={bet._id}
          className="flex items-center justify-between rounded-lg border dark:border-dark-bg-secondary bg-white dark:bg-dark-bg-primary p-3"
        >
          <div className="min-w-0">
            <p className="font-medium text-gray-800 dark:text-dark-text-primary truncate">
              {bet.game?.name || bet.betType}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
              {bet.numbers?.join(', ')}
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-dark-text-primary">
              {formatCusd(bet.amount)} cUSD
            </p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                statusStyles[bet.status] || statusStyles.pending
              }`}
            >
              {bet.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
