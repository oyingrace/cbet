/**
 * Celo / MiniPay constants.
 *
 * cbet runs as a MiniPay Mini App: the user's wallet is provided by MiniPay
 * (injected at `window.ethereum` with `isMiniPay === true`) and the game
 * stakes/settles in USDT on Celo mainnet.
 */

import { celo } from "wagmi/chains";

// Active chain for the app. MiniPay operates on Celo mainnet.
export const ACTIVE_CHAIN = celo;
export const CHAIN_ID_CELO = celo.id; // 42220

// Native USD₮ (Tether) on Celo mainnet. Override via NEXT_PUBLIC_USDT_ADDRESS.
// NOTE: verify against MiniPay's current token list before mainnet deploy.
export const USDT_ADDRESS = (process.env.NEXT_PUBLIC_USDT_ADDRESS ||
  "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e") as `0x${string}`;

// The currency the game stakes and settles in.
export const CURRENCY_USDT = "USDT";
export const STAKE_TOKEN_ADDRESS = USDT_ADDRESS;
export const STAKE_TOKEN_DECIMALS = 6; // USDT on Celo uses 6 decimals

// Deployed CbetLotto proxy address on Celo. Stakes are placed into this
// contract via `placeBet`; the cbet-cron service publishes results to it.
export const LOTTO_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_LOTTO_CONTRACT_ADDRESS as `0x${string}` | undefined) ||
  null;
