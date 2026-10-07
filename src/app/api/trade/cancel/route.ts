import { NextRequest, NextResponse } from 'next/server';
import { cancelOrder, getPositions, getAccountState, getLatestQuotes, getTradeHistory } from '@/lib/market-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const cancelled = cancelOrder(orderId);

    return NextResponse.json({
      success: true,
      order: cancelled,
      positions: getPositions(),
      account: getAccountState(),
      quotes: getLatestQuotes(),
      history: getTradeHistory(),
      message: `Order ${orderId} cancelled successfully`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
