import { NextRequest, NextResponse } from 'next/server';
import { executeOrder } from '@/lib/market-engine';
import { OrderRequest } from '@/lib/types';

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
      message: `Opened ${body.side} ${body.lots} lots on ${body.symbol} at ${position.entryPrice}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
