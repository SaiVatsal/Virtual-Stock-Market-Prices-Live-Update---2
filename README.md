# Nexus Trader

Nexus Trader is a virtual trading terminal built for practicing trading without using real money.

It supports Forex, Gold, and Crypto markets and provides a realistic trading experience with charts, orders, risk management, analytics, and an AI trading journal.

## What You Can Do

* Buy and sell EUR/USD, XAU/USD, and BTC/USD
* Place Market, Limit, and Stop orders
* Set and modify Stop Loss and Take Profit
* Drag trade levels directly on the chart
* View live prices and trading information
* Track balance, equity, margin, and P&L
* View open positions and pending orders
* Analyze trading performance
* Export account statements
* Receive risk and trading discipline warnings
* Review trades using AI
* Use TradingView alerts through webhooks
* Switch between dark and light mode

## Tech Stack

### Frontend

* Next.js 14
* React 18
* TypeScript
* Tailwind CSS
* Lucide React
* TradingView Charts

### Backend

* Node.js
* Next.js API Routes
* JSON file-based storage
* Vitest

### External Services

* TradingView
* OANDA
* Twelve Data
* Anthropic Claude

## Main Parts

### Trading Chart

The chart supports live market data and allows users to interact with trades directly.

Users can:

* Place pending orders
* Move Stop Loss and Take Profit
* Move pending orders
* Switch between trading and normal chart navigation
* Open charts in fullscreen
* View two charts at the same time

### Order Panel

The order panel is used to place trades.

It supports:

* Market orders
* Limit orders
* Stop orders
* Lot size selection
* Stop Loss
* Take Profit
* Margin calculation

### Positions

The positions section shows current trades and pending orders.

It displays information such as:

* Entry price
* Current price
* P&L
* Margin
* Position size

Trades can also be closed or cancelled from here.

### Analytics

Nexus Trader keeps track of trading performance including:

* Net profit and loss
* Win rate
* Profit factor
* Expected payoff
* Maximum drawdown
* Equity growth
* Approximate Sharpe ratio

Account statements can also be exported as CSV or printed as PDF.

### AI Trade Journal

The AI journal reviews completed trades and provides feedback about the trade.

It can identify things such as:

* Risk management problems
* Poor entries
* Overtrading
* Revenge trading
* SMC-related observations

### Risk Coach

The Risk Coach watches trading behaviour and provides warnings when the trader starts taking unnecessary risks.

Examples include:

* Increasing lot size too quickly
* Overleveraging
* Revenge trading
* Taking too many trades

## Backend

The main trading logic is handled by the market engine.

It manages:

* Order creation
* Position management
* Margin calculations
* P&L calculations
* Stop Loss and Take Profit
* Pending orders
* Trade modifications
* Order cancellation

The project stores account data and trading history in:

`data/trading_store.json`

## API

Some of the main API routes are:

```text
POST /api/trade/order
POST /api/trade/close
POST /api/trade/modify
POST /api/trade/cancel

GET /api/stream/market

POST /api/webhooks/tradingview

GET /api/market-status
GET /api/journal
GET /api/risk-coach
GET /api/macro

GET /api/settings
POST /api/settings
```

## Market Schedule

Forex follows normal market hours.

Crypto can be traded 24/7.

There is also a Weekend OTC Practice Mode so the application can still be used for practice when the normal Forex market is closed.

## Testing

The project includes a Vitest test suite.

There are currently **20 passing tests** covering important areas such as:

* Order handling
* Margin calculations
* Trading analytics
* Credentials
* Webhooks

## Project Goal

The main goal of Nexus Trader is to create a realistic trading environment where users can practice trading, understand risk management, and analyze their performance without risking real money.

It is mainly designed as a **paper-trading and learning platform**.
