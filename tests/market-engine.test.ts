import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetStoreForTest,
  executeOrder,
  closePosition,
  getAccountState,
  getPositions,
  getTradeHistory,
  updateMarketPrices,
  getLatestQuotes
} from '../src/lib/market-engine';

describe('Market Engine & OMS', () => {
  beforeEach(() => {
    resetStoreForTest(100000, 100);
  });

  it('opens a buy position on XAUUSD, calculates margin, unrealized P&L and closes with profit', () => {
    updateMarketPrices({
      XAUUSD: {
        symbol: 'XAUUSD',
        bid: 2350.0,
        ask: 2350.2,
        spread: 0.2,
        high24h: 2365.0,
        low24h: 2335.0,
        change24h: 0.65,
        timestamp: Date.now()
      }
    });

    const pos = executeOrder({
      symbol: 'XAUUSD',
      side: 'BUY',
      type: 'MARKET',
      lots: 1.0,
      takeProfit: 2370.0,
      stopLoss: 2340.0
    });

    expect(pos.status).toBe('OPEN');
    expect(pos.entryPrice).toBe(2350.2);
    expect(pos.lots).toBe(1.0);
    // 1 Lot XAUUSD = 100 oz. Margin with 100x leverage = (1 * 100 * 2350.2) / 100 = 2350.2
    expect(pos.margin).toBeCloseTo(2350.2, 1);

    // Initial state check - includes immediate spread difference of -20 (bid 2350.0 vs ask 2350.2)
    let state = getAccountState();
    expect(state.marginUsed).toBeCloseTo(2350.2, 1);
    expect(state.unrealizedPnL).toBeCloseTo(-20.0, 1);
    expect(state.freeMargin).toBeCloseTo(100000 - 20 - 2350.2, 1);

    // Price rises to 2360.0
    updateMarketPrices({
      XAUUSD: {
        symbol: 'XAUUSD',
        bid: 2360.0,
        ask: 2360.2,
        spread: 0.2,
        high24h: 2365.0,
        low24h: 2335.0,
        change24h: 1.1,
        timestamp: Date.now()
      }
    });

    state = getAccountState();
    // For BUY: (current bid 2360.0 - entry ask 2350.2) * 100 = +980.0
    expect(state.unrealizedPnL).toBeCloseTo(980.0, 1);
    expect(state.equity).toBeCloseTo(100980.0, 1);

    // Close position
    const closed = closePosition(pos.id);
    expect(closed.status).toBe('CLOSED');
    expect(closed.profit).toBeCloseTo(980.0, 1);
    expect(closed.exitPrice).toBe(2360.0);

    const afterCloseState = getAccountState();
    expect(afterCloseState.balance).toBeCloseTo(100980.0, 1);
    expect(afterCloseState.marginUsed).toBe(0);
    expect(afterCloseState.unrealizedPnL).toBe(0);
    expect(getPositions().length).toBe(0);
    expect(getTradeHistory().length).toBe(1);
  });

  it('triggers Stop Loss automatically on market price update', () => {
    updateMarketPrices({
      EURUSD: {
        symbol: 'EURUSD',
        bid: 1.0850,
        ask: 1.0851,
        spread: 0.0001,
        high24h: 1.0890,
        low24h: 1.0820,
        change24h: 0.15,
        timestamp: Date.now()
      }
    });

    const pos = executeOrder({
      symbol: 'EURUSD',
      side: 'BUY',
      type: 'MARKET',
      lots: 2.0, // 200,000 units
      stopLoss: 1.0830,
      takeProfit: 1.0900
    });

    expect(pos.status).toBe('OPEN');

    // Market dumps below Stop Loss to 1.0825
    updateMarketPrices({
      EURUSD: {
        symbol: 'EURUSD',
        bid: 1.0825,
        ask: 1.0826,
        spread: 0.0001,
        high24h: 1.0890,
        low24h: 1.0820,
        change24h: -0.3,
        timestamp: Date.now()
      }
    });

    // Position should have auto-closed at Stop Loss
    expect(getPositions().length).toBe(0);
    const history = getTradeHistory();
    expect(history.length).toBe(1);
    expect(history[0].closeReason).toBe('STOP_LOSS');
    expect(history[0].exitPrice).toBe(1.0830);
    // (1.0830 - 1.0851) * 200,000 = -420.0
    expect(history[0].profit).toBeCloseTo(-420.0, 1);
  });
});
