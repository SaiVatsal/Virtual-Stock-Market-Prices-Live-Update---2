import { SymbolId, PriceQuote } from './types';
import { updateMarketPrices, getLatestQuotes } from './market-engine';
import { getMarketScheduleInfo } from './market-schedule';
import { getStore } from './store';

export interface OandaPriceItem {
  instrument: string;
  bids?: { price: string }[];
  asks?: { price: string }[];
  closeoutBid?: string;
  closeoutAsk?: string;
  time?: string;
}

export interface OandaPricingResponse {
  prices?: OandaPriceItem[];
}

const OANDA_TO_INTERNAL: Record<string, SymbolId> = {
  XAU_USD: 'XAUUSD',
  EUR_USD: 'EURUSD',
  BTC_USD: 'BTCUSD'
};

/**
 * Parses raw OANDA v20 pricing payload
 */
export function parseOandaPricingResponse(
  data: OandaPricingResponse
): Partial<Record<SymbolId, Partial<PriceQuote>>> {
  const result: Partial<Record<SymbolId, Partial<PriceQuote>>> = {};

  if (!data || !Array.isArray(data.prices)) {
    return result;
  }

  for (const item of data.prices) {
    const sym = OANDA_TO_INTERNAL[item.instrument];
    if (!sym) continue;

    const bid = item.bids?.[0]?.price
      ? parseFloat(item.bids[0].price)
      : item.closeoutBid
      ? parseFloat(item.closeoutBid)
      : undefined;

    const ask = item.asks?.[0]?.price
      ? parseFloat(item.asks[0].price)
      : item.closeoutAsk
      ? parseFloat(item.closeoutAsk)
      : undefined;

    if (bid !== undefined && ask !== undefined) {
      result[sym] = {
        symbol: sym,
        bid,
        ask,
        spread: Math.round((ask - bid) * 100000) / 100000,
        timestamp: item.time ? new Date(item.time).getTime() : Date.now()
      };
    }
  }

  return result;
}

/**
 * Syncs real market prices from live public crypto and gold spot price endpoints
 * (PAXG for Gold 1:1 Spot, BTCUSDT for Bitcoin, EURUSDT for Euro)
 */
export async function syncRealWorldPrices(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const [btcRes, goldRes, eurRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: controller.signal, cache: 'no-store' }),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT', { signal: controller.signal, cache: 'no-store' }),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT', { signal: controller.signal, cache: 'no-store' })
    ]);
    clearTimeout(timeout);

    const updates: Partial<Record<SymbolId, Partial<PriceQuote>>> = {};

    if (btcRes.ok) {
      const btc = await btcRes.json();
      const price = parseFloat(btc.price);
      updates.BTCUSD = {
        symbol: 'BTCUSD',
        bid: Math.round(price * 100) / 100,
        ask: Math.round((price + 15.0) * 100) / 100,
        spread: 15.0,
        timestamp: Date.now()
      };
    }

    if (goldRes.ok) {
      const gold = await goldRes.json();
      const price = parseFloat(gold.price);
      updates.XAUUSD = {
        symbol: 'XAUUSD',
        bid: Math.round(price * 100) / 100,
        ask: Math.round((price + 0.35) * 100) / 100,
        spread: 0.35,
        timestamp: Date.now()
      };
    }

    if (eurRes.ok) {
      const eur = await eurRes.json();
      const price = parseFloat(eur.price);
      updates.EURUSD = {
        symbol: 'EURUSD',
        bid: Math.round(price * 100000) / 100000,
        ask: Math.round((price + 0.00012) * 100000) / 100000,
        spread: 0.00012,
        timestamp: Date.now()
      };
    }

    if (Object.keys(updates).length > 0) {
      updateMarketPrices(updates);
      return true;
    }
  } catch {
    // Non-fatal, fallback to local tick engine
  }
  return false;
}

/**
 * Realistic Brownian micro-tick generator
 */
export function generateRealisticTick(symbol: SymbolId, currentBid: number): PriceQuote {
  let step = 0;
  let spread = 0.25;
  let decimals = 2;

  if (symbol === 'XAUUSD') {
    step = (Math.random() - 0.495) * 0.40;
    spread = 0.25 + Math.random() * 0.15;
    decimals = 2;
  } else if (symbol === 'EURUSD') {
    step = (Math.random() - 0.498) * 0.00008;
    spread = 0.00010 + Math.random() * 0.00004;
    decimals = 5;
  } else {
    step = (Math.random() - 0.495) * 15.0;
    spread = 15.0 + Math.random() * 8.0;
    decimals = 2;
  }

  const factor = Math.pow(10, decimals);
  const newBid = Math.round((currentBid + step) * factor) / factor;
  const newAsk = Math.round((newBid + spread) * factor) / factor;
  const exactSpread = Math.round((newAsk - newBid) * factor) / factor;

  return {
    symbol,
    bid: newBid,
    ask: newAsk,
    spread: exactSpread,
    high24h: Math.max(newBid * 1.008, newBid),
    low24h: Math.min(newBid * 0.992, newBid),
    change24h: Math.round((step * 100) / currentBid * 100) / 100,
    timestamp: Date.now()
  };
}

/**
 * Triggers a live simulation cycle
 * Respects Exness market hours: on weekends, if REAL_MARKET_HOURS is chosen,
 * freezes XAUUSD and EURUSD quotes at real Friday close price!
 */
export function executeTickCycle(): Record<SymbolId, PriceQuote> {
  const currentQuotes = getLatestQuotes();
  const schedule = getMarketScheduleInfo();
  const store = getStore();
  const isRealMarketMode = store.settings.marketMode === 'REAL_MARKET_HOURS';

  const updated: Partial<Record<SymbolId, Partial<PriceQuote>>> = {};

  for (const [key, quote] of Object.entries(currentQuotes)) {
    const sym = key as SymbolId;

    // If market is closed on weekend and real market hours mode is selected, freeze traditional assets
    if (isRealMarketMode && !schedule.isForexOpen && (sym === 'XAUUSD' || sym === 'EURUSD')) {
      // Keep price frozen at closing price
      continue;
    }

    const newTick = generateRealisticTick(sym, quote.bid);
    updated[sym] = newTick;
  }

  if (Object.keys(updated).length > 0) {
    updateMarketPrices(updated);
  }
  return getLatestQuotes();
}
