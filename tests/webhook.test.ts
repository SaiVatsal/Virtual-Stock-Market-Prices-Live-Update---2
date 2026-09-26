import { describe, it, expect, beforeEach } from 'vitest';
import {
  processWebhookSignal,
  getHistoricalSignalWinRate,
  getSignals,
  clearSignalsForTest
} from '../src/lib/signals-service';
import { resetStoreForTest } from '../src/lib/market-engine';

describe('TradingView Webhook & Signal Analytics', () => {
  beforeEach(() => {
    resetStoreForTest(100000);
    clearSignalsForTest();
  });

  it('processes incoming SMC alert payload and computes empirical win rate with contextual note', async () => {
    const payload = {
      symbol: 'XAUUSD' as const,
      action: 'BUY' as const,
      price: 2355.0,
      timeframe: '15m',
      strategy: 'SMC_Liquidity_Sweep',
      smc_data: {
        pattern: 'Asian Low Liquidity Sweep into 15m Bullish FVG',
        order_block: 2352.0,
        fvg: '2353.50 - 2354.80',
        target: 2370.0,
        stop: 2348.0,
        bias: 'BULLISH' as const
      }
    };

    const signal = await processWebhookSignal(payload, 'WEBHOOK');

    expect(signal.id).toBeDefined();
    expect(signal.symbol).toBe('XAUUSD');
    expect(signal.action).toBe('BUY');
    expect(signal.winRateStats.sampleCount).toBeGreaterThanOrEqual(10);
    expect(signal.winRateStats.winRate).toBeGreaterThan(0);
    expect(signal.contextNote).toBeDefined();
    expect(signal.contextNote.length).toBeGreaterThan(15);

    const allSignals = getSignals();
    expect(allSignals.length).toBe(1);
    expect(allSignals[0].id).toBe(signal.id);
  });

  it('calculates historical win rate consistently across repeated patterns', () => {
    const stats = getHistoricalSignalWinRate('SMC_Liquidity_Sweep', 'XAUUSD');
    expect(stats.pattern).toBe('SMC_Liquidity_Sweep');
    expect(stats.symbol).toBe('XAUUSD');
    expect(stats.winCount + stats.lossCount).toBe(stats.sampleCount);
    expect(stats.winRate).toBe(Math.round((stats.winCount / stats.sampleCount) * 1000) / 10);
  });
});
