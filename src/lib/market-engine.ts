import {
  SymbolId,
  OrderRequest,
  Position,
  AccountState,
  PriceQuote
} from './types';
import { getStore, saveStore, setMemoryStoreOnly, StoreData } from './store';

// Contract specifications
export const INSTRUMENT_SPECS: Record<
  SymbolId,
  { name: string; contractSize: number; pipSize: number; decimals: number }
> = {
  XAUUSD: {
    name: 'Gold (troy oz)',
    contractSize: 100, // 1 lot = 100 oz
    pipSize: 0.1,      // 0.10 USD = 1 pip
    decimals: 2
  },
  EURUSD: {
    name: 'Euro / US Dollar',
    contractSize: 100000, // 1 lot = 100,000 EUR
    pipSize: 0.0001,      // 1 pip = 0.0001
    decimals: 5
  },
  BTCUSD: {
    name: 'Bitcoin / US Dollar',
    contractSize: 1,      // 1 lot = 1 BTC
    pipSize: 1.0,         // 1 pip = 1.00 USD
    decimals: 2
  }
};

// Global quotes in memory
let latestQuotes: Record<SymbolId, PriceQuote> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    bid: 2354.20,
    ask: 2354.45,
    spread: 0.25,
    high24h: 2368.50,
    low24h: 2341.10,
    change24h: 0.42,
    timestamp: Date.now()
  },
  EURUSD: {
    symbol: 'EURUSD',
    bid: 1.08540,
    ask: 1.08552,
    spread: 0.00012,
    high24h: 1.08920,
    low24h: 1.08250,
    change24h: -0.15,
    timestamp: Date.now()
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    bid: 64250.00,
    ask: 64265.00,
    spread: 15.00,
    high24h: 65400.00,
    low24h: 63100.00,
    change24h: 1.85,
    timestamp: Date.now()
  }
};

export function getLatestQuotes(): Record<SymbolId, PriceQuote> {
  return latestQuotes;
}

export function resetStoreForTest(initialBalance = 100000, leverage = 100): void {
  const fresh: StoreData = {
    account: {
      balance: initialBalance,
      equity: initialBalance,
      marginUsed: 0,
      freeMargin: initialBalance,
      marginLevel: 0,
      unrealizedPnL: 0,
      realizedPnL: 0,
      leverage,
      currency: 'USD'
    },
    positions: [],
    history: [],
    signals: [],
    settings: {
      initialBalance,
      leverage
    }
  };
  setMemoryStoreOnly(fresh);
}

export function getPositions(): Position[] {
  const store = getStore();
  return store.positions;
}

export function getTradeHistory(): Position[] {
  const store = getStore();
  return store.history;
}

export function getAccountState(): AccountState {
  const store = getStore();
  return store.account;
}

/**
 * Recalculates Unrealized P&L and Margin for all open positions,
 * checks Stop Loss / Take Profit conditions, and refreshes Account Equity.
 */
export function recalculatePortfolio(): void {
  const store = getStore();
  let totalMarginUsed = 0;
  let totalUnrealizedPnL = 0;
  const remainingPositions: Position[] = [];
  const closedThisTick: Position[] = [];

  for (const pos of store.positions) {
    const quote = latestQuotes[pos.symbol];
    if (!quote) {
      remainingPositions.push(pos);
      totalMarginUsed += pos.margin;
      totalUnrealizedPnL += pos.profit;
      continue;
    }

    const spec = INSTRUMENT_SPECS[pos.symbol];
    let isSlHit = false;
    let isTpHit = false;
    let closePrice = 0;

    if (pos.side === 'BUY') {
      pos.currentPrice = quote.bid;
      pos.profit = (quote.bid - pos.entryPrice) * pos.units;
      pos.profitPips = (quote.bid - pos.entryPrice) / spec.pipSize;

      if (pos.stopLoss && quote.bid <= pos.stopLoss) {
        isSlHit = true;
        closePrice = pos.stopLoss;
      } else if (pos.takeProfit && quote.bid >= pos.takeProfit) {
        isTpHit = true;
        closePrice = pos.takeProfit;
      }
    } else {
      // SELL
      pos.currentPrice = quote.ask;
      pos.profit = (pos.entryPrice - quote.ask) * pos.units;
      pos.profitPips = (pos.entryPrice - quote.ask) / spec.pipSize;

      if (pos.stopLoss && quote.ask >= pos.stopLoss) {
        isSlHit = true;
        closePrice = pos.stopLoss;
      } else if (pos.takeProfit && quote.ask <= pos.takeProfit) {
        isTpHit = true;
        closePrice = pos.takeProfit;
      }
    }

    if (isSlHit || isTpHit) {
      pos.status = 'CLOSED';
      pos.closeTime = Date.now();
      pos.exitPrice = closePrice;
      pos.closeReason = isSlHit ? 'STOP_LOSS' : 'TAKE_PROFIT';

      if (pos.side === 'BUY') {
        pos.profit = (closePrice - pos.entryPrice) * pos.units;
        pos.profitPips = (closePrice - pos.entryPrice) / spec.pipSize;
      } else {
        pos.profit = (pos.entryPrice - closePrice) * pos.units;
        pos.profitPips = (pos.entryPrice - closePrice) / spec.pipSize;
      }

      closedThisTick.push(pos);
    } else {
      remainingPositions.push(pos);
      totalMarginUsed += pos.margin;
      totalUnrealizedPnL += pos.profit;
    }
  }

  // Update realized P&L and balance for auto-closed positions
  for (const closed of closedThisTick) {
    store.account.balance += closed.profit;
    store.account.realizedPnL += closed.profit;
    store.history.unshift(closed);
  }

  store.positions = remainingPositions;
  store.account.marginUsed = Math.round(totalMarginUsed * 100) / 100;
  store.account.unrealizedPnL = Math.round(totalUnrealizedPnL * 100) / 100;
  store.account.equity = Math.round((store.account.balance + store.account.unrealizedPnL) * 100) / 100;
  store.account.freeMargin = Math.round((store.account.equity - store.account.marginUsed) * 100) / 100;
  store.account.marginLevel =
    store.account.marginUsed > 0
      ? Math.round((store.account.equity / store.account.marginUsed) * 10000) / 100
      : 0;

  saveStore(store);
}

