# cbet

cbet is an on-chain numbers lottery built as a [MiniPay](https://www.opera.com/products/minipay) Mini App on the [Celo](https://celo.org) blockchain. Players pick numbers, stake **USDT**, and are paid out automatically when their numbers are drawn — all settled on-chain.

## Features

- **MiniPay-native wallet** — runs inside MiniPay and uses the player's wallet automatically; a Connect Wallet fallback is available in a normal browser.
- **On-chain stakes** — bets are staked into the `CbetLotto` contract in USDT.
- **Multiple game types** — Draw (pick exact numbers), Combo (cover every combination), and Special games (Lucky 10 / Mega 20 / Turbo 30 / Ultra 40).
- **Scheduled draws** — winning numbers are drawn on a fixed timetable, published on-chain, and winners are paid in USDT.
- **Player dashboard** — live balance, bet history, results, leaderboard, and referrals.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- [wagmi](https://wagmi.sh) + [viem](https://viem.sh) (Celo)
- [MongoDB](https://www.mongodb.com) + [Mongoose](https://mongoosejs.com)
- [Tailwind CSS](https://tailwindcss.com)

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB database
- A deployed `CbetLotto` contract (see [`contracts/`](./contracts))

### Setup

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run seed:games           # seed the game lineup
npm run dev
```

Open the app inside MiniPay (or MiniPay's Site Tester) to use the wallet flow. In a normal desktop browser the app loads with a Connect Wallet button.

## How it works

cbet runs inside the MiniPay dapp browser, which injects an EIP-1193 provider at `window.ethereum` (`isMiniPay === true`). On load the app auto-connects that wallet and identifies the player by their Celo address — there is no sign-up step.

To place a bet, the player approves USDT and calls `placeBet` on the `CbetLotto` contract (MiniPay signs, using legacy transactions and paying gas in a stablecoin). The server verifies the on-chain `BetPlaced` event before recording the bet, so winnings can never be forged from the client.

Draws are run by a separate scheduler service (see [Related projects](#related-projects)) that generates the winning numbers, publishes them on-chain, settles every bet for the round, and pays winners in USDT.

## Configuration

Copy `.env.example` to `.env.local` and set:

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `NEXT_PUBLIC_LOTTO_CONTRACT_ADDRESS` | Deployed `CbetLotto` proxy address |
| `NEXT_PUBLIC_USDT_ADDRESS` | USDT token address on Celo (defaults to native USD₮) |
| `NEXT_PUBLIC_CHAIN_ID` | Chain id (defaults to `42220`, Celo mainnet) |
| `CELO_RPC_URL` | Optional custom RPC for server-side verification |
| `NEXT_PUBLIC_BETTING_CUTOFF_MINUTES` | Minutes before a draw when betting closes |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run seed:games` | Seed the game lineup into MongoDB |

## Project structure

```
app/
  api/            # route handlers (games, bets, results, leaderboard, auth)
  components/     # UI components
  lib/
    db/           # Mongoose connection + models
    web3/         # MiniPay/wagmi config, hooks, contract ABI, helpers
    services/     # bet calculation
    utils/        # game types, rounds, combinations
  <pages>/        # home, games, wallet, profile, results, ...
contracts/        # CbetLotto Solidity contract + deploy scripts
scripts/          # seed-games
```

