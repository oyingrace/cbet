import { createWalletClient, http } from 'viem';
import { celo } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

let cachedClient = null;

/**
 * Server-side "gas station" wallet: funded with CELO, used only to top up a
 * player's own wallet so their MiniPay-signed approve/placeBet transactions
 * have gas to spend. It never moves USDT and never signs on a player's
 * behalf — the player's own wallet still submits every transaction.
 *
 * Returns null when RELAYER_PRIVATE_KEY isn't configured.
 */
export function getRelayerClient() {
  if (cachedClient) return cachedClient;

  const pk = process.env.RELAYER_PRIVATE_KEY;
  if (!pk) return null;

  const normalized = pk.startsWith('0x') ? pk : `0x${pk}`;
  const account = privateKeyToAccount(normalized);
  const rpcUrl = process.env.CELO_RPC_URL || undefined;

  cachedClient = createWalletClient({
    account,
    chain: celo,
    transport: http(rpcUrl),
  });
  return cachedClient;
}
