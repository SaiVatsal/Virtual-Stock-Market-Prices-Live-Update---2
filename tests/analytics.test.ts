import { describe, it, expect } from 'vitest';
import { calculatePerformanceReport, generateCSVStatement } from '../src/lib/analytics';
import { Position } from '../src/lib/types';

describe('Trading Analytics & Performance Metrics', () => {
  const mockHistory: Position[] = [
    {
      id: 'trade-001',
      symbol: 'XAUUSD',
      side: 'BUY',
      type: 'MARKET',
      lots: 1.0,
      units: 100,
      entryPrice: 4270.00,
      exitPrice: 4280.00,
      currentPrice: 4280.00,
      profit: 1000.00,
      profitPips: 100,
      margin: 2135.00,
      status: 'CLOSED',
      openTime: 1710000000000,
      closeTime: 1710003600000,
      closeReason: 'TAKE_PROFIT',
      aiCritique: {
        tradeId: 'trade-001',
        grade: 'A+',
        summary: 'Excellent execution',
        strengths: ['Aligned with trend'],
        mistakes: [],
        coachingAdvice: 'Keep consistency',
        smcComplianceScore: 95
      }
    },
    {
      id: 'trade-002',
      symbol: 'EURUSD',
      side: 'SELL',
      type: 'MARKET',
      lots: 2.0,
      units: 200000,
      entryPrice: 1.1400,
      exitPrice: 1.1420,
      currentPrice: 1.1420,
      profit: -400.00,
      profitPips: -20,
      margin: 1140.00,
      status: 'CLOSED',
      openTime: 1710004000000,
      closeTime: 1710007200000,
      closeReason: 'STOP_LOSS'
    },
    {
      id: 'trade-003',
      symbol: 'XAUUSD',
      side: 'BUY',
      type: 'MARKET',
      lots: 1.0,
      units: 100,
      entryPrice: 4280.00,
      exitPrice: 4295.00,
      currentPrice: 4295.00,
      profit: 1500.00,
      profitPips: 150,
      margin: 2140.00,
      status: 'CLOSED',
      openTime: 1710008000000,
      closeTime: 1710012000000,
      closeReason: 'TAKE_PROFIT',
      aiCritique: {
        tradeId: 'trade-003',
        grade: 'A',
        summary: 'Solid liquidity grab entry',
        strengths: ['Good entry'],
        mistakes: [],
        coachingAdvice: 'Scale out',
        smcComplianceScore: 90
      }
    }
  ];

  it('calculates correct profit factor, win rate, and net profit', () => {
    const report = calculatePerformanceReport(mockHistory, 100000);

    expect(report.totalTrades).toBe(3);
    expect(report.winningTrades).toBe(2);
    expect(report.losingTrades).toBe(1);
    expect(report.winRate).toBe(66.67);
    expect(report.netProfit).toBe(2100.00);
    expect(report.grossProfit).toBe(2500.00);
    expect(report.grossLoss).toBe(400.00);
    expect(report.profitFactor).toBe(6.25);
    expect(report.largestWin).toBe(1500.00);
    expect(report.largestLoss).toBe(-400.00);
  });

  it('generates chronological equity curve data points', () => {
    const report = calculatePerformanceReport(mockHistory, 100000);

    expect(report.equityCurve.length).toBe(4); // Start point + 3 trades
    expect(report.equityCurve[0].balance).toBe(100000);
    expect(report.equityCurve[1].balance).toBe(101000);
    expect(report.equityCurve[2].balance).toBe(100600);
    expect(report.equityCurve[3].balance).toBe(102100);
  });

  it('generates valid CSV statement text', () => {
    const csv = generateCSVStatement(mockHistory, {
      id: 'EX-9482104',
      server: 'Exness-Trial2',
      currency: 'USD',
      balance: 102100
    });

    expect(csv).toContain('Ticket,Symbol,Type,Lots,OpenTime,CloseTime,EntryPrice,ExitPrice,Profit,ProfitPips,CloseReason,AIGrade');
    expect(csv).toContain('XAUUSD');
    expect(csv).toContain('EURUSD');
    expect(csv).toContain('1000.00');
    expect(csv).toContain('A+');
  });
});
