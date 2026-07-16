import { isAddress, getAddress } from 'viem';
import User from '@/lib/db/models/User';

/**
 * Identity in cbet is the MiniPay wallet address. Clients send it in the
 * `x-wallet-address` header (sourced from the connected MiniPay account).
 *
 * This is sufficient for reading a player's own history: it exposes no funds
 * and no ability to move money. Any action that moves USDT is authorised by
 * the on-chain transaction itself (verified against Celo), so a spoofed header
 * cannot spend another user's balance. A signed-message (SIWE) session can be
 * layered on later to also protect read privacy.
 *
 * @returns {string | null} the checksummed address, or null if absent/invalid.
 */
export function getWalletAddressFromRequest(request) {
  const raw = request.headers.get('x-wallet-address');
  if (!raw || typeof raw !== 'string' || !isAddress(raw)) return null;
  return getAddress(raw);
}

/** Find or create the User for a wallet address (stored lowercased). */
export async function getOrCreateUser(walletAddress) {
  const normalized = walletAddress.toLowerCase();
  let user = await User.findOne({ walletAddress: normalized });
  if (!user) {
    user = await User.create({ walletAddress: normalized });
  }
  return user;
}
