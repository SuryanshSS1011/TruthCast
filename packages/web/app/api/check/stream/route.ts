import { NextRequest } from 'next/server';

// Access the global pending claims map
const globalForClaims = globalThis as unknown as {
  pendingClaims: Map<string, string> | undefined;
};
const pendingClaims = globalForClaims.pendingClaims ?? new Map<string, string>();

// Runtime check for dynamic import as fallback
let pipelineModule: typeof import('@truthcast/pipeline/orchestrator') | null = null;

async function getPipelineModule() {
  if (!pipelineModule) {
    try {
      pipelineModule = await import('@truthcast/pipeline/orchestrator');
    } catch (error) {
      console.error('Failed to load pipeline module:', error);
      throw error;
    }
  }
  return pipelineModule;
}

/**
 * GET /api/check/stream?session={session_id}
 *
 * Server-Sent Events (SSE) stream for pipeline progress updates.
 * Runs the pipeline and streams events directly to the client.
 */
export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session');

  if (!session_id) {
    return new Response(JSON.stringify({ error: 'Missing session parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get the claim from pending claims
  const claim = pendingClaims.get(session_id);
  if (!claim) {
    // Log for debugging
    console.warn(`Session ${session_id} not found. Pending sessions: ${Array.from(pendingClaims.keys()).join(', ')}`);
    return new Response(JSON.stringify({ error: 'Session not found or expired' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Remove from pending (pipeline is starting)
  pendingClaims.delete(session_id);

  // Create SSE stream
  const encoder = new TextEncoder();
  let streamClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: any) => {
        if (streamClosed) return;
        try {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (e) {
          // Stream might be closed by client
          streamClosed = true;
        }
      };

      const closeStream = () => {
        if (streamClosed) return;
        streamClosed = true;
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      };

      try {
        // Get pipeline module (with fallback for dynamic import)
        const pipeline = await getPipelineModule();

        // Run pipeline with callback for each event
        await pipeline.executePipelineWithCallback(session_id, claim, (event) => {
          sendEvent(event);

          // Close stream when pipeline completes or fails
          if (event.event === 'complete' || event.event === 'error') {
            closeStream();
          }
        });
      } catch (error: any) {
        console.error(`[TruthCast Pipeline Error] Session ${session_id}:`, {
          message: error.message,
          code: error.code,
          isTokenLimit: error.isTokenLimit,
          stack: error.stack,
        });

        // Determine error type for frontend
        let errorType = 'UNKNOWN';
        let userMessage = error.message;

        if (error.isTokenLimit || error.code === 'TOKEN_LIMIT') {
          errorType = 'TOKEN_LIMIT';
          userMessage = 'The AI service has reached its usage limit. Please try again later.';
        } else if (error.code === 'AUTH_ERROR') {
          errorType = 'AUTH_ERROR';
          userMessage = 'API authentication failed. Please contact support.';
        } else if (error.message?.includes('GEMINI') || error.message?.includes('Gemini')) {
          errorType = 'API_ERROR';
        }

        sendEvent({
          session_id,
          event: 'error',
          progress: 0,
          message: `Pipeline failed: ${userMessage}`,
          error_type: errorType,
          error_details: error.message,
        });
        closeStream();
      }
    },
    cancel() {
      // Client disconnected
      streamClosed = true;
      console.log(`Stream cancelled for session ${session_id}`);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
