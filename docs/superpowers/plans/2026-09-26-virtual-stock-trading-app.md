# Virtual Stock & Forex Paper Trading Platform (XAUUSD, EURUSD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an institutional-grade, simulated paper-trading platform for forex and gold (XAUUSD, EURUSD, BTCUSD) featuring an embedded TradingView Advanced Real-Time Chart widget, OANDA v20 REST practice price feed with high-fidelity live simulated fallback, a TradingView webhook endpoint (`/api/webhooks/tradingview`) for custom Pine Script SMC indicators, and four server-side Claude AI features (AI Trade Journal, Signal Confidence, Macro Briefing, and Risk Coach).

**Architecture:** Next.js 14+ App Router with TypeScript and Tailwind CSS; in-memory + file-backed JSON/SQLite persistent trading engine; Server-Sent Events (SSE) for sub-second quote and position updates; server-side API routes for order execution, webhooks, and Claude AI integrations.

**Tech Stack:** Next.js 14/15, React 19, TypeScript, Tailwind CSS, Lucide React, Anthropic Claude SDK (@anthropic-ai/sdk), Vitest.

## Global Constraints
- TradingView integration: Embed free TradingView Advanced Real-Time Chart widget (`s3.tradingview.com/tv.js`). Do not attempt to scrape or fetch direct price candles from TradingView.
- Price feed: OANDA v20 practice REST API (`api-fxpractice.oanda.com`), Twelve Data fallback, and an internal high-fidelity tick engine for offline/unconfigured environments.
- Webhook endpoint: `/api/webhooks/tradingview` accepting SMC & Key-Level alert payloads.
- AI features: Claude API called strictly server-side; API key never exposed to client. Robust fallback when API key is missing.
- Design: High-aesthetic dark terminal theme (Obsidian/Slate/Cyan/Emerald/Rose/Gold), zero placeholder text, immediate responsive interactivity.

---

### Task 1: Project Initialization & Core Types
**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/lib/types.ts`
- Test: `tests/types.test.ts`

**Interfaces:**
- Produces: `AccountState`, `Position`, `OrderRequest`, `WebhookPayload`, `SignalItem`, `AIJournalCritique`, `MacroBrief`, `RiskCoachReport` types in `src/lib/types.ts`.

- [ ] **Step 1: Write failing type validation test**
```typescript
// tests/types.test.ts
import { describe, it, expect } from 'vitest';
import { AccountState, Position } from '../src/lib/types';

