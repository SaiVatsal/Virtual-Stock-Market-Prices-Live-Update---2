'use client';

import React, { useState } from 'react';
import { PINE_SCRIPT_INDICATOR_V5, WEBHOOK_DOCS } from '@/lib/pine-script';
import { X, Copy, Check, Code2, ExternalLink, HelpCircle } from 'lucide-react';

interface PineScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PineScriptModal({ isOpen, onClose }: PineScriptModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const fullWebhookUrl = `${currentOrigin}${WEBHOOK_DOCS.url}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(PINE_SCRIPT_INDICATOR_V5);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullWebhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0A0E18] border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-white">
                Pine Script v5 Indicator & Webhook Setup
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Institutional Smart Money Concepts (Liquidity Sweeps, Order Blocks, FVGs)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Webhook Endpoint Banner */}
        <div className="p-3.5 rounded-xl bg-[#060910] border border-cyan-900/60 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider block font-bold">
              Your Ingestion Webhook URL
            </span>
            <span className="text-xs font-mono text-slate-200 select-all font-semibold">
              {fullWebhookUrl}
            </span>
          </div>

          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all shrink-0"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Copied URL!' : 'Copy URL'}</span>
          </button>
        </div>

        {/* Setup Instructions */}
        <div className="p-3 rounded-xl bg-[#090D17] border border-slate-800/80 mb-4">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Quick 60-Second Setup Guide
          </span>
          <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 font-sans">
            {WEBHOOK_DOCS.instructions.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                <span className="text-slate-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Pine Script Source Code Block */}
        <div className="flex-1 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-xs font-mono text-slate-400">
              Pine Script v5 Source Code (SMC & Key-Levels)
            </span>
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Code Copied!' : 'Copy Pine Script'}</span>
            </button>
          </div>

          <div className="relative flex-1 bg-[#05070D] border border-slate-800 rounded-xl p-3 overflow-auto max-h-[280px]">
            <pre className="text-[11px] font-mono text-cyan-200/90 whitespace-pre leading-relaxed select-all">
              {PINE_SCRIPT_INDICATOR_V5}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
