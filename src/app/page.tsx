'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  SymbolId,
  PriceQuote,
  AccountState,
  Position,
  SignalItem,
  MarketScheduleInfo,
  UserProfile
} from '@/lib/types';
import HeaderNav from '@/components/HeaderNav';
import TradingViewChart from '@/components/TradingViewChart';
import OrderTicket from '@/components/OrderTicket';
import BottomWorkspace from '@/components/BottomWorkspace';
import SettingsModal from '@/components/SettingsModal';
import PineScriptModal from '@/components/PineScriptModal';
import AccountStatementModal from '@/components/AccountStatementModal';
import AuthModal from '@/components/AuthModal';
import OnboardingGate from '@/components/OnboardingGate';
import { TrendingUp, Loader2 } from 'lucide-react';

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
    bid: 4118.20,
    ask: 4118.55,
    spread: 0.35,
    high24h: 4140.00,
    low24h: 4090.00,
    change24h: 0.35,
    timestamp: Date.now()
  },
  EURUSD: {
    symbol: 'EURUSD',
    bid: 1.12510,
    ask: 1.12522,
    spread: 0.00012,
    high24h: 1.12900,
    low24h: 1.12100,
    change24h: -0.10,
    timestamp: Date.now()
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    bid: 83480.00,
    ask: 83495.00,
    spread: 15.00,
    high24h: 84800.00,
    low24h: 82500.00,
    change24h: 1.25,
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

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPineScriptOpen, setIsPineScriptOpen] = useState<boolean>(false);
  const [isStatementOpen, setIsStatementOpen] = useState<boolean>(false);
  const [isSimulatingSignal, setIsSimulatingSignal] = useState<boolean>(false);

  // Sync theme with document class & localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('nexus_terminal_theme') as 'dark' | 'light' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('nexus_terminal_theme', nextTheme);
      } catch (e) {}
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return nextTheme;
    });
  };

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

  // Hydrate trade history from localStorage cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('nexus_trade_history');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
        }
      }
    } catch {}
  }, []);

  // Fetch current user session
  const fetchCurrentUser = useCallback(async () => {
    try {
      let cachedUser: UserProfile | null = null;
      try {
        const cached = localStorage.getItem('nexus_user_profile');
        if (cached) {
          cachedUser = JSON.parse(cached);
        }
      } catch {}

      const headers: Record<string, string> = {};
      if (cachedUser && cachedUser.id) {
        headers['x-user-id'] = cachedUser.id;
      }

      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          try {
            localStorage.setItem('nexus_user_profile', JSON.stringify(data.user));
          } catch {}
          return;
        } else {
          // Explicit unauthenticated response: clear stale cached user profile
          setCurrentUser(null);
          try {
            localStorage.removeItem('nexus_user_profile');
          } catch {}
          return;
        }
      }

      if (cachedUser && cachedUser.id) {
        setCurrentUser(cachedUser);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error('Error fetching auth session:', e);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    async function initSession() {
      try {
        await fetchCurrentUser();
      } finally {
        setIsAuthChecking(false);
      }
    }
    initSession();
  }, [fetchCurrentUser]);

  // Fetch closed trade history
  const fetchHistory = useCallback(async () => {
    try {
      const url = currentUser ? `/api/journal?userId=${encodeURIComponent(currentUser.id)}` : '/api/journal';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history)) {
          setHistory(data.history);
          try {
            localStorage.setItem('nexus_trade_history', JSON.stringify(data.history));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Error fetching trade history:', err);
    }
  }, [currentUser]);

  // Instant Full Snapshot Fetcher (immediate quotes, positions, account, and history)
  const fetchSnapshot = useCallback(async () => {
    try {
      const url = currentUser ? `/api/trade/order?userId=${encodeURIComponent(currentUser.id)}` : '/api/trade/order';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.quotes) setQuotes(data.quotes);
        if (data.account) setAccount(data.account);
        if (data.positions) setPositions(data.positions);
        if (Array.isArray(data.history)) {
          setHistory(data.history);
          try {
            localStorage.setItem('nexus_trade_history', JSON.stringify(data.history));
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to fetch market snapshot:', e);
    }
  }, [currentUser]);

  // Real-Time Server-Sent Events (SSE) Stream
  useEffect(() => {
    if (!currentUser) return;
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    const connectSSE = () => {
      const sseUrl = currentUser ? `/api/stream/market?userId=${encodeURIComponent(currentUser.id)}` : '/api/stream/market';
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.quotes) setQuotes(data.quotes);
          if (data.account) setAccount(data.account);
          if (data.positions) setPositions(data.positions);
          if (Array.isArray(data.history)) {
            setHistory(data.history);
            try {
              localStorage.setItem('nexus_trade_history', JSON.stringify(data.history));
            } catch {}
          }
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

    // Immediate initial snapshot load followed by SSE stream
    fetchSnapshot();
    connectSSE();
    fetchMarketStatus();
    fetchSignals();
    fetchHistory();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimer);
    };
  }, [fetchSnapshot, fetchMarketStatus, fetchSignals, fetchHistory, currentUser]);

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

  const handleQuickTrade = async (side: 'BUY' | 'SELL') => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/trade/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          side,
          type: 'MARKET',
          lots: selectedSymbol === 'BTCUSD' ? 0.5 : 1.0,
          userId: currentUser?.id,
          smcContext: {
            pattern: 'Fullscreen Quick Execution',
            timeframe: '15m'
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.positions) setPositions(data.positions);
        if (data.account) setAccount(data.account);
        if (data.quotes) setQuotes(data.quotes);
      }
      handleRefreshAll();
    } catch (err) {
      console.error('Quick trade error:', err);
    }
  };

  const handleRefreshAll = () => {
    fetchSnapshot();
    fetchHistory();
    fetchSignals();
    fetchMarketStatus();
  };

  const handleOpenStatement = async () => {
    await fetchHistory();
    setIsStatementOpen(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('nexus_user_profile');
    setCurrentUser(null);
    handleRefreshAll();
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    handleRefreshAll();
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/20 animate-pulse">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-white">Nexus Pro Terminal</h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Verifying session and connecting to institutional stream...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <OnboardingGate
        onSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-[#05080E] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Exness Top Navigation & Telemetry */}
      <HeaderNav
        account={account}
        quotes={quotes}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPineScript={() => setIsPineScriptOpen(true)}
        onOpenStatement={handleOpenStatement}
        onTriggerTestSignal={handleTriggerTestSignal}
        isSimulatingSignal={isSimulatingSignal}
        marketSchedule={marketSchedule}
        marketMode={marketMode}
        onToggleMarketMode={handleToggleMarketMode}
        exnessAccount={exnessAccount}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Trading Floor Workspace */}
      <main className="flex-1 p-2.5 flex flex-col gap-2.5 max-w-[1920px] w-full mx-auto">
        {/* Upper Screen: 68% TradingView Chart | 32% Order Ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-[460px]">
          {/* TradingView Advanced Real-Time Chart Widget (Single View or Dual Split Grid) */}
          <div className="lg:col-span-8 flex flex-col h-[480px] lg:h-full">
            <TradingViewChart
              symbol={selectedSymbol}
              theme={theme}
              quote={quotes[selectedSymbol]}
              quotes={quotes}
              positions={positions}
              onSelectSymbol={setSelectedSymbol}
              onQuickTrade={handleQuickTrade}
              onRefreshAll={handleRefreshAll}
            />
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
              currentUser={currentUser}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
          </div>
        </div>

        {/* Lower Screen: Tabbed Dock (Positions, AI Journal, Equity Curve, Webhook Signals, Risk Coach, Macro) */}
        <div className="flex-1">
          <BottomWorkspace
            positions={positions}
            history={history}
            signals={signals}
            account={account}
            onRefreshPositions={handleRefreshAll}
            onRefreshHistory={handleRefreshAll}
            onTriggerTestSignal={handleTriggerTestSignal}
            isSimulatingSignal={isSimulatingSignal}
            onOpenStatement={handleOpenStatement}
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

      <AccountStatementModal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        history={history}
        account={account}
        exnessAccount={exnessAccount}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}
