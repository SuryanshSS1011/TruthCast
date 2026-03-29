import { NextRequest, NextResponse } from 'next/server';
import { startPipeline } from '../../../../pipeline/orchestrator';

/**
 * POST /api/check
 *
 * Starts a new fact-checking pipeline for a claim.
 * Returns a session_id that can be used to stream progress via SSE.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claim } = body;

    if (!claim || typeof claim !== 'string') {
      return NextResponse.json(
        { error: 'Claim text is required' },
        { status: 400 }
      );
    }

    if (claim.length < 10) {
      return NextResponse.json(
        { error: 'Claim must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (claim.length > 2000) {
      return NextResponse.json(
        { error: 'Claim must be less than 2000 characters' },
        { status: 400 }
      );
    }

    // Start the pipeline asynchronously
    const session_id = startPipeline(claim);

    return NextResponse.json({ session_id });
  } catch (error: any) {
    console.error('Error starting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to start pipeline' },
      { status: 500 }
    );
  }
}
