'use client';

import React from 'react';
import { AccountState, PriceQuote, SymbolId, MarketScheduleInfo } from '@/lib/types';
import {
  TrendingUp,
  Settings,
  Code2,
  Zap,
  Clock,
  ShieldCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface HeaderNavProps {
  account: AccountState;
  quotes: Record<SymbolId, PriceQuote>;
  selectedSymbol: SymbolId;
  onSelectSymbol: (symbol: SymbolId) => void;
  onOpenSettings: () => void;
  onOpenPineScript: () => void;
  onTriggerTestSignal: () => void;
  isSimulatingSignal: boolean;
  marketSchedule?: MarketScheduleInfo;
  marketMode: 'REAL_MARKET_HOURS' | 'WEEKEND_OTC_PRACTICE';
  onToggleMarketMode: () => void;
  exnessAccount?: {
    id: string;
    server: string;
    type: string;
  };
}

export default function HeaderNav({
  account,
  quotes,
  selectedSymbol,
  onSelectSymbol,
  onOpenSettings,
  onOpenPineScript,
  onTriggerTestSignal,
  isSimulatingSignal,
  marketSchedule,
  marketMode,
  onToggleMarketMode,
  exnessAccount
}: HeaderNavProps) {
  const symbols: { id: SymbolId; label: string; sub: string }[] = [
    { id: 'XAUUSD', label: 'GOLD / USD', sub: 'Spot Commodities' },
    { id: 'EURUSD', label: 'EUR / USD', sub: 'Major Forex' },
    { id: 'BTCUSD', label: 'BTC / USD', sub: 'Crypto 24/7' }
  ];

  const pnlIsPositive = account.unrealizedPnL >= 0;
  const isWeekendClosed = marketSchedule && !marketSchedule.isForexOpen;

  return (
    <header className="w-full bg-[#070A10] border-b border-slate-800/90 sticky top-0 z-40 px-3 py-2">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        {/* Brand & Exness Terminal Identity */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Exness-inspired logo mark */}
            <div className="h-8 px-2 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center font-extrabold text-black tracking-tighter text-xs shadow-md shadow-amber-500/20">
              EXNESS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-wider text-slate-100">
                  TERMINAL <span className="text-cyan-400">PRO</span>
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/40">
                  {exnessAccount?.type || 'PRO'} DEMO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {exnessAccount?.id || 'EX-9482104'} • {exnessAccount?.server || 'Exness-Trial2'}
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Symbol Selector with Real Market Prices */}
          <div className="flex items-center gap-1 bg-[#0B0F1A] p-1 rounded-lg border border-slate-800/90">
            {symbols.map((s) => {
              const q = quotes[s.id];
              const isSelected = selectedSymbol === s.id;
              const isPositiveChange = q && q.change24h >= 0;

              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSymbol(s.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <span className="font-mono">{s.id}</span>
                  {q && (
                    <span className="font-mono text-[11px] text-slate-200 font-semibold">
                      ${q.bid.toFixed(s.id === 'EURUSD' ? 5 : 2)}
                    </span>
                  )}
                  {s.id === 'BTCUSD' && (
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                      24/7
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Market Status & Weekend Toggle like Exness */}
          <div className="flex items-center gap-2">
            {isWeekendClosed ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-950/30 border border-rose-800/40 text-[11px] font-mono text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-bold">WEEKEND: MARKET CLOSED</span>
                <span className="text-slate-400 text-[10px] hidden md:inline">
                  (Opens Sun 21:00 UTC)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] font-mono text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-bold">MARKET OPEN</span>
              </div>
            )}

            {/* Mode Toggle Button */}
            <button
              onClick={onToggleMarketMode}
              title="Toggle between Strict Real Market Hours (freezes on weekends) and 24/7 OTC Demo Practice"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0F1626] border border-slate-700/80 hover:border-slate-600 text-[10px] font-mono text-slate-300 transition-colors"
            >
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>
                Mode:{' '}
                <strong className={marketMode === 'WEEKEND_OTC_PRACTICE' ? 'text-cyan-400' : 'text-amber-400'}>
                  {marketMode === 'WEEKEND_OTC_PRACTICE' ? '24/7 OTC Demo' : 'Real Hours'}
                </strong>
              </span>
            </button>
          </div>
        </div>

        {/* Telemetry & Action Strip */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 xl:pb-0">
          {/* Exness Telemetry Bar */}
          <div className="flex items-center gap-2.5 bg-[#0A0E18] px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Balance</span>
              <span className="font-bold text-slate-200">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Equity</span>
              <span className="font-bold text-cyan-400">
                ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">P&L</span>
              <span className={`font-bold ${pnlIsPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pnlIsPositive ? '+' : ''}${account.unrealizedPnL.toFixed(2)}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden 2xl:block" />

            <div className="hidden 2xl:block">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Free Margin</span>
              <span className="text-slate-300">${account.freeMargin.toFixed(2)}</span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden 2xl:block" />

            <div className="hidden 2xl:block">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Leverage</span>
              <span className="text-amber-400 font-bold">1:{account.leverage}</span>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onTriggerTestSignal}
              disabled={isSimulatingSignal}
              title="Simulate TradingView Webhook alert"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 font-mono"
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulatingSignal ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">Simulate Alert</span>
            </button>

            <button
              onClick={onOpenPineScript}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Pine Script</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-all"
              title="Exness Credentials & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
