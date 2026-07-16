import { formatUnits, parseUnits } from 'viem';
import { STAKE_TOKEN_DECIMALS } from './constants';

/** Format a cUSD amount (bigint base units, or a whole-cUSD number) for display. */
export function formatCusd(value, maximumFractionDigits = 2) {
  if (value == null) return '0.00';
  const asNumber =
    typeof value === 'bigint'
      ? Number(formatUnits(value, STAKE_TOKEN_DECIMALS))
      : Number(value);
  if (!Number.isFinite(asNumber)) return '0.00';
  return asNumber.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  });
}

/** Whole-cUSD amount (e.g. 12.5) -> base units bigint. */
export function cusdToRaw(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0n;
  // Clamp to token decimals to avoid parseUnits throwing on long fractions.
  return parseUnits(n.toFixed(STAKE_TOKEN_DECIMALS), STAKE_TOKEN_DECIMALS);
}

/** Base units bigint -> whole-cUSD Number. */
export function rawToCusd(raw) {
  const value = typeof raw === 'bigint' ? raw : BigInt(raw || 0);
  return Number(formatUnits(value, STAKE_TOKEN_DECIMALS));
}
