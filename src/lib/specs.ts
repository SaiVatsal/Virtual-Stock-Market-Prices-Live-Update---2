import { SymbolId } from './types';

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
