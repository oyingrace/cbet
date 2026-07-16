'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Navigation from '@/components/navigation';

const guides = [
  {
    id: 'draw',
    title: 'Draw games',
    body: 'Pick an exact set of numbers. You win only if all of your picked numbers appear among the 5 winning numbers drawn. Fewer picks means better odds of matching; more picks pays much more.',
  },
  {
    id: 'combo',
    title: 'Combo games',
    body: 'Choose a pool of numbers and the game automatically covers every combination of the required size. Each combination is its own line, so your total stake is split across (or multiplied by) the number of lines.',
  },
  {
    id: 'special',
    title: 'Special games',
    body: 'Lucky 10, Mega 20, Turbo 30 and Ultra 40. Pick 2 numbers — you win if any of them match the draw. Simple and fast, with fixed odds per game.',
  },
];

export default function GamesGuidesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <Header />
      <div className="flex-grow p-4 pb-24">
        <div className="flex items-center justify-center mb-4 relative">
          <button onClick={() => router.push('/games')} aria-label="Back" className="absolute left-0">
            <ChevronLeft className="text-gray-700 dark:text-white" size={22} />
          </button>
          <h1 className="text-xl font-bold dark:text-dark-text-primary">Game Guides</h1>
        </div>

        <div className="space-y-3">
          {guides.map((g) => (
            <div
              key={g.id}
              id={g.id}
              className="rounded-2xl border dark:border-dark-bg-secondary bg-white dark:bg-dark-bg-secondary p-4"
            >
              <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                {g.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{g.body}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-dream-yellow bg-yellow-50 dark:bg-yellow-500/10 p-4">
            <p className="text-sm text-gray-700 dark:text-dark-text-secondary">
              All stakes and winnings are in <span className="font-semibold">cUSD</span> and paid
              through your MiniPay wallet on Celo.
            </p>
          </div>
        </div>
      </div>
      <Navigation activePage="play" />
    </div>
  );
}
