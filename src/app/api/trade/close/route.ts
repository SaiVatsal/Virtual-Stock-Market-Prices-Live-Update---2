import { NextRequest, NextResponse } from 'next/server';
import { closePosition, getPositions, getAccountState, getLatestQuotes, getTradeHistory } from '@/lib/market-engine';
import { generateTradeCritique } from '@/lib/claude';
import { getStore, saveStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { positionId, price } = await req.json();

    if (!positionId) {
      return NextResponse.json({ error: 'positionId is required' }, { status: 400 });
    }

    const closedPosition = closePosition(positionId, price);

    // Asynchronously trigger AI Trade Journal Critique
    try {
      const critique = await generateTradeCritique(closedPosition);
      closedPosition.aiCritique = critique;

      // Update in store
      const store = getStore();
      const histIndex = store.history.findIndex((p) => p.id === closedPosition.id);
      if (histIndex !== -1) {
        store.history[histIndex].aiCritique = critique;
        saveStore(store);
      }
    } catch (aiErr) {
      console.warn('AI critique generation encountered error:', aiErr);
    }

    return NextResponse.json({
      success: true,
      position: closedPosition,
      positions: getPositions(),
      account: getAccountState(),
      quotes: getLatestQuotes(),
      history: getTradeHistory(),
      message: `Position closed with ${closedPosition.profit >= 0 ? '+' : ''}$${closedPosition.profit.toFixed(2)} (${closedPosition.profitPips >= 0 ? '+' : ''}${closedPosition.profitPips.toFixed(1)} pips)`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
