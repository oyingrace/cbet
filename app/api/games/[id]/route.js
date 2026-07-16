import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connection';
import Game from '@/lib/db/models/Game';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const { id: gameId } = await params;

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game id' },
        { status: 400 }
      );
    }

    await connectDB();

    const game = await Game.findById(gameId).lean();

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: game });
  } catch (error) {
    console.error('Error in game API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}
