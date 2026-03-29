import { NextRequest } from 'next/server';
import { pipelineEmitter } from '../../../../../pipeline/orchestrator';

/**
 * GET /api/check/stream?session={session_id}
 *
 * Server-Sent Events (SSE) stream for pipeline progress updates.
 * Client opens an EventSource to this endpoint after starting a pipeline.
 */
export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session');

  if (!session_id) {
    return new Response('Missing session parameter', { status: 400 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Listen for events specific to this session
      const listener = (event: any) => {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        // Close stream when pipeline completes or fails
        if (event.event === 'complete' || event.event === 'error') {
          pipelineEmitter.removeListener(session_id, listener);
          controller.close();
        }
      };

      pipelineEmitter.on(session_id, listener);

      // Clean up if client disconnects
      req.signal.addEventListener('abort', () => {
        pipelineEmitter.removeListener(session_id, listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
