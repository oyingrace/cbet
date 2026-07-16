# cbet

A numbers-lottery game (a port of Dream Lotto) built as a **MiniPay Mini App** on the **Celo** blockchain. The game stakes and settles in **USDT**.

## How the wallet works

cbet runs inside the **MiniPay** dapp browser. MiniPay injects an EIP-1193
provider at `window.ethereum` with `isMiniPay === true`, so the app:

- auto-connects the wallet on load — there is **no "Connect Wallet" button**,
- identifies the player by their Celo **wallet address**,
- stakes in **USDT** using **legacy transactions** (MiniPay ignores EIP-1559
  fields).

The MiniPay integration lives in `app/lib/web3/` (`config.ts`, `constants.ts`,
`hooks/useMiniPay.ts`) and is wired through `app/providers.tsx`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

Open the app inside MiniPay (or MiniPay's Site Tester) to exercise the wallet
flow. In a normal desktop browser the app loads but reports that MiniPay was
not detected.

## Stack

- Next.js 16 (App Router)
- wagmi + viem (Celo)
- MongoDB + Mongoose
- Tailwind CSS
