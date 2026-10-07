'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SymbolId, PriceQuote, Position, OrderSide, OrderType } from '@/lib/types';
import { INSTRUMENT_SPECS } from '@/lib/specs';
import {
  GripVertical,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Zap,
  Target,
  ShieldAlert,
  MousePointer,
  Crosshair
} from 'lucide-react';

interface ChartTradingOverlayProps {
  symbol: SymbolId;
  quote?: PriceQuote;
  positions: Position[];
  theme?: 'dark' | 'light';
  interactionMode?: 'TRADE' | 'PAN';
  onInteractionModeChange?: (mode: 'TRADE' | 'PAN') => void;
  verticalScale?: number;
  onVerticalScaleChange?: (scale: number) => void;
  onOrderPlaced?: () => void;
  onPositionModified?: () => void;
  onPositionClosed?: () => void;
}

interface DragState {
  type: 'TP' | 'SL' | 'PENDING';
  positionId: string;
  side: OrderSide;
  entryPrice: number;
  units: number;
  currentY: number;
  currentPrice: number;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  price: number;
}

export default function ChartTradingOverlay({
  symbol,
  quote,
  positions,
  theme = 'dark',
  interactionMode: propInteractionMode,
  onInteractionModeChange,
  verticalScale: propVerticalScale,
  onVerticalScaleChange,
  onOrderPlaced,
  onPositionModified,
  onPositionClosed
}: ChartTradingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Interaction Mode: 'TRADE' (drag SL/TP, right-click menu) or 'PAN' (TradingView native mouse interactions)
  const [localInteractionMode, setLocalInteractionMode] = useState<'TRADE' | 'PAN'>('TRADE');
  const interactionMode = propInteractionMode ?? localInteractionMode;
  const setInteractionMode = (val: 'TRADE' | 'PAN' | ((prev: 'TRADE' | 'PAN') => 'TRADE' | 'PAN')) => {
    const nextVal = typeof val === 'function' ? val(interactionMode) : val;
    if (onInteractionModeChange) onInteractionModeChange(nextVal);
    else setLocalInteractionMode(nextVal);
  };

  // Dragging state for SL / TP / Pending order lines
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Custom Exness Right-Click Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    price: 0
  });

  // Action toast message for feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [localVerticalScale, setLocalVerticalScale] = useState<number>(1.0);
  const verticalScale = propVerticalScale ?? localVerticalScale;
  const setVerticalScale = (val: number | ((prev: number) => number)) => {
    const nextVal = typeof val === 'function' ? val(verticalScale) : val;
    if (onVerticalScaleChange) onVerticalScaleChange(nextVal);
    else setLocalVerticalScale(nextVal);
  };

  const spec = INSTRUMENT_SPECS[symbol] || { contractSize: 100, pipSize: 0.1, decimals: 2 };
  const currentBid = quote?.bid || (symbol === 'XAUUSD' ? 4118.20 : symbol === 'EURUSD' ? 1.12510 : 83480.00);
  const currentAsk = quote?.ask || (symbol === 'XAUUSD' ? 4118.55 : symbol === 'EURUSD' ? 1.12522 : 83495.00);
  const midPrice = (currentBid + currentAsk) / 2;

  // Coordinate mapping functions with zoom scale support
  const getPriceRange = useCallback(() => {
    const baseRangePct = symbol === 'EURUSD' ? 0.008 : symbol === 'XAUUSD' ? 0.018 : 0.025;
    const rangePct = baseRangePct * verticalScale;
    const pHigh = midPrice * (1 + rangePct);
    const pLow = midPrice * (1 - rangePct);
    return { pHigh, pLow, pSpan: pHigh - pLow };
  }, [symbol, midPrice, verticalScale]);

  const getPriceFromY = useCallback(
    (pixelY: number, containerHeight: number): number => {
      const { pHigh, pSpan } = getPriceRange();
      const fraction = Math.max(0.02, Math.min(0.98, pixelY / containerHeight));
      const rawPrice = pHigh - fraction * pSpan;
      return Number(rawPrice.toFixed(spec.decimals));
    },
    [getPriceRange, spec.decimals]
  );

  const getYFromPrice = useCallback(
    (price: number, containerHeight: number): number => {
      const { pHigh, pSpan } = getPriceRange();
      const fraction = (pHigh - price) / pSpan;
      const clampedFraction = Math.max(0.04, Math.min(0.96, fraction));
      return clampedFraction * containerHeight;
    },
    [getPriceRange]
  );

  // Active positions & pending orders for the selected symbol
  const symbolPositions = positions.filter((p) => p.symbol === symbol && (p.status === 'OPEN' || p.status === 'PENDING'));

  // Handle right-click on chart: PREVENTS TradingView default context menu and displays Exness Menu
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(10, e.clientX - rect.left), rect.width - 250);
    const y = Math.min(Math.max(10, e.clientY - rect.top), rect.height - 290);
    const priceAtCursor = getPriceFromY(e.clientY - rect.top, rect.height);

    setContextMenu({
      isOpen: true,
      x,
      y,
      price: priceAtCursor
    });
  };

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse drag listeners for draggable SL, TP, and Pending orders
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const y = Math.max(10, Math.min(rect.height - 10, e.clientY - rect.top));
      const newPrice = getPriceFromY(y, rect.height);

      setDragState((prev) => (prev ? { ...prev, currentY: y, currentPrice: newPrice } : null));
    };

    const handleMouseUp = async () => {
      if (!dragState) return;
      const { type, positionId, currentPrice } = dragState;

      try {
        if (type === 'TP') {
          await fetch('/api/trade/modify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionId, takeProfit: currentPrice })
          });
          showToast(`Take Profit set to $${currentPrice.toFixed(spec.decimals)}`);
          if (onPositionModified) onPositionModified();
        } else if (type === 'SL') {
          await fetch('/api/trade/modify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionId, stopLoss: currentPrice })
          });
          showToast(`Stop Loss set to $${currentPrice.toFixed(spec.decimals)}`);
          if (onPositionModified) onPositionModified();
        } else if (type === 'PENDING') {
          await fetch('/api/trade/modify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionId, entryPrice: currentPrice })
          });
          showToast(`Pending Order adjusted to $${currentPrice.toFixed(spec.decimals)}`);
          if (onPositionModified) onPositionModified();
        }
      } catch (err) {
        console.error('Failed to commit drag update:', err);
      } finally {
        setDragState(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, getPriceFromY, onPositionModified, spec.decimals]);

  // Start dragging a Take Profit line
  const handleStartDragTP = (e: React.MouseEvent, pos: Position) => {
    e.stopPropagation();
    e.preventDefault();
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const initialPrice = pos.takeProfit || (pos.side === 'BUY' ? pos.entryPrice * 1.008 : pos.entryPrice * 0.992);
    const initialY = getYFromPrice(initialPrice, rect.height);

    setDragState({
      type: 'TP',
      positionId: pos.id,
      side: pos.side,
      entryPrice: pos.entryPrice,
      units: pos.units,
      currentY: initialY,
      currentPrice: initialPrice
    });
  };

  // Start dragging a Stop Loss line
  const handleStartDragSL = (e: React.MouseEvent, pos: Position) => {
    e.stopPropagation();
    e.preventDefault();
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const initialPrice = pos.stopLoss || (pos.side === 'BUY' ? pos.entryPrice * 0.992 : pos.entryPrice * 1.008);
    const initialY = getYFromPrice(initialPrice, rect.height);

    setDragState({
      type: 'SL',
      positionId: pos.id,
      side: pos.side,
      entryPrice: pos.entryPrice,
      units: pos.units,
      currentY: initialY,
      currentPrice: initialPrice
    });
  };

  // Start dragging a Pending Order line
  const handleStartDragPending = (e: React.MouseEvent, pos: Position) => {
    e.stopPropagation();
    e.preventDefault();
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const initialY = getYFromPrice(pos.entryPrice, rect.height);

    setDragState({
      type: 'PENDING',
      positionId: pos.id,
      side: pos.side,
      entryPrice: pos.entryPrice,
      units: pos.units,
      currentY: initialY,
      currentPrice: pos.entryPrice
    });
  };

  // Quick remove SL or TP
  const handleRemoveTP = async (e: React.MouseEvent, positionId: string) => {
    e.stopPropagation();
    try {
      await fetch('/api/trade/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId, takeProfit: null })
      });
      showToast('Take Profit removed');
      if (onPositionModified) onPositionModified();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSL = async (e: React.MouseEvent, positionId: string) => {
    e.stopPropagation();
    try {
      await fetch('/api/trade/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId, stopLoss: null })
      });
      showToast('Stop Loss removed');
      if (onPositionModified) onPositionModified();
    } catch (err) {
      console.error(err);
    }
  };

  // Quick close position or cancel pending order from chart
  const handleCancelOrClose = async (e: React.MouseEvent, pos: Position) => {
    e.stopPropagation();
    try {
      if (pos.status === 'PENDING') {
        await fetch('/api/trade/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: pos.id })
        });
        showToast(`Pending Order cancelled`);
      } else {
        await fetch('/api/trade/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positionId: pos.id })
        });
        showToast(`Position #${pos.id.slice(-5)} closed`);
      }
      if (onPositionClosed) onPositionClosed();
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Context Menu Actions: Place Limit/Stop order at right-clicked price
  const handlePlaceOrderAtPrice = async (side: OrderSide, type: OrderType, targetPrice: number) => {
    try {
      const res = await fetch('/api/trade/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side,
          type,
          lots: symbol === 'BTCUSD' ? 0.5 : 1.0,
          price: targetPrice,
          smcContext: {
            pattern: `Exness Chart Right-Click ${type}`,
            timeframe: '15m'
          }
        })
      });
      if (res.ok) {
        showToast(`Placed ${side} ${type} @ $${targetPrice.toFixed(spec.decimals)}`);
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
        if (onOrderPlaced) onOrderPlaced();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Attach SL or TP to first active position for this symbol
  const handleAttachPriceToPosition = async (actionType: 'TP' | 'SL', targetPrice: number) => {
    const firstOpenPos = symbolPositions.find((p) => p.status === 'OPEN');
    if (!firstOpenPos) {
      showToast('No active open position on ' + symbol);
      return;
    }

    try {
      await fetch('/api/trade/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: firstOpenPos.id,
          [actionType === 'TP' ? 'takeProfit' : 'stopLoss']: targetPrice
        })
      });
      showToast(`Set ${actionType} to $${targetPrice.toFixed(spec.decimals)}`);
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
      if (onPositionModified) onPositionModified();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper calculations for dragging tooltip
  const getDragCalculations = () => {
    if (!dragState) return null;
    const { type, side, entryPrice, units, currentPrice } = dragState;
    let pnl = 0;
    let pips = 0;

    if (type === 'TP' || type === 'SL') {
      if (side === 'BUY') {
        pnl = (currentPrice - entryPrice) * units;
        pips = (currentPrice - entryPrice) / spec.pipSize;
      } else {
        pnl = (entryPrice - currentPrice) * units;
        pips = (entryPrice - currentPrice) / spec.pipSize;
      }
    }

    return {
      priceStr: currentPrice.toFixed(spec.decimals),
      pnlStr: (pnl >= 0 ? '+' : '') + `$${pnl.toFixed(2)}`,
      pipsStr: (pips >= 0 ? '+' : '') + `${pips.toFixed(1)} pips`,
      isPositive: pnl >= 0
    };
  };

  const dragCalc = getDragCalculations();

  return (
    <div
      ref={overlayRef}
      onContextMenu={handleContextMenu}
      onClick={() => {
        if (contextMenu.isOpen) setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }}
      className={`absolute inset-0 select-none z-20 ${
        interactionMode === 'TRADE' ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >


      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/95 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold shadow-xl backdrop-blur-md animate-fade-in pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Render Price Lines for each Active Position and Pending Order */}
      {overlayRef.current &&
        symbolPositions.map((pos) => {
          const containerHeight = overlayRef.current?.getBoundingClientRect().height || 400;
          const entryY = getYFromPrice(pos.entryPrice, containerHeight);
          const isPending = pos.status === 'PENDING';
          const isWinner = pos.profit >= 0;

          const tpPrice = pos.takeProfit;
          const tpY = tpPrice ? getYFromPrice(tpPrice, containerHeight) : null;

          const slPrice = pos.stopLoss;
          const slY = slPrice ? getYFromPrice(slPrice, containerHeight) : null;

          const projectedTpProfit = tpPrice
            ? pos.side === 'BUY'
              ? (tpPrice - pos.entryPrice) * pos.units
              : (pos.entryPrice - tpPrice) * pos.units
            : 0;
          const projectedTpPips = tpPrice
            ? Math.abs(tpPrice - pos.entryPrice) / spec.pipSize
            : 0;

          const projectedSlLoss = slPrice
            ? pos.side === 'BUY'
              ? (pos.entryPrice - slPrice) * pos.units
              : (slPrice - pos.entryPrice) * pos.units
            : 0;
          const projectedSlPips = slPrice
            ? Math.abs(pos.entryPrice - slPrice) / spec.pipSize
            : 0;

          return (
            <React.Fragment key={pos.id}>
              {/* Shaded Take Profit Bracket Zone (Green) */}
              {!isPending && tpY !== null && (
                <div
                  style={{
                    top: `${Math.min(entryY, tpY)}px`,
                    height: `${Math.max(2, Math.abs(entryY - tpY))}px`
                  }}
                  className="absolute left-0 right-16 pointer-events-none z-5 bg-emerald-500/[0.08] border-l-2 border-emerald-500/50 flex items-center pl-3"
                >
                  <span className="text-[9px] font-mono font-bold text-emerald-400/80 tracking-wider uppercase">
                    Target Profit Zone • +${projectedTpProfit.toFixed(2)} ({projectedTpPips.toFixed(1)} pips)
                  </span>
                </div>
              )}

              {/* Shaded Stop Loss Bracket Zone (Red) */}
              {!isPending && slY !== null && (
                <div
                  style={{
                    top: `${Math.min(entryY, slY)}px`,
                    height: `${Math.max(2, Math.abs(entryY - slY))}px`
                  }}
                  className="absolute left-0 right-16 pointer-events-none z-5 bg-rose-500/[0.08] border-l-2 border-rose-500/50 flex items-center pl-3"
                >
                  <span className="text-[9px] font-mono font-bold text-rose-400/80 tracking-wider uppercase">
                    Stop Risk Zone • -${projectedSlLoss.toFixed(2)} ({projectedSlPips.toFixed(1)} pips)
                  </span>
                </div>
              )}

              {/* 1. Position Entry Line / Pending Order Line */}
              <div
                style={{ top: `${entryY}px` }}
                className="absolute left-0 right-0 h-[2px] flex items-center z-20 pointer-events-auto"
              >
                {/* Solid Glowing Line Body */}
                <div
                  className={`absolute inset-x-0 h-[2px] ${
                    isPending
                      ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]'
                      : pos.side === 'BUY'
                      ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                      : 'bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                  }`}
                />

                {/* Left Institutional HUD Capsule */}
                <div
                  className={`absolute left-2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-md shadow-2xl text-[11px] font-mono font-bold border backdrop-blur-md z-30 ${
                    isPending
                      ? 'bg-slate-950/95 text-amber-300 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : pos.side === 'BUY'
                      ? 'bg-slate-950/95 text-emerald-300 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-950/95 text-rose-300 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  }`}
                >
                  {/* Side & Lots Pill */}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5 ${
                      isPending
                        ? 'bg-amber-500 text-slate-950'
                        : pos.side === 'BUY'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {pos.side === 'BUY' ? (
                      <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                    ) : (
                      <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />
                    )}
                    {isPending ? `${pos.side} ${pos.type}` : pos.side} {pos.lots}L
                  </span>

                  {/* Entry Price */}
                  <span className="text-white font-extrabold tracking-wide">
                    @${pos.entryPrice.toFixed(spec.decimals)}
                  </span>

                  {/* Live Profit/Loss Pill */}
                  {!isPending && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight ${
                        isWinner
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {isWinner ? '+' : ''}${pos.profit.toFixed(2)} ({pos.profitPips >= 0 ? '+' : ''}{pos.profitPips.toFixed(1)}p)
                    </span>
                  )}

                  {/* Quick Actions in Badge */}
                  <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-700/80">
                    {/* Pending Move Drag Handle */}
                    {isPending && (
                      <div
                        onMouseDown={(e) => handleStartDragPending(e, pos)}
                        title="Drag up/down to adjust Pending Order price"
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-ns-resize shadow-md"
                      >
                        <GripVertical className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Move</span>
                      </div>
                    )}

                    {/* Add TP Button */}
                    {!isPending && !pos.takeProfit && (
                      <button
                        onClick={(e) => handleStartDragTP(e, pos)}
                        title="Click or drag to attach Take Profit"
                        className="px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/60 text-[10px] font-black transition-colors"
                      >
                        + TP
                      </button>
                    )}

                    {/* Add SL Button */}
                    {!isPending && !pos.stopLoss && (
                      <button
                        onClick={(e) => handleStartDragSL(e, pos)}
                        title="Click or drag to attach Stop Loss"
                        className="px-1.5 py-0.5 rounded bg-rose-950 hover:bg-rose-800 text-rose-300 border border-rose-500/60 text-[10px] font-black transition-colors"
                      >
                        + SL
                      </button>
                    )}

                    {/* Close / Cancel Button */}
                    <button
                      onClick={(e) => handleCancelOrClose(e, pos)}
                      title={isPending ? 'Cancel Pending Order' : 'Close Position at Market Price'}
                      className="p-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Right Axis Price Chevron Badge */}
                <div className="absolute right-0 -translate-y-1/2 flex items-center z-30 shadow-2xl">
                  <div
                    className={`w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] ${
                      isPending
                        ? 'border-r-amber-500'
                        : pos.side === 'BUY'
                        ? 'border-r-emerald-500'
                        : 'border-r-rose-600'
                    }`}
                  />
                  <div
                    className={`px-2 py-0.5 rounded-r font-mono font-black text-[10px] tracking-tight ${
                      isPending
                        ? 'bg-amber-500 text-slate-950 border border-l-0 border-amber-400'
                        : pos.side === 'BUY'
                        ? 'bg-emerald-500 text-slate-950 border border-l-0 border-emerald-400'
                        : 'bg-rose-600 text-white border border-l-0 border-rose-400'
                    }`}
                  >
                    {pos.side === 'BUY' ? '▲' : '▼'} ${pos.entryPrice.toFixed(spec.decimals)}
                  </div>
                </div>
              </div>

              {/* 2. Take Profit (TP) Line: Bright Green with Drag Handle & Axis Flag */}
              {tpY !== null && tpPrice && (
                <div
                  style={{ top: `${tpY}px` }}
                  className="absolute left-0 right-0 h-[2px] flex items-center z-20 pointer-events-auto border-t-2 border-dashed border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                >
                  {/* Left TP Info Badge */}
                  <div className="absolute left-2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/95 border border-emerald-500/80 text-emerald-300 font-mono font-black text-[10px] shadow-xl backdrop-blur-md">
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span>TP: +${projectedTpProfit.toFixed(2)} (+{projectedTpPips.toFixed(1)}p)</span>
                  </div>

                  {/* Right Draggable Handle */}
                  <div
                    onMouseDown={(e) => handleStartDragTP(e, pos)}
                    title="Drag up/down to adjust Take Profit price"
                    className="absolute right-24 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-[10px] cursor-ns-resize shadow-xl transition-transform hover:scale-105 active:scale-95"
                  >
                    <GripVertical className="w-3 h-3 stroke-[3]" />
                    <span>TP: ${tpPrice.toFixed(spec.decimals)}</span>
                    <button
                      onClick={(e) => handleRemoveTP(e, pos.id)}
                      title="Remove Take Profit"
                      className="ml-0.5 hover:text-rose-200"
                    >
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  </div>

                  {/* Right Axis TP Scale Badge */}
                  <div className="absolute right-0 -translate-y-1/2 flex items-center z-30 shadow-2xl">
                    <div className="w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] border-r-emerald-600" />
                    <div className="bg-emerald-600 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded-r border border-l-0 border-emerald-400">
                      TP: ${tpPrice.toFixed(spec.decimals)}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Stop Loss (SL) Line: Bright Red with Drag Handle & Axis Flag */}
              {slY !== null && slPrice && (
                <div
                  style={{ top: `${slY}px` }}
                  className="absolute left-0 right-0 h-[2px] flex items-center z-20 pointer-events-auto border-t-2 border-dashed border-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                >
                  {/* Left SL Info Badge */}
                  <div className="absolute left-2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/95 border border-rose-500/80 text-rose-300 font-mono font-black text-[10px] shadow-xl backdrop-blur-md">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    <span>SL: -${projectedSlLoss.toFixed(2)} (-{projectedSlPips.toFixed(1)}p)</span>
                  </div>

                  {/* Right Draggable Handle */}
                  <div
                    onMouseDown={(e) => handleStartDragSL(e, pos)}
                    title="Drag up/down to adjust Stop Loss price"
                    className="absolute right-24 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-[10px] cursor-ns-resize shadow-xl transition-transform hover:scale-105 active:scale-95"
                  >
                    <GripVertical className="w-3 h-3 stroke-[3]" />
                    <span>SL: ${slPrice.toFixed(spec.decimals)}</span>
                    <button
                      onClick={(e) => handleRemoveSL(e, pos.id)}
                      title="Remove Stop Loss"
                      className="ml-0.5 hover:text-slate-200"
                    >
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  </div>

                  {/* Right Axis SL Scale Badge */}
                  <div className="absolute right-0 -translate-y-1/2 flex items-center z-30 shadow-2xl">
                    <div className="w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] border-r-rose-600" />
                    <div className="bg-rose-600 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded-r border border-l-0 border-rose-400">
                      SL: ${slPrice.toFixed(spec.decimals)}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

      {/* Real-Time Dragging Guide Line & Tooltip */}
      {dragState && dragCalc && (
        <div
          style={{ top: `${dragState.currentY}px` }}
          className={`absolute left-0 right-0 h-[2px] z-30 pointer-events-none transition-none ${
            dragState.type === 'TP'
              ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
              : dragState.type === 'SL'
              ? 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
              : 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
          }`}
        >
          {/* Dynamic Floating HUD Tooltip */}
          <div className="absolute right-6 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md font-mono text-xs">
            <span
              className={`font-extrabold ${
                dragState.type === 'TP'
                  ? 'text-emerald-400'
                  : dragState.type === 'SL'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {dragState.type}: ${dragCalc.priceStr}
            </span>
            {dragState.type !== 'PENDING' && (
              <span
                className={`font-bold ${
                  dragCalc.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dragCalc.pnlStr} ({dragCalc.pipsStr})
              </span>
            )}
            <span className="text-[10px] text-slate-400">Release to save</span>
          </div>
        </div>
      )}

      {/* Custom Exness Right-Click Context Menu */}
      {contextMenu.isOpen && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 w-64 rounded-xl bg-slate-900/95 dark:bg-[#0B0F19]/95 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-1.5 font-mono text-xs animate-scale-up"
        >
          {/* Menu Header with Clicked Price and Bid/Ask */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-extrabold text-white">{symbol}</span>
            </div>
            <span className="font-extrabold text-cyan-400">
              ${contextMenu.price.toFixed(spec.decimals)}
            </span>
          </div>

          <div className="py-1 space-y-0.5">
            {/* Context-aware Pending Orders */}
            {contextMenu.price > currentAsk ? (
              <>
                <button
                  onClick={() => handlePlaceOrderAtPrice('SELL', 'LIMIT', contextMenu.price)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-white transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowDown className="w-3 h-3 text-rose-400 stroke-[3]" />
                    <span>Sell Limit 1.00</span>
                  </span>
                  <span className="text-[10px] opacity-80">${contextMenu.price.toFixed(spec.decimals)}</span>
                </button>
                <button
                  onClick={() => handlePlaceOrderAtPrice('BUY', 'STOP', contextMenu.price)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 hover:text-white transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowUp className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>Buy Stop 1.00</span>
                  </span>
                  <span className="text-[10px] opacity-80">${contextMenu.price.toFixed(spec.decimals)}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handlePlaceOrderAtPrice('BUY', 'LIMIT', contextMenu.price)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 hover:text-white transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowUp className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>Buy Limit 1.00</span>
                  </span>
                  <span className="text-[10px] opacity-80">${contextMenu.price.toFixed(spec.decimals)}</span>
                </button>
                <button
                  onClick={() => handlePlaceOrderAtPrice('SELL', 'STOP', contextMenu.price)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-white transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowDown className="w-3 h-3 text-rose-400 stroke-[3]" />
                    <span>Sell Stop 1.00</span>
                  </span>
                  <span className="text-[10px] opacity-80">${contextMenu.price.toFixed(spec.decimals)}</span>
                </button>
              </>
            )}

            {/* Position S/L & T/P Quick Attachment */}
            {symbolPositions.some((p) => p.status === 'OPEN') && (
              <>
                <div className="h-[1px] bg-slate-800 my-1" />
                <button
                  onClick={() => handleAttachPriceToPosition('TP', contextMenu.price)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 hover:text-white transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span>Set Take Profit</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ${contextMenu.price.toFixed(spec.decimals)}
                  </span>
                </button>
                <button
                  onClick={() => handleAttachPriceToPosition('SL', contextMenu.price)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-white transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    <span>Set Stop Loss</span>
                  </span>
                  <span className="text-[10px] text-rose-400 font-bold">
                    ${contextMenu.price.toFixed(spec.decimals)}
                  </span>
                </button>
              </>
            )}

            {/* Market Order Quick Executions */}
            <div className="h-[1px] bg-slate-800 my-1" />
            <button
              onClick={() => handlePlaceOrderAtPrice('BUY', 'MARKET', currentAsk)}
              className="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-emerald-500/10 text-emerald-400 text-left text-[11px]"
            >
              <span>Buy Market 1.00</span>
              <span>Ask: ${currentAsk.toFixed(spec.decimals)}</span>
            </button>
            <button
              onClick={() => handlePlaceOrderAtPrice('SELL', 'MARKET', currentBid)}
              className="w-full flex items-center justify-between px-2.5 py-1 rounded hover:bg-rose-500/10 text-rose-400 text-left text-[11px]"
            >
              <span>Sell Market 1.00</span>
              <span>Bid: ${currentBid.toFixed(spec.decimals)}</span>
            </button>

            {/* Close Context Menu */}
            <div className="h-[1px] bg-slate-800 my-1" />
            <button
              onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
              className="w-full px-2.5 py-1 text-center text-slate-500 hover:text-slate-300 text-[10px] rounded hover:bg-slate-800/50"
            >
              Cancel / Close Menu (Esc)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
