'use client';

import React, { useState } from 'react';
import { Position, SignalItem } from '@/lib/types';
import PositionsTable from './PositionsTable';
import TradeHistoryTable from './TradeHistoryTable';
import SignalsFeed from './SignalsFeed';
import RiskCoachCard from './RiskCoachCard';
import MacroBriefingCard from './MacroBriefingCard';
import {
  ListFilter,
  History,
  Radio,
  ShieldAlert,
  Globe,
  TrendingUp
} from 'lucide-react';

interface BottomWorkspaceProps {
  positions: Position[];
  history: Position[];
  signals: SignalItem[];
  onRefreshPositions: () => void;
  onRefreshHistory: () => void;
  onTriggerTestSignal: () => void;
  isSimulatingSignal: boolean;
}

type TabType = 'POSITIONS' | 'HISTORY' | 'SIGNALS' | 'RISK_COACH' | 'MACRO';

export default function BottomWorkspace({
  positions,
  history,
  signals,
  onRefreshPositions,
  onRefreshHistory,
  onTriggerTestSignal,
  isSimulatingSignal
}: BottomWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('POSITIONS');

  return (
    <div className="w-full bg-white dark:bg-[#080C14] border border-slate-200 dark:border-slate-800/90 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[380px] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Navigation Tab Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/90 px-3 bg-slate-100 dark:bg-[#0B0F19] overflow-x-auto">
        <div className="flex items-center gap-1 py-1">
          {/* Positions Tab */}
          <button
            onClick={() => setActiveTab('POSITIONS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'POSITIONS'
                ? 'bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/40'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Open Positions</span>
            {positions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500 text-black">
                {positions.length}
              </span>
            )}
          </button>

          {/* Closed History Tab */}
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/40'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trade History & AI Journal</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {history.length}
              </span>
            )}
          </button>

          {/* Webhook Signals Feed */}
          <button
            onClick={() => setActiveTab('SIGNALS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all relative ${
              activeTab === 'SIGNALS'
                ? 'bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            <span>Live Signals Feed</span>
            {signals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                {signals.length}
              </span>
            )}
          </button>

          {/* Risk Coach HUD */}
          <button
            onClick={() => setActiveTab('RISK_COACH')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'RISK_COACH'
                ? 'bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Risk Coach HUD</span>
          </button>

          {/* Macro Briefing */}
          <button
            onClick={() => setActiveTab('MACRO')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'MACRO'
                ? 'bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Macro Briefing</span>
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="p-3.5 flex-1 overflow-y-auto">
        {activeTab === 'POSITIONS' && (
          <PositionsTable positions={positions} onPositionClosed={onRefreshPositions} />
        )}

        {activeTab === 'HISTORY' && (
          <TradeHistoryTable history={history} onRefresh={onRefreshHistory} />
        )}

        {activeTab === 'SIGNALS' && (
          <SignalsFeed
            signals={signals}
            onTriggerTestSignal={onTriggerTestSignal}
            isSimulating={isSimulatingSignal}
          />
        )}

        {activeTab === 'RISK_COACH' && <RiskCoachCard />}

        {activeTab === 'MACRO' && <MacroBriefingCard />}
      </div>
    </div>
  );
}
