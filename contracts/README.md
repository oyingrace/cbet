# cbet – Smart Contracts

`CbetLotto` is an upgradeable **USDT** lottery contract for **Celo** (UUPS proxy),
adapted from the Dream Lotto contract. Players place bets with `placeBet`
(stakes are escrowed in the contract); the operator publishes draw results
on-chain via `publishDrawResult`. Winners are paid off-chain from the escrowed
stakes (funded via `withdrawToken`); on-chain payout logic can be added in a
future implementation upgrade.

Designed for **MiniPay**: players call `placeBet` directly (`approve` +
`placeBet`), signing with their MiniPay wallet — no permit/relayer needed.

## Setup

1. [Install Foundry](https://book.getfoundry.sh/getting-started/installation).
2. Install dependencies (from this directory):

   ```bash
   cd contracts
   forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts OpenZeppelin/openzeppelin-contracts-upgradeable
   ```

3. Build:

   ```bash
   forge build
   ```

## Deploy

1. Create `.env` in `contracts/`:
   - `PRIVATE_KEY` – deployer key (becomes the contract owner / results publisher)
   - `CELO_RPC_URL` – e.g. `https://forno.celo.org`
   - Optional: `USDT_ADDRESS`, `MIN_BET` (default `1e5` = 0.1 USDT), `MAX_BET` (default `100e6`)
   - USDT on Celo uses **6 decimals** (verify the token address against MiniPay's list before mainnet)

2. Deploy (implementation + UUPS proxy):

   ```bash
   forge script script/Deploy.s.sol --rpc-url celo --broadcast --verify
   ```

3. Set the **proxy** address as `NEXT_PUBLIC_LOTTO_CONTRACT_ADDRESS` in the
   cbet app and `LOTTO_CONTRACT_ADDRESS` in cbet-cron. The deployer key is the
   `LOTTO_OWNER_PRIVATE_KEY` the cron uses to publish results.

## Game type encoding

| index | game     | numbers            |
|-------|----------|--------------------|
| 0     | draw-2   | exactly 2 (1-90)   |
| 1     | draw-3   | exactly 3 (1-90)   |
| 2     | draw-4   | exactly 4 (1-90)   |
| 3     | combo-2  | ≥ 2 (1-90)         |
| 4     | combo-3  | ≥ 3 (1-90)         |
| 5     | draw-5   | exactly 5 (1-90)   |
| 6     | lucky-10 | exactly 2 (1-10)   |
| 7     | mega-20  | exactly 2 (1-20)   |
| 8     | turbo-30 | exactly 2 (1-30)   |
| 9     | ultra-40 | exactly 2 (1-40)   |
| 10    | combo-4  | ≥ 4 (1-90)         |
| 11    | combo-5  | ≥ 5 (1-90)         |
