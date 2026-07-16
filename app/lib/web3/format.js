import { formatUnits } from 'viem';
import { STAKE_TOKEN_DECIMALS } from './constants';

/** Format a cUSD amount (bigint base units) for display, e.g. "12.50". */
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
