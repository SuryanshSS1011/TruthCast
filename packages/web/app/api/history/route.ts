import { NextResponse } from 'next/server';
import { db } from '@truthcast/pipeline/db/init';

export const dynamic = 'force-dynamic';

interface VerdictRow {
  claim_hash: string;
  claim_text: string;
  verdict_label: string;
  confidence: number;
  checked_at: number;
  tx_hash: string | null;
}

export async function GET() {
  try {
    const verdicts = db
      .prepare(
        `SELECT claim_hash, claim_text, verdict_label, confidence, checked_at, tx_hash
         FROM verdicts
         ORDER BY checked_at DESC
         LIMIT 50`
      )
      .all() as VerdictRow[];

    const totalCount = db
      .prepare('SELECT COUNT(*) as count FROM verdicts')
      .get() as { count: number };

    return NextResponse.json({
      verdicts,
      totalCount: totalCount.count,
    });
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', verdicts: [], totalCount: 0 },
      { status: 500 }
    );
  }
}
