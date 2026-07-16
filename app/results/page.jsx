'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Navigation from '@/components/navigation';
import LatestResults from '@/components/latestresults';

export default function ResultsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <Header />
      <div className="flex-grow p-4 pb-24">
        <div className="flex items-center justify-center mb-4 relative">
          <button
            onClick={() => router.push('/home')}
            aria-label="Back"
            className="absolute left-0"
          >
            <ChevronLeft className="text-gray-700 dark:text-white" size={22} />
          </button>
          <h1 className="text-xl font-bold dark:text-dark-text-primary">Results</h1>
        </div>
        <LatestResults limit={30} />
      </div>
      <Navigation activePage="results" />
    </div>
  );
}
