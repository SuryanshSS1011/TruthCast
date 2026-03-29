import { NextResponse } from 'next/server';
import { db } from '@truthcast/pipeline/db/init';

export async function GET() {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN verdict_label IN ('FALSE','MOSTLY_FALSE') THEN 1 ELSE 0 END) as caught,
        COUNT(DISTINCT claim_hash) as unique_claims
      FROM verdicts
    `).get() as { total: number; caught: number; unique_claims: number };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { total: 0, caught: 0, unique_claims: 0 },
      { status: 500 }
    );
  }
}
