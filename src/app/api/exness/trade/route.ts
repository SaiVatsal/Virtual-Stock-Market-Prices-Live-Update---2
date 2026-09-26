import { NextRequest, NextResponse } from 'next/server';
import { executeExnessOrder } from '@/lib/exness-service';
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

    const position = await executeExnessOrder(body);

    return NextResponse.json({
      success: true,
      position,
      message: `[Exness Gateway] Order executed: ${body.side} ${body.lots} lots on ${body.symbol} @ ${position.entryPrice}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
