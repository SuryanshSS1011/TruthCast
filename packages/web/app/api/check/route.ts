import { NextRequest, NextResponse } from 'next/server';
import { startPipeline } from '../../../../pipeline/orchestrator';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

/**
 * POST /api/check
 *
 * Starts a new fact-checking pipeline for a claim.
 * Returns a session_id that can be used to stream progress via SSE.
 *
 * Rate limit: 1 request per IP per 5 seconds
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 1 request per IP per 5 seconds
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(clientIp, 1, 5000);

    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before submitting another claim.',
          retry_after: resetIn
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetIn),
            'X-RateLimit-Limit': '1',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateLimit.resetAt / 1000)),
          }
        }
      );
    }

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

    return NextResponse.json(
      { session_id },
      {
        headers: {
          'X-RateLimit-Limit': '1',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.floor(rateLimit.resetAt / 1000)),
        }
      }
    );
  } catch (error: any) {
    console.error('Error starting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to start pipeline' },
      { status: 500 }
    );
  }
}
