import { Anthropic } from '@anthropic-ai/sdk';
import {
  Position,
  AIJournalCritique,
  WebhookAlertPayload,
  SignalWinRateStats,
  MacroBrief,
  EconomicEvent
} from './types';
import { getStore } from './store';

function getAnthropicClient(): Anthropic | null {
  const store = getStore();
  const apiKey = store.settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new Anthropic({ apiKey });
}

/**
 * 1. AI Trade Journal Critique
 * Prompted with ICT/SMC concepts: liquidity sweep, order block, fair value gap, structure shift.
 * Returns a structured critique of the trade, not generic praise.
 */
export async function generateTradeCritique(
  trade: Position
): Promise<AIJournalCritique> {
  const client = getAnthropicClient();
  const isWinner = trade.profit > 0;
  const pips = trade.profitPips;
  const durationMinutes = trade.closeTime && trade.openTime
    ? Math.max(1, Math.round((trade.closeTime - trade.openTime) / 60000))
    : 15;

  if (client) {
    try {
      const prompt = `You are an elite, no-nonsense institutional ICT/SMC (Smart Money Concepts) prop firm risk director and trade auditor.
Critique this closed paper trade. Do NOT give generic praise. Focus strictly on market mechanics:
- Liquidity sweeps (internal vs external range liquidity)
- Order block mitigation (valid breaker vs mitigation blocks)
- Fair value gaps (FVG premium vs discount pricing)
- Market structure shifts (MSS, CHoCH, displacement)
- Execution discipline (holding time, R:R, SL/TP adherence)

Trade Parameters:
- Asset: ${trade.symbol}
- Direction: ${trade.side}
- Lots: ${trade.lots} (${trade.units} units)
- Entry: ${trade.entryPrice}
- Exit: ${trade.exitPrice}
- Result: ${isWinner ? 'WIN' : 'LOSS'} ($${trade.profit.toFixed(2)}, ${pips} pips)
- Close Reason: ${trade.closeReason || 'MANUAL'}
- Holding Time: ${durationMinutes} minutes
- SMC Context Tag: ${trade.smcContext?.pattern || 'None specified by user'}

Output MUST be strictly valid JSON matching this schema:
{
  "grade": "A+" | "A" | "B" | "C" | "D" | "F",
  "confluenceScore": number (1-10),
  "verdict": "string (1-2 sentences blunt summary)",
  "smcAnalysis": {
    "liquiditySweepVerdict": "string",
    "orderBlockMitigation": "string",
    "fairValueGapContext": "string",
    "marketStructureShift": "string"
  },
  "strengths": ["string", "string"],
  "mistakes": ["string", "string"],
  "ruleViolations": ["string"],
  "actionableLesson": "string (concrete technical takeaway for next execution)"
}`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (textBlock && textBlock.text) {
        // Strip possible markdown fences
        const cleanJson = textBlock.text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          id: `critique_${Date.now()}`,
          tradeId: trade.id,
          timestamp: Date.now(),
          ...parsed
        };
      }
    } catch (err) {
      console.warn('Claude API trade critique call failed, falling back to heuristic engine:', err);
    }
  }

  // Institutional Heuristic Fallback Critique
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
  let confluence = 6;
  const mistakes: string[] = [];
  const strengths: string[] = [];
  const ruleViolations: string[] = [];

  if (isWinner && pips >= 30) {
    grade = 'A';
    confluence = 8;
    strengths.push('Capturing significant displacement away from retail liquidity pool');
    strengths.push('Clean exit executed before counter-trend order block mitigation');
  } else if (isWinner) {
    grade = 'B';
    confluence = 7;
    strengths.push('Positive risk-reward execution adhering to structural take-profit');
    mistakes.push('Exited trade slightly before reaching full liquidity objective');
  } else {
    // Loss
    grade = durationMinutes < 5 ? 'F' : 'D';
    confluence = 4;
    mistakes.push('Failed to confirm lower timeframe displacement after liquidity raid');
    if (!trade.stopLoss) {
      ruleViolations.push('Entered trade without pre-defined hard Stop Loss in OMS');
    }
    if (durationMinutes < 5) {
      ruleViolations.push('Premature reaction entry into opposing momentum without retest');
    }
  }

  return {
    id: `critique_${Date.now()}`,
    tradeId: trade.id,
    timestamp: Date.now(),
    grade,
    confluenceScore: confluence,
    verdict: isWinner
      ? `Discipline maintained on ${trade.symbol} ${trade.side}; executed into institutional imbalance with acceptable target realization.`
      : `Sub-optimal entry on ${trade.symbol} ${trade.side}; price was caught in discount/premium equilibrium rather than true high-timeframe order block.`,
    smcAnalysis: {
      liquiditySweepVerdict: isWinner
        ? 'Liquidity sweep confirmed prior to entry; retail stops provided necessary fuel for expansion.'
        : 'Entry triggered before sell-side liquidity was fully cleared, resulting in slippage through the stop pool.',
      orderBlockMitigation: 'Refined 15m order block acted as mitigation springboard.',
      fairValueGapContext: 'Trade captured fair value gap fill in direction of daily structural bias.',
      marketStructureShift: isWinner
        ? 'Valid Change of Character (CHoCH) on the 5m chart confirmed displacement.'
        : 'Lack of aggressive displacement candle invalidated the purported structure shift.'
    },
    strengths: strengths.length ? strengths : ['Pre-trade risk sizing was within account margin parameters'],
    mistakes: mistakes.length ? mistakes : ['Minor hesitation on initial market displacement'],
    ruleViolations,
    actionableLesson: isWinner
      ? 'Continue trailing stops behind validated swing structure pivots rather than fixed dollar milestones.'
      : 'Wait for a 5-minute candle body close beyond the swing high/low before tagging the move as a valid liquidity sweep.'
  };
}

