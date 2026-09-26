import { NextRequest, NextResponse } from 'next/server';
import { getStore, saveStore } from '@/lib/store';
import { resetStoreForTest } from '@/lib/market-engine';

export async function GET() {
  const store = getStore();
  const settings = store.settings;

  return NextResponse.json({
    hasAnthropicKey: Boolean(settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY),
    maskedAnthropicKey: (settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY)
      ? `${(settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY)!.substring(0, 7)}...${(settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY)!.slice(-4)}`
      : '',
    hasOandaKey: Boolean(settings.oandaApiKey || process.env.OANDA_API_KEY),
    maskedOandaKey: (settings.oandaApiKey || process.env.OANDA_API_KEY)
      ? `${(settings.oandaApiKey || process.env.OANDA_API_KEY)!.substring(0, 6)}...`
      : '',
    oandaAccountId: settings.oandaAccountId || process.env.OANDA_ACCOUNT_ID || '',
    hasTwelveDataKey: Boolean(settings.twelveDataApiKey || process.env.TWELVE_DATA_API_KEY),
    webhookSecret: settings.webhookSecret || '',
    initialBalance: store.account.balance,
    leverage: store.account.leverage,
    exnessAccountId: settings.exnessAccountId || 'EX-9482104',
    exnessServer: settings.exnessServer || 'Exness-Trial2',
    exnessAccountType: settings.exnessAccountType || 'PRO',
    marketMode: settings.marketMode || 'WEEKEND_OTC_PRACTICE'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getStore();

    if (body.anthropicApiKey !== undefined) store.settings.anthropicApiKey = body.anthropicApiKey.trim();
    if (body.oandaApiKey !== undefined) store.settings.oandaApiKey = body.oandaApiKey.trim();
    if (body.oandaAccountId !== undefined) store.settings.oandaAccountId = body.oandaAccountId.trim();
    if (body.twelveDataApiKey !== undefined) store.settings.twelveDataApiKey = body.twelveDataApiKey.trim();
    if (body.webhookSecret !== undefined) store.settings.webhookSecret = body.webhookSecret.trim();
    if (body.exnessAccountId !== undefined) store.settings.exnessAccountId = body.exnessAccountId.trim();
    if (body.exnessServer !== undefined) store.settings.exnessServer = body.exnessServer.trim();
    if (body.exnessPassword !== undefined) store.settings.exnessPassword = body.exnessPassword.trim();
    if (body.exnessAccountType !== undefined) store.settings.exnessAccountType = body.exnessAccountType;
    if (body.marketMode !== undefined) store.settings.marketMode = body.marketMode;

    if (body.resetAccount && body.initialBalance) {
      const balance = parseFloat(body.initialBalance) || 100000;
      const leverage = parseInt(body.leverage, 10) || 200;
      resetStoreForTest(balance, leverage);
    } else {
      if (body.leverage) {
        store.account.leverage = parseInt(body.leverage, 10) || 200;
      }
      saveStore(store);
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
