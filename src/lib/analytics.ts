import { Position, SymbolId } from './types';

export interface EquityCurvePoint {
  tradeIndex: number;
  timestamp: number;
  balance: number;
  equity: number;
  pnl: number;
  symbol?: string;
}

export interface SymbolPerformance {
  symbol: SymbolId;
  trades: number;
  profit: number;
  winCount: number;
  winRate: number;
}

export interface PerformanceReport {
  initialBalance: number;
  currentBalance: number;
  netProfit: number;
  returnOnInitial: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
  avgRiskReward: number;
  expectedPayoff: number;
  maxDrawdownDollars: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  equityCurve: EquityCurvePoint[];
  gradeDistribution: Record<string, number>;
  symbolBreakdown: Record<string, SymbolPerformance>;
}

export function calculatePerformanceReport(
  history: Position[],
  initialBalance: number = 100000,
  currentUnrealizedPnL: number = 0
): PerformanceReport {
  if (history.length === 0) {
    const startPoint: EquityCurvePoint = {
      tradeIndex: 0,
      timestamp: Date.now(),
      balance: initialBalance,
      equity: initialBalance + currentUnrealizedPnL,
      pnl: 0
    };

    return {
      initialBalance,
      currentBalance: initialBalance,
      netProfit: 0,
      returnOnInitial: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: 0,
      largestWin: 0,
      largestLoss: 0,
      avgWin: 0,
      avgLoss: 0,
      avgRiskReward: 0,
      expectedPayoff: 0,
      maxDrawdownDollars: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      equityCurve: [startPoint],
      gradeDistribution: { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 },
      symbolBreakdown: {}
    };
  }

  // Sort chronological by closeTime (or openTime)
  const sorted = [...history].sort((a, b) => (a.closeTime || a.openTime) - (b.closeTime || b.openTime));

  let runningBalance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdownDollars = 0;
  let maxDrawdownPercent = 0;

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let largestWin = 0;
  let largestLoss = 0;

  const returns: number[] = [];
  const gradeDist: Record<string, number> = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  const symbolStats: Record<string, { trades: number; profit: number; wins: number }> = {};

  const equityCurve: EquityCurvePoint[] = [
    {
      tradeIndex: 0,
      timestamp: sorted[0].openTime - 60000,
      balance: initialBalance,
      equity: initialBalance,
      pnl: 0
    }
  ];

  sorted.forEach((trade, idx) => {
    const profit = Math.round(trade.profit * 100) / 100;
    runningBalance = Math.round((runningBalance + profit) * 100) / 100;

    if (runningBalance > peakBalance) {
      peakBalance = runningBalance;
    }
    const currentDrawdown = peakBalance - runningBalance;
    if (currentDrawdown > maxDrawdownDollars) {
      maxDrawdownDollars = currentDrawdown;
      maxDrawdownPercent = peakBalance > 0 ? (currentDrawdown / peakBalance) * 100 : 0;
    }

    if (profit > 0.001) {
      winningTrades++;
      grossProfit += profit;
      if (profit > largestWin) largestWin = profit;
    } else if (profit < -0.001) {
      losingTrades++;
      grossLoss += Math.abs(profit);
      if (profit < largestLoss) largestLoss = profit;
    } else {
      breakevenTrades++;
    }

    const prevBal = equityCurve[idx].balance;
    const tradeReturn = prevBal > 0 ? profit / prevBal : 0;
    returns.push(tradeReturn);

    // Track grades
    if (trade.aiCritique?.grade) {
      const g = trade.aiCritique.grade;
      gradeDist[g] = (gradeDist[g] || 0) + 1;
    }

    // Track symbol breakdown
    if (!symbolStats[trade.symbol]) {
      symbolStats[trade.symbol] = { trades: 0, profit: 0, wins: 0 };
    }
    symbolStats[trade.symbol].trades++;
    symbolStats[trade.symbol].profit += profit;
    if (profit > 0) symbolStats[trade.symbol].wins++;

    equityCurve.push({
      tradeIndex: idx + 1,
      timestamp: trade.closeTime || trade.openTime,
      balance: runningBalance,
      equity: runningBalance, // realized balance at trade close
      pnl: profit,
      symbol: trade.symbol
    });
  });

  const totalTrades = sorted.length;
  const netProfit = Math.round((runningBalance - initialBalance) * 100) / 100;
  const returnOnInitial = Math.round((netProfit / initialBalance) * 10000) / 100;
  const winRate = Math.round((winningTrades / totalTrades) * 10000) / 100;
  const profitFactor =
    grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99.99 : 0;

  const avgWin = winningTrades > 0 ? Math.round((grossProfit / winningTrades) * 100) / 100 : 0;
  const avgLoss = losingTrades > 0 ? Math.round((grossLoss / losingTrades) * 100) / 100 : 0;
  const avgRiskReward = avgLoss > 0 ? Math.round((avgWin / avgLoss) * 100) / 100 : avgWin > 0 ? 3.0 : 1.0;
  const expectedPayoff = Math.round((netProfit / totalTrades) * 100) / 100;

  // Approximate Sharpe Ratio (assuming zero risk-free rate)
  let sharpeRatio = 0;
  if (returns.length > 1) {
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0) {
      sharpeRatio = Math.round((meanReturn / stdDev) * Math.sqrt(252) * 100) / 100;
    }
  }

  // Format symbol breakdown
  const symbolBreakdown: Record<string, SymbolPerformance> = {};
  for (const [sym, s] of Object.entries(symbolStats)) {
    symbolBreakdown[sym] = {
      symbol: sym as SymbolId,
      trades: s.trades,
      profit: Math.round(s.profit * 100) / 100,
      winCount: s.wins,
      winRate: s.trades > 0 ? Math.round((s.wins / s.trades) * 10000) / 100 : 0
    };
  }

  return {
    initialBalance,
    currentBalance: runningBalance,
    netProfit,
    returnOnInitial,
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossLoss: Math.round(grossLoss * 100) / 100,
    profitFactor,
    largestWin,
    largestLoss,
    avgWin,
    avgLoss,
    avgRiskReward,
    expectedPayoff,
    maxDrawdownDollars: Math.round(maxDrawdownDollars * 100) / 100,
    maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
    sharpeRatio,
    equityCurve,
    gradeDistribution: gradeDist,
    symbolBreakdown
  };
}