/**
 * 2. Signal Contextual Note
 * Short AI-generated contextual note for incoming webhook signals (never an unexplained buy/sell call)
 */
export async function generateSignalContextNoteWithAI(
  payload: WebhookAlertPayload,
  stats: SignalWinRateStats
): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const prompt = `You are a quantitative macro analyst and SMC trader. 
TradingView just fired a webhook alert:
- Asset: ${payload.symbol}
- Action: ${payload.action}
- Price: ${payload.price}
- Pattern: ${payload.smc_data?.pattern || payload.strategy}
- Historical Win Rate: ${stats.winRate}% (Sample: ${stats.sampleCount}, R:R: ${stats.avgRiskReward})

Generate exactly 2 sentences of institutional market structure context.
CRITICAL RULE: Do NOT say "Buy now" or "Sell now". Focus exclusively on liquidity dynamics, order block mitigation, and risk boundaries.`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content.find((c) => c.type === 'text');
    return text?.text ? text.text.trim() : null;
  } catch (err) {
    console.warn('Claude API signal note error:', err);
    return null;
  }
}

/**
 * 3. Macro Briefing Generator
 * Scheduled or on-demand synthesis of the day's high-impact economic calendar (FOMC, NFP, CPI)
 * Volatility brief for XAUUSD, EURUSD, and BTC.
 */
export async function generateMacroBriefing(): Promise<MacroBrief> {
  const defaultEvents: EconomicEvent[] = [
    {
      id: 'e1',
      time: '12:30 GMT',
      currency: 'USD',
      event: 'Core CPI (MoM)',
      impact: 'HIGH',
      forecast: '0.3%',
      previous: '0.2%'
    },
    {
      id: 'e2',
      time: '14:00 GMT',
      currency: 'USD',
      event: 'FOMC Press Conference & Rate Decision',
      impact: 'HIGH',
      forecast: '5.25%',
      previous: '5.50%'
    },
    {
      id: 'e3',
      time: '08:00 GMT',
      currency: 'EUR',
      event: 'ECB President Lagarde Speech',
      impact: 'MEDIUM',
      forecast: '-',
      previous: '-'
    }
  ];

  const client = getAnthropicClient();
  if (client) {
    try {
      const prompt = `Analyze this economic calendar for today's trading session:
${JSON.stringify(defaultEvents, null, 2)}

Provide an institutional macro volatility brief for Forex & Commodities traders focusing on:
- Gold (XAUUSD)
- Euro (EURUSD)
- Bitcoin (BTCUSD)

Output MUST be strictly valid JSON:
{
  "overallSentiment": "string",
  "goldOutlook": "string (impact of rates/CPI on gold liquidity)",
  "eurOutlook": "string (ECB vs Fed rate differential)",
  "btcOutlook": "string (macro liquidity spillover)",
  "keyRiskWindows": ["12:30 GMT (CPI Release)", "14:00 GMT (FOMC Rate)"],
  "actionableAdvice": "string (risk parameters for paper trading session)"
}`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (textBlock && textBlock.text) {
        const clean = textBlock.text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(clean);
        return {
          id: `macro_${Date.now()}`,
          timestamp: Date.now(),
          sessionDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
          events: defaultEvents,
          briefing: parsed
        };
      }
    } catch (err) {
      console.warn('Claude macro briefing error, using fallback:', err);
    }
  }

  // Institutional Fallback Briefing
  return {
    id: `macro_${Date.now()}`,
    timestamp: Date.now(),
    sessionDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
    events: defaultEvents,
    briefing: {
      overallSentiment: 'High Volatility Expected. Asymmetric risk skews towards US Dollar expansion during New York session.',
      goldOutlook: 'XAUUSD remains hyper-sensitive to real yields; any hotter-than-expected CPI print will trigger a test of discount liquidity pools near $2,340, while a rate pause reinforces bullish order flow toward $2,375.',
      eurOutlook: 'EURUSD constrained in a 50-pip equilibrium range ahead of the Fed rate decision. Watch for false breakouts above 1.0880 Asian highs followed by aggressive mean reversion.',
      btcOutlook: 'Crypto asset beta will mirror broad risk appetite. Expect liquidity sweeps of weekend ranges before structural direction is established post-FOMC.',
      keyRiskWindows: [
        '12:30 GMT - US Core CPI Release (Spreads typically widen 3-5x)',
        '14:00 GMT - FOMC Statement & Powell Press Conference'
      ],
      actionableAdvice: 'Avoid entering fresh market orders 10 minutes prior to high-impact releases. Widen stop parameters or scale down lot sizes to 50% to prevent slippage sweeps.'
    }
  };
}
