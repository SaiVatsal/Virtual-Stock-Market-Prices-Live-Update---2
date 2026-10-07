import { NextRequest, NextResponse } from 'next/server';
import { executeOrder, getPositions, getAccountState, getLatestQuotes } from '@/lib/market-engine';
import { OrderRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    positions: getPositions(),
    account: getAccountState(),
    quotes: getLatestQuotes(),
    timestamp: Date.now()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json();

    if (!body.symbol || !body.side || !body.lots) {
      return NextResponse.json(
        { error: 'Missing required parameters: symbol, side, lots' },
        { status: 400 }
      );
    }

    if (body.lots <= 0 || body.lots > 100) {
      return NextResponse.json(
        { error: 'Lot size must be between 0.01 and 100' },
        { status: 400 }
      );
    }

    const position = executeOrder(body);

    return NextResponse.json({
      success: true,
      position,
      positions: getPositions(),
      account: getAccountState(),
      quotes: getLatestQuotes(),
      message: `Filled ${body.side} ${body.lots} lots on ${body.symbol} at $${position.entryPrice.toFixed(2)}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
