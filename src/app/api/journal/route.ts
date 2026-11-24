import { NextRequest, NextResponse } from 'next/server';
import { getTradeHistory } from '@/lib/market-engine';
import { generateTradeCritique } from '@/lib/claude';
import { getStore, saveStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const queryUserId = req.nextUrl.searchParams.get('userId');
  const cookieUserId = req.cookies.get('nexus_user_id')?.value;
  const headerUserId = req.headers.get('x-user-id');
  const userId = queryUserId || cookieUserId || headerUserId || 'admin';

  const history = getTradeHistory(userId);
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tradeId } = body;
    const cookieUserId = req.cookies.get('nexus_user_id')?.value;
    const headerUserId = req.headers.get('x-user-id');
    const userId = body.userId || cookieUserId || headerUserId || 'admin';

    const store = getStore(userId);
    const trade = store.history.find((t) => t.id === tradeId);

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    const critique = await generateTradeCritique(trade);
    trade.aiCritique = critique;
    saveStore(store, userId);

    return NextResponse.json({ success: true, critique });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
