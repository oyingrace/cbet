import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

let cachedClient = null;

/**
 * A viem public client for Celo, used server-side to verify staking
 * transactions (reading receipts and Transfer logs). Uses the configured RPC
 * URL if provided, otherwise the chain's default.
 */
export function getServerPublicClient() {
  if (cachedClient) return cachedClient;
  const rpcUrl = process.env.CELO_RPC_URL || undefined;
  cachedClient = createPublicClient({
    chain: celo,
    transport: http(rpcUrl),
  });
  return cachedClient;
}
