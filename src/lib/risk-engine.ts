import { Position, RiskCoachReport, RiskFlag } from './types';

/**
 * Audits portfolio trade history for behavioral hazards:
 * - Position-size creep
 * - Revenge trading
 * - Overtrading around news & rapid executions
 * - Omission of Stop Losses
 */
export function auditRiskBehavior(allTrades: Position[]): RiskCoachReport {
  const flags: RiskFlag[] = [];
  const activeWarnings: RiskCoachReport['activeWarnings'] = [];
  const coachAdvice: string[] = [];

  if (allTrades.length === 0) {
    return {
      timestamp: Date.now(),
      riskScore: 95,
      status: 'EXCELLENT',
      flags: [],
      activeWarnings: [],
      metrics: {
        avgHoldingMinutes: 0,
        maxConsecutiveLosses: 0,
        lotSizeVariance: 0,
        quickFlipCount: 0
      },
      coachAdvice: [
        'No trades recorded yet. Maintain a strict 1% risk-per-trade rule when entering your first position.'
      ]
    };
  }

  // Sort trades chronologically by openTime
  const chronological = [...allTrades].sort((a, b) => a.openTime - b.openTime);

  // 1. Check for Revenge Trading: opened within 5 minutes of a loss
  let quickFlipCount = 0;
  for (let i = 1; i < chronological.length; i++) {
    const current = chronological[i];
    const prev = chronological[i - 1];

    if (prev.status === 'CLOSED' && prev.profit < 0 && prev.closeTime) {
      const diffMs = current.openTime - prev.closeTime;
      if (diffMs >= 0 && diffMs <= 300000) {
        // within 5 minutes
        quickFlipCount++;
        if (!flags.includes('REVENGE_TRADING')) {
          flags.push('REVENGE_TRADING');
          activeWarnings.push({
            title: 'Revenge Trading Detected',
            description: `Position on ${current.symbol} opened only ${Math.round(diffMs / 1000)}s after taking a $${Math.abs(prev.profit).toFixed(0)} loss.`,
            severity: 'CRITICAL',
            evidence: `Trade ${current.id.slice(-5)} entered impulsively without cooling-off period.`
          });
        }
      }
    }
  }

  // 2. Check for Position Size Creep
  const lotSizes = chronological.map((t) => t.lots);
  const avgLots = lotSizes.reduce((sum, l) => sum + l, 0) / lotSizes.length;
  const variance =
    lotSizes.reduce((acc, l) => acc + Math.pow(l - avgLots, 2), 0) / lotSizes.length;

  if (lotSizes.length >= 2) {
    const priorLots = lotSizes.slice(0, -1);
    const priorAvg = priorLots.reduce((sum, l) => sum + l, 0) / priorLots.length;
    const latestTrade = chronological[chronological.length - 1];

    if ((latestTrade.lots >= priorAvg * 1.5 || latestTrade.lots >= avgLots * 1.5) && latestTrade.lots > 0.5) {
      flags.push('POSITION_SIZE_CREEP');
      activeWarnings.push({
        title: 'Position Size Creep Warning',
        description: `Current lot size (${latestTrade.lots}) is ${Math.round((latestTrade.lots / priorAvg) * 100)}% of your prior average volume (${priorAvg.toFixed(2)} lots).`,
        severity: 'MEDIUM',
        evidence: `Sizing spiked from baseline. High risk of catastrophic drawdown.`
      });
    }
  }

  // 3. Check for Overtrading (clusters of 3+ trades opened within 15 minutes)
  for (let i = 0; i < chronological.length - 2; i++) {
    const t1 = chronological[i];
    const t3 = chronological[i + 2];
    if (t3.openTime - t1.openTime <= 900000) {
      // 3 trades in 15 mins
      if (!flags.includes('OVERTRADING_NEWS')) {
        flags.push('OVERTRADING_NEWS');
        activeWarnings.push({
          title: 'High-Frequency Overtrading Alert',
          description: 'Burst of 3+ trades opened within a 15-minute window.',
          severity: 'MEDIUM',
          evidence: 'Overtrading during high volatility leads to rapid commission drain and spread slippage.'
        });
      }
      break;
    }
  }

  // 4. Check for Stop Loss Omission
  const unprotectedCount = chronological.filter((t) => !t.stopLoss && t.status === 'OPEN').length;
  if (unprotectedCount > 0) {
    flags.push('STOP_LOSS_REMOVAL');
    activeWarnings.push({
      title: 'Unprotected Position Warning',
      description: `${unprotectedCount} active position(s) lack a pre-defined Stop Loss in the OMS.`,
      severity: 'CRITICAL',
      evidence: 'Trading without a stop loss risks total margin liquidation during news spikes.'
    });
  }

  // Calculate Metrics
  let maxConsecutiveLosses = 0;
  let currentLossStreak = 0;
  let totalHoldingMinutes = 0;
  let closedCount = 0;

  for (const t of chronological) {
    if (t.status === 'CLOSED') {
      closedCount++;
      if (t.closeTime) {
        totalHoldingMinutes += Math.max(1, (t.closeTime - t.openTime) / 60000);
      }
      if (t.profit < 0) {
        currentLossStreak++;
        if (currentLossStreak > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentLossStreak;
        }
      } else {
        currentLossStreak = 0;
      }
    }
  }

  const avgHoldingMinutes = closedCount > 0 ? Math.round(totalHoldingMinutes / closedCount) : 15;

  // Composite Risk Score Calculation
  let riskScore = 100;
  if (flags.includes('REVENGE_TRADING')) riskScore -= 28;
  if (flags.includes('POSITION_SIZE_CREEP')) riskScore -= 22;
  if (flags.includes('OVERTRADING_NEWS')) riskScore -= 16;
  if (flags.includes('STOP_LOSS_REMOVAL')) riskScore -= 18;
  if (maxConsecutiveLosses >= 3) riskScore -= 10;

  riskScore = Math.max(15, Math.min(100, riskScore));

  const status: RiskCoachReport['status'] =
    riskScore >= 80 ? 'EXCELLENT' : riskScore >= 55 ? 'CAUTION' : 'HIGH_RISK';

  // Construct Personalized Coach Advice
  if (flags.includes('REVENGE_TRADING')) {
    coachAdvice.push(
      'MANDATORY STEP: Enforce a 15-minute "hands-off-keyboard" rule after any stop-out before re-evaluating the chart.'
    );
  }
  if (flags.includes('POSITION_SIZE_CREEP')) {
    coachAdvice.push(
      `Normalize lot sizes back to ${avgLots.toFixed(2)} lots. Sizing up after losses or winning streaks is the #1 cause of account blowout.`
    );
  }
  if (flags.includes('STOP_LOSS_REMOVAL')) {
    coachAdvice.push(
      'Never click BUY or SELL without typing an invalidation price into the Stop Loss field.'
    );
  }
  if (coachAdvice.length === 0) {
    coachAdvice.push(
      'Flawless risk execution. Your position sizing and emotional composure are aligned with professional prop-desk standards.'
    );
    coachAdvice.push(
      'Focus on letting high-probability SMC winners reach their full liquidity targets.'
    );
  }

  return {
    timestamp: Date.now(),
    riskScore,
    status,
    flags,
    activeWarnings,
    metrics: {
      avgHoldingMinutes,
      maxConsecutiveLosses,
      lotSizeVariance: Math.round(variance * 100) / 100,
      quickFlipCount
    },
    coachAdvice
  };
}