describe('Core Types', () => {
  it('validates initial account structure', () => {
    const account: AccountState = {
      balance: 100000,
      equity: 100000,
      marginUsed: 0,
      freeMargin: 100000,
      unrealizedPnL: 0,
      realizedPnL: 0,
      leverage: 100,
      currency: 'USD'
    };
    expect(account.balance).toBe(100000);
    expect(account.freeMargin).toBe(100000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/types.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Create package.json and configuration files**
Install dependencies: `next`, `react`, `react-dom`, `lucide-react`, `@anthropic-ai/sdk`, `tailwind-merge`, `clsx`, `vitest`.
Write `src/lib/types.ts` with complete data schemas.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add package.json tsconfig.json next.config.js tailwind.config.js postcss.config.js src/lib/types.ts tests/types.test.ts
git commit -m "feat: initialize project scaffolding and core trading types"
```

---

### Task 2: Persistent Trading Store & Market Engine
**Files:**
- Create: `src/lib/store.ts`
- Create: `src/lib/market-engine.ts`
- Test: `tests/market-engine.test.ts`

**Interfaces:**
- Consumes: `src/lib/types.ts`
- Produces:
  - `getStore()` / `saveStore()`
  - `executeOrder(order: OrderRequest): Position`
  - `closePosition(positionId: string, currentPrice?: number): Position`
  - `updateMarketPrices(prices: Record<string, { bid: number; ask: number }>): void`
  - `getPositions()`, `getAccountState()`, `getTradeHistory()`

- [ ] **Step 1: Write failing test for Market Engine**
```typescript
// tests/market-engine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetStoreForTest, executeOrder, closePosition, getAccountState, updateMarketPrices } from '../src/lib/market-engine';

describe('Market Engine & OMS', () => {
  beforeEach(() => {
    resetStoreForTest(100000);
  });

  it('opens a buy position and correctly computes margin and P&L on price change', () => {
    updateMarketPrices({ XAUUSD: { bid: 2350.0, ask: 2350.2 } });
    const pos = executeOrder({
      symbol: 'XAUUSD',
      side: 'BUY',
      type: 'MARKET',
      lots: 1.0, // 100 oz of gold
      takeProfit: 2370.0,
      stopLoss: 2340.0
    });
    expect(pos.status).toBe('OPEN');
    expect(pos.entryPrice).toBe(2350.2);

    // Price rises to 2360.0
    updateMarketPrices({ XAUUSD: { bid: 2360.0, ask: 2360.2 } });
    const state = getAccountState();
    expect(state.unrealizedPnL).toBeCloseTo(980.0, 1); // (2360.0 - 2350.2) * 100

    // Close position
    const closed = closePosition(pos.id);
    expect(closed.status).toBe('CLOSED');
    expect(closed.profit).toBeCloseTo(980.0, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/market-engine.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement store and market engine**
Implement in-memory cache with atomic file sync in `data/trading_store.json`. Implement margin calculation (lots * contractSize / leverage), SL/TP auto-triggering on price updates, and P&L pip calculation.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/market-engine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/store.ts src/lib/market-engine.ts tests/market-engine.test.ts
git commit -m "feat: implement persistent trading store and execution engine"
```

---

### Task 3: OANDA v20 Price Feed & High-Fidelity Tick Engine
**Files:**
- Create: `src/lib/oanda.ts`
- Create: `src/lib/tick-engine.ts`
- Create: `src/app/api/stream/market/route.ts`
- Test: `tests/oanda.test.ts`

**Interfaces:**
- Consumes: `src/lib/market-engine.ts`
- Produces:
  - `fetchOandaPrices(instruments: string[])`
  - `startTickStream(): void`
  - `GET /api/stream/market` (SSE streaming prices, account state, and open positions)

- [ ] **Step 1: Write failing test for price feed fallback**
```typescript
// tests/oanda.test.ts
import { describe, it, expect } from 'vitest';
import { getLatestMarketPrice, generateRealisticTick } from '../src/lib/tick-engine';

describe('Tick Engine & Price Provider', () => {
  it('generates realistic Brownian ticks within reasonable bounds for XAUUSD and EURUSD', () => {
    const tick = generateRealisticTick('XAUUSD', 2350.0);
    expect(tick.bid).toBeGreaterThan(2300);
    expect(tick.bid).toBeLessThan(2400);
    expect(tick.ask).toBeGreaterThan(tick.bid);
    expect(tick.spread).toBeCloseTo(tick.ask - tick.bid, 3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/oanda.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement OANDA client and Tick Engine**
Write `src/lib/oanda.ts` connecting to `https://api-fxpractice.oanda.com/v3/accounts/{accountID}/pricing` with bearer token auth. If no credentials, gracefully fall back to `src/lib/tick-engine.ts` realistic tick generator. Implement `GET /api/stream/market` SSE route.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/oanda.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/oanda.ts src/lib/tick-engine.ts src/app/api/stream/market/route.ts tests/oanda.test.ts
git commit -m "feat: add OANDA v20 price feed, fallback tick engine, and SSE stream"
```

---

### Task 4: TradingView Webhook Endpoint & Pine Script Indicator
**Files:**
- Create: `src/lib/pine-script.ts`
- Create: `src/app/api/webhooks/tradingview/route.ts`
- Create: `src/app/api/signals/route.ts`
- Test: `tests/webhook.test.ts`

**Interfaces:**
- Consumes: `src/lib/store.ts`, `src/lib/types.ts`
- Produces:
  - `PINE_SCRIPT_INDICATOR_V5` (ready-to-paste Pine Script code with SMC & Key Levels)
  - `POST /api/webhooks/tradingview`
  - `GET /api/signals`

- [ ] **Step 1: Write failing test for webhook and historical win rate calculation**
```typescript
// tests/webhook.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { processWebhookSignal, getHistoricalSignalWinRate, clearSignalsForTest } from '../src/lib/signals-service';

describe('TradingView Webhook & Signal Analytics', () => {
  beforeEach(() => {
    clearSignalsForTest();
  });

  it('processes incoming SMC alert payload and computes empirical win rate', async () => {
    const payload = {
      symbol: 'XAUUSD',
      action: 'BUY' as const,
      price: 2355.0,
      timeframe: '15m',
      strategy: 'SMC_Liquidity_Sweep',
      smc_data: {
        pattern: 'Asian Low Sweep into 15m Bullish FVG',
        key_level: 2352.0,
        target: 2370.0
      }
    };
    const signal = await processWebhookSignal(payload);
    expect(signal.id).toBeDefined();
    expect(signal.winRateStats.sampleCount).toBeGreaterThanOrEqual(1);
    expect(signal.contextNote).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/webhook.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Webhook and Signals Service**
Implement `processWebhookSignal()` to parse payload, query stored signal performance, compute real empirical win rate, generate short AI contextual note, and record signal. Write Pine Script v5 code in `src/lib/pine-script.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/webhook.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/pine-script.ts src/lib/signals-service.ts src/app/api/webhooks/tradingview/route.ts src/app/api/signals/route.ts tests/webhook.test.ts
git commit -m "feat: implement TradingView webhook handler, signal win-rate engine, and Pine Script indicator"
```

---

### Task 5: Server-Side Claude AI Suite
**Files:**
- Create: `src/lib/claude.ts`
- Create: `src/lib/risk-engine.ts`
- Create: `src/app/api/journal/route.ts`
- Create: `src/app/api/macro/route.ts`
- Create: `src/app/api/risk-coach/route.ts`
- Test: `tests/risk-coach.test.ts`
- Test: `tests/claude-ai.test.ts`

**Interfaces:**
- Consumes: `src/lib/types.ts`, `src/lib/store.ts`
- Produces:
  - `generateTradeCritique(closedPosition: Position): Promise<AIJournalCritique>`
  - `generateMacroBriefing(): Promise<MacroBrief>`
  - `auditRiskBehavior(history: Position[]): RiskCoachReport`

- [ ] **Step 1: Write failing test for Risk Coach Behavioral Detection**
```typescript
// tests/risk-coach.test.ts
import { describe, it, expect } from 'vitest';
import { auditRiskBehavior } from '../src/lib/risk-engine';
import { Position } from '../src/lib/types';

describe('Risk Coach Engine', () => {
  it('flags revenge trading when new position is opened shortly after a loss with increased lot size', () => {
    const trades: Position[] = [
      {
        id: 't1',
        symbol: 'XAUUSD',
        side: 'BUY',
        type: 'MARKET',
        lots: 1.0,
        entryPrice: 2350,
        exitPrice: 2340,
        profit: -1000,
        status: 'CLOSED',
        openTime: Date.now() - 600000,
        closeTime: Date.now() - 300000
      },
      {
        id: 't2',
        symbol: 'XAUUSD',
        side: 'BUY',
        type: 'MARKET',
        lots: 3.0, // Position creep & revenge size
        entryPrice: 2341,
        status: 'OPEN',
        openTime: Date.now() - 120000
      }
    ];
    const report = auditRiskBehavior(trades);
    expect(report.flags).toContain('REVENGE_TRADING');
    expect(report.flags).toContain('POSITION_SIZE_CREEP');
    expect(report.riskScore).toBeLessThan(70);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/risk-coach.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Claude client, Risk Coach, and AI Routes**
Implement `src/lib/claude.ts` with Anthropic API client (and institutional fallback generator when ANTHROPIC_API_KEY is not set). Implement ICT/SMC prompt structure for trade reviews. Implement behavioral pattern detector in `src/lib/risk-engine.ts`. Wire API routes.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/risk-coach.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/claude.ts src/lib/risk-engine.ts src/app/api/journal/route.ts src/app/api/macro/route.ts src/app/api/risk-coach/route.ts tests/risk-coach.test.ts
git commit -m "feat: implement Claude AI trade journal, macro briefing, and risk coach behavioral engine"
```

---

### Task 6: Terminal UI - Header, TradingView Chart & Order Ticket
**Files:**
- Create: `src/components/HeaderNav.tsx`
- Create: `src/components/TradingViewChart.tsx`
- Create: `src/components/OrderTicket.tsx`
- Create: `src/components/SettingsModal.tsx`
- Create: `src/components/PineScriptModal.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `/api/stream/market`, `/api/trade/order`, `src/lib/types.ts`
- Produces: Live header telemetry, responsive TradingView widget, 1-click execution panel, settings and Pine Script modals.

- [ ] **Step 1: Create TradingView script loader & chart component**
Embed `s3.tradingview.com/tv.js` widget container with dark theme, responsive height, and sync with selected symbol (`OANDA:XAUUSD`, `FX:EURUSD`, `BINANCE:BTCUSDT`).

- [ ] **Step 2: Build Order Ticket Panel**
Support Market/Limit orders, lot selector (0.01 - 50 lots), SL/TP price inputs with automatic pip calculation, margin preview, and Buy/Sell trigger buttons with feedback toast.

- [ ] **Step 3: Build Header Navigation**
Live account equity, balance, used margin, free margin, unrealized P&L badge, quick symbol selector, Settings trigger, and Pine Script modal button.

- [ ] **Step 4: Verify visually and functionally via Next.js dev server**
Ensure layout renders cleanly without console errors and responds to symbol changes.

- [ ] **Step 5: Commit**
```bash
git add src/components/HeaderNav.tsx src/components/TradingViewChart.tsx src/components/OrderTicket.tsx src/components/SettingsModal.tsx src/components/PineScriptModal.tsx src/app/globals.css src/app/page.tsx
git commit -m "feat: build terminal header, embedded TradingView chart, and order ticket panel"
```

---

### Task 7: Workspace Dock - Positions, AI Journal, Signals Feed, Risk Coach & Macro
**Files:**
- Create: `src/components/BottomWorkspace.tsx`
- Create: `src/components/PositionsTable.tsx`
- Create: `src/components/TradeHistoryTable.tsx`
- Create: `src/components/AIJournalModal.tsx`
- Create: `src/components/SignalsFeed.tsx`
- Create: `src/components/RiskCoachCard.tsx`
- Create: `src/components/MacroBriefingCard.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: All API endpoints & SSE stream
- Produces: Unified interactive trading desk with real-time position management, trade review modal, webhook signal feed with manual simulator, risk coach HUD, and macro briefing.

- [ ] **Step 1: Build Open Positions & Trade History tables**
Display tickets with real-time P&L, pip counters, entry/current prices, and 1-click Close button.
Trigger AI Journal critique on close.

- [ ] **Step 2: Build AI Trade Journal modal**
Render structured ICT/SMC trade critique: Grade badge, Confluence rating, Strengths, Mistakes, and SMC structure shift feedback.

- [ ] **Step 3: Build Signals Feed & Webhook Simulator**
Display incoming TradingView alerts with strategy, SMC pattern, empirical historical win-rate pill, and Claude contextual note. Add a "Simulate TradingView Alert" button for immediate demonstration.

- [ ] **Step 4: Build Risk Coach HUD & Macro Briefing components**
Interactive risk health gauge, toxic behavior alert badges, and economic calendar volatility forecast.

- [ ] **Step 5: Commit**
```bash
git add src/components/BottomWorkspace.tsx src/components/PositionsTable.tsx src/components/TradeHistoryTable.tsx src/components/AIJournalModal.tsx src/components/SignalsFeed.tsx src/components/RiskCoachCard.tsx src/components/MacroBriefingCard.tsx src/app/page.tsx
git commit -m "feat: assemble workspace dock with positions, AI journal, signals feed, risk coach, and macro briefing"
```

---

### Task 8: End-to-End Verification & Production Build
**Files:**
- Test: `tests/e2e.test.ts`
- Documentation: `README.md`

- [ ] **Step 1: Run comprehensive test suite**
Run: `npm run test`
Expected: All unit and integration tests PASS.

- [ ] **Step 2: Run production build verification**
Run: `npm run build`
Expected: Successful Next.js production compilation.

- [ ] **Step 3: Verify end-to-end paper trading flow in browser**
Launch dev server, verify TradingView chart loads, execute a paper trade on XAUUSD, close it, verify AI Journal generates structured critique, test simulated webhook alert, verify Risk Coach HUD updates.

- [ ] **Step 4: Commit and finalize**
```bash
git add tests/ README.md
git commit -m "chore: verify end-to-end paper trading platform and create documentation"
```
