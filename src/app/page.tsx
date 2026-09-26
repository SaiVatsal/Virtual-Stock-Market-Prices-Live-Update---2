'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  SymbolId,
  PriceQuote,
  AccountState,
  Position,
  SignalItem,
  MarketScheduleInfo
} from '@/lib/types';
import HeaderNav from '@/components/HeaderNav';
import TradingViewChart from '@/components/TradingViewChart';
import OrderTicket from '@/components/OrderTicket';
import BottomWorkspace from '@/components/BottomWorkspace';
import SettingsModal from '@/components/SettingsModal';
import PineScriptModal from '@/components/PineScriptModal';

const DEFAULT_ACCOUNT: AccountState = {
  balance: 100000,
  equity: 100000,
  marginUsed: 0,
  freeMargin: 100000,
  marginLevel: 0,
  unrealizedPnL: 0,
  realizedPnL: 0,
  leverage: 200,
  currency: 'USD'
};

const DEFAULT_QUOTES: Record<SymbolId, PriceQuote> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    bid: 4284.90,
    ask: 4285.25,
    spread: 0.35,
    high24h: 4310.00,
    low24h: 4260.00,
    change24h: 0.42,
    timestamp: Date.now()
  },
  EURUSD: {
    symbol: 'EURUSD',
    bid: 1.13850,
    ask: 1.13862,
    spread: 0.00012,
    high24h: 1.14200,
    low24h: 1.13400,
    change24h: -0.15,
    timestamp: Date.now()
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    bid: 84029.00,
    ask: 84044.00,
    spread: 15.00,
    high24h: 85200.00,
    low24h: 83100.00,
    change24h: 1.85,
    timestamp: Date.now()
  }
};

export default function TradingTerminalPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolId>('XAUUSD');
  const [quotes, setQuotes] = useState<Record<SymbolId, PriceQuote>>(DEFAULT_QUOTES);
  const [account, setAccount] = useState<AccountState>(DEFAULT_ACCOUNT);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Position[]>([]);
  const [signals, setSignals] = useState<SignalItem[]>([]);

  // Exness Market Schedule & Mode
  const [marketSchedule, setMarketSchedule] = useState<MarketScheduleInfo | undefined>(undefined);
  const [marketMode, setMarketMode] = useState<'REAL_MARKET_HOURS' | 'WEEKEND_OTC_PRACTICE'>('WEEKEND_OTC_PRACTICE');
  const [exnessAccount, setExnessAccount] = useState<{ id: string; server: string; type: string }>({
    id: 'EX-9482104',
    server: 'Exness-Trial2',
    type: 'PRO'
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPineScriptOpen, setIsPineScriptOpen] = useState<boolean>(false);
  const [isSimulatingSignal, setIsSimulatingSignal] = useState<boolean>(false);

  // Fetch market schedule & Exness account status
  const fetchMarketStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/market-status');
      if (res.ok) {
        const data = await res.json();
        if (data.schedule) setMarketSchedule(data.schedule);
        if (data.marketMode) setMarketMode(data.marketMode);
        if (data.exnessAccount) setExnessAccount(data.exnessAccount);
      }
    } catch (err) {
      console.error('Error fetching market status:', err);
    }
  }, []);

  // Fetch signals
  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/signals');
      if (res.ok) {
        const data = await res.json();
        if (data.signals) setSignals(data.signals);
      }
    } catch (err) {
      console.error('Error fetching signals:', err);
    }
  }, []);

  // Fetch closed trade history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        if (data.history) setHistory(data.history);
      }
    } catch (err) {
      console.error('Error fetching trade history:', err);
    }
  }, []);

  // Real-Time Server-Sent Events (SSE) Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/stream/market');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.quotes) setQuotes(data.quotes);
          if (data.account) setAccount(data.account);
          if (data.positions) setPositions(data.positions);
        } catch (e) {
          console.error('Failed to parse SSE tick:', e);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();
    fetchMarketStatus();
    fetchSignals();
    fetchHistory();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimer);
    };
  }, [fetchMarketStatus, fetchSignals, fetchHistory]);

  // Toggle between Real Market Hours (freezes weekends) vs 24/7 OTC Demo
  const handleToggleMarketMode = async () => {
    const nextMode = marketMode === 'WEEKEND_OTC_PRACTICE' ? 'REAL_MARKET_HOURS' : 'WEEKEND_OTC_PRACTICE';
    setMarketMode(nextMode);
    try {
      await fetch('/api/market-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketMode: nextMode })
      });
    } catch (err) {
      console.error('Error toggling market mode:', err);
    }
  };

  // Simulate TradingView Webhook alert
  const handleTriggerTestSignal = async () => {
    setIsSimulatingSignal(true);
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        if (data.signal) {
          setSignals((prev) => [data.signal, ...prev]);
        }
      }
    } catch (err) {
      console.error('Test signal error:', err);
    } finally {
      setIsSimulatingSignal(false);
    }
  };

  const handleRefreshAll = () => {
    fetchHistory();
    fetchSignals();
    fetchMarketStatus();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#05080E] text-slate-100">
      {/* Exness Top Navigation & Telemetry */}
      <HeaderNav
        account={account}
        quotes={quotes}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPineScript={() => setIsPineScriptOpen(true)}
        onTriggerTestSignal={handleTriggerTestSignal}
        isSimulatingSignal={isSimulatingSignal}
        marketSchedule={marketSchedule}
        marketMode={marketMode}
        onToggleMarketMode={handleToggleMarketMode}
        exnessAccount={exnessAccount}
      />

      {/* Main Trading Floor Workspace */}
      <main className="flex-1 p-2.5 flex flex-col gap-2.5 max-w-[1920px] w-full mx-auto">
        {/* Upper Screen: 68% TradingView Chart | 32% Order Ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-[460px]">
          {/* TradingView Advanced Real-Time Chart Widget */}
          <div className="lg:col-span-8 flex flex-col h-[480px] lg:h-full">
            <TradingViewChart symbol={selectedSymbol} />
          </div>

          {/* Exness Institutional Order Ticket Panel */}
          <div className="lg:col-span-4 flex flex-col">
            <OrderTicket
              symbol={selectedSymbol}
              quote={quotes[selectedSymbol]}
              freeMargin={account.freeMargin}
              leverage={account.leverage}
              onOrderPlaced={handleRefreshAll}
              marketSchedule={marketSchedule}
              marketMode={marketMode}
            />
          </div>
        </div>

        {/* Lower Screen: Tabbed Dock (Positions, AI Journal, Webhook Signals, Risk Coach, Macro) */}
        <div className="flex-1">
          <BottomWorkspace
            positions={positions}
            history={history}
            signals={signals}
            onRefreshPositions={handleRefreshAll}
            onRefreshHistory={handleRefreshAll}
            onTriggerTestSignal={handleTriggerTestSignal}
            isSimulatingSignal={isSimulatingSignal}
          />
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={handleRefreshAll}
      />

      <PineScriptModal
        isOpen={isPineScriptOpen}
        onClose={() => setIsPineScriptOpen(false)}
      />
    </div>
  );
}
