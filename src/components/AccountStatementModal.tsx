'use client';

import React from 'react';
import { Position, AccountState } from '@/lib/types';
import { calculatePerformanceReport, generateCSVStatement } from '@/lib/analytics';
import {
  X,
  Download,
  Printer,
  ShieldCheck,
  TrendingUp,
  Award,
  Calendar,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: Position[];
  account: AccountState;
  exnessAccount?: {
    id: string;
    server: string;
    type: string;
  };
}

export default function AccountStatementModal({
  isOpen,
  onClose,
  history,
  account,
  exnessAccount
}: AccountStatementModalProps) {
  if (!isOpen) return null;

  const initialBalance = 100000;
  const report = calculatePerformanceReport(history, initialBalance, account.unrealizedPnL);

  const accountId = exnessAccount?.id || 'EX-9482104';
  const server = exnessAccount?.server || 'Exness-Trial2';

  const handleDownloadCSV = () => {
    const csvContent = generateCSVStatement(history, {
      id: accountId,
      server,
      currency: account.currency || 'USD',
      balance: account.balance
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Exness_Statement_${accountId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const isNetProfit = report.netProfit >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#070A10] border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Printable Statement Container */}
        <div id="printable-statement" className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800/90 pb-4">
            <div className="flex items-start gap-3">
              <div className="h-10 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center font-black text-black tracking-tight text-sm shadow-md shrink-0">
                EXNESS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Official Trading Account Statement
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40">
                    {exnessAccount?.type || 'PRO'} DEMO
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Exness (SC) Ltd • Licensed Securities Dealer • Real-Time Order Audit
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  Login: <strong className="text-slate-800 dark:text-slate-200">{accountId}</strong> • Server:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{server}</strong> • Currency:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">USD</strong> • Leverage: <strong>1:{account.leverage}</strong>
                </p>
              </div>
            </div>

            {/* Print & Action Buttons (Hidden on actual print) */}
            <div className="flex items-center gap-2 print:hidden self-end sm:self-auto shrink-0">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                title="Download CSV for Excel / Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Statement Performance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C101C] border border-slate-200 dark:border-slate-800/90">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Net Closed P&L</span>
              <span className={`text-xl font-black ${isNetProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isNetProfit ? '+' : ''}${report.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Return: <strong className={isNetProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{report.returnOnInitial}%</strong>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C101C] border border-slate-200 dark:border-slate-800/90">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Win Rate</span>
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                {report.winRate}%
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {report.winningTrades} W / {report.losingTrades} L ({report.totalTrades} total)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C101C] border border-slate-200 dark:border-slate-800/90">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Profit Factor</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {report.profitFactor}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Gross: +${report.grossProfit.toFixed(0)} / -${report.grossLoss.toFixed(0)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C101C] border border-slate-200 dark:border-slate-800/90">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Max Drawdown</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                {report.maxDrawdownPercent.toFixed(1)}%
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Peak DD: -${report.maxDrawdownDollars.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Secondary Statistical Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Account Financial Overview */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#090D18] border border-slate-200 dark:border-slate-800/90 space-y-1.5">
              <h4 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                Capital Metrics & Balance
              </h4>
              <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500">Initial Deposit:</span>
                <span className="font-bold">${initialBalance.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500">Closed Balance:</span>
                <span className="font-bold">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500">Mark-to-Market Equity:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-500">Expected Payoff / Trade:</span>
                <span className="font-bold">${report.expectedPayoff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Annualized Sharpe Ratio:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{report.sharpeRatio}</span>
              </div>
            </div>

            {/* Claude AI Quality Audit & Instrument Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#090D18] border border-slate-200 dark:border-slate-800/90 space-y-2">
              <h4 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-500" />
                Claude AI Trade Quality Distribution
              </h4>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {Object.entries(report.gradeDistribution).map(([grade, count]) => (
                  <span
                    key={grade}
                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                  >
                    <strong>{grade}</strong>: {count}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Instrument Performance</span>
                <div className="space-y-1 text-[11px]">
                  {Object.values(report.symbolBreakdown).map((sb) => (
                    <div key={sb.symbol} className="flex justify-between">
                      <span className="font-bold">{sb.symbol} ({sb.trades} trades)</span>
                      <span className={sb.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                        {sb.profit >= 0 ? '+' : ''}${sb.profit.toFixed(2)} ({sb.winRate}% Win)
                      </span>
                    </div>
                  ))}
                  {Object.keys(report.symbolBreakdown).length === 0 && (
                    <span className="text-slate-400 italic">No closed trades recorded yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trade Ledger Table */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2 font-mono">
              Closed Trade Ledger ({history.length} Records)
            </h4>
            <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-[#0A0E18] text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-2.5">Ticket</th>
                    <th className="py-2 px-2.5">Symbol</th>
                    <th className="py-2 px-2.5">Type</th>
                    <th className="py-2 px-2.5">Lots</th>
                    <th className="py-2 px-2.5">Entry</th>
                    <th className="py-2 px-2.5">Exit</th>
                    <th className="py-2 px-2.5 text-right">Profit ($)</th>
                    <th className="py-2 px-2.5">Reason</th>
                    <th className="py-2 px-2.5 text-center">AI Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {history.map((t) => {
                    const isWin = t.profit >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-1.5 px-2.5 text-slate-500 font-bold">{t.id.slice(-6).toUpperCase()}</td>
                        <td className="py-1.5 px-2.5 font-bold">{t.symbol}</td>
                        <td className="py-1.5 px-2.5">
                          <span className={t.side === 'BUY' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                            {t.side}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5">{t.lots}</td>
                        <td className="py-1.5 px-2.5">${t.entryPrice}</td>
                        <td className="py-1.5 px-2.5 font-bold">${t.exitPrice ?? '-'}</td>
                        <td className={`py-1.5 px-2.5 text-right font-bold ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isWin ? '+' : ''}${t.profit.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500 text-[10px]">{t.closeReason || 'MANUAL'}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/40">
                            {t.aiCritique?.grade || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        No closed trade records found. Execute and close trades to populate your statement.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row justify-between gap-1">
            <span>Generated electronically by Nexus Exness Pro Terminal Engine</span>
            <span>Signature: __________________________ (Authorized Broker)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
