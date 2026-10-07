import { describe, it, expect, beforeEach } from 'vitest';
import { getExnessStatus, connectExnessAccount, executeExnessOrder, EXNESS_SYMBOLS } from '../src/lib/exness-service';
import { resetStoreForTest } from '../src/lib/market-engine';

describe('Exness Platform Backend Service', () => {
  beforeEach(() => {
    resetStoreForTest(100000, 200);
  });

  it('retrieves initial Exness account status with low latency', () => {
    const status = getExnessStatus();
    expect(status.isConnected).toBe(true);
    expect(status.login).toBeDefined();
    expect(status.server).toBeDefined();
    expect(status.lastPingMs).toBeGreaterThan(0);
    expect(status.lastPingMs).toBeLessThan(50);
  });

  it('connects to custom Exness account credentials and persists settings', async () => {
    const res = await connectExnessAccount({
      login: '14920482',
      server: 'Exness-Real19',
      password: 'SamplePassword123!',
      accountType: 'RAW_SPREAD'
    });

    expect(res.success).toBe(true);
    expect(res.details.login).toBe('14920482');
    expect(res.details.server).toBe('Exness-Real19');
    expect(res.details.accountType).toBe('RAW_SPREAD');

    const updated = getExnessStatus();
    expect(updated.login).toBe('14920482');
    expect(updated.server).toBe('Exness-Real19');
  });

  it('routes order through Exness execution bridge', async () => {
    const order = await executeExnessOrder({
      symbol: 'XAUUSD',
      side: 'BUY',
      type: 'MARKET',
      lots: 1.0,
      stopLoss: 4050.0,
      takeProfit: 4200.0
    });

    expect(order.status).toBe('OPEN');
    expect(order.symbol).toBe('XAUUSD');
    expect(order.smcContext?.pattern).toContain('Exness');
  });

  it('provides Exness symbol specifications', () => {
    expect(EXNESS_SYMBOLS.XAUUSD.exnessSymbol).toBe('XAUUSDm');
    expect(EXNESS_SYMBOLS.EURUSD.exnessSymbol).toBe('EURUSDm');
    expect(EXNESS_SYMBOLS.BTCUSD.exnessSymbol).toBe('BTCUSDm');
  });
});
