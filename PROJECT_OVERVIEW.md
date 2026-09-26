# Nexus Trader | Project Architecture & Overview

This document provides a simple, plain-English summary of everything inside this project, the frontend and backend components used, what was built, and how the entire system works.

---

## 1. What Is This Project?
* **Project Name:** Nexus Trader (Virtual Trading Terminal)
* **Goal:** A professional paper-trading web terminal for Forex (**EUR/USD**), Gold (**XAU/USD**), and Crypto (**BTC/USD**).
* **How It Works:** Traders can practice buying, selling, and managing risk using real-time market data, leverage, and spreads without risking real money.
* **Broker Feel:** Modeled after the **Exness WebTerminal** interface with institutional tools, real-time charts, and AI-powered trading feedback.

---

## 2. Frontend Technologies & Components

### Core Tech Stack
* **Framework:** Next.js 14 (App Router) + React 18 + TypeScript.
* **Styling:** Tailwind CSS with full **Dark Mode** and **Light Mode** parity.
* **Icons:** Lucide React icons.
* **Live Chart Engine:** TradingView Advanced Real-Time Chart widget (via `s3.tradingview.com/tv.js`).

### Frontend Components Breakdown
* **`HeaderNav.tsx` (Top Navigation Bar):**
  * Displays real-time account metrics: Balance, Equity, Margin Used, Free Margin, and Margin Level %.
  * Shows the Exness Pro account badge (`EX-9482104 Pro`) and server connection status.
  * Displays Forex market session status (Open vs. Weekend Closed) with an OTC Practice Mode toggle.
  * Contains one-click buttons for: Statement Export, Pine Script Webhook setup, Exness Settings, and Dark/Light theme toggle.

* **`TradingViewChart.tsx` (Advanced Charting):**
  * Embeds live candlestick charts for XAUUSD, EURUSD, and BTCUSD with indicators (Moving Averages, RSI).
  * **Fullscreen Mode:** Expands the chart to full screen with quick-trade buttons and keyboard navigation (Esc to exit).
  * **Dual Split-Chart Grid View:** Allows viewing two charts side-by-side (e.g. Gold + Euro) with independent symbol switchers.

* **`ChartTradingOverlay.tsx` (Exness Drag-and-Drop & Custom Right-Click Menu):**
  * **Custom Exness Right-Click Menu:** Intercepts right-clicks anywhere on the chart, completely blocking the default TradingView menu and showing instant broker trading options (Buy Limit, Sell Limit, Buy Stop, Sell Stop, Set SL/TP) at the exact clicked price.
  * **Draggable Take Profit (TP) Line:** Green dashed line with a drag handle showing real-time price, pips, and dollar profit. Dragging and releasing updates the trade.
  * **Draggable Stop Loss (SL) Line:** Red dashed line with a drag handle showing risk and pips. Dragging and releasing saves the new stop loss.
  * **Draggable Pending Orders:** Amber/purple dashed lines for Limit and Stop orders that can be moved up or down directly on the chart.
  * **Mode Toggle:** Lets you switch between `Trade on Chart` (dragging enabled) and `Pan Chart` (standard chart panning).

* **`OrderTicket.tsx` (Execution Panel):**
  * Institutional order entry panel supporting **Market**, **Limit**, and **Stop** orders.
  * Features a lot size slider, pip calculator, margin requirements preview, and Stop Loss / Take Profit inputs.

* **`BottomWorkspace.tsx` (Lower Multi-Tab Dock):**
  * **`PositionsTable.tsx`:** Displays open positions and pending orders with real-time P&L, mark price, margin, and 1-click Close/Cancel buttons.
  * **`AIJournalTab.tsx`:** Claude AI Trade Journal that grades closed trades (A+, A, B, C, F) and provides Smart Money Concepts (SMC) critiques.
  * **`EquityCurveCard.tsx`:** Interactive SVG chart displaying account balance and equity growth over time, win rate, profit factor, and maximum drawdown.
  * **`SignalsFeed.tsx`:** Feed of live SMC signals (Order Blocks, Liquidity Sweeps, FVGs) received via TradingView webhooks or simulator.
  * **`RiskCoachHUD.tsx`:** Behavioral risk detector warning against revenge trading, overleveraging, and lot size creep.
  * **`MacroBriefCard.tsx`:** Economic calendar showing high-impact news events (CPI, FOMC, NFP).

* **`AccountStatementModal.tsx` (Official Account Statement):**
  * Printable and exportable statement with Exness broker header, capital performance metrics, and AI trade grade summaries.
  * Features an **Export CSV** button and a **Print / PDF** button with print-friendly styles.

* **`SettingsModal.tsx` & `PineScriptModal.tsx`:**
  * Configure API keys (Anthropic Claude, OANDA, Twelve Data) and Exness server credentials.
  * Copy-paste ready Pine Script v5 code to connect TradingView alerts to the app.

