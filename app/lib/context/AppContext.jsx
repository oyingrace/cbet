'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useMiniPay } from '@/lib/web3/hooks/useMiniPay';

const AppContext = createContext({
  isMiniPay: false,
  isReady: false,
  address: undefined,
  isConnected: false,
  isConnecting: false,
  connectWallet: () => {},
  user: null,
  isSyncing: false,
});

export function useApp() {
  return useContext(AppContext);
}

/** Captures a `?ref=` referral code into localStorage on first load. */
function captureReferral() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('start');
    if (ref && ref !== 'undefined') {
      window.localStorage.setItem('referralCode', ref);
    }
  } catch {
    // ignore
  }
}

/**
 * Provides MiniPay identity to the app and registers the player.
 *
 * On connect it POSTs the wallet address to /api/auth/wallet-sync, which
 * creates the User if needed — this is the sign-up step. The DB user is
 * exposed via context for pages that need it.
 */
export function AppProvider({ children }) {
  const { isMiniPay, isReady, address, isConnected, isConnecting, connectWallet } =
    useMiniPay();
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncedFor = useRef(null);

  useEffect(() => {
    captureReferral();
  }, []);

  useEffect(() => {
    if (!isConnected || !address || syncedFor.current === address) return;

    let cancelled = false;
    syncedFor.current = address;
    setIsSyncing(true);

    (async () => {
      try {
        const res = await fetch('/api/auth/wallet-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            referralCode:
              typeof window !== 'undefined'
                ? window.localStorage.getItem('referralCode')
                : null,
          }),
        });
        const data = await res.json();
        if (!cancelled && data?.success) setUser(data.user);
      } catch (err) {
        console.error('Wallet sync failed:', err);
        if (!cancelled) syncedFor.current = null; // allow retry
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  return (
    <AppContext.Provider
      value={{
        isMiniPay,
        isReady,
        address,
        isConnected,
        isConnecting,
        connectWallet,
        user,
        isSyncing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
