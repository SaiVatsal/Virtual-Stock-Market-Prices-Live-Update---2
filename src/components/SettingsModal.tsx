'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Shield, RefreshCw, CheckCircle2, DollarSign, ExternalLink, Server, Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSettingsSaved }: SettingsModalProps) {
  // Exness Credentials
  const [exnessAccountId, setExnessAccountId] = useState<string>('EX-9482104');
  const [exnessServer, setExnessServer] = useState<string>('Exness-Trial2');
  const [exnessPassword, setExnessPassword] = useState<string>('');
  const [exnessAccountType, setExnessAccountType] = useState<string>('PRO');
  const [marketMode, setMarketMode] = useState<string>('WEEKEND_OTC_PRACTICE');

  // External APIs
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>('');
  const [oandaApiKey, setOandaApiKey] = useState<string>('');
  const [oandaAccountId, setOandaAccountId] = useState<string>('');
  const [twelveDataApiKey, setTwelveDataApiKey] = useState<string>('');
  const [webhookSecret, setWebhookSecret] = useState<string>('');
  const [initialBalance, setInitialBalance] = useState<string>('100000');
  const [leverage, setLeverage] = useState<string>('200');
  const [resetAccount, setResetAccount] = useState<boolean>(false);

  const [maskedClaude, setMaskedClaude] = useState<string>('');
  const [maskedOanda, setMaskedOanda] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.maskedAnthropicKey) setMaskedClaude(data.maskedAnthropicKey);
        if (data.maskedOandaKey) setMaskedOanda(data.maskedOandaKey);
        if (data.oandaAccountId) setOandaAccountId(data.oandaAccountId);
        if (data.webhookSecret) setWebhookSecret(data.webhookSecret);
        if (data.initialBalance) setInitialBalance(data.initialBalance.toString());
        if (data.leverage) setLeverage(data.leverage.toString());
        if (data.exnessAccountId) setExnessAccountId(data.exnessAccountId);
        if (data.exnessServer) setExnessServer(data.exnessServer);
        if (data.exnessAccountType) setExnessAccountType(data.exnessAccountType);
        if (data.marketMode) setMarketMode(data.marketMode);
      })
      .catch((err) => console.error('Error fetching settings:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const payload: any = {
        resetAccount,
        initialBalance: parseFloat(initialBalance),
        leverage: parseInt(leverage, 10),
        exnessAccountId: exnessAccountId.trim(),
        exnessServer: exnessServer.trim(),
        exnessAccountType,
        marketMode
      };

      if (exnessPassword.trim()) payload.exnessPassword = exnessPassword.trim();
      if (anthropicApiKey.trim()) payload.anthropicApiKey = anthropicApiKey.trim();
      if (oandaApiKey.trim()) payload.oandaApiKey = oandaApiKey.trim();
      if (oandaAccountId.trim()) payload.oandaAccountId = oandaAccountId.trim();
      if (twelveDataApiKey.trim()) payload.twelveDataApiKey = twelveDataApiKey.trim();
      if (webhookSecret.trim()) payload.webhookSecret = webhookSecret.trim();

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg('Exness credentials and platform settings saved successfully!');
        setAnthropicApiKey('');
        setOandaApiKey('');
        setTwelveDataApiKey('');
        setExnessPassword('');
        setResetAccount(false);
        onSettingsSaved();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#080C14] border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 flex items-center justify-center font-extrabold text-black tracking-tight text-xs shadow-md">
              EXNESS
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-white">
                Exness Trading Account & Platform Settings
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Configure your Exness MT5 account, live pricing feed, and Claude AI key
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

        <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
          {/* Exness Account Credentials Section */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#141A29] to-[#0A0E18] border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                Exness Account Configuration
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/40">
                PRO TERMINAL READY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Exness Account ID / Login</label>
                <input
                  type="text"
                  placeholder="e.g. 28491024 or EX-9482104"
                  value={exnessAccountId}
                  onChange={(e) => setExnessAccountId(e.target.value)}
                  className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Trading Server</label>
                <select
                  value={exnessServer}
                  onChange={(e) => setExnessServer(e.target.value)}
                  className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Exness-Trial2">Exness-Trial2 (Demo)</option>
                  <option value="Exness-Trial">Exness-Trial (Demo)</option>
                  <option value="Exness-MT5Trial">Exness-MT5Trial</option>
                  <option value="Exness-Real">Exness-Real</option>
                  <option value="Exness-Real19">Exness-Real19</option>
                  <option value="Exness-Real21">Exness-Real21</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Trading Password / API Token</label>
                <input
                  type="password"
                  placeholder="Enter your Exness password / token"
                  value={exnessPassword}
                  onChange={(e) => setExnessPassword(e.target.value)}
                  className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Exness Account Type</label>
                <select
                  value={exnessAccountType}
                  onChange={(e) => setExnessAccountType(e.target.value)}
                  className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="PRO">Exness Pro (Instant Execution)</option>
                  <option value="RAW_SPREAD">Exness Raw Spread (0.0 Pip Spreads)</option>
                  <option value="ZERO">Exness Zero</option>
                  <option value="STANDARD">Exness Standard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Market Schedule Mode */}
          <div className="p-3 rounded-xl bg-[#090D17] border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Weekend Market Schedule Behavior
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label
                onClick={() => setMarketMode('WEEKEND_OTC_PRACTICE')}
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  marketMode === 'WEEKEND_OTC_PRACTICE'
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                    : 'bg-[#060910] border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold mb-0.5">24/7 OTC Demo Practice (Recommended)</div>
                <div className="text-[10px] opacity-80 font-sans">
                  Allows continuous simulated trading on Gold & Forex over the weekend for practice.
                </div>
              </label>

              <label
                onClick={() => setMarketMode('REAL_MARKET_HOURS')}
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  marketMode === 'REAL_MARKET_HOURS'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-[#060910] border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold mb-0.5">Strict Real Market Hours (Exness)</div>
                <div className="text-[10px] opacity-80 font-sans">
                  Freezes Gold & Forex prices at Friday close until Sunday 21:00 UTC. Crypto stays 24/7.
                </div>
              </label>
            </div>
          </div>

          {/* Claude AI API Key */}
          <div className="p-3 rounded-xl bg-[#090D17] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold">Anthropic Claude API Key</label>
              {maskedClaude && (
                <span className="text-[10px] text-emerald-400">Active: {maskedClaude}</span>
              )}
            </div>
            <input
              type="password"
              placeholder={maskedClaude ? 'Enter new key to replace' : 'sk-ant-api03-...'}
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500 font-sans block">
              Used server-side for AI Trade Journal critiques, pre-session macro briefings, and signal confidence notes.
            </span>
          </div>

          {/* Virtual Account Parameters & Exness Leverage */}
          <div className="p-3 rounded-xl bg-[#090D17] border border-slate-800 space-y-2.5">
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px] block">
              Virtual Margin & Balance
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Starting Balance</label>
                <select
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full bg-[#060910] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="10000">$10,000 USD</option>
                  <option value="50000">$50,000 USD</option>
                  <option value="100000">$100,000 USD</option>
                  <option value="500000">$500,000 USD</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Exness Leverage</label>
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  className="w-full bg-[#060910] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="100">1:100</option>
                  <option value="200">1:200 (Exness Standard)</option>
                  <option value="500">1:500</option>
                  <option value="1000">1:1000</option>
                  <option value="2000">1:2000 (Exness High)</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={resetAccount}
                onChange={(e) => setResetAccount(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-amber-400 text-[11px]">
                Reset virtual equity back to initial balance & clear history on save
              </span>
            </label>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Exness Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
