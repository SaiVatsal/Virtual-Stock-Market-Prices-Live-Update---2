import { describe, it, expect } from 'vitest';
import { AccountState, Position, SignalItem, AIJournalCritique, RiskCoachReport } from '../src/lib/types';

describe('Core Types', () => {
  it('validates account structure defaults', () => {
    const account: AccountState = {
      balance: 100000,
      equity: 100000,
      marginUsed: 0,
      freeMargin: 100000,
      marginLevel: 0,
      unrealizedPnL: 0,
      realizedPnL: 0,
      leverage: 100,
      currency: 'USD'
    };
    expect(account.balance).toBe(100000);
    expect(account.freeMargin).toBe(100000);
    expect(account.leverage).toBe(100);
  });

  it('validates position interface', () => {
    const pos: Position = {
      id: 'pos_123',
      symbol: 'XAUUSD',
      side: 'BUY',
      type: 'MARKET',
      lots: 1.0,
      units: 100,
      entryPrice: 2350.50,
      currentPrice: 2355.00,
      profit: 450.00,
      profitPips: 45.0,
      margin: 2350.50,
      status: 'OPEN',
      openTime: 1710000000000
    };
    expect(pos.symbol).toBe('XAUUSD');
    expect(pos.profit).toBe(450.00);
  });
});
