'use client';

import React, { useState } from 'react';
import { Position } from '@/lib/types';
import { ArrowDown, ArrowUp, Sparkles, BookOpen, Clock, FileSpreadsheet } from 'lucide-react';
import AIJournalModal from './AIJournalModal';

interface TradeHistoryTableProps {
  history: Position[];
  onRefresh: () => void;
  onOpenStatement?: () => void;
}

export default function TradeHistoryTable({
  history,
  onRefresh,
  onOpenStatement
}: TradeHistoryTableProps) {
  const [selectedTrade, setSelectedTrade] = useState<Position | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  const handleOpenCritique = (trade: Position) => {
    setSelectedTrade(trade);
  };

  const handleRegenerate = async (tradeId: string) => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId })
      });
      const data = await res.json();
      if (data.critique) {
        setSelectedTrade((prev) => (prev ? { ...prev, aiCritique: data.critique } : null));
        onRefresh();
      }
    } catch (err) {
      console.error('Error generating AI review:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400">
        <Clock className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 stroke-1" />
        <p className="text-sm font-medium">No closed trade records yet.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Once you close a position, it will appear here with an instant AI Trade Journal review.</p>
      </div>
    );
  }

  const totalPnL = history.reduce((sum, t) => sum + t.profit, 0);

  return (
    <>
      {/* Subheader bar with quick stats and Statement Export button */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800/80 px-1">
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-500">
            Total Closed: <strong className="text-slate-900 dark:text-slate-200">{history.length}</strong>
          </span>
          <span className="text-slate-500">
            Realized P&L:{' '}
            <strong className={totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </strong>
          </span>
        </div>

        {onOpenStatement && (
          <button
            onClick={onOpenStatement}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-mono font-semibold transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Official Statement</span>
          </button>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-[#0A0E18] text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Ticket</th>
              <th className="py-2.5 px-3">Symbol</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Lots</th>
              <th className="py-2.5 px-3">Entry</th>
              <th className="py-2.5 px-3">Exit</th>
              <th className="py-2.5 px-3">Close Reason</th>
              <th className="py-2.5 px-3 text-right">Net Profit</th>
              <th className="py-2.5 px-3 text-right">Pips</th>
              <th className="py-2.5 px-3 text-center">AI Critique</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {history.map((t) => {
              const isWinner = t.profit >= 0;
              const hasCritique = Boolean(t.aiCritique);

              return (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-bold">
                    {t.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-200">{t.symbol}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        t.side === 'BUY'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/40'
                      }`}
                    >
                      {t.side === 'BUY' ? (
                        <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                      ) : (
                        <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />
                      )}
                      {t.side}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-800 dark:text-slate-300 font-bold">{t.lots}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">${t.entryPrice}</td>
                  <td className="py-2 px-3 text-slate-800 dark:text-slate-300 font-bold">${t.exitPrice ?? '-'}</td>
                  <td className="py-2 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {t.closeReason || 'MANUAL'}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isWinner ? '+' : ''}${t.profit.toFixed(2)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isWinner ? '+' : ''}{t.profitPips.toFixed(1)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleOpenCritique(t)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                        hasCritique
                          ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-800/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span>{hasCritique ? `Grade ${t.aiCritique?.grade}` : 'Audit Trade'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AIJournalModal
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onRegenerateCritique={handleRegenerate}
        isRegenerating={isRegenerating}
      />
    </>
  );
}
