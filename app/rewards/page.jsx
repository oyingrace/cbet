'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Navigation from '@/components/navigation';
import { useApp } from '@/lib/context/AppContext';

export default function RewardsPage() {
  const router = useRouter();
  const { address } = useApp();
  const [copied, setCopied] = useState(false);

  const referralLink =
    typeof window !== 'undefined' && address
      ? `${window.location.origin}/?ref=${address}`
      : '';

  const copy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <Header />
      <div className="flex-grow p-4 pb-24">
        <div className="flex items-center justify-center mb-4 relative">
          <button onClick={() => router.push('/home')} aria-label="Back" className="absolute left-0">
            <ChevronLeft className="text-gray-700 dark:text-white" size={22} />
          </button>
          <h1 className="text-xl font-bold dark:text-dark-text-primary">Rewards</h1>
        </div>

        <div className="rounded-2xl p-6 mb-4 lotto-gradient text-white">
          <h2 className="text-lg font-bold mb-1">Invite friends</h2>
          <p className="text-sm opacity-90">
            Share your link. When friends play, you both get rewarded.
          </p>
        </div>

        <div className="rounded-2xl border dark:border-dark-bg-secondary bg-white dark:bg-dark-bg-secondary p-4">
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-1">
            Your referral link
          </p>
          <p className="font-mono text-xs break-all text-gray-900 dark:text-dark-text-primary">
            {referralLink || 'Connect in MiniPay to get your link'}
          </p>
          <button
            onClick={copy}
            disabled={!referralLink}
            className="mt-3 w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium disabled:opacity-50"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
      <Navigation activePage="rewards" />
    </div>
  );
}
