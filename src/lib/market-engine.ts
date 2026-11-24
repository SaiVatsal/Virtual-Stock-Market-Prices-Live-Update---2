import {
  SymbolId,
  OrderRequest,
  Position,
  AccountState,
  PriceQuote
} from './types';
import { getStore, saveStore, setMemoryStoreOnly, StoreData } from './store';
import { INSTRUMENT_SPECS } from './specs';
export { INSTRUMENT_SPECS };

import { isInstrumentTradeable } from './market-schedule';

// Global quotes initialized to exact real market prices (matching TradingView and Exness live candles)
export const INITIAL_DEFAULT_QUOTES: Record<SymbolId, PriceQuote> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    bid: 4118.20,
    ask: 4118.55,
    spread: 0.35,
    high24h: 4140.00,
    low24h: 4090.00,
    change24h: 0.35,
    timestamp: Date.now()
  },
  EURUSD: {
    symbol: 'EURUSD',
    bid: 1.12510,
    ask: 1.12522,
    spread: 0.00012,
    high24h: 1.12900,
    low24h: 1.12100,
    change24h: -0.10,
    timestamp: Date.now()
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    bid: 83480.00,
    ask: 83495.00,
    spread: 15.00,
    high24h: 84800.00,
    low24h: 82500.00,
    change24h: 1.25,
    timestamp: Date.now()
  }
};

let latestQuotes: Record<SymbolId, PriceQuote> = JSON.parse(JSON.stringify(INITIAL_DEFAULT_QUOTES));

export function getLatestQuotes(): Record<SymbolId, PriceQuote> {
  return latestQuotes;
}

