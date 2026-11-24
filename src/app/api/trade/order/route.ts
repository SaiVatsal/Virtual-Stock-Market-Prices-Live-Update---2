import { NextRequest, NextResponse } from 'next/server';
import { executeOrder, getPositions, getAccountState, getLatestQuotes, getTradeHistory } from '@/lib/market-engine';
import { OrderRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const queryUserId = req.nextUrl.searchParams.get('userId');
  const cookieUserId = req.cookies.get('nexus_user_id')?.value;
  const headerUserId = req.headers.get('x-user-id');
  const userId = queryUserId || cookieUserId || headerUserId || 'admin';

  return NextResponse.json({
    success: true,
    positions: getPositions(userId),
    account: getAccountState(userId),
    quotes: getLatestQuotes(),
    history: getTradeHistory(userId),
    timestamp: Date.now()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest & { userId?: string } = await req.json();

    const cookieUserId = req.cookies.get('nexus_user_id')?.value;
    const headerUserId = req.headers.get('x-user-id');
    const userId = body.userId || cookieUserId || headerUserId || 'admin';

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

    const position = executeOrder(body, userId);

    return NextResponse.json({
      success: true,
      position,
      positions: getPositions(userId),
      account: getAccountState(userId),
      quotes: getLatestQuotes(),
      history: getTradeHistory(userId),
      message: `Filled ${body.side} ${body.lots} lots on ${body.symbol} at $${position.entryPrice.toFixed(2)}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
