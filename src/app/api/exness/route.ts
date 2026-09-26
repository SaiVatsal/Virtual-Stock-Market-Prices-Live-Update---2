import { NextRequest, NextResponse } from 'next/server';
import { getExnessStatus, connectExnessAccount, EXNESS_SYMBOLS } from '@/lib/exness-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getExnessStatus();
  return NextResponse.json({
    status,
    symbols: EXNESS_SYMBOLS,
    platform: 'Exness MetaTrader 5 Web Gateway',
    timestamp: Date.now()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, server, password, accountType } = body;

    if (!login || !server) {
      return NextResponse.json(
        { error: 'Exness login ID and server name are required' },
        { status: 400 }
      );
    }

    const result = await connectExnessAccount({
      login,
      server,
      password,
      accountType
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
