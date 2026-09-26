import { SymbolId, PriceQuote } from './types';
import { getStore } from './store';
import { parseOandaPricingResponse, executeTickCycle } from './tick-engine';
import { updateMarketPrices } from './market-engine';

const OANDA_PRACTICE_BASE_URL = 'https://api-fxpractice.oanda.com';

/**
 * Fetches live pricing from OANDA v20 REST API (Practice/Demo environment)
 */
export async function fetchOandaPrices(): Promise<boolean> {
  const store = getStore();
  const apiKey = store.settings.oandaApiKey || process.env.OANDA_API_KEY;
  const accountId = store.settings.oandaAccountId || process.env.OANDA_ACCOUNT_ID;

  if (!apiKey || !accountId) {
    return false; // Keys not configured
  }

  try {
    const instruments = 'EUR_USD,XAU_USD';
    const url = `${OANDA_PRACTICE_BASE_URL}/v3/accounts/${accountId}/pricing?instruments=${instruments}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`OANDA API response status ${res.status}: ${res.statusText}`);
      return false;
    }

    const data = await res.json();
    const parsed = parseOandaPricingResponse(data);
    updateMarketPrices(parsed);
    return true;
  } catch (err) {
    console.warn('OANDA price fetch failed, falling back to tick simulator:', err);
    return false;
  }
}

/**
 * Fetches prices from Twelve Data as secondary fallback
 */
export async function fetchTwelveDataPrices(): Promise<boolean> {
  const store = getStore();
  const apiKey = store.settings.twelveDataApiKey || process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return false;
  }

  try {
    const url = `https://api.twelvedata.com/price?symbol=XAU/USD,EUR/USD,BTC/USD&apikey=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();

    const updates: Partial<Record<SymbolId, Partial<PriceQuote>>> = {};
    if (data['XAU/USD']?.price) {
      const bid = parseFloat(data['XAU/USD'].price);
      updates.XAUUSD = { bid, ask: bid + 0.25, spread: 0.25 };
    }
    if (data['EUR/USD']?.price) {
      const bid = parseFloat(data['EUR/USD'].price);
      updates.EURUSD = { bid, ask: bid + 0.00012, spread: 0.00012 };
    }
    if (data['BTC/USD']?.price) {
      const bid = parseFloat(data['BTC/USD'].price);
      updates.BTCUSD = { bid, ask: bid + 15.0, spread: 15.0 };
    }

    updateMarketPrices(updates);
    return true;
  } catch {
    return false;
  }
}

/**
 * Single cycle update: tries OANDA first, then Twelve Data, then local tick engine
 */
export async function refreshLiveMarket(): Promise<void> {
  const oandaSuccess = await fetchOandaPrices();
  if (oandaSuccess) return;

  const twelveSuccess = await fetchTwelveDataPrices();
  if (twelveSuccess) return;

  // Fallback to high-fidelity tick engine
  executeTickCycle();
}
