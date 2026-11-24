'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';
import {
  User,
  Lock,
  DollarSign,
  Shield,
  Check,
  Loader2,
  Sparkles,
  LogIn,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [initialBalance, setInitialBalance] = useState('100000');
  const [leverage, setLeverage] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Check if session is already active
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (e) {
        console.error('Session check error:', e);
      }
    }
    checkActiveSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const endpoint = tab === 'LOGIN' ? '/api/auth/login' : '/api/auth/register';
      const body =
        tab === 'LOGIN'
          ? { username, password }
          : { username, password, initialBalance: parseFloat(initialBalance), leverage: parseInt(leverage, 10) };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccessMsg(data.message || 'Success! Redirecting to trading terminal...');
      localStorage.setItem('nexus_user_profile', JSON.stringify(data.user));
      setCurrentUser(data.user);

      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('nexus_user_profile');
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setSuccessMsg('Signed out successfully.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-mono selection:bg-cyan-500 selection:text-black">
      {/* Top Brand Nav */}
      <header className="w-full border-b border-slate-800 bg-[#070A10]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 px-3 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center font-black text-black tracking-tighter text-sm shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              EXNESS
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-slate-100">
                TERMINAL <span className="text-cyan-400">PRO</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono">Institutional Paper Trading Terminal</p>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium"
          >
            <span>Launch Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-xl bg-[#0B0F1A] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Active Session Banner */}
          {currentUser && (
            <div className="mb-6 p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Currently Logged In: <span className="text-cyan-400">@{currentUser.username}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Account: {currentUser.accountNumber} • Role: {currentUser.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Enter Terminal
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Switch / Logout
                </button>
              </div>
            </div>
          )}

          {/* Title Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-1 flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400 inline" />
              Terminal Access Portal
            </h1>
            <p className="text-xs text-slate-400">
              Sign in with institutional credentials or create an isolated practice account
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tab === 'LOGIN'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('REGISTER');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tab === 'REGISTER'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. trader_alex or admin"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Registration Options: Initial Balance & Leverage */}
            {tab === 'REGISTER' && (
              <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-fade-in">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Initial Practice Balance
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['10000', '50000', '100000', '250000'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setInitialBalance(val)}
                        className={`py-1.5 px-2 text-[11px] rounded-lg border font-mono transition-all ${
                          initialBalance === val
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        ${parseInt(val) / 1000}k
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Leverage Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['50', '100', '200', '500'].map((lev) => (
                      <button
                        key={lev}
                        type="button"
                        onClick={() => setLeverage(lev)}
                        className={`py-1.5 px-2 text-[11px] rounded-lg border font-mono transition-all ${
                          leverage === lev
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        1:{lev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : tab === 'LOGIN' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Authenticate & Enter Terminal</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Start Trading</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
            <p className="text-[10px] text-slate-500">
              Nexus Trader • Exness Terminal Simulation Engine • Multi-Tenant Isolated Ledger
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 bg-[#070A10]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Nexus Trader — Next.js 14 Institutional Paper Trading Platform</span>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              Terminal
            </Link>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">Institutional Multi-Tenant Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
