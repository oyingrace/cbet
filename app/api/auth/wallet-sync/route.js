import { NextResponse } from 'next/server';
import { isAddress, getAddress } from 'viem';
import connectDB from '@/lib/db/connection';
import { getOrCreateUser } from '@/lib/web3/serverIdentity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Called on first load inside MiniPay: ensures a User exists for the connected
 * wallet address and returns it. This is how players are registered — there is
 * no separate sign-up step.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { walletAddress } = body || {};

    if (!walletAddress || typeof walletAddress !== 'string' || !isAddress(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Valid walletAddress required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await getOrCreateUser(getAddress(walletAddress));

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username || null,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Wallet sync error:', error);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}
