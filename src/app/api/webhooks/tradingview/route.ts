import { NextRequest, NextResponse } from 'next/server';
import { processWebhookSignal } from '@/lib/signals-service';
import { WebhookAlertPayload } from '@/lib/types';
import { getStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    let payload: WebhookAlertPayload;

    const rawBody = await req.text();
    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ error: 'Empty payload body' }, { status: 400 });
    }

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Optional secret check if configured by user
    const store = getStore();
    const expectedSecret = store.settings.webhookSecret || process.env.TRADINGVIEW_WEBHOOK_SECRET;
    if (expectedSecret && payload.secret && payload.secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook secret' }, { status: 401 });
    }

    if (!payload.symbol || !payload.action || !payload.price) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: symbol, action, price' },
        { status: 422 }
      );
    }

    const signal = await processWebhookSignal(payload, 'WEBHOOK');

    return NextResponse.json({
      success: true,
      message: 'TradingView alert processed successfully',
      signal
    });
  } catch (err: any) {
    console.error('TradingView webhook error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/webhooks/tradingview',
    method: 'POST',
    description: 'TradingView SMC/Key-Levels Webhook Ingestion Service'
  });
}
