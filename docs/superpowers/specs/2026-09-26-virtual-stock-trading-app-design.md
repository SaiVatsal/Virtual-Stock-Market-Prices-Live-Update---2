# Design Document: Virtual Forex & Gold Paper Trading Platform (XAUUSD, EURUSD)
**Date:** 2026-09-26  
**Status:** Approved  
**Author:** Antigravity AI Engineering

---

## 1. Executive Summary & Core Objectives
Build a high-performance, institutional-grade virtual paper-trading web application specifically tailored for **XAUUSD (Gold)** and **EURUSD (Euro/US Dollar)**, with multi-asset expansion capability (BTCUSD).

The platform integrates:
1. **TradingView Advanced Real-Time Chart widget** (`s3.tradingview.com/tv.js`) embedded natively for institutional charting.
2. **OANDA v20 REST API live price feed** (practice/demo environment) as primary execution feed, with Twelve Data and high-fidelity micro-tick engine fallback.
3. **Webhook endpoint (`/api/webhooks/tradingview`)** receiving real-time Smart Money Concepts (SMC) & Key-Levels indicator alert payloads, feeding a live Signals stream.
4. **Server-Side AI Suite (Claude API)**:
   - **AI Trade Journal**: Structured ICT/SMC trade review (Liquidity Sweeps, Order Blocks, FVGs, Market Structure Shifts) on trade close.
   - **Signal Confidence**: Real empirical win-rate calculated from historical database + concise AI contextual note.
   - **Macro Briefing**: High-impact economic calendar analysis (FOMC, NFP, CPI) predicting volatility bias.
   - **Risk Coach**: Real-time behavioral pattern detector (position-size creep, revenge trading, news overtrading) on the dashboard.

---

## 2. Architecture & Tech Stack
* **Framework:** Next.js 14+ (App Router, Node.js runtime, TypeScript, Tailwind CSS, Lucide icons).
* **Database & Persistence:** Fast JSON/SQLite storage (`data/trading_store.json` / SQLite) storing:
  - Account state (Cash balance, equity, leverage, margin rules).
  - Open positions & pending orders.
  - Closed trade history with P&L, hold time, and execution logs.
  - Webhook alerts & calculated win-rate metrics.
  - AI journal critiques & risk coach audits.
  - Economic calendar events.
* **Real-time Communication:** Server-Sent Events (SSE) via `/api/stream/market` for sub-second quote broadcasts and position P&L recalculation.
* **Security & Isolation:** API keys (Anthropic Claude, OANDA Token, Twelve Data) stored securely in server environment variables or in-app encrypted settings, never leaked to the client browser.

---

## 3. Core Modules & Specifications

### 3.1 TradingView Advanced Chart Integration
* Embedded via client component loading `https://s3.tradingview.com/tv.js`.
* Fully interactive: supports drawing tools, timeframes (1m, 5m, 15m, 1h, 4h, 1D), dark theme (`#0B0E14`), symbol sync with UI selector (`OANDA:XAUUSD`, `FX:EURUSD`, `BINANCE:BTCUSDT`).
* Fallback iframe widget if script blockers are active.

### 3.2 Market Price Feed & Execution Engine
* **Instruments:**
  - `XAUUSD`: Gold Spot in USD (e.g. $2,350.00 / oz, 0.10 - 0.25 spread).
  - `EURUSD`: EUR/USD Spot (e.g. 1.08500, 0.8 - 1.2 pip spread).
  - `BTCUSD`: Bitcoin Spot (e.g. $64,200.00).
* **Data Sources:**
  - OANDA v20 REST API (`https://api-fxpractice.oanda.com/v3/accounts/{accountID}/pricing?instruments=EUR_USD,XAU_USD`).
  - Twelve Data fallback.
  - Internal High-Fidelity Tick Engine: When external keys are missing or offline, simulates realistic Brownian-motion ticks around live institutional market prices with authentic bid/ask spread dynamics.
* **Order Management System (OMS):**
  - Order types: Market Buy/Sell, Limit Buy/Sell, Stop Buy/Sell.
  - Position sizing in Lots (e.g., 0.01 micro lot to 50 standard lots).
  - Automatic Margin Calculation (e.g. 1:100 leverage for FX/Gold).
  - Take Profit (TP) and Stop Loss (SL) auto-triggering on each tick.
  - Partial or full position closure, real-time unrealized P&L calculation.

