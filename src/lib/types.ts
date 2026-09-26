export type SymbolId = 'XAUUSD' | 'EURUSD' | 'BTCUSD';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PENDING';

export interface PriceQuote {
  symbol: SymbolId;
  bid: number;
  ask: number;
  spread: number;
  high24h: number;
  low24h: number;
  change24h: number;
  timestamp: number;
}

export interface Position {
  id: string;
  symbol: SymbolId;
  side: OrderSide;
  type: OrderType;
  lots: number;
  units: number;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  profit: number; // in USD
  profitPips: number;
  margin: number;
  status: PositionStatus;
  openTime: number;
  closeTime?: number;
  closeReason?: 'MANUAL' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'MARGIN_CALL';
  smcContext?: {
    pattern?: string;
    orderBlock?: number;
    fvg?: string;
    timeframe?: string;
  };
  aiCritique?: AIJournalCritique;
}

export interface OrderRequest {
  symbol: SymbolId;
  side: OrderSide;
  type: OrderType;
  lots: number;
  price?: number; // for limit orders
  takeProfit?: number;
  stopLoss?: number;
  smcContext?: {
    pattern?: string;
    orderBlock?: number;
    fvg?: string;
    timeframe?: string;
  };
}

export interface AccountState {
  balance: number;
  equity: number;
  marginUsed: number;
  freeMargin: number;
  marginLevel: number; // percentage
  unrealizedPnL: number;
  realizedPnL: number;
  leverage: number; // default 100:1
  currency: string;
}

export interface WebhookSMCData {
  pattern?: string;
  order_block?: number;
  key_level?: number;
  fvg?: string;
  target?: number;
  stop?: number;
  bias?: 'BULLISH' | 'BEARISH';
  confidence_score?: number;
}

export interface WebhookAlertPayload {
  symbol: SymbolId;
  action: OrderSide;
  price: number;
  timeframe?: string;
  strategy?: string;
  indicator?: string;
  smc_data?: WebhookSMCData;
  secret?: string;
}

export interface SignalWinRateStats {
  pattern: string;
  symbol: SymbolId;
  sampleCount: number;
  winCount: number;
  lossCount: number;
  winRate: number; // percentage e.g. 68.4
  avgRiskReward: number; // e.g. 2.4
  profitFactor: number;
}

export interface SignalItem {
  id: string;
  timestamp: number;
  symbol: SymbolId;
  action: OrderSide;
  price: number;
  timeframe: string;
  strategy: string;
  smcData?: WebhookSMCData;
  winRateStats: SignalWinRateStats;
  contextNote: string;
  source: 'WEBHOOK' | 'SIMULATOR';
}

export interface AIJournalCritique {
  id: string;
  tradeId: string;
  timestamp: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  confluenceScore: number; // 1 to 10
  verdict: string;
  smcAnalysis: {
    liquiditySweepVerdict: string;
    orderBlockMitigation: string;
    fairValueGapContext: string;
    marketStructureShift: string;
  };
  strengths: string[];
  mistakes: string[];
  ruleViolations: string[];
  actionableLesson: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface MacroBrief {
  id: string;
  timestamp: number;
  sessionDate: string;
  events: EconomicEvent[];
  briefing: {
    overallSentiment: string;
    goldOutlook: string;
    eurOutlook: string;
    btcOutlook: string;
    keyRiskWindows: string[];
    actionableAdvice: string;
  };
}

export type RiskFlag = 'POSITION_SIZE_CREEP' | 'REVENGE_TRADING' | 'OVERTRADING_NEWS' | 'STOP_LOSS_REMOVAL' | 'EXCESSIVE_LEVERAGE';

export interface RiskCoachReport {
  timestamp: number;
  riskScore: number; // 0 to 100, 100 being pristine discipline
  status: 'EXCELLENT' | 'CAUTION' | 'HIGH_RISK';
  flags: RiskFlag[];
  activeWarnings: {
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
    evidence: string;
  }[];
  metrics: {
    avgHoldingMinutes: number;
    maxConsecutiveLosses: number;
    lotSizeVariance: number;
    quickFlipCount: number; // trades opened within 5m of a loss
  };
  coachAdvice: string[];
}

export type MarketSessionStatus = 'OPEN' | 'CLOSED_WEEKEND' | 'HOLIDAY';

export interface MarketScheduleInfo {
  status: MarketSessionStatus;
  isForexOpen: boolean;
  isCryptoOpen: boolean;
  nextOpenTime: string;
  serverTimeGMT: string;
}

export interface AppSettings {
  anthropicApiKey?: string;
  oandaApiKey?: string;
  oandaAccountId?: string;
  twelveDataApiKey?: string;
  webhookSecret?: string;
  initialBalance: number;
  leverage: number;
  // Exness configuration
  exnessAccountId?: string;
  exnessServer?: string;
  exnessPassword?: string;
  exnessAccountType?: 'PRO' | 'RAW_SPREAD' | 'STANDARD' | 'ZERO';
  marketMode?: 'REAL_MARKET_HOURS' | 'WEEKEND_OTC_PRACTICE';
}
