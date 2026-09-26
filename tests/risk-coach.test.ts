import { describe, it, expect } from 'vitest';
import { auditRiskBehavior } from '../src/lib/risk-engine';
import { Position } from '../src/lib/types';

describe('Risk Coach Behavioral Engine', () => {
  it('detects revenge trading when a trader opens a position within 5 minutes of a loss with escalated size', () => {
    const now = Date.now();
    const trades: Position[] = [
      {
        id: 't2',
        symbol: 'XAUUSD',
        side: 'BUY',
        type: 'MARKET',
        lots: 3.0, // 3x position creep
        units: 300,
        entryPrice: 2351.0,
        currentPrice: 2351.0,
        profit: 0,
        profitPips: 0,
        margin: 7053,
        status: 'OPEN',
        openTime: now - 60000 // opened 1 min ago
      },
      {
        id: 't1',
        symbol: 'XAUUSD',
        side: 'BUY',
        type: 'MARKET',
        lots: 1.0,
        units: 100,
        entryPrice: 2360.0,
        currentPrice: 2350.0,
        exitPrice: 2350.0,
        profit: -1000.0, // Lost $1,000
        profitPips: -100,
        margin: 2360,
        status: 'CLOSED',
        openTime: now - 360000,
        closeTime: now - 120000 // closed 2 mins ago
      }
    ];

    const report = auditRiskBehavior(trades);
    expect(report.flags).toContain('REVENGE_TRADING');
    expect(report.flags).toContain('POSITION_SIZE_CREEP');
    expect(report.riskScore).toBeLessThan(75);
    expect(report.activeWarnings.length).toBeGreaterThanOrEqual(1);
    expect(report.coachAdvice.length).toBeGreaterThan(0);
  });

  it('awards high risk health score to disciplined trading history with stable sizing', () => {
    const now = Date.now();
    const trades: Position[] = [
      {
        id: 't1',
        symbol: 'EURUSD',
        side: 'BUY',
        type: 'MARKET',
        lots: 0.5,
        units: 50000,
        entryPrice: 1.0850,
        exitPrice: 1.0880,
        profit: 150.0,
        profitPips: 30,
        margin: 542.5,
        status: 'CLOSED',
        openTime: now - 86400000,
        closeTime: now - 82800000
      },
      {
        id: 't2',
        symbol: 'EURUSD',
        side: 'SELL',
        type: 'MARKET',
        lots: 0.5,
        units: 50000,
        entryPrice: 1.0880,
        exitPrice: 1.0860,
        profit: 100.0,
        profitPips: 20,
        margin: 544,
        status: 'CLOSED',
        openTime: now - 43200000,
        closeTime: now - 39600000
      }
    ];

    const report = auditRiskBehavior(trades);
    expect(report.status).toBe('EXCELLENT');
    expect(report.riskScore).toBeGreaterThanOrEqual(85);
    expect(report.flags.length).toBe(0);
  });
});
