# NEXUS TRADER — Virtual Stock & Forex Paper Trading Platform

An institutional-grade simulated paper-trading platform for **Forex & Gold (XAUUSD, EURUSD, BTCUSD)** built with Next.js 14, Tailwind CSS, embedded TradingView Advanced Real-Time Charts, OANDA v20 REST pricing engine, Pine Script webhooks, and a server-side Claude 3.5 AI suite.

![Nexus Trader Terminal](https://raw.githubusercontent.com/tradingview/tradingview/master/public/logo.png)

---

## 🌟 Key Features

### 1. Embedded TradingView Advanced Real-Time Chart
- Native integration with the free TradingView Advanced Chart widget (`s3.tradingview.com/tv.js`).
- Complete technical analysis toolbar, multi-timeframe candle charting, RSI/MA indicators, and drawing tools.
- Auto-synchronized with the active desk symbol (`OANDA:XAUUSD`, `FX:EURUSD`, `BINANCE:BTCUSDT`).

### 2. Live Market Price Feed & Execution Engine (OMS)
- **Primary Data:** OANDA v20 REST API (`api-fxpractice.oanda.com`) purpose-built for forex and gold practice accounts.
- **Secondary Fallback:** Twelve Data REST API.
- **Internal High-Fidelity Tick Engine:** Realistic Brownian motion micro-tick simulator running offline or when external keys are not supplied.
- **Live Stream:** Real-time Server-Sent Events (SSE) `/api/stream/market` pushing sub-second quotes, mark-to-market P&L, margin calculations, and auto-triggering Stop Loss (SL) and Take Profit (TP).

### 3. TradingView Webhook Endpoint & Custom Pine Script SMC Indicator
- **Endpoint:** `POST /api/webhooks/tradingview` receives JSON alert payloads fired by your TradingView indicators.
- **Ready-to-Paste Pine Script v5:**
  - Includes detection for:
    - Swing High/Low Liquidity Sweeps
    - Bullish & Bearish Order Blocks (OB)
    - Fair Value Gaps (FVG)
    - Market Structure Shifts (MSS / CHoCH)
  - Pre-configured `alertcondition()` definitions dispatching structured JSON to your webhook.
- **Live Signals Feed:** Real-time stream of incoming alerts with empirical win-rate calculations and Claude structural context notes.
- **In-App Simulator:** 1-Click "Simulate Alert" button to test the ingestion pipeline without external setup.

### 4. Server-Side Claude AI Suite (Anthropic Claude 3.5 Sonnet)
*All AI logic runs strictly server-side; API keys are never exposed to client network calls.*

- **AI Trade Journal:**
  - On trade close, sends execution parameters, holding duration, and SMC structure context to Claude.
  - Returns a structured technical critique (Grade A+ to F, Confluence Score 1-10, Liquidity Sweep analysis, Order Block mitigation, Fair Value Gap evaluation, Mistakes, and Actionable Lessons).
- **Signal Confidence:**
  - Computes empirical historical win rates (% win, sample size, profit factor, average R:R) from stored trade history.
  - Pairs each signal with a concise 2-sentence institutional structural note (never an unexplained buy/sell call).
- **Macro Briefing:**
  - Analyzes high-impact economic calendar events (FOMC, NFP, CPI, ECB).
  - Synthesizes pre-session volatility forecasts and risk windows for Gold, EUR, and BTC.
- **Risk Coach HUD:**
  - Continuously audits your portfolio for toxic behavioral patterns:
    - **Position-Size Creep:** Sizing up abruptly after wins or losses.
    - **Revenge Trading:** Re-entering positions within 5 minutes of a loss.
    - **News Overtrading:** Rapid-fire order clusters during volatility spikes.
    - **Stop Loss Omission:** Operating unhedged positions without defined risk.
  - Surfaced as a live Risk Health Score (0-100) card with actionable coaching guidance.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configuration (Optional)
Create a `.env.local` file or configure via the in-app **Settings** modal:
```env
# Anthropic Claude API Key (Server-side AI suite)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OANDA v20 Practice Environment (Free practice account)
OANDA_API_KEY=your_oanda_practice_token
OANDA_ACCOUNT_ID=101-004-xxxxxxx-001

# Twelve Data (Optional Fallback)
TWELVE_DATA_API_KEY=your_twelve_data_key

# Webhook Secret Token (Optional for alert authentication)
TRADINGVIEW_WEBHOOK_SECRET=sk_tv_smc_institutional
```

*Note: If no API keys are provided, the platform automatically runs in realistic hybrid simulation mode with full AI heuristic fallback and high-fidelity tick generation.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npm run test
```
Executes all unit, integration, and E2E vitest test suites covering market matching, margin calculations, webhooks, risk coaching, and AI services.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/exness` | `GET / POST` | Exness MT5 Gateway status, account telemetry, and credentials authentication |
| `/api/exness/trade` | `POST` | Route trade executions directly through Exness platform bridge |
| `/api/stream/market` | `GET` | SSE stream pushing live quotes, portfolio equity, margin, and open positions |
| `/api/trade/order` | `POST` | Execute market or limit order with SL/TP parameters |
| `/api/trade/close` | `POST` | Close position, calculate realized P&L, trigger AI Trade Journal critique |
| `/api/webhooks/tradingview` | `POST` | Ingestion endpoint for TradingView Pine Script alert payloads |
| `/api/signals` | `GET / POST` | Fetch received signals / trigger simulated alert test |
| `/api/journal` | `GET / POST` | Fetch trade history with AI critiques / regenerate critique |
| `/api/risk-coach` | `GET` | Retrieve behavioral risk audit & psychological health score |
| `/api/macro` | `GET / POST` | Fetch economic calendar & Claude pre-session volatility brief |
| `/api/settings` | `GET / POST` | Read masked credentials & update platform settings |

---

## 🛠️ Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Institutional Terminal Palette
- **Icons:** Lucide React
- **AI SDK:** `@anthropic-ai/sdk` (Claude 3.5 Sonnet)
- **Testing:** Vitest
