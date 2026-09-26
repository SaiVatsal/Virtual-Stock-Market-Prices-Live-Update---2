'use client';

import React, { useEffect, useState } from 'react';
import { MacroBrief } from '@/lib/types';
import { Globe, Calendar, RefreshCw, AlertCircle, TrendingUp, Sparkles, Clock } from 'lucide-react';

export default function MacroBriefingCard() {
  const [brief, setBrief] = useState<MacroBrief | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBrief = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/macro', {
        method: force ? 'POST' : 'GET'
      });
      if (res.ok) {
        const data = await res.json();
        setBrief(data);
      }
    } catch (err) {
      console.error('Error fetching macro briefing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief(false);
  }, []);

  if (loading && !brief) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-cyan-400" />
        Synthesizing high-impact economic calendar & volatility forecasts...
      </div>
    );
  }

  if (!brief) return null;

  return (
    <div className="flex flex-col space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800/50 text-cyan-700 dark:text-cyan-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-200">
                Macro Briefing & Economic Calendar
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/40">
                Claude Volatility Brief
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Session: {brief.sessionDate} • High-impact event risk analysis
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchBrief(true)}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-mono transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Brief</span>
        </button>
      </div>

      {/* Main Grid: Calendar Events on Left, AI Volatility Brief on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Economic Calendar Events */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            High-Impact Economic Calendar
          </h4>

          <div className="space-y-1.5">
            {brief.events.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D17] border border-slate-200 dark:border-slate-800/90 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold text-[11px]">
                    {ev.time}
                  </span>
                  <span className="font-mono px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {ev.currency}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{ev.event}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
                    {ev.forecast && <span>Fcst: {ev.forecast}</span>}
                  </div>
                  <span
                    className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                      ev.impact === 'HIGH'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/40'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/40'
                    }`}
                  >
                    {ev.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Key Risk Windows */}
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-xs">
            <span className="text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" /> Key Volatility Windows
            </span>
            <ul className="text-[11px] text-rose-800 dark:text-rose-200/80 space-y-0.5 font-mono">
              {brief.briefing.keyRiskWindows.map((w, idx) => (
                <li key={idx}>⚡ {w}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Volatility Brief by Asset */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Asset Volatility Outlook (Claude Analysis)
          </h4>

          {/* Overall Sentiment */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D17] border border-cyan-200 dark:border-cyan-950/80 text-xs">
            <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 uppercase font-bold block mb-0.5">
              Prevailing Macro Regime
            </span>
            <p className="text-slate-800 dark:text-slate-200">{brief.briefing.overallSentiment}</p>
          </div>

          {/* Gold Outlook */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D17] border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase font-bold block mb-0.5">
              Gold (XAUUSD) Volatility Forecast
            </span>
            <p className="text-slate-700 dark:text-slate-300 text-[11px]">{brief.briefing.goldOutlook}</p>
          </div>

          {/* Euro Outlook */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D17] border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 uppercase font-bold block mb-0.5">
              Euro (EURUSD) Structural Bias
            </span>
            <p className="text-slate-700 dark:text-slate-300 text-[11px]">{brief.briefing.eurOutlook}</p>
          </div>

          {/* Actionable Advice */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-slate-100 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/40 text-xs">
            <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 uppercase font-bold block mb-0.5">
              Execution Strategy & Risk Cap
            </span>
            <p className="text-slate-800 dark:text-slate-200 text-[11px]">{brief.briefing.actionableAdvice}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