export function generateCSVStatement(
  history: Position[],
  accountMeta: { id: string; server: string; currency: string; balance: number }
): string {
  const headers = [
    'Ticket',
    'Symbol',
    'Type',
    'Lots',
    'OpenTime',
    'CloseTime',
    'EntryPrice',
    'ExitPrice',
    'Profit',
    'ProfitPips',
    'CloseReason',
    'AIGrade'
  ];

  const rows = history.map((pos) => {
    return [
      pos.id,
      pos.symbol,
      pos.side,
      pos.lots,
      new Date(pos.openTime).toISOString(),
      pos.closeTime ? new Date(pos.closeTime).toISOString() : '',
      pos.entryPrice,
      pos.exitPrice ?? '',
      pos.profit.toFixed(2),
      pos.profitPips.toFixed(1),
      pos.closeReason || 'MANUAL',
      pos.aiCritique?.grade || 'UNRATED'
    ].join(',');
  });

  const metadata = [
    `# EXNESS ACCOUNT STATEMENT`,
    `# Account ID: ${accountMeta.id}`,
    `# Trading Server: ${accountMeta.server}`,
    `# Currency: ${accountMeta.currency}`,
    `# Current Balance: $${accountMeta.balance.toFixed(2)}`,
    `# Generated At: ${new Date().toISOString()}`,
    ''
  ].join('\n');

  return metadata + headers.join(',') + '\n' + rows.join('\n');
}
