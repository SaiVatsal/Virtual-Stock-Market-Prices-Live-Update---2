'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/lib/types';
import {
  User,
  Lock,
  DollarSign,
  Shield,
  Check,
  Loader2,
  LogIn,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
  Sun,
  Moon,
  BarChart3,
  Layers,
  Activity,
  Sparkles
} from 'lucide-react';

interface OnboardingGateProps {
  onSuccess: (user: UserProfile) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function OnboardingGate({
  onSuccess,
  theme,
  onToggleTheme
}: OnboardingGateProps) {
  // Default to REGISTER so new visitors are immediately asked to create their account first
  const [tab, setTab] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [initialBalance, setInitialBalance] = useState('100000');
  const [leverage, setLeverage] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setError('Please enter a username or email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);

    try {
      const endpoint = tab === 'LOGIN' ? '/api/auth/login' : '/api/auth/register';
      const body =
        tab === 'LOGIN'
          ? { username: username.trim(), password: password.trim() }
          : {
              username: username.trim(),
              password: password.trim(),
              initialBalance: parseFloat(initialBalance),
              leverage: parseInt(leverage, 10)
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setSuccessMsg(
        tab === 'REGISTER'
          ? 'Account created successfully! Loading your live trading floor...'
          : 'Welcome back! Unlocking live terminal...'
      );

      try {
        localStorage.setItem('nexus_user_profile', JSON.stringify(data.user));
      } catch {}

      setTimeout(() => {
        onSuccess(data.user);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 font-mono relative overflow-hidden select-none">
      {/* Dynamic Background Grid Pattern & Glowing Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-white">EXNESS</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                PRO TERMINAL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight">Institutional Multi-Asset Paper Trading</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24/7 OTC Liquidity Active</span>
          </div>

          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Main Center Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>TERMINAL ACCESS VERIFICATION</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
              {tab === 'REGISTER' ? 'Create Your Trading Account' : 'Sign In To Nexus Terminal'}
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
              {tab === 'REGISTER'
                ? 'Create a simulated institutional account to access the live TradingView charts, order ticket, and real-time execution engine.'
                : 'Enter your credentials to unlock your live positions, account telemetry, and active charts.'}
            </p>
          </div>

          {/* Tab Selector: Register (Default) vs Sign In */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab('REGISTER');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
                tab === 'REGISTER'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
                tab === 'LOGIN'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-xs text-rose-300 font-semibold flex items-start gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Username / Email */}
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center justify-between">
                <span>{tab === 'REGISTER' ? 'New Account Username or Email' : 'Account Username or Email'}</span>
                <span className="text-[10px] text-slate-500 font-normal">Required</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tab === 'REGISTER' ? 'e.g. trader_pro or user@example.com' : 'Enter your username or email'}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-slate-500 font-normal">Required</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Registration Options: Initial Balance & Leverage */}
            {tab === 'REGISTER' && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center justify-between">
                    <span>Virtual Starting Balance</span>
                    <span className="text-[10px] text-cyan-400 font-bold">${parseFloat(initialBalance).toLocaleString()}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: '10000', label: '$10k' },
                      { val: '50000', label: '$50k' },
                      { val: '100000', label: '$100k' },
                      { val: '250000', label: '$250k' }
                    ].map((b) => (
                      <button
                        type="button"
                        key={b.val}
                        onClick={() => setInitialBalance(b.val)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          initialBalance === b.val
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center justify-between">
                    <span>Simulated Leverage</span>
                    <span className="text-[10px] text-amber-400 font-bold">1:{leverage}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: '50', label: '1:50' },
                      { val: '100', label: '1:100' },
                      { val: '200', label: '1:200' },
                      { val: '500', label: '1:500' }
                    ].map((l) => (
                      <button
                        type="button"
                        key={l.val}
                        onClick={() => setLeverage(l.val)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          leverage === l.val
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Processing...</span>
                </>
              ) : tab === 'REGISTER' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Unlock Trading Terminal</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In & Unlock Trading Terminal</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Helper Link */}
          <div className="mt-5 text-center text-xs text-slate-400">
            {tab === 'REGISTER' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('LOGIN');
                    setError(null);
                  }}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                First time visitor?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('REGISTER');
                    setError(null);
                  }}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  Create a new account
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Institutional Highlights Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-6 border-t border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase">TradingView Engine</h3>
              <p className="text-[11px] text-slate-400">Real-time candlesticks, indicators & dual split-grid</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase">24/7 OTC Liquidity</h3>
              <p className="text-[11px] text-slate-400">Trade Gold (XAUUSD), EURUSD & Bitcoin anytime</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase">Risk & Telemetry</h3>
              <p className="text-[11px] text-slate-400">Auto margin protection & 1-click batch position closing</p>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-4">
          Exness Pro Terminal Simulator • Multi-tenant Paper Trading Environment • All trades are virtual
        </p>
      </footer>
    </div>
  );
}
