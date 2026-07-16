import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Bet from '@/lib/db/models/Bet';
import '@/lib/db/models/User';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Top players ranked by total USDT won. */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    const rows = await Bet.aggregate([
      { $match: { status: 'won' } },
      {
        $group: {
          _id: '$user',
          totalWon: { $sum: '$payout' },
          wins: { $sum: 1 },
          walletAddress: { $first: '$walletAddress' },
        },
      },
      { $sort: { totalWon: -1 } },
      { $limit: limit },
    ]);

    const data = rows.map((r, i) => ({
      rank: i + 1,
      walletAddress: r.walletAddress,
      totalWon: r.totalWon,
      wins: r.wins,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
