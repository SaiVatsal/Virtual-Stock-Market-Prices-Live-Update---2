import { NextRequest, NextResponse } from 'next/server';
import { closePosition, closePositionsByFilter, getPositions, getAccountState, getLatestQuotes, getTradeHistory } from '@/lib/market-engine';
import { generateTradeCritique } from '@/lib/claude';
import { getStore, saveStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { positionId, filter, price } = body;

    const cookieUserId = req.cookies.get('nexus_user_id')?.value;
    const headerUserId = req.headers.get('x-user-id');
    const userId = body.userId || cookieUserId || headerUserId || 'admin';

    // Handle bulk closing by filter ('PROFIT' | 'LOSS' | 'ALL')
    if (filter) {
      if (filter !== 'PROFIT' && filter !== 'LOSS' && filter !== 'ALL') {
        return NextResponse.json(
          { error: 'Invalid filter. Must be PROFIT, LOSS, or ALL' },
          { status: 400 }
        );
      }

      const closed = closePositionsByFilter(filter, userId);
      return NextResponse.json({
        success: true,
        closedCount: closed.length,
        positions: getPositions(userId),
        account: getAccountState(userId),
        quotes: getLatestQuotes(),
        history: getTradeHistory(userId),
        message: `Successfully closed ${closed.length} ${filter.toLowerCase()} position(s)`
      });
    }

    if (!positionId) {
      return NextResponse.json({ error: 'positionId or filter is required' }, { status: 400 });
    }

    const closedPosition = closePosition(positionId, price, userId);

    // Asynchronously trigger AI Trade Journal Critique
    try {
      const critique = await generateTradeCritique(closedPosition);
      closedPosition.aiCritique = critique;

      // Update in store
      const store = getStore(userId);
      const histIndex = store.history.findIndex((p) => p.id === closedPosition.id);
      if (histIndex !== -1) {
        store.history[histIndex].aiCritique = critique;
        saveStore(store, userId);
      }
    } catch (aiErr) {
      console.warn('AI critique generation encountered error:', aiErr);
    }

    return NextResponse.json({
      success: true,
      position: closedPosition,
      positions: getPositions(userId),
      account: getAccountState(userId),
      quotes: getLatestQuotes(),
      history: getTradeHistory(userId),
      message: `Position closed with ${closedPosition.profit >= 0 ? '+' : ''}$${closedPosition.profit.toFixed(2)} (${closedPosition.profitPips >= 0 ? '+' : ''}${closedPosition.profitPips.toFixed(1)} pips)`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
