import { NextRequest, NextResponse } from 'next/server';
import { getSignals, processWebhookSignal } from '@/lib/signals-service';
import { WebhookAlertPayload } from '@/lib/types';
import { getLatestQuotes } from '@/lib/market-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const signals = getSignals();
  return NextResponse.json({ signals });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let payload: WebhookAlertPayload = body;

    // If payload is empty or requested as random simulation
    if (!payload.symbol || !payload.action) {
      const quotes = getLatestQuotes();
      const symbols = ['XAUUSD', 'EURUSD', 'BTCUSD'] as const;
      const chosen = symbols[Math.floor(Math.random() * symbols.length)];
      const quote = quotes[chosen];
      const action = Math.random() > 0.5 ? 'BUY' : 'SELL';

      payload = {
        symbol: chosen,
        action,
        price: action === 'BUY' ? quote.ask : quote.bid,
        timeframe: '15m',
        strategy: 'SMC_Liquidity_Sweep',
        smc_data: {
          pattern:
            action === 'BUY'
              ? 'Asian Low Liquidity Raid into Bullish H1 Order Block'
              : 'London High Liquidity Sweep into Bearish FVG',
          key_level: action === 'BUY' ? quote.bid - 2.5 : quote.ask + 2.5,
          bias: action === 'BUY' ? 'BULLISH' : 'BEARISH'
        }
      };
    }

    const signal = await processWebhookSignal(payload, 'SIMULATOR');
    return NextResponse.json({ success: true, signal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