/**
 * Updates quotes from OANDA, Twelve Data, or Internal Tick Engine
 */
export function updateMarketPrices(prices: Partial<Record<SymbolId, Partial<PriceQuote>>>): void {
  for (const [key, quote] of Object.entries(prices)) {
    const sym = key as SymbolId;
    if (latestQuotes[sym] && quote) {
      latestQuotes[sym] = {
        ...latestQuotes[sym],
        ...quote,
        timestamp: Date.now()
      };
    }
  }
  recalculatePortfolio();
}

/**
 * Executes a new Market or Limit Order
 */
export function executeOrder(req: OrderRequest): Position {
  const store = getStore();
  const quote = latestQuotes[req.symbol];
  if (!quote) {
    throw new Error(`Symbol ${req.symbol} quote unavailable`);
  }

  const spec = INSTRUMENT_SPECS[req.symbol];
  const units = Math.round(req.lots * spec.contractSize);
  const entryPrice = req.side === 'BUY' ? quote.ask : quote.bid;

  const leverage = store.account.leverage || 100;
  const marginRequired = Math.round(((req.lots * spec.contractSize * entryPrice) / leverage) * 100) / 100;

  if (store.account.freeMargin < marginRequired) {
    throw new Error(`Insufficient Free Margin. Required: $${marginRequired}, Available: $${store.account.freeMargin}`);
  }

  const newPosition: Position = {
    id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    symbol: req.symbol,
    side: req.side,
    type: req.type,
    lots: req.lots,
    units,
    entryPrice,
    currentPrice: entryPrice,
    takeProfit: req.takeProfit,
    stopLoss: req.stopLoss,
    profit: 0,
    profitPips: 0,
    margin: marginRequired,
    status: 'OPEN',
    openTime: Date.now(),
    smcContext: req.smcContext
  };

  store.positions.unshift(newPosition);
  recalculatePortfolio();
  return newPosition;
}

/**
 * Closes an open position manually
 */
export function closePosition(positionId: string, currentExitPrice?: number): Position {
  const store = getStore();
  const index = store.positions.findIndex((p) => p.id === positionId);
  if (index === -1) {
    throw new Error(`Position ${positionId} not found`);
  }

  const pos = store.positions[index];
  const quote = latestQuotes[pos.symbol];
  const spec = INSTRUMENT_SPECS[pos.symbol];

  const exitPrice =
    currentExitPrice ?? (pos.side === 'BUY' ? (quote ? quote.bid : pos.entryPrice) : (quote ? quote.ask : pos.entryPrice));

  pos.status = 'CLOSED';
  pos.closeTime = Date.now();
  pos.exitPrice = exitPrice;
  pos.closeReason = 'MANUAL';

  if (pos.side === 'BUY') {
    pos.profit = Math.round((exitPrice - pos.entryPrice) * pos.units * 100) / 100;
    pos.profitPips = Math.round(((exitPrice - pos.entryPrice) / spec.pipSize) * 10) / 10;
  } else {
    pos.profit = Math.round((pos.entryPrice - exitPrice) * pos.units * 100) / 100;
    pos.profitPips = Math.round(((pos.entryPrice - exitPrice) / spec.pipSize) * 10) / 10;
  }

  store.positions.splice(index, 1);
  store.account.balance = Math.round((store.account.balance + pos.profit) * 100) / 100;
  store.account.realizedPnL = Math.round((store.account.realizedPnL + pos.profit) * 100) / 100;
  store.history.unshift(pos);

  recalculatePortfolio();
  return pos;
}