### 3.3 TradingView Webhook & Pine Script Indicator
* **Webhook Route:** `POST /api/webhooks/tradingview`
  * Validates JSON payload containing:
    ```json
    {
      "symbol": "XAUUSD",
      "action": "BUY" | "SELL",
      "price": 2354.50,
      "timeframe": "15m",
      "strategy": "SMC_Liquidity_Sweep",
      "smc_data": {
        "pattern": "Bearish Liquidity Run into H1 Bullish Order Block",
        "key_level": 2351.20,
        "fvg": "2353.00 - 2354.10",
        "target": 2368.00
      }
    }
    ```
  * Computes empirical historical win-rate for this strategy/symbol from past records.
  * Calls server-side Claude API (or heuristic fallback) to produce an institutional structural context note.
  * Emits signal to the live SSE stream for immediate rendering in the "Signals" feed.
* **Pine Script v5 Indicator:**
  * Pre-built, tested Pine Script SMC & Key-Levels indicator with `alertcondition()` definitions, provided in a one-click copy modal inside the application.
  * Includes a webhook test simulator button directly in the UI so users can trigger simulated alerts with 1 click.

### 3.4 AI Features (Server-Side Claude API)
1. **AI Trade Journal:**
   - On trade close, sends trade parameters (entry, exit, duration, lot size, P&L, SMC structural context) to Claude.
   - Returns structured JSON critique:
     - `grade`: "A+", "A", "B", "C", "F"
     - `confluence_rating`: 1-10
     - `strengths`: ["Patience waiting for liquidity sweep", "Proper 1:3 R:R"]
     - `critique`: Sharp, constructive feedback grounded in ICT/SMC principles without hollow praise.
     - `rule_violations`: Flags if user moved stop loss or closed prematurely.
2. **Signal Confidence:**
   - Calculates empirical win rate (% wins, average R:R, sample size).
   - Generates a 2-sentence macro/SMC market context note explaining the prevailing structure.
3. **Macro Briefing:**
   - High-impact economic calendar (FOMC, NFP, CPI, Powell Speech).
   - Claude generates a pre-session volatility brief explaining how the events affect Gold, EUR, and BTC.
4. **Risk Coach HUD:**
   - Continuously audits trading history for toxic habits:
     * **Position-Size Creep**: Increasing risk exponentially after wins or losses.
     * **Revenge Trading**: Opening new positions within 5 minutes of a loss.
     * **News Overtrading**: Multiple rapid orders around high-volatility spikes.
   - Presents a Risk Health Score (0-100), Active Warning Badges, and actionable coaching guidance.

---

## 4. UI/UX Design System
* **Aesthetic Direction:** Bloomberg Terminal / TradingView Dark aesthetic.
* **Palette:**
  - Base: Deep Obsidian `#070A0F`
  - Panels/Cards: Dark Slate `#0D131F` / Border `#1E293B`
  - Primary Accent: Neon Cyan `#00F0FF`
  - Bullish / Profit: Emerald `#10B981`
  - Bearish / Loss: Crimson `#F43F5E`
  - Gold Accent: Amber `#F59E0B`
* **Layout Structure:**
  - Top Navigation: Account KPIs (Balance, Equity, Margin, Free Margin, Unrealized P&L), Symbol Switcher, Quick Modals (Settings, Pine Script, Webhook Test).
  - Main Area: 65% TradingView Live Chart | 35% Order Ticket & Depth Panel.
  - Bottom Dock: Tabbed workspace (Open Positions, Closed History & AI Journal, Live Signals Feed, Risk Coach, Macro Briefing).

---

## 5. Implementation Milestones
1. **Foundation & Dependencies:** Next.js project setup with Tailwind CSS, Lucide icons, and state stores.
2. **Database & Mock/Live Data Layer:** Persistence store, OANDA v20 client, high-fidelity live tick generator, SSE broadcaster.
3. **Execution Engine & TradingView Chart:** TV widget embed, order placement, SL/TP matching engine, real-time P&L updating.
4. **TradingView Webhooks & Pine Script Indicator:** `/api/webhooks/tradingview`, indicator script modal, webhook alert simulator, signals feed.
5. **AI Integration (Claude API):** AI Trade Journal, Signal Confidence, Macro Briefing, and Risk Coach behavioral detector.
6. **Polish & Verification:** Dark theme visual refinement, responsive layout, end-to-end paper trading verification.