export function resetStoreForTest(initialBalance = 100000, leverage = 100): void {
  latestQuotes = JSON.parse(JSON.stringify(INITIAL_DEFAULT_QUOTES));
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

export function getPositions(userId?: string): Position[] {
  const store = getStore(userId);
  return store.positions;
}

export function getTradeHistory(userId?: string): Position[] {
  const store = getStore(userId);
  return store.history;
}

export function getAccountState(userId?: string): AccountState {
  const store = getStore(userId);
  return store.account;
}

/**
 * Recalculates Unrealized P&L and Margin for all open positions,
 * checks Stop Loss / Take Profit conditions, and refreshes Account Equity.
 */
export function recalculatePortfolio(userId?: string): void {
  const store = getStore(userId);
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

    // Handle PENDING limit/stop orders
    if (pos.status === 'PENDING') {
      let triggered = false;
      if (pos.type === 'LIMIT') {
        if (pos.side === 'BUY' && quote.ask <= pos.entryPrice) triggered = true;
        if (pos.side === 'SELL' && quote.bid >= pos.entryPrice) triggered = true;
      } else if (pos.type === 'STOP') {
        if (pos.side === 'BUY' && quote.ask >= pos.entryPrice) triggered = true;
        if (pos.side === 'SELL' && quote.bid <= pos.entryPrice) triggered = true;
      }

      if (triggered) {
        pos.status = 'OPEN';
        pos.openTime = Date.now();
        pos.currentPrice = pos.side === 'BUY' ? quote.bid : quote.ask;
      } else {
        pos.currentPrice = pos.side === 'BUY' ? quote.ask : quote.bid;
        remainingPositions.push(pos);
        continue;
      }
    }

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

  saveStore(store, userId);
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

  const root = getStore();
  if (root.users && Object.keys(root.users).length > 0) {
    for (const uid of Object.keys(root.users)) {
      recalculatePortfolio(uid);
    }
  } else {
    recalculatePortfolio();
  }
}

/**
 * Executes a new Market or Limit Order
 */
export function executeOrder(req: OrderRequest, userId?: string): Position {
  const store = getStore(userId);

  const tradeCheck = isInstrumentTradeable(req.symbol);
  if (!tradeCheck.tradeable) {
    throw new Error(tradeCheck.reason || `Market for ${req.symbol} is currently closed`);
  }

  const quote = latestQuotes[req.symbol];
  if (!quote) {
    throw new Error(`Symbol ${req.symbol} quote unavailable`);
  }

  const spec = INSTRUMENT_SPECS[req.symbol];
  const units = Math.round(req.lots * spec.contractSize);
  const isPending = (req.type === 'LIMIT' || req.type === 'STOP') && req.price !== undefined;
  const entryPrice = isPending ? req.price! : (req.side === 'BUY' ? quote.ask : quote.bid);

  const leverage = store.account.leverage || 100;
  const marginRequired = Math.round(((req.lots * spec.contractSize * entryPrice) / leverage) * 100) / 100;

  if (!isPending && store.account.freeMargin < marginRequired) {
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
    status: isPending ? 'PENDING' : 'OPEN',
    openTime: Date.now(),
    smcContext: req.smcContext
  };

  store.positions.unshift(newPosition);
  recalculatePortfolio(userId);
  saveStore(store, userId);
  return newPosition;
}

/**
 * Modifies Stop Loss, Take Profit, or Entry Price of a position or pending order
 */
export function modifyPosition(
  positionId: string,
  updates: {
    stopLoss?: number | null;
    takeProfit?: number | null;
    entryPrice?: number;
  },
  userId?: string
): Position {
  const store = getStore(userId);
  const pos = store.positions.find((p) => p.id === positionId);
  if (!pos) {
    throw new Error(`Position or order ${positionId} not found`);
  }

  if (updates.stopLoss !== undefined) {
    pos.stopLoss = updates.stopLoss === null ? undefined : updates.stopLoss;
  }
  if (updates.takeProfit !== undefined) {
    pos.takeProfit = updates.takeProfit === null ? undefined : updates.takeProfit;
  }
  if (updates.entryPrice !== undefined) {
    pos.entryPrice = updates.entryPrice;
    if (pos.status === 'PENDING') {
      pos.currentPrice = updates.entryPrice;
    }
  }

  recalculatePortfolio(userId);
  saveStore(store, userId);
  return pos;
}

/**
 * Cancels a pending order or closes an open position
 */
export function cancelOrder(orderId: string, userId?: string): Position {
  const store = getStore(userId);
  const index = store.positions.findIndex((p) => p.id === orderId);
  if (index === -1) {
    throw new Error(`Order ${orderId} not found`);
  }
  const pos = store.positions[index];
  if (pos.status === 'PENDING') {
    pos.status = 'CANCELLED';
    store.positions.splice(index, 1);
    recalculatePortfolio(userId);
    saveStore(store, userId);
    return pos;
  } else {
    return closePosition(orderId, undefined, userId);
  }
}

/**
 * Closes an open position manually
 */
export function closePosition(positionId: string, currentExitPrice?: number, userId?: string): Position {
  const store = getStore(userId);
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

  recalculatePortfolio(userId);
  saveStore(store, userId);
  return pos;
}

/**
 * Closes all open positions matching a filter ('PROFIT' | 'LOSS' | 'ALL')
 */
export function closePositionsByFilter(filter: 'PROFIT' | 'LOSS' | 'ALL', userId?: string): Position[] {
  const store = getStore(userId);
  const openPositions = store.positions.filter((p) => p.status === 'OPEN');
  const targets = openPositions.filter((pos) => {
    if (filter === 'PROFIT') return pos.profit > 0;
    if (filter === 'LOSS') return pos.profit < 0;
    return true;
  });

  if (targets.length === 0) {
    return [];
  }

  const closed: Position[] = [];
  for (const pos of targets) {
    const quote = latestQuotes[pos.symbol];
    const spec = INSTRUMENT_SPECS[pos.symbol];
    const exitPrice =
      pos.side === 'BUY' ? (quote ? quote.bid : pos.entryPrice) : (quote ? quote.ask : pos.entryPrice);

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

    store.account.balance = Math.round((store.account.balance + pos.profit) * 100) / 100;
    store.account.realizedPnL = Math.round((store.account.realizedPnL + pos.profit) * 100) / 100;
    store.history.unshift(pos);
    closed.push(pos);
  }

  const closedIds = new Set(closed.map((c) => c.id));
  store.positions = store.positions.filter((p) => !closedIds.has(p.id));

  recalculatePortfolio(userId);
  saveStore(store, userId);
  return closed;
}
