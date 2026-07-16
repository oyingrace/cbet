'use client';

import { usePathname, useRouter } from 'next/navigation';
import { FaWallet } from 'react-icons/fa';
import { useUsdtBalance } from '@/lib/web3/hooks/useUsdtBalance';
import { formatUsdt } from '@/lib/web3/format';

/**
 * App header showing the brand and the player's live USDT balance (read from
 * MiniPay). Tapping the balance goes to the wallet page.
 */
const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { balance, isLoading } = useUsdtBalance();

  const isWalletPage = pathname === '/wallet';

  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-dark-bg-primary transition-colors duration-200">
      <div className="flex items-center">
        <span className="text-xl font-extrabold text-dream-blue dark:text-dream-yellow">
          cbet
        </span>
      </div>
      <div className="flex items-center gap-4">
        {!isWalletPage && (
          <button
            type="button"
            onClick={() => router.push('/wallet')}
            className="flex items-center bg-gray-200 dark:bg-dark-bg-secondary rounded-full px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
            aria-label="Go to wallet"
          >
            <FaWallet
              size={18}
              className="text-dream-yellow dark:text-dream-yellow-subtlelight"
            />
            <span className="ml-2 text-black dark:text-dark-text-primary font-semibold">
              {isLoading ? (
                <span className="inline-block animate-pulse w-20 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
              ) : (
                `USDT ${formatUsdt(balance)}`
              )}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
