'use client';

import React from 'react';
import { Position, AIJournalCritique } from '@/lib/types';
import { X, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, Award, BookOpen } from 'lucide-react';

interface AIJournalModalProps {
  trade: Position | null;
  onClose: () => void;
  onRegenerateCritique?: (tradeId: string) => void;
  isRegenerating?: boolean;
}

export default function AIJournalModal({
  trade,
  onClose,
  onRegenerateCritique,
  isRegenerating
}: AIJournalModalProps) {
  if (!trade) return null;

  const critique: AIJournalCritique | undefined = trade.aiCritique;
  const isWinner = trade.profit >= 0;

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50 shadow-emerald-900/30';
      case 'B':
        return 'text-cyan-400 bg-cyan-950/80 border-cyan-500/50 shadow-cyan-900/30';
      case 'C':
        return 'text-amber-400 bg-amber-950/80 border-amber-500/50 shadow-amber-900/30';
      default:
        return 'text-rose-400 bg-rose-950/80 border-rose-500/50 shadow-rose-900/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0E18] border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-wide text-white">
                  AI Trade Journal & SMC Audit
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/40">
                  Claude 3.5 Sonnet
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ticket: {trade.id} • {trade.symbol} {trade.side} {trade.lots} Lots
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trade Summary Strip */}
        <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-[#06090F] border border-slate-800/80 mb-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">ENTRY PRICE</span>
            <span className="font-bold text-slate-200">${trade.entryPrice}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">EXIT PRICE</span>
            <span className="font-bold text-slate-200">${trade.exitPrice ?? '-'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">NET PROFIT</span>
            <span className={`font-bold ${isWinner ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isWinner ? '+' : ''}${trade.profit.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">PIPS GAINED</span>
            <span className={`font-bold ${isWinner ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isWinner ? '+' : ''}{trade.profitPips.toFixed(1)} pips
            </span>
          </div>
        </div>

        {critique ? (
          <div className="space-y-4">
            {/* Grade & Confluence Score Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0D1424] border border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-2xl border shadow-lg ${getGradeColor(
                    critique.grade
                  )}`}
                >
                  {critique.grade}
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 block">
                    Execution Grade
                  </span>
                  <p className="text-xs text-slate-200 font-semibold">{critique.verdict}</p>
                </div>
              </div>

              <div className="text-right pl-3 border-l border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase">SMC Confluence</span>
                <p className="text-base font-bold text-cyan-400 font-mono">
                  {critique.confluenceScore}/10
                </p>
              </div>
            </div>

            {/* Smart Money Concepts (ICT/SMC) Breakdown */}
            <div className="p-3.5 rounded-xl bg-[#0D1424] border border-slate-800">
              <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2.5">
                <Award className="w-3.5 h-3.5" />
                ICT / SMC Structural Mechanics Audit
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-[#070A10] border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
                    Liquidity Sweep Analysis
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {critique.smcAnalysis.liquiditySweepVerdict}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#070A10] border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
                    Order Block Mitigation
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {critique.smcAnalysis.orderBlockMitigation}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#070A10] border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
                    Fair Value Gap (FVG)
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {critique.smcAnalysis.fairValueGapContext}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#070A10] border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
                    Market Structure Shift (MSS)
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {critique.smcAnalysis.marketStructureShift}
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths & Mistakes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Strengths */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Execution Strengths</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {critique.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mistakes & Flaws */}
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flaws & Inefficiencies</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {critique.mistakes.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rule Violations if any */}
            {critique.ruleViolations && critique.ruleViolations.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Risk Rule Violations Detected</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-200/90 space-y-0.5">
                  {critique.ruleViolations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actionable Lesson */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-800/50">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                Actionable Technical Lesson
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {critique.actionableLesson}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-[#0D1424] rounded-xl text-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            <p className="text-sm font-medium text-slate-300">
              No AI critique attached yet.
            </p>
            {onRegenerateCritique && (
              <button
                onClick={() => onRegenerateCritique(trade.id)}
                disabled={isRegenerating}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-colors disabled:opacity-50"
              >
                {isRegenerating ? 'Generating Critique...' : 'Generate AI Review Now'}
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Journal
          </button>
        </div>
      </div>
    </div>
  );
}
