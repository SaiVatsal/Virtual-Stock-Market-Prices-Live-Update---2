'use client';

import React, { useState } from 'react';
import { SymbolId, PriceQuote, OrderSide, OrderType, OrderRequest, MarketScheduleInfo } from '@/lib/types';
import { INSTRUMENT_SPECS } from '@/lib/specs';
import {
  ArrowDown,
  ArrowUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Sliders,
  Layers,
  BarChart,
  Percent,
  ShieldAlert
} from 'lucide-react';

interface OrderTicketProps {
  symbol: SymbolId;
  quote?: PriceQuote;
  freeMargin: number;
  leverage: number;
  onOrderPlaced: () => void;
  marketSchedule?: MarketScheduleInfo;
  marketMode: 'REAL_MARKET_HOURS' | 'WEEKEND_OTC_PRACTICE';
}

export default function OrderTicket({
  symbol,
  quote,
  freeMargin,
  leverage,
  onOrderPlaced,
  marketSchedule,
  marketMode
}: OrderTicketProps) {
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [lots, setLots] = useState<number>(symbol === 'XAUUSD' ? 1.0 : symbol === 'EURUSD' ? 1.0 : 0.5);
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [oneClickTrading, setOneClickTrading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const spec = INSTRUMENT_SPECS[symbol];
  const currentBid = quote?.bid || (symbol === 'XAUUSD' ? 4284.90 : symbol === 'EURUSD' ? 1.13850 : 84029.00);
  const currentAsk = quote?.ask || (symbol === 'XAUUSD' ? 4285.25 : symbol === 'EURUSD' ? 1.13862 : 84044.00);

  // Compute required margin with leverage
  const contractSize = spec?.contractSize || 100;
  const executionPrice = orderType === 'MARKET' ? currentAsk : parseFloat(limitPrice) || currentAsk;
  const estMargin = Math.round(((lots * contractSize * executionPrice) / leverage) * 100) / 100;
  const hasEnoughMargin = freeMargin >= estMargin;

  // Max lots purchasable with available free margin
  const maxLots = Math.max(0.01, Math.floor(((freeMargin * leverage) / (contractSize * executionPrice)) * 100) / 100);

  // 24h range percentage
  const low24h = quote?.low24h || currentBid * 0.994;
  const high24h = quote?.high24h || currentAsk * 1.006;
  const rangePercent = Math.min(100, Math.max(0, Math.round(((currentBid - low24h) / (high24h - low24h)) * 100)));

  // Check if traditional market is closed
  const isWeekend = marketSchedule && !marketSchedule.isForexOpen;
  const isMarketClosed = isWeekend && symbol !== 'BTCUSD' && marketMode === 'REAL_MARKET_HOURS';

  // Preset lot buttons
  const lotPresets = symbol === 'BTCUSD' ? [0.1, 0.5, 1.0, 2.0] : [0.01, 0.1, 0.5, 1.0, 2.5, 5.0];

  const handleExecute = async (side: OrderSide) => {
    if (isMarketClosed) {
      setFeedback({
        type: 'error',
        message: `Market for ${symbol} is closed for the weekend. Switch to '24/7 OTC Demo' or trade BTCUSD.`
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload: OrderRequest = {
        symbol,
        side,
        type: orderType,
        lots,
        price: orderType !== 'MARKET' ? parseFloat(limitPrice) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        smcContext: {
          pattern: `Exness ${orderType} Instant Execution`,
          timeframe: '15m'
        }
      };

      const res = await fetch('/api/trade/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setFeedback({
        type: 'success',
        message: data.message || `Filled ${side} ${lots} lots @ ${side === 'BUY' ? currentAsk : currentBid}`
      });
      onOrderPlaced();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Execution error'
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const applyQuickRiskReward = (side: OrderSide, riskPips: number, rewardPips: number) => {
    const pip = spec.pipSize;
    if (side === 'BUY') {
      const sl = currentAsk - riskPips * pip;
      const tp = currentAsk + rewardPips * pip;
      setStopLoss(sl.toFixed(spec.decimals));
      setTakeProfit(tp.toFixed(spec.decimals));
    } else {
      const sl = currentBid + riskPips * pip;
      const tp = currentBid - rewardPips * pip;
      setStopLoss(sl.toFixed(spec.decimals));
      setTakeProfit(tp.toFixed(spec.decimals));
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#080C14] border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 shadow-xl text-slate-800 dark:text-slate-100">
      {/* Header with live spread and One-Click toggle */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2 mb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-mono font-extrabold text-slate-900 dark:text-slate-100 uppercase">{symbol}</h2>
            <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-300 dark:border-cyan-800/40">
              1:{leverage}
            </span>
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1 py-0.2 rounded border border-amber-300 dark:border-amber-800/40">
              Exness Pro
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {spec.name} • 1 Lot = {spec.contractSize.toLocaleString()} units
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* One-Click Trading pill */}
          <button
            onClick={() => setOneClickTrading(!oneClickTrading)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              oneClickTrading ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Zap className="w-2.5 h-2.5" />
            <span>1-Click: {oneClickTrading ? 'ON' : 'OFF'}</span>
          </button>

          <div className="text-right font-mono">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase block">Spread</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {quote ? `${(quote.spread / spec.pipSize).toFixed(1)} pips` : '0.4 pips'}
            </span>
          </div>
        </div>
      </div>

      {/* Order Type Selector: Market / Limit / Stop */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-[#0D1322] p-1 rounded-lg border border-slate-200 dark:border-slate-800 mb-2.5 text-xs font-mono">
        <button
          onClick={() => setOrderType('MARKET')}
          className={`py-1 text-center rounded font-semibold transition-colors ${
            orderType === 'MARKET'
              ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Market
        </button>
        <button
          onClick={() => setOrderType('LIMIT')}
          className={`py-1 text-center rounded font-semibold transition-colors ${
            orderType === 'LIMIT'
              ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Limit
        </button>
        <button
          onClick={() => setOrderType('STOP')}
          className={`py-1 text-center rounded font-semibold transition-colors ${
            orderType === 'STOP'
              ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Stop
        </button>
      </div>

      {/* Market Closed Banner if applicable */}
      {isMarketClosed && (
        <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 mb-2.5 flex items-start gap-2">
          <Clock className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Market Closed:</strong> Forex & Gold trading reopens Sunday 21:00 UTC. To practice right now, toggle{' '}
            <span className="underline font-bold">24/7 OTC Demo</span> in the top header or trade BTCUSD 24/7.
          </div>
        </div>
      )}

      {/* Exness Dual Execution Cards (SELL Bid / BUY Ask) */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {/* SELL CARD */}
        <button
          type="button"
          onClick={() => handleExecute('SELL')}
          disabled={isSubmitting || !hasEnoughMargin || isMarketClosed}
          className="p-3 rounded-xl bg-gradient-to-b from-rose-50 dark:from-[#2B1017] to-rose-100 dark:to-[#1F0A11] hover:from-rose-100 dark:hover:from-[#3D1420] border border-rose-300 dark:border-rose-700/50 flex flex-col items-center justify-center text-center transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-rose-900/10"
        >
          <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-300 font-extrabold uppercase tracking-wider mb-0.5">
            <ArrowDown className="w-3 h-3 stroke-[3]" />
            <span>SELL</span>
          </div>
          <span className="text-xl font-mono font-black text-rose-600 dark:text-rose-400">
            {currentBid.toFixed(spec.decimals)}
          </span>
          <span className="text-[10px] text-rose-500/80 dark:text-rose-300/70 font-mono mt-0.5">
            Market Bid
          </span>
        </button>

        {/* BUY CARD */}
        <button
          type="button"
          onClick={() => handleExecute('BUY')}
          disabled={isSubmitting || !hasEnoughMargin || isMarketClosed}
          className="p-3 rounded-xl bg-gradient-to-b from-emerald-50 dark:from-[#0A261D] to-emerald-100 dark:to-[#071C15] hover:from-emerald-100 dark:hover:from-[#0E3529] border border-emerald-300 dark:border-emerald-600/50 flex flex-col items-center justify-center text-center transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-emerald-900/10"
        >
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-300 font-extrabold uppercase tracking-wider mb-0.5">
            <ArrowUp className="w-3 h-3 stroke-[3]" />
            <span>BUY</span>
          </div>
          <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
            {currentAsk.toFixed(spec.decimals)}
          </span>
          <span className="text-[10px] text-emerald-500/80 dark:text-emerald-300/70 font-mono mt-0.5">
            Market Ask
          </span>
        </button>
      </div>

      {/* Limit Price Input if Pending Order */}
      {orderType !== 'MARKET' && (
        <div className="mb-2 p-2 rounded-lg bg-slate-50 dark:bg-[#060910] border border-slate-200 dark:border-slate-800">
          <label className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase block mb-1">
            Trigger {orderType} Price
          </label>
          <input
            type="number"
            step={spec.pipSize}
            placeholder={currentBid.toFixed(spec.decimals)}
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="w-full bg-white dark:bg-[#0B0F1A] border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Lot Size Volume Selector */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Order Volume (Lots)</span>
          <span className="text-[10px] font-mono text-slate-500">
            Max: <strong className="text-cyan-600 dark:text-cyan-400">{maxLots} Lots</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <button
            type="button"
            onClick={() => setLots((l) => Math.max(0.01, Math.round((l - 0.1) * 100) / 100))}
            className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold"
          >
            -0.1
          </button>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={maxLots}
            value={lots}
            onChange={(e) => setLots(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
            className="flex-1 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-[#060910] border border-slate-300 dark:border-slate-700 rounded py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => setLots((l) => Math.round((l + 0.1) * 100) / 100)}
            className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold"
          >
            +0.1
          </button>
        </div>

        {/* Quick lot pills */}
        <div className="flex flex-wrap gap-1">
          {lotPresets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setLots(p)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                lots === p
                  ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stop Loss & Take Profit */}
      <div className="space-y-1.5 mb-2.5 bg-slate-50 dark:bg-[#060910] p-2 rounded-lg border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-medium">SL / TP Protection</span>
          <div className="flex gap-1.5 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => applyQuickRiskReward('BUY', 30, 75)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              1:2.5 Buy R:R
            </button>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <button
              type="button"
              onClick={() => applyQuickRiskReward('SELL', 30, 75)}
              className="text-rose-600 dark:text-rose-400 hover:underline"
            >
              1:2.5 Sell R:R
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-mono text-rose-600 dark:text-rose-400 uppercase">Stop Loss</label>
            <input
              type="number"
              step={spec.pipSize}
              placeholder={currentBid ? (currentBid - 30 * spec.pipSize).toFixed(spec.decimals) : 'Optional'}
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-white dark:bg-[#0B0F1A] border border-slate-300 dark:border-slate-700/80 rounded px-2 py-1 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase">Take Profit</label>
            <input
              type="number"
              step={spec.pipSize}
              placeholder={currentAsk ? (currentAsk + 75 * spec.pipSize).toFixed(spec.decimals) : 'Optional'}
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full bg-white dark:bg-[#0B0F1A] border border-slate-300 dark:border-slate-700/80 rounded px-2 py-1 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Margin Requirement Summary */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/40 px-2 py-1 rounded mb-2.5 border border-slate-200 dark:border-slate-800/60">
        <span>Required Margin:</span>
        <span className={hasEnoughMargin ? 'text-slate-900 dark:text-slate-200 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
          ${estMargin.toFixed(2)}
        </span>
      </div>

      {/* 24-Hour Market Range Meter (Fills the gap!) */}
      <div className="mb-2.5 p-2 rounded-lg bg-slate-50 dark:bg-[#060910] border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] mb-1">
          <span>24h Low: ${low24h.toFixed(spec.decimals)}</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">Session Range ({rangePercent}%)</span>
          <span>24h High: ${high24h.toFixed(spec.decimals)}</span>
        </div>
        <div className="relative w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${rangePercent}%` }}
          />
        </div>
      </div>

      {/* Level 2 Micro Depth / Order Book Preview (Fills the gap!) */}
      <div className="mb-2.5 p-2 rounded-lg bg-slate-50 dark:bg-[#060910] border border-slate-200 dark:border-slate-800 text-[10px] font-mono">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1 font-bold">
            <Layers className="w-3 h-3 text-cyan-500" />
            Exness Level 2 Depth
          </span>
          <span className="text-[9px]">Market Depth</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Ask 3: ${(currentAsk + 0.30).toFixed(spec.decimals)}</span>
            <div className="w-16 h-1 bg-emerald-500/30 rounded" />
            <span className="text-emerald-600 dark:text-emerald-400">12.5 Lots</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Ask 1: ${currentAsk.toFixed(spec.decimals)}</span>
            <div className="w-24 h-1 bg-emerald-500/50 rounded" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">28.0 Lots</span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Bid 1: ${currentBid.toFixed(spec.decimals)}</span>
            <div className="w-20 h-1 bg-rose-500/50 rounded" />
            <span className="text-rose-600 dark:text-rose-400 font-bold">24.5 Lots</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Bid 3: ${(currentBid - 0.30).toFixed(spec.decimals)}</span>
            <div className="w-12 h-1 bg-rose-500/30 rounded" />
            <span className="text-rose-600 dark:text-rose-400">15.0 Lots</span>
          </div>
        </div>
      </div>

      {/* Contract Specifications & Exness Advantages (Fills the gap!) */}
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#070A10] border border-slate-200 dark:border-slate-800/90 text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-1 mt-auto">
        <div className="flex justify-between">
          <span>Pip Value (1 Lot):</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">${(spec.contractSize * spec.pipSize).toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between">
          <span>Swap Long / Short:</span>
          <span>
            <strong className="text-rose-500">-$4.20</strong> / <strong className="text-emerald-500">+$1.80</strong>
          </span>
        </div>
        <div className="flex justify-between">
          <span>Stop Out Level:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">0% (Exness Protection)</span>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-1.5 p-2 rounded text-xs mt-2 font-mono ${
            feedback.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span className="truncate">{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
