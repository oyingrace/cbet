import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Game from '@/lib/db/models/Game';

// Force dynamic rendering and use Node.js runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();

    const games = await Game.find({ isActive: true }).lean().exec();

    return NextResponse.json(games || []);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
