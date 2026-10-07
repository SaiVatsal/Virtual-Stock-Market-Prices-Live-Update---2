'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SymbolId, PriceQuote, Position } from '@/lib/types';
import ChartTradingOverlay from './ChartTradingOverlay';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Columns,
  Square,
  Zap,
  Layers,
  Crosshair,
  MousePointer
} from 'lucide-react';

interface TradingViewChartProps {
  symbol: SymbolId;
  theme?: 'dark' | 'light';
  quote?: PriceQuote;
  quotes?: Record<SymbolId, PriceQuote>;
  positions?: Position[];
  onSelectSymbol?: (symbol: SymbolId) => void;
  onQuickTrade?: (side: 'BUY' | 'SELL', targetSymbol?: SymbolId) => void;
  onRefreshAll?: () => void;
}

const TV_SYMBOL_MAP: Record<SymbolId, string> = {
  XAUUSD: 'OANDA:XAUUSD',
  EURUSD: 'FX:EURUSD',
  BTCUSD: 'BINANCE:BTCUSDT'
};

export default function TradingViewChart({
  symbol,
  theme = 'dark',
  quote,
  quotes,
  positions = [],
  onSelectSymbol,
  onQuickTrade,
  onRefreshAll
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const container2Ref = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDualChart, setIsDualChart] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] = useState<'TRADE' | 'PAN'>('TRADE');
  const [verticalScale, setVerticalScale] = useState<number>(1.0);
  const [secondarySymbol, setSecondarySymbol] = useState<SymbolId>(
    symbol === 'XAUUSD' ? 'EURUSD' : 'XAUUSD'
  );
  const [widgetKey, setWidgetKey] = useState<number>(0);

  // Load s3.tradingview.com/tv.js script once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).TradingView) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'tradingview-widget-script';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.warn('TradingView tv.js script load fallback');
      setScriptLoaded(false);
    };
    document.head.appendChild(script);
  }, []);

  // Helper to construct TradingView widget config
  const createWidgetConfig = (targetSym: SymbolId, containerId: string, isDark: boolean) => ({
    autosize: true,
    symbol: TV_SYMBOL_MAP[targetSym] || 'OANDA:XAUUSD',
    interval: '15',
    timezone: 'Etc/UTC',
    theme: isDark ? 'dark' : 'light',
    style: '1',
    locale: 'en',
    toolbar_bg: isDark ? '#0A0E17' : '#F1F5F9',
    enable_publishing: false,
    allow_symbol_change: false,
    container_id: containerId,
    hide_side_toolbar: false,
    studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
    overrides: isDark
      ? {
          'paneProperties.background': '#070A0F',
          'paneProperties.vertGridProperties.color': '#111726',
          'paneProperties.horzGridProperties.color': '#111726',
          'symbolWatermarkProperties.transparency': 90,
          'scalesProperties.textColor': '#64748B',
          'mainSeriesProperties.candleStyle.upColor': '#10B981',
          'mainSeriesProperties.candleStyle.downColor': '#F43F5E',
          'mainSeriesProperties.candleStyle.drawWick': true,
          'mainSeriesProperties.candleStyle.drawBorder': true,
          'mainSeriesProperties.candleStyle.borderColor': '#334155',
          'mainSeriesProperties.candleStyle.borderUpColor': '#10B981',
          'mainSeriesProperties.candleStyle.borderDownColor': '#F43F5E',
          'mainSeriesProperties.candleStyle.wickUpColor': '#10B981',
          'mainSeriesProperties.candleStyle.wickDownColor': '#F43F5E'
        }
      : {
          'paneProperties.background': '#FFFFFF',
          'paneProperties.vertGridProperties.color': '#E2E8F0',
          'paneProperties.horzGridProperties.color': '#E2E8F0',
          'scalesProperties.textColor': '#475569',
          'mainSeriesProperties.candleStyle.upColor': '#059669',
          'mainSeriesProperties.candleStyle.downColor': '#E11D48',
          'mainSeriesProperties.candleStyle.drawWick': true,
          'mainSeriesProperties.candleStyle.drawBorder': true,
          'mainSeriesProperties.candleStyle.borderColor': '#CBD5E1',
          'mainSeriesProperties.candleStyle.borderUpColor': '#059669',
          'mainSeriesProperties.candleStyle.borderDownColor': '#E11D48'
        }
  });

  // Initialize or re-create TradingView widgets
  const initWidgets = useCallback(() => {
    if (!scriptLoaded || !containerRef.current) return;
    const isDark = theme === 'dark';

    // Primary Chart
    const containerId1 = `tv_chart_main_${symbol}_${isDualChart ? 'dual' : 'single'}_${
      isFullscreen ? 'fs' : 'normal'
    }`;
    containerRef.current.innerHTML = `<div id="${containerId1}" style="height: 100%; width: 100%;"></div>`;

    try {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget(createWidgetConfig(symbol, containerId1, isDark));
      }
    } catch (err) {
      console.error('Error creating primary TradingView widget:', err);
    }

    // Secondary Chart (if in Dual Grid mode)
    if (isDualChart && container2Ref.current) {
      const containerId2 = `tv_chart_sec_${secondarySymbol}_${isFullscreen ? 'fs' : 'normal'}`;
      container2Ref.current.innerHTML = `<div id="${containerId2}" style="height: 100%; width: 100%;"></div>`;

      try {
        if ((window as any).TradingView) {
          new (window as any).TradingView.widget(
            createWidgetConfig(secondarySymbol, containerId2, isDark)
          );
        }
      } catch (err) {
        console.error('Error creating secondary TradingView widget:', err);
      }
    }
  }, [symbol, secondarySymbol, theme, scriptLoaded, isFullscreen, isDualChart]);

  useEffect(() => {
    initWidgets();
  }, [initWidgets, widgetKey]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Keyboard shortcut: Escape exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const currentBid1 = quote?.bid || (symbol === 'XAUUSD' ? 4118.20 : symbol === 'EURUSD' ? 1.12510 : 83480.00);
  const currentAsk1 = quote?.ask || (symbol === 'XAUUSD' ? 4118.55 : symbol === 'EURUSD' ? 1.12522 : 83495.00);

  const secQuote = quotes?.[secondarySymbol];
  const currentBid2 =
    secQuote?.bid || (secondarySymbol === 'XAUUSD' ? 4118.20 : secondarySymbol === 'EURUSD' ? 1.12510 : 83480.00);
  const currentAsk2 =
    secQuote?.ask || (secondarySymbol === 'XAUUSD' ? 4118.55 : secondarySymbol === 'EURUSD' ? 1.12522 : 83495.00);

  return (
    <div
      ref={chartWrapperRef}
      className={`relative flex flex-col transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#070A0F] dark:bg-[#070A0F] p-0'
          : 'h-full w-full bg-white dark:bg-[#070A0F] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-2xl'
      }`}
    >
      {/* Chart Top Header Strip */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800/80 text-xs shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-wider">
            {symbol} / USD
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/50">
            TV Advanced {isDualChart ? 'Dual' : 'Single'}
          </span>

          {/* If Fullscreen: Primary symbol switcher */}
          {isFullscreen && onSelectSymbol && (
            <div className="flex items-center gap-1 ml-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded">
              {(['XAUUSD', 'EURUSD', 'BTCUSD'] as SymbolId[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onSelectSymbol(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    symbol === s
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Live Quote Preview in Fullscreen */}
          {isFullscreen && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] ml-1">
              <span className="text-slate-500">B:</span>
              <span className="font-bold text-rose-500">${currentBid1}</span>
              <span className="text-slate-500">A:</span>
              <span className="font-bold text-emerald-600">${currentAsk1}</span>
            </div>
          )}

          {/* Secondary chart indicator & selector when in Dual Mode */}
          {isDualChart && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-700">
              <span className="text-slate-500 font-mono text-[10px]">Split 2:</span>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded">
                {(['EURUSD', 'XAUUSD', 'BTCUSD'] as SymbolId[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSecondarySymbol(s)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      secondarySymbol === s
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[10px] text-slate-500 hidden xl:inline">
                ${currentBid2}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls: Trade/Pan Mode, Scale Zoom, Dual/Single Grid Toggle, Quick Trade, Refresh & Fullscreen Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Exness Trade on Chart vs Pan Mode Toggle */}
          <button
            onClick={() => setInteractionMode((m) => (m === 'TRADE' ? 'PAN' : 'TRADE'))}
            title={
              interactionMode === 'TRADE'
                ? 'Exness Chart Trading Active: Drag SL/TP & Right-Click enabled. Click to switch to Pan Chart mode.'
                : 'Pan Chart Active: TradingView native mouse interactions enabled. Click to switch to Exness Trading mode.'
            }
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold transition-all shadow-sm ${
              interactionMode === 'TRADE'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50'
                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {interactionMode === 'TRADE' ? (
              <>
                <Crosshair className="w-3.5 h-3.5 text-emerald-200" />
                <span className="text-[11px] font-bold">Trade Mode</span>
              </>
            ) : (
              <>
                <MousePointer className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold">Pan Mode</span>
              </>
            )}
          </button>

          {/* Overlay Vertical Scale Fine-Tuner */}
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 hidden xl:inline">Scale:</span>
            <button
              onClick={() => setVerticalScale((s) => Math.max(0.4, Number((s - 0.2).toFixed(1))))}
              title="Decrease overlay scale span"
              className="px-1 hover:text-cyan-500 font-bold"
            >
              -
            </button>
            <span className="font-extrabold text-cyan-600 dark:text-cyan-400 min-w-[24px] text-center">{verticalScale.toFixed(1)}x</span>
            <button
              onClick={() => setVerticalScale((s) => Math.min(3.0, Number((s + 0.2).toFixed(1))))}
              title="Increase overlay scale span"
              className="px-1 hover:text-cyan-500 font-bold"
            >
              +
            </button>
            {verticalScale !== 1.0 && (
              <button
                onClick={() => setVerticalScale(1.0)}
                title="Reset scale to 1.0x default"
                className="ml-1 text-[9px] text-amber-500 hover:underline font-bold"
              >
                Rst
              </button>
            )}
          </div>

          {/* Dual Split-Chart Grid Mode Toggle (Feature 3!) */}
          <button
            onClick={() => setIsDualChart((d) => !d)}
            title={isDualChart ? 'Switch to Single Chart View' : 'Switch to Dual Split-Chart Grid View'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold transition-all ${
              isDualChart
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isDualChart ? (
              <>
                <Square className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] hidden sm:inline">Single View</span>
              </>
            ) : (
              <>
                <Columns className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-[11px] hidden sm:inline">Dual Grid</span>
              </>
            )}
          </button>

          {/* Quick 1-click execution in Fullscreen */}
          {isFullscreen && onQuickTrade && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onQuickTrade('SELL', symbol)}
                className="flex items-center gap-0.5 px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] font-mono shadow-sm"
              >
                <ArrowDown className="w-3 h-3 stroke-[3]" />
                <span>SELL</span>
              </button>
              <button
                onClick={() => onQuickTrade('BUY', symbol)}
                className="flex items-center gap-0.5 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] font-mono shadow-sm"
              >
                <ArrowUp className="w-3 h-3 stroke-[3]" />
                <span>BUY</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setWidgetKey((k) => k + 1)}
            title="Reload Chart"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand Chart to Full Screen'}
            className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Exit (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chart Canvas: Single View or Dual Grid View */}
      <div className="relative flex-1 w-full h-full min-h-[380px] overflow-hidden">
        {isDualChart ? (
          <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Left Chart (Primary Symbol) */}
            <div className="relative h-full w-full">
              <div ref={containerRef} className="h-full w-full" />
              <ChartTradingOverlay
                symbol={symbol}
                quote={quote}
                positions={positions}
                theme={theme}
                interactionMode={interactionMode}
                onInteractionModeChange={setInteractionMode}
                verticalScale={verticalScale}
                onVerticalScaleChange={setVerticalScale}
                onOrderPlaced={onRefreshAll}
                onPositionModified={onRefreshAll}
                onPositionClosed={onRefreshAll}
              />
            </div>

            {/* Right Chart (Secondary Symbol) */}
            <div className="relative h-full w-full">
              <div ref={container2Ref} className="h-full w-full" />
              <ChartTradingOverlay
                symbol={secondarySymbol}
                quote={quotes?.[secondarySymbol]}
                positions={positions}
                theme={theme}
                interactionMode={interactionMode}
                onInteractionModeChange={setInteractionMode}
                verticalScale={verticalScale}
                onVerticalScaleChange={setVerticalScale}
                onOrderPlaced={onRefreshAll}
                onPositionModified={onRefreshAll}
                onPositionClosed={onRefreshAll}
              />
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full" />
            <ChartTradingOverlay
              symbol={symbol}
              quote={quote}
              positions={positions}
              theme={theme}
              interactionMode={interactionMode}
              onInteractionModeChange={setInteractionMode}
              verticalScale={verticalScale}
              onVerticalScaleChange={setVerticalScale}
              onOrderPlaced={onRefreshAll}
              onPositionModified={onRefreshAll}
              onPositionClosed={onRefreshAll}
            />
          </div>
        )}

        {!scriptLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#070A0F] text-slate-500 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
            <p className="text-sm font-mono">Loading TradingView Engine...</p>
            <iframe
              title="TradingView Embedded Mini Chart"
              src={`https://s.tradingview.com/widgetembed/?symbol=${TV_SYMBOL_MAP[symbol]}&interval=15&theme=${theme}&style=1`}
              className="absolute inset-0 w-full h-full border-0 opacity-80"
            />
          </div>
        )}
      </div>
    </div>
  );
}
