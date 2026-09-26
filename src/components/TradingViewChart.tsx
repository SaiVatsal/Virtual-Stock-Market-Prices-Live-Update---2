'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SymbolId, PriceQuote } from '@/lib/types';
import { Maximize2, Minimize2, RefreshCw, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface TradingViewChartProps {
  symbol: SymbolId;
  theme?: 'dark' | 'light';
  quote?: PriceQuote;
  onSelectSymbol?: (symbol: SymbolId) => void;
  onQuickTrade?: (side: 'BUY' | 'SELL') => void;
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
  onSelectSymbol,
  onQuickTrade
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
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

  // Initialize or re-create TradingView widget
  const initWidget = useCallback(() => {
    if (!scriptLoaded || !containerRef.current) return;

    const tvSymbol = TV_SYMBOL_MAP[symbol] || 'OANDA:XAUUSD';
    const containerId = `tv_chart_container_${symbol}_${isFullscreen ? 'fs' : 'normal'}`;

    containerRef.current.innerHTML = `<div id="${containerId}" style="height: 100%; width: 100%;"></div>`;

    try {
      if ((window as any).TradingView) {
        const isDark = theme === 'dark';

        new (window as any).TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
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
      }
    } catch (err) {
      console.error('Error creating TradingView widget:', err);
    }
  }, [symbol, theme, scriptLoaded, isFullscreen]);

  useEffect(() => {
    initWidget();
  }, [initWidget, widgetKey]);

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

  const currentBid = quote?.bid || (symbol === 'XAUUSD' ? 4284.90 : symbol === 'EURUSD' ? 1.13850 : 84029.00);
  const currentAsk = quote?.ask || (symbol === 'XAUUSD' ? 4285.25 : symbol === 'EURUSD' ? 1.13862 : 84044.00);

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
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800/80 text-xs shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-wider">
            {symbol} / USD
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/50">
            TV Advanced Chart
          </span>

          {/* If Fullscreen: Quick symbol switcher on the floating bar */}
          {isFullscreen && onSelectSymbol && (
            <div className="flex items-center gap-1 ml-2 bg-slate-200 dark:bg-slate-800 p-0.5 rounded">
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
          {isFullscreen && quote && (
            <div className="flex items-center gap-2 font-mono text-xs ml-2">
              <span className="text-slate-500">BID:</span>
              <span className="font-bold text-rose-500 dark:text-rose-400">${currentBid}</span>
              <span className="text-slate-500">ASK:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">${currentAsk}</span>
            </div>
          )}
        </div>

        {/* Action Controls: Quick Buy/Sell in Fullscreen, Refresh & Fullscreen Button */}
        <div className="flex items-center gap-2">
          {/* Quick 1-click execution in Fullscreen */}
          {isFullscreen && onQuickTrade && (
            <div className="flex items-center gap-1.5 mr-2">
              <button
                onClick={() => onQuickTrade('SELL')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] font-mono shadow-sm"
              >
                <ArrowDown className="w-3 h-3 stroke-[3]" />
                <span>SELL</span>
              </button>
              <button
                onClick={() => onQuickTrade('BUY')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] font-mono shadow-sm"
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
                <span className="font-mono text-[11px]">Exit Fullscreen (Esc)</span>
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

      {/* Chart Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[360px]">
        <div ref={containerRef} className="h-full w-full" />

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
