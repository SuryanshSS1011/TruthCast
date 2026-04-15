import { NextResponse } from 'next/server';
import { getAllVerdicts, getStats } from '@truthcast/pipeline/db/init';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [verdicts, stats] = await Promise.all([
      getAllVerdicts(50),
      getStats()
    ]);

    // Map verdicts to the expected format
    const formattedVerdicts = verdicts.map(v => ({
      claim_hash: v.claim_hash,
      claim_text: v.claim_text,
      verdict_label: v.verdict,
      confidence: v.confidence,
      checked_at: v.checked_at,
      tx_hash: v.tx_hash || null
    }));

    return NextResponse.json({
      verdicts: formattedVerdicts,
      totalCount: stats.total,
    });
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', verdicts: [], totalCount: 0 },
      { status: 500 }
    );
  }
}
