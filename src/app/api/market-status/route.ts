import { NextRequest, NextResponse } from 'next/server';
import { getMarketScheduleInfo } from '@/lib/market-schedule';
import { getStore, saveStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = getStore();
  const schedule = getMarketScheduleInfo();
  return NextResponse.json({
    schedule,
    marketMode: store.settings.marketMode || 'WEEKEND_OTC_PRACTICE',
    exnessAccount: {
      id: store.settings.exnessAccountId || 'EX-9482104',
      server: store.settings.exnessServer || 'Exness-Trial2',
      type: store.settings.exnessAccountType || 'PRO',
      leverage: store.account.leverage || 200
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const { marketMode } = await req.json();
    const store = getStore();
    if (marketMode === 'REAL_MARKET_HOURS' || marketMode === 'WEEKEND_OTC_PRACTICE') {
      store.settings.marketMode = marketMode;
      saveStore(store);
    }
    return NextResponse.json({ success: true, marketMode: store.settings.marketMode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
