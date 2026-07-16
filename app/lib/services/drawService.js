import connectDB from '@/lib/db/connection';
import Game from '@/lib/db/models/Game';
import Bet from '@/lib/db/models/Bet';
import Result from '@/lib/db/models/Result';
import Transaction from '@/lib/db/models/Transaction';
import { drawNumbers } from '@/lib/utils/drawNumbers';
import { generatePermCombinations } from '@/lib/utils/combinationGenerator';
import { getWinningNumberCount, getWinCondition } from '@/lib/utils/gameTypes';
import { generateRoundId } from '@/lib/utils/rounds';
import BetCalculator from '@/lib/services/betCalculator';
import { getTreasuryClient } from '@/lib/web3/treasuryClient';
import { getServerPublicClient } from '@/lib/web3/serverClient';
import { erc20Abi } from '@/lib/web3/erc20Abi';
import { CUSD_ADDRESS, CHAIN_ID_CELO } from '@/lib/web3/constants';
import { cusdToRaw } from '@/lib/web3/format';

const round2 = (n) => Math.round(n * 100) / 100;

/** Evaluate a single bet against the winning numbers. */
function evaluateBet(bet, game, winningNumbers) {
  const { combinations, count } = generatePermCombinations(bet.numbers, bet.betType);
  const stakePerLine = count > 0 ? bet.amount / count : bet.amount;
  const winCondition = getWinCondition(game);

  const winningCombos = combinations.filter((combo) =>
    BetCalculator.isCombinationWinner(combo, winningNumbers, bet.betType, winCondition)
  );

  const wins = winningCombos.length;
  const payout = wins > 0 ? round2(stakePerLine * game.odds * wins) : 0;
  return { winningCombos, wins, payout };
}

/** Pay a single winning bet from the treasury. Returns txHash or null. */
async function payWinner(bet) {
  const treasury = getTreasuryClient();
  if (!treasury || bet.payout <= 0) return null;

  const publicClient = getServerPublicClient();
  const txHash = await treasury.writeContract({
    address: CUSD_ADDRESS,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [bet.walletAddress, cusdToRaw(bet.payout)],
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Run a draw for a game's round: generate winning numbers, settle every pending
 * bet, publish a Result, and pay winners from the treasury.
 *
 * Idempotent-ish: a published Result for the same (game, roundId) is returned
 * instead of drawing again. Payouts are attempted per winning bet; a failed
 * payout leaves the bet `won` without a payoutTxHash so it can be retried.
 */
export async function settleDraw({ gameId, roundId } = {}) {
  await connectDB();

  const game = await Game.findById(gameId).lean();
  if (!game) throw new Error('Game not found');

  const round = roundId || generateRoundId(new Date(), game.type);

  const existing = await Result.findOne({ game: game._id, roundId: round }).lean();
  if (existing && existing.status === 'published') {
    return { result: existing, alreadySettled: true };
  }

  const count = getWinningNumberCount(game);
  const min = game.numberRange?.min ?? 1;
  const max = game.numberRange?.max ?? 90;
  const winningNumbers = drawNumbers({ count, min, max });

  const bets = await Bet.find({ game: game._id, roundId: round, status: 'pending' });

  const winners = [];
  let totalWinners = 0;
  let totalPrizeAmount = 0;

  const result = await Result.create({
    game: game._id,
    drawNumber: `DRAW-${Date.now()}`,
    winningNumbers,
    drawTime: new Date(),
    status: 'published',
    roundId: round,
    roundType: game.type,
  });

  for (const bet of bets) {
    const { winningCombos, wins, payout } = evaluateBet(bet, game, winningNumbers);

    bet.status = wins > 0 ? 'won' : 'lost';
    bet.payout = payout;
    bet.winningCombos = winningCombos.length ? winningCombos : undefined;
    bet.result = result._id;

    if (wins > 0) {
      totalWinners += 1;
      totalPrizeAmount = round2(totalPrizeAmount + payout);

      // Attempt payout from the treasury.
      try {
        const txHash = await payWinner(bet);
        if (txHash) {
          bet.payoutTxHash = txHash;
          await Transaction.create({
            user: bet.user,
            type: 'WINNING_PAYOUT',
            amount: payout,
            currency: 'cUSD',
            chainId: CHAIN_ID_CELO,
            txHash,
            walletAddress: bet.walletAddress,
            status: 'COMPLETED',
            reference: `payout_${bet._id}`,
            description: `Winnings for ${game.name}`,
          });
        }
      } catch (err) {
        console.error(`Payout failed for bet ${bet._id}:`, err);
        // Leave payoutTxHash unset for retry.
      }

      winners.push({
        displayName: bet.walletAddress
          ? `${bet.walletAddress.slice(0, 6)}…${bet.walletAddress.slice(-4)}`
          : 'Player',
        userId: bet.user,
        betId: bet._id,
        matchedNumbers: bet.numbers.filter((n) => winningNumbers.includes(n)),
        matchCount: bet.numbers.filter((n) => winningNumbers.includes(n)).length,
        prizeAmount: payout,
      });
    }

    await bet.save();
  }

  result.winners = winners;
  result.totalWinners = totalWinners;
  result.totalPrizeAmount = totalPrizeAmount;
  await result.save();

  return {
    result,
    winningNumbers,
    settledBets: bets.length,
    totalWinners,
    totalPrizeAmount,
  };
}
