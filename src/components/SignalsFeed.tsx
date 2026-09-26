'use client';

import React from 'react';
import { SignalItem } from '@/lib/types';
import { Radio, ArrowDown, ArrowUp, Zap, BarChart2, ShieldCheck, Clock } from 'lucide-react';

interface SignalsFeedProps {
  signals: SignalItem[];
  onTriggerTestSignal: () => void;
  isSimulating: boolean;
}

export default function SignalsFeed({
  signals,
  onTriggerTestSignal,
  isSimulating
}: SignalsFeedProps) {
  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Subheader */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
            TradingView Webhook Live Feed
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40">
            POST /api/webhooks/tradingview
          </span>
        </div>

        <button
          onClick={onTriggerTestSignal}
          disabled={isSimulating}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold transition-all disabled:opacity-50"
        >
          <Zap className={`w-3 h-3 ${isSimulating ? 'animate-bounce' : ''}`} />
          <span>Fire Test Webhook Alert</span>
        </button>
      </div>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400">
          <Radio className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 stroke-1 animate-pulse" />
          <p className="text-sm font-medium">Waiting for TradingView SMC alert payloads...</p>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-1 max-w-md">
            Your Pine Script SMC indicator fires real-time alerts to the webhook endpoint. Click the button above to test the ingestion pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {signals.map((sig) => {
            const isBuy = sig.action === 'BUY';
            const stats = sig.winRateStats;
            const timeAgo = Math.max(1, Math.round((Date.now() - sig.timestamp) / 1000));

            return (
              <div
                key={sig.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#090D17] border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md"
              >
                {/* Top strip */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-extrabold ${
                        isBuy
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/50'
                      }`}
                    >
                      {isBuy ? <ArrowUp className="w-3 h-3 stroke-[3]" /> : <ArrowDown className="w-3 h-3 stroke-[3]" />}
                      {sig.action} {sig.symbol}
                    </span>

                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-200">
                      @{sig.price}
                    </span>

                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                      {sig.timeframe}
                    </span>

                    <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/30">
                      {sig.strategy}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Win rate statistical pill */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 text-[11px] font-mono">
                      <BarChart2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">Empirical Win Rate:</span>
                      <span className="font-extrabold text-cyan-700 dark:text-cyan-300">
                        {stats.winRate}%
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        (n={stats.sampleCount} | {stats.avgRiskReward}:1 R:R)
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo < 60 ? `${timeAgo}s ago` : `${Math.round(timeAgo / 60)}m ago`}
                    </span>
                  </div>
                </div>

                {/* SMC Pattern detail if present */}
                {sig.smcData?.pattern && (
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1.5 font-mono">
                    <span className="text-slate-500">Pattern: </span>
                    {sig.smcData.pattern}
                  </p>
                )}

                {/* AI Contextual Note (Never unexplained buy/sell) */}
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#05070D] border border-cyan-200 dark:border-cyan-950/80 text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-mono text-[10px] text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block font-bold mb-0.5">
                    Claude AI Structural Context
                  </span>
                  {sig.contextNote}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
