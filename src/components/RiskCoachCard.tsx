'use client';

import React, { useEffect, useState } from 'react';
import { RiskCoachReport } from '@/lib/types';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, RefreshCw, Flame } from 'lucide-react';

export default function RiskCoachCard() {
  const [report, setReport] = useState<RiskCoachReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/risk-coach');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching risk report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-cyan-400" />
        Auditing trading psychology & risk metrics...
      </div>
    );
  }

  if (!report) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Risk Coach & Behavioral Auditor
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              Detects position creep, revenge trading & overtrading habits
            </p>
          </div>
        </div>

        <button
          onClick={fetchReport}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          title="Refresh Risk Audit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Score & Quick Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Risk Health Score */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${getScoreColor(
            report.riskScore
          )}`}
        >
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider block">
              Risk Health Score
            </span>
            <span className="text-2xl font-extrabold font-mono">{report.riskScore}/100</span>
            <p className="text-[10px] font-bold mt-0.5">{report.status}</p>
          </div>
          <Flame className="w-8 h-8 opacity-40 shrink-0" />
        </div>

        {/* Avg Holding Time */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#090D17] border border-slate-200 dark:border-slate-800/90 font-mono">
          <span className="text-[10px] text-slate-500 uppercase block">Avg Hold Time</span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-200">
            {report.metrics.avgHoldingMinutes} mins
          </span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Execution patience</p>
        </div>

        {/* Quick Flips (Revenge Trades) */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#090D17] border border-slate-200 dark:border-slate-800/90 font-mono">
          <span className="text-[10px] text-slate-500 uppercase block">Quick Re-Entries</span>
          <span
            className={`text-base font-bold ${
              report.metrics.quickFlipCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {report.metrics.quickFlipCount}
          </span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Trades &lt;5m after a loss</p>
        </div>

        {/* Max Consecutive Losses */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#090D17] border border-slate-200 dark:border-slate-800/90 font-mono">
          <span className="text-[10px] text-slate-500 uppercase block">Max Loss Streak</span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-200">
            {report.metrics.maxConsecutiveLosses}
          </span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Drawdown tolerance</p>
        </div>
      </div>

      {/* Active Behavioral Warnings */}
      {report.activeWarnings.length > 0 ? (
        <div className="space-y-2">
          {report.activeWarnings.map((w, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start gap-3 ${
                w.severity === 'CRITICAL'
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs font-mono">{w.title}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-black/10 dark:bg-black/40">
                    {w.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-sans">{w.description}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 opacity-80">
                  Evidence: {w.evidence}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-400 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Zero behavioral red flags detected. Excellent emotional discipline across your portfolio.</span>
        </div>
      )}

      {/* Coach Actionable Guidance */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080C14] border border-indigo-200 dark:border-indigo-900/40">
        <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1.5">
          Risk Coach Behavioral Prescription
        </span>
        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
          {report.coachAdvice.map((advice, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">✦</span>
              <span>{advice}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
