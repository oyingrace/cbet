import { rawToCusd, formatCusd } from '@/lib/web3/format';

/**
 * Derive bet affordability from on-chain cUSD balance and total stake (raw units).
 * @returns {'checking'|'unknown'|'error'|'sufficient'|'insufficient'} status
 */
export function getAffordability({
  balanceRaw,
  totalCostRaw,
  balanceLoading = false,
  balanceError = null,
  walletAddress = null,
}) {
  if (!walletAddress) {
    return { status: 'unknown', message: null, shortfall: 0, shortfallRaw: 0n };
  }

  if (balanceLoading) {
    return { status: 'checking', message: 'Checking balance...', shortfall: 0, shortfallRaw: 0n };
  }

  if (balanceError) {
    return {
      status: 'error',
      message: 'Could not load balance. Tap to retry.',
      shortfall: 0,
      shortfallRaw: 0n,
    };
  }

  const cost = totalCostRaw ?? 0n;
  if (cost <= 0n) {
    return { status: 'unknown', message: null, shortfall: 0, shortfallRaw: 0n };
  }

  const balance = balanceRaw ?? 0n;
  if (balance >= cost) {
    return { status: 'sufficient', message: 'Sufficient balance', shortfall: 0, shortfallRaw: 0n };
  }

  const shortfallRaw = cost - balance;
  const shortfall = rawToCusd(shortfallRaw);
  return {
    status: 'insufficient',
    message: `Need ${formatCusd(shortfall)} more cUSD`,
    shortfall,
    shortfallRaw,
  };
}
