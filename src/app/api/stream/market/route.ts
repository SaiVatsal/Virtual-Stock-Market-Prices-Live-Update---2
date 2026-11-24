import { NextRequest } from 'next/server';
import { getLatestQuotes, getAccountState, getPositions, getTradeHistory } from '@/lib/market-engine';
import { refreshLiveMarket } from '@/lib/oanda';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const cookieUserId = req.cookies.get('nexus_user_id')?.value;
  const urlUserId = req.nextUrl.searchParams.get('userId');
  const userId = urlUserId || cookieUserId || 'admin';

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      // Send immediate initial snapshot
      try {
        const initialData = JSON.stringify({
          type: 'SNAPSHOT',
          quotes: getLatestQuotes(),
          account: getAccountState(userId),
          positions: getPositions(userId),
          history: getTradeHistory(userId),
          timestamp: Date.now()
        });
        controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));
      } catch {
        // Stream aborted
        return;
      }

      // Interval ticker pushing updates every 1000ms
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        try {
          await refreshLiveMarket();

          const payload = JSON.stringify({
            type: 'TICK',
            quotes: getLatestQuotes(),
            account: getAccountState(userId),
            positions: getPositions(userId),
            history: getTradeHistory(userId),
            timestamp: Date.now()
          });

          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          isClosed = true;
          clearInterval(interval);
          try {
            controller.close();
          } catch {}
        }
      }, 1000);

      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
