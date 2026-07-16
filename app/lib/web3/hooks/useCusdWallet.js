'use client';

import { useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CUSD_ADDRESS, STAKE_TOKEN_DECIMALS } from '@/lib/web3/constants';
import { erc20Abi } from '@/lib/web3/erc20Abi';

/**
 * MiniPay wallet + live cUSD balance, shaped for the betting screen.
 * Returns the connected address, balance (whole cUSD + raw bigint), load state,
 * and a `refresh()` that refetches and resolves with the fresh raw balance.
 */
export function useCusdWallet() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CUSD_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const balanceRaw = typeof data === 'bigint' ? data : 0n;
  const balance = Number(balanceRaw) / 10 ** STAKE_TOKEN_DECIMALS;

  const refresh = useCallback(async () => {
    const res = await refetch();
    const raw = typeof res.data === 'bigint' ? res.data : 0n;
    return { balanceRaw: raw, balance: Number(raw) / 10 ** STAKE_TOKEN_DECIMALS };
  }, [refetch]);

  return { address, balance, balanceRaw, isLoading, error, refresh };
}
