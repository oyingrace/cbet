import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Game from '@/lib/db/models/Game';
import { settleDraw } from '@/lib/services/drawService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Runs a draw and settles bets for a game's round. Intended to be triggered by
 * an admin or a scheduled job, authorised with the ADMIN_SECRET shared secret.
 *
 * Body: { gameId? , gameType?, roundId? }
 */
export async function POST(request) {
  try {
    const secret = process.env.ADMIN_SECRET;
    if (!secret || request.headers.get('x-admin-secret') !== secret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { gameId, gameType, roundId } = body || {};

    await connectDB();

    let resolvedGameId = gameId;
    if (!resolvedGameId && gameType) {
      const game = await Game.findOne({ type: gameType, isActive: true }).lean();
      if (!game) {
        return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
      }
      resolvedGameId = game._id;
    }

    if (!resolvedGameId) {
      return NextResponse.json(
        { success: false, error: 'gameId or gameType required' },
        { status: 400 }
      );
    }

    const outcome = await settleDraw({ gameId: resolvedGameId, roundId });

    return NextResponse.json({ success: true, ...outcome });
  } catch (error) {
    console.error('Draw error:', error);
    return NextResponse.json({ success: false, error: 'Failed to run draw' }, { status: 500 });
  }
}
