import { NextResponse } from 'next/server';
import { getStats } from '@truthcast/pipeline/db/init';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { total: 0, caught: 0, unique_claims: 0 },
      { status: 500 }
    );
  }
}