---

## 3. Backend Technologies & Components

### Core Tech Stack
* **Runtime:** Node.js with Next.js Serverless Route Handlers (`src/app/api/`).
* **Database / Store:** File-backed database (`data/trading_store.json`) ensuring account balance, positions, trade history, and settings are permanently saved.
* **Testing:** Vitest test suite with 20 passing unit tests.

### Backend Services Breakdown
* **`src/lib/market-engine.ts` (Order Management System):**
  * Calculates margin requirements based on 100:1 or 200:1 leverage.
  * Calculates real-time unrealized P&L on every tick based on live bid/ask spreads.
  * Automatically closes positions when Stop Loss or Take Profit price levels are crossed.
  * Automatically triggers pending Limit and Stop orders when market prices reach their trigger price.
  * Provides `modifyPosition` (used by drag-and-drop) and `cancelOrder`.

* **`src/lib/market-schedule.ts` (Market Hours Engine):**
  * Enforces real Forex market hours (closes Friday 22:00 GMT, reopens Sunday 22:00 GMT).
  * Keeps Crypto (BTC/USD) tradeable 24/7/365.
  * Provides a toggle for "Weekend OTC Practice Mode" so users can practice anytime.

* **`src/lib/analytics.ts` (Financial Math Engine):**
  * Computes Net P&L, Profit Factor, Win Rate %, Expected Payoff, Max Drawdown %, and approximate Sharpe Ratio.
  * Generates clean `.csv` account statement downloads.

* **`src/lib/exness.ts` (Exness Backend Integration):**
  * Manages Exness server connections (`Exness-Trial2`, `Exness-Real`), custom credentials, and persists configuration to disk.

* **`src/lib/oanda.ts` (Live Price Feed):**
  * Connects to OANDA v20 REST API for live forex/gold quotes, with fallback to Twelve Data and an internal tick generator.

* **`src/lib/ai-journal.ts` (AI Risk & Trade Coach):**
  * Integrates with Anthropic Claude 3.5 Sonnet to critique closed trades and analyze SMC market structure.

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trade/order` | Places a new Market, Limit, or Stop order. |
| `POST` | `/api/trade/close` | Closes an open position manually. |
| `POST` | `/api/trade/modify` | Updates Stop Loss, Take Profit, or Entry Price from chart drag-and-drop. |
| `POST` | `/api/trade/cancel` | Cancels a pending limit or stop order. |
| `GET` | `/api/stream/market` | Server-Sent Events (SSE) streaming live quotes, balance, and positions every second. |
| `POST` | `/api/webhooks/tradingview` | Webhook accepting Pine Script alerts from TradingView. |
| `GET / POST` | `/api/market-status` | Reads or toggles Forex market schedule and weekend OTC practice mode. |
| `GET` | `/api/journal` | Fetches closed trades and Claude AI review history. |
| `GET` | `/api/risk-coach` | Fetches trader behavioral scores and discipline warnings. |
| `GET` | `/api/macro` | Fetches daily economic calendar events. |
| `GET / POST` | `/api/settings` | Reads or updates API keys and Exness broker configuration. |

---

## 5. Summary of What Was Done (Step-by-Step)

1. **Broker Visuals & Exness Experience:**
   * Designed a high-tech terminal interface with live bid/ask spreads, margin telemetry, and Exness account branding.
   * Built both **Dark Mode** and **Light Mode** with automatic localStorage persistence.

2. **TradingView Live Chart Integration:**
   * Integrated TradingView's Advanced Real-Time widget.
   * Added a **Fullscreen Mode** with keyboard escape handling and live quote bars.
   * Built a **Dual Split-Chart Grid** mode to view two symbols simultaneously side-by-side.

3. **Chart Drag-and-Drop & Custom Right-Click Menu:**
   * **Custom Right-Click Menu:** Right-clicking anywhere on the chart canvas blocks the default TradingView menu and opens an Exness Quick Trade menu with one-click Limit/Stop orders and SL/TP settings at the clicked price.
   * **Draggable Price Lines:** Take Profit, Stop Loss, and Pending Limit/Stop orders can be dragged vertically on the chart to adjust prices in real time, with floating P&L tooltips and instant database saving on release.

4. **Analytics & Performance Tracking:**
   * Added an **Account Statement Modal** with CSV download and Print-to-PDF formatting.
   * Added an **Equity Curve SVG Visualizer** showing balance and equity growth over time, profit factor, win rate, and drawdown.

5. **Safety, Testing & Architecture Integrity:**
   * Preserved all files and the local database (`data/trading_store.json`) for presentation and grading.
   * Created 20 comprehensive unit tests covering orders, margin math, analytics, Exness credentials, and webhooks. All 20 tests pass.
