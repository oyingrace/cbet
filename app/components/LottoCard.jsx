'use client';

import Link from 'next/link';

/**
 * Hero banner on the home screen. The source variant polled a shared-rounds
 * endpoint for the next draw time; that lives behind the draw engine (not yet
 * built), so this shows the call-to-action without the countdown for now.
 */
const LottoCard = () => {
  return (
    <div className="rounded-lg overflow-hidden mb-4 relative bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-700">
      <div className="relative p-4 z-10">
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
