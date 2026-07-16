'use client';

import useSWR from 'swr';
import { formatUsdt } from '@/lib/web3/format';

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load results');
  return json.data;
};

/** Shows the most recent published draw results. */
export default function LatestResults({ limit = 6 }) {
  const { data, isLoading } = useSWR(`/api/results?limit=${limit}`, fetcher, {
    dedupingInterval: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
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
      <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
        No results yet. Check back after the next draw.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((result) => (
        <div
          key={result._id}
          className="rounded-lg border dark:border-dark-bg-secondary bg-white dark:bg-dark-bg-primary p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-800 dark:text-dark-text-primary">
              {result.game?.name || result.roundType}
            </span>
            <span className="text-xs text-gray-500 dark:text-dark-text-secondary">
              {new Date(result.drawTime).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.winningNumbers?.map((n, i) => (
              <span
                key={i}
                className="w-8 h-8 rounded-full bg-dream-blue text-white flex items-center justify-center text-sm font-semibold"
              >
                {n}
              </span>
            ))}
          </div>
          {result.totalWinners > 0 && (
            <p className="text-xs text-green-600 dark:text-green-500 mt-2">
              {result.totalWinners} winner{result.totalWinners > 1 ? 's' : ''} ·{' '}
              {formatUsdt(result.totalPrizeAmount)} USDT paid
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
