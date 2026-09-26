import { SymbolId, MarketScheduleInfo, MarketSessionStatus } from './types';
import { getStore } from './store';

/**
 * Checks whether traditional forex/gold markets are currently open.
 * Traditional Forex & Commodities (XAUUSD, EURUSD) trade:
 * Sunday 21:00 UTC (5 PM EST) to Friday 21:00 UTC (5 PM EST).
 * Crypto (BTCUSD) trades 24 hours a day, 7 days a week.
 */
export function getMarketScheduleInfo(): MarketScheduleInfo {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  let isForexOpen = true;

  if (day === 6) {
    // Saturday: completely closed
    isForexOpen = false;
  } else if (day === 5 && (hour > 21 || (hour === 21 && minute >= 0))) {
    // Friday after 21:00 UTC
    isForexOpen = false;
  } else if (day === 0 && hour < 21) {
    // Sunday before 21:00 UTC
    isForexOpen = false;
  }

  const status: MarketSessionStatus = isForexOpen ? 'OPEN' : 'CLOSED_WEEKEND';

  const serverTimeGMT = now.toUTCString().replace('GMT', 'UTC');

  let nextOpenTime = 'Active';
  if (!isForexOpen) {
    nextOpenTime = 'Sunday 21:00 UTC (02:30 AM IST)';
  }

  return {
    status,
    isForexOpen,
    isCryptoOpen: true, // Crypto always open
    nextOpenTime,
    serverTimeGMT
  };
}

export function isInstrumentTradeable(symbol: SymbolId): { tradeable: boolean; reason?: string } {
  const store = getStore();
  const mode = store.settings.marketMode || 'WEEKEND_OTC_PRACTICE';

  if (symbol === 'BTCUSD') {
    return { tradeable: true };
  }

  // If in 24/7 OTC simulation practice mode, allow trading
  if (mode === 'WEEKEND_OTC_PRACTICE') {
    return { tradeable: true };
  }

  const schedule = getMarketScheduleInfo();
  if (!schedule.isForexOpen) {
    return {
      tradeable: false,
      reason: `Market for ${symbol} is currently closed for the weekend (Friday 21:00 UTC - Sunday 21:00 UTC). Reopens ${schedule.nextOpenTime}. You can trade BTCUSD 24/7 or switch to '24/7 OTC Demo' in the top header.`
    };
  }

  return { tradeable: true };
}
