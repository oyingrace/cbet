'use client';

import Link from 'next/link';
import { useNextDrawCountdown } from '@/lib/hooks/useNextDrawCountdown';

/**
 * Hero banner on the home screen. Shows a live countdown to the next
 * draw-combo draw, computed client-side from the static round schedule.
 */
const LottoCard = () => {
  const { label } = useNextDrawCountdown('draw-combo');

  return (
    <div className="rounded-lg overflow-hidden mb-4 relative bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-700">
      <div className="relative p-4 z-10">
        <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">
          Next draw in {label}
        </p>
        <h2 className="text-white text-2xl font-bold mb-1">Play the next draw</h2>
        <p className="text-blue-100 text-sm mb-3">Pick your numbers, stake USDT, win big.</p>
        <Link href="/games">
          <button className="bg-yellow-500 dark:bg-dream-yellow text-white dark:text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 dark:hover:bg-dream-yellow-dark transition-colors">
            Play Now
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LottoCard;
