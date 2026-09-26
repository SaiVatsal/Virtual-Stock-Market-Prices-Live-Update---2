import { NextRequest, NextResponse } from 'next/server';
import { getTradeHistory } from '@/lib/market-engine';
import { generateTradeCritique } from '@/lib/claude';
import { getStore, saveStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const history = getTradeHistory();
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  try {
    const { tradeId } = await req.json();
    const store = getStore();
    const trade = store.history.find((t) => t.id === tradeId);

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    const critique = await generateTradeCritique(trade);
    trade.aiCritique = critique;
    saveStore(store);

    return NextResponse.json({ success: true, critique });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
