import { NextResponse } from 'next/server';
import { getAddress, parseEventLogs } from 'viem';
import connectDB from '@/lib/db/connection';
import Game from '@/lib/db/models/Game';
import Bet from '@/lib/db/models/Bet';
import Transaction from '@/lib/db/models/Transaction';
import { getWalletAddressFromRequest, getOrCreateUser } from '@/lib/web3/serverIdentity';
import { getServerPublicClient } from '@/lib/web3/serverClient';
import { CUSD_ADDRESS, TREASURY_ADDRESS, CHAIN_ID_CELO } from '@/lib/web3/constants';
import { cusdToRaw } from '@/lib/web3/format';
import BetCalculator from '@/lib/services/betCalculator';
import { generateRoundId } from '@/lib/utils/rounds';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const transferEventAbi = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
  },
];

/**
 * Records a bet after the player has staked cUSD to the treasury from MiniPay.
 *
 * Trust model: the amount and winnings are recomputed server-side, and the
 * on-chain transaction is verified against Celo — we confirm a cUSD Transfer
 * from the player to the treasury for at least the computed stake. A spoofed
 * wallet header cannot forge this, and each txHash can back only one bet.
 */
export async function POST(request) {
  try {
    if (!TREASURY_ADDRESS) {
      return NextResponse.json(
        { success: false, error: 'Treasury not configured' },
        { status: 500 }
      );
    }

    const headerAddress = getWalletAddressFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const { gameId, numbers, betMode = 'total', amount, txHash } = body || {};
    const walletAddress = headerAddress || (body.walletAddress ?? null);

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }
    if (!gameId || !Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'gameId and numbers are required' },
        { status: 400 }
      );
    }
    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Staking txHash required' },
        { status: 400 }
      );
    }

    await connectDB();

    const game = await Game.findById(gameId).lean();
    if (!game || !game.isActive) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Idempotency: one bet per staking transaction.
    const existing = await Bet.findOne({ txHash }).lean();
    if (existing) {
      return NextResponse.json({ success: true, bet: { _id: existing._id }, deduped: true });
    }

    const parsedNumbers = numbers.map((n) => Number(n)).filter((n) => Number.isInteger(n));
    const numAmount = Number(amount);

    // Recompute the bet server-side — never trust client-provided winnings.
    const validation = BetCalculator.validateBet({
      selectedNumbers: parsedNumbers,
      betType: game.type,
      amount: numAmount,
      minBetAmount: Number(game.minBetAmount) || 1,
      maxBetAmount: Number(game.maxBetAmount) || 1000000,
      mode: betMode,
    });
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const calc = BetCalculator.calculateBet({
      selectedNumbers: parsedNumbers,
      betType: game.type,
      amount: numAmount,
      mode: betMode,
      gameOdds: game.odds,
    });

    const expectedRaw = cusdToRaw(calc.totalCost);

    // Verify the staking transaction on Celo.
    const client = getServerPublicClient();
    let receipt;
    try {
      receipt = await client.getTransactionReceipt({ hash: txHash });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Staking transaction not found on chain' },
        { status: 400 }
      );
    }

    if (receipt.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Staking transaction failed' },
        { status: 400 }
      );
    }

    const transfers = parseEventLogs({
      abi: transferEventAbi,
      logs: receipt.logs,
      eventName: 'Transfer',
    });

    const cusd = getAddress(CUSD_ADDRESS);
    const treasury = getAddress(TREASURY_ADDRESS);
    const from = getAddress(walletAddress);

    const matched = transfers.find((log) => {
      try {
        return (
          getAddress(log.address) === cusd &&
          getAddress(log.args.from) === from &&
          getAddress(log.args.to) === treasury &&
          log.args.value >= expectedRaw
        );
      } catch {
        return false;
      }
    });

    if (!matched) {
      return NextResponse.json(
        { success: false, error: 'No matching cUSD stake to treasury in transaction' },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser(from);
    const roundId = generateRoundId(new Date(), game.type);

    const transaction = await Transaction.create({
      user: user._id,
      type: 'TICKET_PURCHASE',
      amount: calc.totalCost,
      currency: 'cUSD',
      chainId: CHAIN_ID_CELO,
      txHash,
      walletAddress: from.toLowerCase(),
      status: 'COMPLETED',
      reference: `ticket_${txHash}`,
      description: `Stake for ${game.name}`,
    });

    const bet = await Bet.create({
      user: user._id,
      game: game._id,
      numbers: parsedNumbers,
      amount: calc.totalCost,
      currency: 'cUSD',
      chainId: CHAIN_ID_CELO,
      txHash,
      walletAddress: from.toLowerCase(),
      potentialWinnings: calc.potentialWinnings,
      betType: game.type,
      ticketCost: calc.totalCost,
      roundId,
      gameType: 'shared-round',
      status: 'pending',
      transaction: transaction._id,
    });

    if (!user.hasPlacedFirstBet) {
      user.hasPlacedFirstBet = true;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      bet: {
        _id: bet._id,
        roundId,
        amount: calc.totalCost,
        potentialWinnings: calc.potentialWinnings,
        status: bet.status,
      },
    });
  } catch (error) {
    console.error('Place bet error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to place bet' },
      { status: 500 }
    );
  }
}
