/**
 * Celo / MiniPay constants.
 *
 * cbet runs as a MiniPay Mini App: the user's wallet is provided by MiniPay
 * (injected at `window.ethereum` with `isMiniPay === true`) and the game
 * stakes/settles in cUSD on Celo mainnet.
 */

import { celo } from "wagmi/chains";

// Active chain for the app. MiniPay operates on Celo mainnet.
export const ACTIVE_CHAIN = celo;
export const CHAIN_ID_CELO = celo.id; // 42220

// Celo stablecoin (ERC-20) addresses on mainnet.
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;

// The currency the game stakes and settles in.
export const CURRENCY_CUSD = "cUSD";
export const STAKE_TOKEN_ADDRESS = CUSD_ADDRESS;
export const STAKE_TOKEN_DECIMALS = 18; // cUSD uses 18 decimals

// Deployed CbetLotto proxy address on Celo. Stakes are placed into this
// contract via `placeBet`; the cbet-cron service publishes results to it.
export const LOTTO_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_LOTTO_CONTRACT_ADDRESS as `0x${string}` | undefined) ||
  null;
