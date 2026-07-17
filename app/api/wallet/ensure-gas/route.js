import { NextResponse } from 'next/server';
import { getAddress, parseEther, formatEther } from 'viem';
import connectDB from '@/lib/db/connection';
import GasDrip from '@/lib/db/models/GasDrip';
import { getWalletAddressFromRequest } from '@/lib/web3/serverIdentity';
import { getServerPublicClient } from '@/lib/web3/serverClient';
import { getRelayerClient } from '@/lib/web3/relayerClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// MiniPay wallets can hold only USDT, with zero CELO for gas — and MiniPay
// currently only supports paying gas in cUSD, not USDT. Without any CELO,
// a player's wallet cannot submit the approve/placeBet transactions at all.
// This endpoint tops up a small amount of CELO from the relayer wallet so
// the player's own transactions have gas to spend; the relayer never moves
// USDT and never signs anything on the player's behalf.
const MIN_BALANCE_CELO = process.env.RELAYER_MIN_CELO_BALANCE || '0.01';
const TOPUP_AMOUNT_CELO = process.env.RELAYER_TOPUP_CELO_AMOUNT || '0.05';
const COOLDOWN_MINUTES = Number(process.env.RELAYER_DRIP_COOLDOWN_MINUTES || 10);

export async function POST(request) {
  try {
    const relayer = getRelayerClient();
    if (!relayer) {
      return NextResponse.json(
        { success: false, error: 'Gas relayer not configured' },
        { status: 500 }
      );
    }

    const headerAddress = getWalletAddressFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const walletAddress = headerAddress || (body.walletAddress ?? null);
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }
    const player = getAddress(walletAddress);

    await connectDB();

    const publicClient = getServerPublicClient();
    const balance = await publicClient.getBalance({ address: player });
    const minBalance = parseEther(MIN_BALANCE_CELO);

    if (balance >= minBalance) {
      return NextResponse.json({
        success: true,
        toppedUp: false,
        balance: formatEther(balance),
      });
    }

    // Cooldown guard: refuse repeated drips to the same address even if its
    // balance still reads low (e.g. an address that keeps burning gas fast).
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000);
    const recent = await GasDrip.findOne({
      walletAddress: player.toLowerCase(),
      lastDripAt: { $gt: cooldownCutoff },
    }).lean();

    if (recent) {
      return NextResponse.json(
        { success: false, error: 'Gas top-up already requested recently. Try again shortly.' },
        { status: 429 }
      );
    }

    const topupAmount = parseEther(TOPUP_AMOUNT_CELO);
    const txHash = await relayer.sendTransaction({
      to: player,
      value: topupAmount,
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    await GasDrip.findOneAndUpdate(
      { walletAddress: player.toLowerCase() },
      { walletAddress: player.toLowerCase(), lastDripAt: new Date(), txHash },
      { upsert: true }
    );

    const newBalance = await publicClient.getBalance({ address: player });

    return NextResponse.json({
      success: true,
      toppedUp: true,
      txHash,
      balance: formatEther(newBalance),
    });
  } catch (error) {
    console.error('Ensure-gas error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to top up gas' },
      { status: 500 }
    );
  }
}
