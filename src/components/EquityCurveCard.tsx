'use client';

import React, { useState } from 'react';
import { Position, AccountState } from '@/lib/types';
import { calculatePerformanceReport, EquityCurvePoint } from '@/lib/analytics';
import {
  TrendingUp,
  Award,
  ShieldAlert,
  FileSpreadsheet,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

interface EquityCurveCardProps {
  history: Position[];
  account: AccountState;
  onOpenStatement?: () => void;
}

export default function EquityCurveCard({
  history,
  account,
  onOpenStatement
}: EquityCurveCardProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'LAST20' | 'LAST10'>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<EquityCurvePoint | null>(null);

  const initialBalance = 100000;
  const filteredHistory =
    filterMode === 'LAST10'
      ? history.slice(-10)
      : filterMode === 'LAST20'
      ? history.slice(-20)
      : history;

  const report = calculatePerformanceReport(filteredHistory, initialBalance, account.unrealizedPnL);
  const points = report.equityCurve;

  // Compute SVG dimensions and scale
  const width = 800;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 35, left: 65 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const balances = points.map((p) => p.balance);
  const minBal = Math.min(initialBalance * 0.99, ...balances);
  const maxBal = Math.max(initialBalance * 1.01, ...balances);
  const range = maxBal - minBal || 1;

  const getX = (idx: number) => {
    if (points.length <= 1) return padding.left + graphWidth / 2;
    return padding.left + (idx / (points.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    return padding.top + graphHeight - ((val - minBal) / range) * graphHeight;
  };

  // Generate SVG path for balance line
  const pathD = points.reduce((acc, p, idx) => {
    const x = getX(idx);
    const y = getY(p.balance);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Generate filled area path
  const areaD =
    points.length > 0
      ? `${pathD} L ${getX(points.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${
          padding.top + graphHeight
        } Z`
      : '';

  const isNetProfit = report.netProfit >= 0;

  return (
    <div className="flex flex-col space-y-3">
      {/* Top Header & Filter Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800/50 text-cyan-700 dark:text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Equity & Balance Growth Trajectory
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              Real-time portfolio growth, drawdowns, and high-water mark tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe pill selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2 py-0.5 rounded font-semibold ${
                filterMode === 'ALL'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilterMode('LAST20')}
              className={`px-2 py-0.5 rounded font-semibold ${
                filterMode === 'LAST20'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 20
            </button>
            <button
              onClick={() => setFilterMode('LAST10')}
              className={`px-2 py-0.5 rounded font-semibold ${
                filterMode === 'LAST10'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 10
            </button>
          </div>

          {onOpenStatement && (
            <button
              onClick={onOpenStatement}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-mono font-semibold transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full Statement</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D18] border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase block">Account Return</span>
          <span className={`text-base font-bold ${isNetProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isNetProfit ? '+' : ''}{report.returnOnInitial}%
          </span>
          <p className="text-[10px] text-slate-500">${report.netProfit.toFixed(2)}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D18] border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase block">Profit Factor</span>
          <span className="text-base font-bold text-amber-600 dark:text-amber-400">
            {report.profitFactor}
          </span>
          <p className="text-[10px] text-slate-500">Gross: +${report.grossProfit.toFixed(0)}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D18] border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase block">Win Rate</span>
          <span className="text-base font-bold text-cyan-600 dark:text-cyan-400">
            {report.winRate}%
          </span>
          <p className="text-[10px] text-slate-500">{report.winningTrades}W / {report.losingTrades}L</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D18] border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase block">Max Drawdown</span>
          <span className="text-base font-bold text-rose-600 dark:text-rose-400">
            {report.maxDrawdownPercent.toFixed(1)}%
          </span>
          <p className="text-[10px] text-slate-500">-${report.maxDrawdownDollars.toFixed(0)} peak</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D18] border border-slate-200 dark:border-slate-800/80 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-500 uppercase block">Sharpe Ratio</span>
          <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
            {report.sharpeRatio}
          </span>
          <p className="text-[10px] text-slate-500">Risk-adjusted</p>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full rounded-xl bg-slate-50 dark:bg-[#060910] border border-slate-200 dark:border-slate-800/90 p-3 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[220px] select-none overflow-visible"
        >
          <defs>
            <linearGradient id="equityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                stopColor={isNetProfit ? '#10B981' : '#F43F5E'}
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor={isNetProfit ? '#10B981' : '#F43F5E'}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + graphHeight * (1 - pct);
            const val = minBal + range * pct;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + graphWidth}
                  y2={y}
                  stroke="#64748B"
                  strokeOpacity="0.15"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#64748B"
                  fontFamily="monospace"
                >
                  ${Math.round(val).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {points.length > 1 && <path d={areaD} fill="url(#equityGrad)" />}

          {/* Balance Curve Line */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke={isNetProfit ? '#059669' : '#E11D48'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Trade Dots */}
          {points.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.balance);
            const isHovered = hoveredPoint?.tradeIndex === p.tradeIndex;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : idx === 0 || idx === points.length - 1 ? 4 : 2.5}
                fill={isHovered ? '#00F0FF' : isNetProfit ? '#10B981' : '#F43F5E'}
                stroke="#0F172A"
                strokeWidth="1.5"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-white dark:bg-[#0F1626] border border-cyan-500/50 shadow-xl rounded-lg p-2.5 text-xs font-mono z-10 pointer-events-none animate-in fade-in">
            <span className="font-bold text-slate-800 dark:text-slate-100 block">
              {hoveredPoint.tradeIndex === 0
                ? 'Account Inception'
                : `Trade #${hoveredPoint.tradeIndex} (${hoveredPoint.symbol || 'Spot'})`}
            </span>
            <div className="space-y-0.5 mt-1">
              <div className="flex justify-between gap-3 text-slate-500">
                <span>Balance:</span>
                <strong className="text-cyan-600 dark:text-cyan-400">
                  ${hoveredPoint.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              {hoveredPoint.tradeIndex > 0 && (
                <div className="flex justify-between gap-3 text-slate-500">
                  <span>Trade P&L:</span>
                  <strong className={hoveredPoint.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {hoveredPoint.pnl >= 0 ? '+' : ''}${hoveredPoint.pnl.toFixed(2)}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
