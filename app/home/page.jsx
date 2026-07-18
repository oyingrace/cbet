'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Navigation } from '../components/navigation';
import Header from '../components/header';
import QuickActions from '../components/quickactions';
import LottoCard from '../components/LottoCard';
import LatestResults from '../components/latestresults';
import RecentWinners from '../components/recentWinners';

const FEATURED_GAME_TYPES = ['draw-2', 'draw-3'];

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch games');
  return response.json();
};

const getFeaturedGames = (games) => {
  if (!games?.length) return [];
  return FEATURED_GAME_TYPES.map((type) => games.find((g) => g.type === type)).filter(
    Boolean
  );
};

const truncateDescription = (text, maxLength = 90) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
};

export default function DashboardPage() {
  const router = useRouter();

  const { data: games, error, isLoading } = useSWR('/api/games', fetcher, {
    dedupingInterval: 5 * 60 * 1000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  });

  const featuredGames = getFeaturedGames(games);

  if (error && !games) {
    return (
      <div className="flex flex-col min-h-screen dark:bg-dark-bg-primary">
        <Header />
        <div className="flex-grow p-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load games</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-dream-yellow dark:bg-dream-yellow-subtlelight text-white dark:text-black rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        <Navigation activePage="home" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen dark:bg-dark-bg-primary">
      <Header />

      <div className="flex-grow p-4 pb-24">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text-primary">
          Let&apos;s win today 🚀
        </h2>

        <LottoCard />
        <QuickActions />
        <RecentWinners />

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary">
              Choose Your Game
            </h3>
            <Link
              href="/games"
              className="text-sm text-dream-blue dark:text-dream-yellow transition-colors duration-200"
            >
              View All
            </Link>
          </div>

          {isLoading && !games ? (
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-lg bg-gray-200 dark:bg-dark-bg-secondary animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {featuredGames.map((game) => (
                <div
                  key={game._id}
                  className="border dark:border-dark-bg-secondary rounded-lg overflow-hidden bg-white dark:bg-dark-bg-primary transition-colors duration-200"
                >
                  <div className="h-24 relative bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <span className="text-white text-2xl font-extrabold uppercase tracking-wide">
                      {game.type}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold mb-1 text-gray-800 dark:text-dark-text-primary">
                      {game.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-2">
                      {truncateDescription(game.description)}
                    </p>
                    {game.odds && (
                      <p className="text-xs text-dream-blue dark:text-dream-yellow mb-2">
                        {game.odds}x odds
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(`/games/${game._id}`)}
                      className="w-full bg-dream-yellow dark:bg-dream-yellow-subtlelight hover:bg-dream-yellow-dark dark:hover:bg-dream-yellow text-white dark:text-black py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
                    >
                      Play Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-dark-text-primary">
              Latest Results
            </h3>
            <Link
              href="/results"
              className="text-sm text-dream-blue dark:text-dream-yellow transition-colors duration-200"
            >
              View All
            </Link>
          </div>
          <LatestResults />
        </div>
      </div>

      <Navigation activePage="home" />
    </div>
  );
}
