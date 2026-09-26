import { describe, it, expect } from 'vitest';
import { generateRealisticTick, parseOandaPricingResponse } from '../src/lib/tick-engine';

describe('Tick Engine & OANDA Price Parser', () => {
  it('generates realistic Brownian ticks within reasonable bounds for XAUUSD and EURUSD', () => {
    const xauTick = generateRealisticTick('XAUUSD', 2350.0);
    expect(xauTick.bid).toBeGreaterThan(2300);
    expect(xauTick.bid).toBeLessThan(2400);
    expect(xauTick.ask).toBeGreaterThan(xauTick.bid);
    expect(xauTick.spread).toBeCloseTo(xauTick.ask - xauTick.bid, 2);

    const eurTick = generateRealisticTick('EURUSD', 1.0850);
    expect(eurTick.bid).toBeGreaterThan(1.0500);
    expect(eurTick.bid).toBeLessThan(1.1200);
    expect(eurTick.ask).toBeGreaterThan(eurTick.bid);
    expect(eurTick.spread).toBeCloseTo(eurTick.ask - eurTick.bid, 5);
  });

  it('correctly parses OANDA v20 pricing payload format', () => {
    const mockOandaResponse = {
      prices: [
        {
          instrument: 'XAU_USD',
          bids: [{ price: '2352.40', liquidity: 1000 }],
          asks: [{ price: '2352.65', liquidity: 1000 }],
          closeoutBid: '2352.40',
          closeoutAsk: '2352.65',
          status: 'tradeable',
          time: '2026-09-26T12:00:00.000000000Z'
        },
        {
          instrument: 'EUR_USD',
          bids: [{ price: '1.08520', liquidity: 5000 }],
          asks: [{ price: '1.08532', liquidity: 5000 }],
          closeoutBid: '1.08520',
          closeoutAsk: '1.08532',
          status: 'tradeable',
          time: '2026-09-26T12:00:00.000000000Z'
        }
      ]
    };

    const parsed = parseOandaPricingResponse(mockOandaResponse);
    expect(parsed.XAUUSD).toBeDefined();
    expect(parsed.XAUUSD?.bid).toBe(2352.40);
    expect(parsed.XAUUSD?.ask).toBe(2352.65);
    expect(parsed.XAUUSD?.spread).toBeCloseTo(0.25, 2);

    expect(parsed.EURUSD).toBeDefined();
    expect(parsed.EURUSD?.bid).toBe(1.08520);
    expect(parsed.EURUSD?.ask).toBe(1.08532);
    expect(parsed.EURUSD?.spread).toBeCloseTo(0.00012, 5);
  });
});
