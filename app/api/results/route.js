import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Result from '@/lib/db/models/Result';
import '@/lib/db/models/Game';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Lists recent published draw results, most recent first. */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    const results = await Result.find({ status: 'published' })
      .sort({ drawTime: -1 })
      .limit(limit)
      .populate('game', 'name type')
      .lean();

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('List results error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load results' },
      { status: 500 }
    );
  }
}
