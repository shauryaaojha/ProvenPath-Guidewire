import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const speedParam = searchParams.get('speed') || '3';
  const speed = Math.max(0.5, Math.min(20, parseFloat(speedParam) || 3));
  const instant = searchParams.get('instant') === 'true';
  const afterSeq = parseInt(searchParams.get('after') || '0', 10);
  const pauseAtBlocked = searchParams.get('pauseAtBlocked') === 'true';

  // Locate the fixture file
  let fixturePath = path.join(process.cwd(), 'public', 'fixtures', 'events_demo_run.jsonl');
  if (!fs.existsSync(fixturePath)) {
    fixturePath = path.join(process.cwd(), '..', 'fixtures', 'events_demo_run.jsonl');
  }

  if (!fs.existsSync(fixturePath)) {
    return new Response(JSON.stringify({ error: 'Fixture file not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fileContent = fs.readFileSync(fixturePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let previousTs = 0;

      for (let i = 0; i < lines.length; i++) {
        try {
          const event = JSON.parse(lines[i]);
          if (event.seq <= afterSeq) {
            continue;
          }

          const currentTs = new Date(event.ts).getTime();

          if (!instant && previousTs > 0 && currentTs > previousTs) {
            let delayMs = (currentTs - previousTs) / speed;
            // Cap reasonable delays for demo fluidity
            if (delayMs > 1200) delayMs = 1200;
            if (delayMs < 20) delayMs = 20;

            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else if (!instant && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 30 / speed));
          }

          previousTs = currentTs;

          // Format SSE frame
          const sseChunk = `id: ${event.seq}\nevent: message\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseChunk));

          // Pause at blocked if requested so the user can see the red node and blocked banner
          if (pauseAtBlocked && event.type === 'gate.blocked') {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch {
          // ignore parsing error on corrupted line
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
