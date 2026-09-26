import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetStoreForTest,
  executeOrder,
  closePosition,
  getAccountState,
  getPositions,
  getTradeHistory,
  updateMarketPrices
} from '../src/lib/market-engine';
import { processWebhookSignal, getSignals } from '../src/lib/signals-service';
import { auditRiskBehavior } from '../src/lib/risk-engine';
import { generateTradeCritique, generateMacroBriefing } from '../src/lib/claude';

describe('End-to-End Trading Desk Workflow', () => {
  beforeEach(() => {
    resetStoreForTest(100000);
  });

  it('completes full institutional lifecycle: trade -> close -> AI critique -> TV webhook -> Risk Coach -> Macro', async () => {
    // 1. Initial market price
    updateMarketPrices({
      XAUUSD: {
        symbol: 'XAUUSD',
        bid: 2350.0,
        ask: 2350.25,
        spread: 0.25,
        timestamp: Date.now()
      }
    });

    // 2. Open 1 lot BUY on Gold
    const order = executeOrder({
      symbol: 'XAUUSD',
      side: 'BUY',
      type: 'MARKET',
      lots: 1.0,
      stopLoss: 2335.0,
      takeProfit: 2375.0,
      smcContext: {
        pattern: 'Asian Low Sweep',
        timeframe: '15m'
      }
    });
    expect(order.status).toBe('OPEN');
    expect(getPositions().length).toBe(1);

    // 3. Price jumps $15 in profit
    updateMarketPrices({
      XAUUSD: {
        symbol: 'XAUUSD',
        bid: 2365.25,
        ask: 2365.50,
        spread: 0.25,
        timestamp: Date.now()
      }
    });

    let state = getAccountState();
    expect(state.unrealizedPnL).toBeCloseTo(1500.0, 1);

    // 4. Close trade
    const closed = closePosition(order.id);
    expect(closed.status).toBe('CLOSED');
    expect(closed.profit).toBeCloseTo(1500.0, 1);
    expect(getTradeHistory().length).toBe(1);

    // 5. Generate AI Trade Journal Critique
    const critique = await generateTradeCritique(closed);
    expect(critique.grade).toMatch(/^[A-F](\+)?$/);
    expect(critique.confluenceScore).toBeGreaterThanOrEqual(1);
    expect(critique.smcAnalysis.liquiditySweepVerdict).toBeDefined();
    expect(critique.actionableLesson).toBeDefined();

    // 6. Ingest incoming TradingView Webhook alert
    const webhookPayload = {
      symbol: 'XAUUSD' as const,
      action: 'BUY' as const,
      price: 2366.0,
      timeframe: '15m',
      strategy: 'SMC_Liquidity_Sweep',
      smc_data: {
        pattern: 'Bullish H1 Order Block Expansion',
        key_level: 2350.0,
        bias: 'BULLISH' as const
      }
    };

    const signal = await processWebhookSignal(webhookPayload, 'WEBHOOK');
    expect(signal.winRateStats.winRate).toBeGreaterThan(0);
    expect(signal.contextNote).toBeDefined();
    expect(getSignals().length).toBeGreaterThanOrEqual(1);

    // 7. Audit Risk Coach
    const history = getTradeHistory();
    const riskReport = auditRiskBehavior(history);
    expect(riskReport.riskScore).toBeGreaterThanOrEqual(80);
    expect(riskReport.status).toBe('EXCELLENT');
    expect(riskReport.coachAdvice.length).toBeGreaterThan(0);

    // 8. Generate Macro Briefing
    const macro = await generateMacroBriefing();
    expect(macro.events.length).toBeGreaterThan(0);
    expect(macro.briefing.goldOutlook).toBeDefined();
    expect(macro.briefing.eurOutlook).toBeDefined();
  });
});
