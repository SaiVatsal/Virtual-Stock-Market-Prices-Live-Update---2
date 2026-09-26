import { NextRequest, NextResponse } from 'next/server';
import { modifyPosition } from '@/lib/market-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { positionId, stopLoss, takeProfit, entryPrice } = body;

    if (!positionId) {
      return NextResponse.json({ error: 'Missing positionId' }, { status: 400 });
    }

    const updated = modifyPosition(positionId, {
      stopLoss: stopLoss !== undefined ? (stopLoss === null ? null : parseFloat(stopLoss)) : undefined,
      takeProfit: takeProfit !== undefined ? (takeProfit === null ? null : parseFloat(takeProfit)) : undefined,
      entryPrice: entryPrice !== undefined ? parseFloat(entryPrice) : undefined
    });

    return NextResponse.json({
      success: true,
      position: updated,
      message: `Updated order ${positionId} parameters`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
