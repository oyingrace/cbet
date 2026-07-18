'use client';

import useSWR from 'swr';
import { formatUsdt } from '@/lib/web3/format';
import { formatRelativeTime } from '@/lib/utils/relativeTime';

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load results');
  return json.data;
};

/** Horizontally-scrolling strip of recent winners, pulled from published results. */
export default function RecentWinners() {
  const { data, isLoading } = useSWR('/api/results?limit=10', fetcher, {
    dedupingInterval: 60 * 1000,
  });

  const winners = (data || [])
    .flatMap((result) =>
      (result.winners || []).map((w) => ({ ...w, drawTime: result.drawTime, id: w.betId || `${result._id}-${w.displayName}` }))
    )
    .slice(0, 12);

  if (isLoading || winners.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary mb-3">
        Recent Winners
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {winners.map((w) => (
          <div
            key={w.id}
            className="shrink-0 rounded-lg border dark:border-dark-bg-secondary bg-white dark:bg-dark-bg-primary p-3 min-w-[140px]"
          >
            <p className="font-mono text-xs text-gray-700 dark:text-dark-text-primary truncate">
              {w.displayName}
            </p>
            <p className="text-sm font-bold text-green-600 dark:text-green-500 mt-1">
              +{formatUsdt(w.prizeAmount)} USDT
            </p>
            <p className="text-[11px] text-gray-400 dark:text-dark-text-secondary/70 mt-0.5">
              {formatRelativeTime(w.drawTime)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
