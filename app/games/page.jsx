'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import Header from '../components/header';
import { Navigation } from '../components/navigation';
import BetHistory from '../components/betHistory';
import { GAME_CATEGORIES, filterGamesByCategory } from '@/lib/utils/gameTypes';

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch games');
  return response.json();
};

const categoryHints = {
  draw: 'Draw games — pick exact numbers; all must match the 5 winning numbers.',
  combo: 'Combo games — cover every combination from your number selection.',
  special: 'Special games — win if any of your numbers match the draw.',
};

export default function GameSelectionPage() {
  const [activeCategory, setActiveCategory] = useState('special');
  const categories = GAME_CATEGORIES;

  const { data: games, error, isLoading } = useSWR('/api/games', fetcher, {
    dedupingInterval: 5 * 60 * 1000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  });

  const filteredGames = filterGamesByCategory(games, activeCategory);
  const showSkeleton = isLoading && !games;

  if (showSkeleton) {
    return (
      <div className="flex flex-col min-h-screen dark:bg-dark-bg-primary">
        <Header />
        <div className="flex-grow p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-40 rounded-lg bg-gray-200 dark:bg-dark-bg-secondary animate-pulse"
              />
            ))}
          </div>
        </div>
        <Navigation activePage="play" />
      </div>
    );
  }

  if (error && !games) {
    return (
      <div className="flex flex-col min-h-screen dark:bg-dark-bg-primary">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center">
          <p className="text-xl text-red-500 dark:text-red-400">
            Failed to load games. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-dream-blue dark:bg-dream-blue-dark text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
        <Navigation activePage="play" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen dark:bg-dark-bg-primary">
      <Header />

      <div className="flex-grow p-4 pb-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-dark-text-primary">Select a Game</h2>
          <Link
            href="/games-guides"
            className="text-sm text-dream-yellow dark:text-dream-yellow-subtlelight font-medium"
          >
            Game Guides
          </Link>
        </div>

        <div className="mb-4 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-dream-yellow text-black font-medium'
                    : 'bg-gray-100 dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {categoryHints[activeCategory] && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-gray-800 rounded-lg border border-dream-yellow dark:border-dream-yellow-subtlelight">
            <p className="text-sm text-gray-700 dark:text-dark-text-secondary">
              {categoryHints[activeCategory]}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {filteredGames && filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <Link
                key={game._id}
                href={`/games/${game._id}`}
                className="block border-2 border-dream-yellow dark:border-dream-yellow-subtlelight rounded-lg overflow-hidden bg-white dark:bg-dark-bg-primary hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors duration-200"
              >
                <div className="h-20 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <span className="text-white text-xl font-extrabold uppercase tracking-wide">
                    {game.type}
                  </span>
                </div>
                <div className="p-2">
                  <h4 className="font-semibold text-gray-800 dark:text-dark-text-primary text-sm">
                    {game.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1 line-clamp-2">
                    {game.description}
                  </p>
                  {game.odds && (
                    <p className="text-xs text-blue-800 dark:text-dream-yellow-subtlelight mt-1">
                      Odds: {game.odds}x
                    </p>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-dark-text-secondary">
                No games available in this category.
              </p>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary">My Bets</h3>
        <BetHistory />
      </div>

      <Navigation activePage="play" />
    </div>
  );
}
