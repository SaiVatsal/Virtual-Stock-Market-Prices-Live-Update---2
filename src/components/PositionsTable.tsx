'use client';

import React, { useState } from 'react';
import { Position } from '@/lib/types';
import { X, ArrowDown, ArrowUp, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface PositionsTableProps {
  positions: Position[];
  onPositionClosed: () => void;
}

export default function PositionsTable({ positions, onPositionClosed }: PositionsTableProps) {
  const [closingId, setClosingId] = useState<string | null>(null);
  const [bulkClosing, setBulkClosing] = useState<'PROFIT' | 'LOSS' | 'ALL' | null>(null);

  const openPositions = positions.filter((p) => p.status === 'OPEN');
  const profitPositions = openPositions.filter((p) => p.profit > 0);
  const lossPositions = openPositions.filter((p) => p.profit < 0);

  const profitSum = profitPositions.reduce((acc, p) => acc + p.profit, 0);
  const lossSum = lossPositions.reduce((acc, p) => acc + p.profit, 0);
  const totalFloating = openPositions.reduce((acc, p) => acc + p.profit, 0);

  const handleBulkClose = async (filter: 'PROFIT' | 'LOSS' | 'ALL') => {
    setBulkClosing(filter);
    try {
      const res = await fetch('/api/trade/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter })
      });
      if (res.ok) {
        onPositionClosed();
      }
    } catch (err) {
      console.error(`Error bulk closing ${filter} positions:`, err);
    } finally {
      setBulkClosing(null);
    }
  };

  const handleClose = async (positionId: string, isPending?: boolean) => {
    setClosingId(positionId);
    try {
      const endpoint = isPending ? '/api/trade/cancel' : '/api/trade/close';
      const body = isPending ? { orderId: positionId } : { positionId };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        onPositionClosed();
      }
    } catch (err) {
      console.error('Error closing/cancelling position:', err);
    } finally {
      setClosingId(null);
    }
  };

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400">
        <p className="text-sm font-medium">No open positions in your virtual portfolio.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Use the execution panel above to execute market or limit orders.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Quick Action & Bulk Close Toolbar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800/80 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-500">
            Open: <strong className="text-slate-900 dark:text-slate-200">{openPositions.length}</strong>
          </span>
          <span className="text-slate-500">
            Floating P&L:{' '}
            <strong className={totalFloating >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {totalFloating >= 0 ? '+' : ''}${totalFloating.toFixed(2)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Close All Profit Positions */}
          <button
            onClick={() => handleBulkClose('PROFIT')}
            disabled={profitPositions.length === 0 || bulkClosing !== null}
            title={profitPositions.length > 0 ? `Close ${profitPositions.length} profitable position(s)` : 'No profitable positions open'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all shadow-sm border bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {bulkClosing === 'PROFIT' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>Close All Profit</span>
            {profitPositions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                +{profitPositions.length} (+${profitSum.toFixed(2)})
              </span>
            )}
          </button>

          {/* Close All Loss Positions */}
          <button
            onClick={() => handleBulkClose('LOSS')}
            disabled={lossPositions.length === 0 || bulkClosing !== null}
            title={lossPositions.length > 0 ? `Close ${lossPositions.length} losing position(s)` : 'No losing positions open'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all shadow-sm border bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {bulkClosing === 'LOSS' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span>Close All Loss</span>
            {lossPositions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100">
                {lossPositions.length} (${lossSum.toFixed(2)})
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-slate-100 dark:bg-[#0A0E18] text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-2.5 px-3">Ticket</th>
            <th className="py-2.5 px-3">Symbol</th>
            <th className="py-2.5 px-3">Type</th>
            <th className="py-2.5 px-3">Volume</th>
            <th className="py-2.5 px-3">Entry</th>
            <th className="py-2.5 px-3">Mark Price</th>
            <th className="py-2.5 px-3">S / L</th>
            <th className="py-2.5 px-3">T / P</th>
            <th className="py-2.5 px-3">Margin</th>
            <th className="py-2.5 px-3 text-right">Profit ($)</th>
            <th className="py-2.5 px-3 text-right">Pips</th>
            <th className="py-2.5 px-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {positions.map((pos) => {
            const isWinner = pos.profit >= 0;
            const isClosing = closingId === pos.id;

            return (
              <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-bold">
                  {pos.id.slice(-6).toUpperCase()}
                </td>
                <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-200">
                  {pos.symbol}
                </td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                      pos.status === 'PENDING'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/40'
                        : pos.side === 'BUY'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/40'
                    }`}
                  >
                    {pos.side === 'BUY' ? (
                      <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                    ) : (
                      <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />
                    )}
                    {pos.status === 'PENDING' ? `${pos.side} ${pos.type}` : pos.side}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-800 dark:text-slate-300 font-bold">{pos.lots}</td>
                <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{pos.entryPrice}</td>
                <td className="py-2 px-3 text-cyan-700 dark:text-cyan-300 font-bold">{pos.currentPrice}</td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{pos.stopLoss ?? '-'}</td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{pos.takeProfit ?? '-'}</td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400">${pos.margin.toFixed(1)}</td>
                <td
                  className={`py-2 px-3 text-right font-bold ${
                    pos.status === 'PENDING'
                      ? 'text-amber-500'
                      : isWinner
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {pos.status === 'PENDING' ? 'PENDING' : `${isWinner ? '+' : ''}$${pos.profit.toFixed(2)}`}
                </td>
                <td
                  className={`py-2 px-3 text-right font-bold ${
                    pos.status === 'PENDING'
                      ? 'text-slate-500'
                      : isWinner
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {pos.status === 'PENDING' ? '-' : `${isWinner ? '+' : ''}${pos.profitPips.toFixed(1)}`}
                </td>
                <td className="py-2 px-3 text-center">
                  <button
                    onClick={() => handleClose(pos.id, pos.status === 'PENDING')}
                    disabled={isClosing}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600/80 dark:hover:text-white text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isClosing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    <span>{pos.status === 'PENDING' ? 'Cancel' : 'Close'}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}
