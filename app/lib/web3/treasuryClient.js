import { createWalletClient, http } from 'viem';
import { celo } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

let cached = null;

/**
 * Server-side treasury wallet client used to pay winners in cUSD.
 *
 * The treasury key is a server secret (TREASURY_PRIVATE_KEY) and must never be
 * exposed to the client. Returns null when unset so callers can degrade
 * gracefully (bets are still settled/marked; payouts can be retried later).
 */
export function getTreasuryClient() {
  if (cached) return cached;

  const pk = process.env.TREASURY_PRIVATE_KEY;
  if (!pk) return null;

  const normalized = pk.startsWith('0x') ? pk : `0x${pk}`;
  const account = privateKeyToAccount(normalized);
  const rpcUrl = process.env.CELO_RPC_URL || undefined;

  cached = createWalletClient({
    account,
    chain: celo,
    transport: http(rpcUrl),
  });
  return cached;
}
