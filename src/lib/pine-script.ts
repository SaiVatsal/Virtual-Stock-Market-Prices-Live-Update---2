export const PINE_SCRIPT_INDICATOR_V5 = `//@version=5
indicator("SMC & Key-Levels Institutional Engine [Antigravity]", overlay=true, max_boxes_count=500, max_lines_count=500)

// ---------------------------------------------------------
// INPUTS & CONFIGURATION
// ---------------------------------------------------------
group_smc = "Smart Money Concepts (SMC)"
swing_len = input.int(5, "Swing High/Low Length", minval=2, maxval=50, group=group_smc)
show_ob = input.bool(true, "Show Order Blocks (OB)", group=group_smc)
show_fvg = input.bool(true, "Show Fair Value Gaps (FVG)", group=group_smc)
show_sweeps = input.bool(true, "Highlight Liquidity Sweeps", group=group_smc)

group_webhook = "TradingView Webhook Configuration"
webhook_secret = input.string("sk_tv_smc_institutional", "Webhook Secret Token", group=group_webhook)

// ---------------------------------------------------------
// SWING HIGHS & LOWS
// ---------------------------------------------------------
ph = ta.pivothigh(high, swing_len, swing_len)
pl = ta.pivotlow(low, swing_len, swing_len)

var float last_swing_high = na
var float last_swing_low = na

if not na(ph)
    last_swing_high := ph

if not na(pl)
    last_swing_low := pl

// ---------------------------------------------------------
// LIQUIDITY SWEEP DETECTION
// ---------------------------------------------------------
// Bullish Sweep: Price wicks below previous swing low, but closes back above it
bullish_sweep = not na(last_swing_low) and low < last_swing_low and close > last_swing_low and close > open
// Bearish Sweep: Price wicks above previous swing high, but closes back below it
bearish_sweep = not na(last_swing_high) and high > last_swing_high and close < last_swing_high and close < open

// ---------------------------------------------------------
// FAIR VALUE GAP (FVG) DETECTION
// ---------------------------------------------------------
bullish_fvg = show_fvg and (low > high[2]) and (close[1] > open[1])
bearish_fvg = show_fvg and (high < low[2]) and (close[1] < open[1])

// ---------------------------------------------------------
// ORDER BLOCK (OB) DETECTION
// ---------------------------------------------------------
// Bullish OB: Last down-candle before an impulsive upward break
bullish_ob = show_ob and (close[1] < open[1]) and (close > high[1]) and (close > high[2])
// Bearish OB: Last up-candle before an impulsive downward break
bearish_ob = show_ob and (close[1] > open[1]) and (close < low[1]) and (close < low[2])

// ---------------------------------------------------------
// PLOTTING & VISUALIZATION
// ---------------------------------------------------------
plotshape(bullish_sweep and show_sweeps, title="Bullish Liquidity Sweep", style=shape.triangleup, location=location.belowbar, color=color.new(#10B981, 0), size=size.small, text="SWEEP")
plotshape(bearish_sweep and show_sweeps, title="Bearish Liquidity Sweep", style=shape.triangledown, location=location.abovebar, color=color.new(#F43F5E, 0), size=size.small, text="SWEEP")

if bullish_fvg
    box.new(left=bar_index-2, top=low, right=bar_index+5, bottom=high[2], border_color=color.new(#10B981, 60), bgcolor=color.new(#10B981, 85))

if bearish_fvg
    box.new(left=bar_index-2, top=low[2], right=bar_index+5, bottom=high, border_color=color.new(#F43F5E, 60), bgcolor=color.new(#F43F5E, 85))

// ---------------------------------------------------------
// WEBHOOK ALERTS (DISPATCH TO YOUR PAPER TRADING TERMINAL)
// ---------------------------------------------------------
// Alert 1: Bullish Liquidity Sweep + Confluence
alertcondition(bullish_sweep, title="Bullish SMC Liquidity Sweep Alert", 
  message='{"symbol":"{{ticker}}","action":"BUY","price":{{close}},"timeframe":"{{interval}}","strategy":"SMC_Liquidity_Sweep","smc_data":{"pattern":"Liquidity Sweep of Swing Low into Demand","key_level":{{low}},"bias":"BULLISH"}}')

// Alert 2: Bearish Liquidity Sweep + Confluence
alertcondition(bearish_sweep, title="Bearish SMC Liquidity Sweep Alert", 
  message='{"symbol":"{{ticker}}","action":"SELL","price":{{close}},"timeframe":"{{interval}}","strategy":"SMC_Liquidity_Sweep","smc_data":{"pattern":"Liquidity Sweep of Swing High into Supply","key_level":{{high}},"bias":"BEARISH"}}')

// Alert 3: Order Block Mitigation
alertcondition(bullish_ob, title="Bullish Order Block Alert", 
  message='{"symbol":"{{ticker}}","action":"BUY","price":{{close}},"timeframe":"{{interval}}","strategy":"SMC_Order_Block","smc_data":{"pattern":"H1 Bullish Order Block Expansion","order_block":{{low[1]}},"bias":"BULLISH"}}')

alertcondition(bearish_ob, title="Bearish Order Block Alert", 
  message='{"symbol":"{{ticker}}","action":"SELL","price":{{close}},"timeframe":"{{interval}}","strategy":"SMC_Order_Block","smc_data":{"pattern":"H1 Bearish Order Block Mitigation","order_block":{{high[1]}},"bias":"BEARISH"}}')
`;

export const WEBHOOK_DOCS = {
  url: '/api/webhooks/tradingview',
  instructions: [
    'Open TradingView (or your embedded chart) and open the Pine Editor.',
    'Paste the Pine Script code and click "Add to Chart".',
    'Right-click on the chart and select "Add Alert on SMC & Key-Levels Institutional Engine".',
    'Set Condition to any of the SMC alerts (e.g. Bullish SMC Liquidity Sweep).',
    'Check the "Webhook URL" checkbox in the alert creation modal.',
    'Enter your webhook URL: http://localhost:3000/api/webhooks/tradingview (or your deployed domain).',
    'Ensure Message is left as {{strategy.order.alert_message}} or the pre-formatted JSON from the script.'
  ]
};
