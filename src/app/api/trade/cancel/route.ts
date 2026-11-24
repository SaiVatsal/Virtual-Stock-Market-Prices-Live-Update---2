import { NextRequest, NextResponse } from 'next/server';
import { cancelOrder, getPositions, getAccountState, getLatestQuotes, getTradeHistory } from '@/lib/market-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    const cookieUserId = req.cookies.get('nexus_user_id')?.value;
    const headerUserId = req.headers.get('x-user-id');
    const userId = body.userId || cookieUserId || headerUserId || 'admin';

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const cancelled = cancelOrder(orderId, userId);

    return NextResponse.json({
      success: true,
      order: cancelled,
      positions: getPositions(userId),
      account: getAccountState(userId),
      quotes: getLatestQuotes(),
      history: getTradeHistory(userId),
      message: `Order ${orderId} cancelled successfully`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
