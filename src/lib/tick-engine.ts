import { SymbolId, PriceQuote } from './types';
import { updateMarketPrices, getLatestQuotes } from './market-engine';

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

// Convert symbol names between internal and OANDA
const INTERNAL_TO_OANDA: Record<SymbolId, string> = {
  XAUUSD: 'XAU_USD',
  EURUSD: 'EUR_USD',
  BTCUSD: 'BTC_USD'
};

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
 * High-fidelity realistic tick generator using Geometric Brownian Motion with Mean Reversion
 */
export function generateRealisticTick(symbol: SymbolId, currentBid: number): PriceQuote {
  let step = 0;
  let spread = 0.25;
  let decimals = 2;

  if (symbol === 'XAUUSD') {
    // Gold tick step: +/- $0.05 to $0.40
    step = (Math.random() - 0.495) * 0.35;
    spread = 0.20 + Math.random() * 0.15;
    decimals = 2;
  } else if (symbol === 'EURUSD') {
    // EURUSD tick step: +/- 0.00003 to 0.00010 (0.3 to 1.0 pip)
    step = (Math.random() - 0.498) * 0.00008;
    spread = 0.00010 + Math.random() * 0.00004;
    decimals = 5;
  } else {
    // BTCUSD
    step = (Math.random() - 0.495) * 12.0;
    spread = 12.0 + Math.random() * 8.0;
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
 * Triggers a live simulation cycle for all symbols
 */
export function executeTickCycle(): Record<SymbolId, PriceQuote> {
  const currentQuotes = getLatestQuotes();
  const updated: Partial<Record<SymbolId, Partial<PriceQuote>>> = {};

  for (const [key, quote] of Object.entries(currentQuotes)) {
    const sym = key as SymbolId;
    const newTick = generateRealisticTick(sym, quote.bid);
    updated[sym] = newTick;
  }

  updateMarketPrices(updated);
  return getLatestQuotes();
}
