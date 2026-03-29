import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

// Global pending claims map - shared across routes via globalThis
const globalForClaims = globalThis as unknown as {
  pendingClaims: Map<string, string> | undefined;
};
const pendingClaims = globalForClaims.pendingClaims ?? new Map<string, string>();
if (!globalForClaims.pendingClaims) {
  globalForClaims.pendingClaims = pendingClaims;
}

/**
 * POST /api/check
 *
 * Stores a claim for processing and returns a session_id.
 * The actual pipeline runs when the client connects to the stream endpoint.
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

    // Generate session ID and store claim
    const session_id = uuidv4();
    pendingClaims.set(session_id, claim);

    // Clean up old pending claims (older than 5 minutes)
    setTimeout(() => {
      pendingClaims.delete(session_id);
    }, 5 * 60 * 1000);

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
    console.error('Error storing claim:', error);
    return NextResponse.json(
      { error: 'Failed to process claim' },
      { status: 500 }
    );
  }
}
