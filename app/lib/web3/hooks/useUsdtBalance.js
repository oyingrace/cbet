'use client';

import { useAccount, useReadContract } from 'wagmi';
import { USDT_ADDRESS, STAKE_TOKEN_DECIMALS } from '@/lib/web3/constants';
import { erc20Abi } from '@/lib/web3/erc20Abi';

/**
 * Reads the connected MiniPay wallet's USDT balance from Celo.
 * Returns the balance as a Number (whole USDT) plus the raw bigint.
 */
export function useUsdtBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch, error } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const raw = typeof data === 'bigint' ? data : 0n;
  const balance = Number(raw) / 10 ** STAKE_TOKEN_DECIMALS;

  return { balance, raw, isLoading, refetch, error };
}
