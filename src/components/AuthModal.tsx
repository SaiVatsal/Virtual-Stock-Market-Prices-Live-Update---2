'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserProfile } from '@/lib/types';
import { User, Lock, DollarSign, Shield, X, Check, Loader2, Sparkles, LogIn, UserPlus, Zap, ExternalLink } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}: AuthModalProps) {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [initialBalance, setInitialBalance] = useState('100000');
  const [leverage, setLeverage] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFillAdmin = () => {
    setTab('LOGIN');
    setUsername('vatsal1327@gmail.com');
    setPassword('Bitcoin@100');
    setError(null);
  };

  const handleFillDemo = () => {
    setTab('LOGIN');
    setUsername('sai1327y@gmail.com');
    setPassword('Sai@987654321');
    setError(null);
  };

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

      setSuccessMsg(data.message || 'Success!');
      localStorage.setItem('nexus_user_profile', JSON.stringify(data.user));
      onLoginSuccess(data.user);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Nexus Terminal Access
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentUser ? `Signed in as @${currentUser.username}` : 'Sign in or create a simulated account'}
            </p>
          </div>
        </div>

        {/* Admin & Demo Credentials Quick Fill */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300 text-[11px]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Admin
                </span>
                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">ADMIN</span>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-mono truncate">
                vatsal1327@gmail.com
              </p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                Bitcoin@100
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillAdmin}
              className="mt-2 py-1 px-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition-colors"
            >
              Auto Fill Admin
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-bold text-cyan-800 dark:text-cyan-300 text-[11px]">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" /> User
                </span>
                <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300">TRADER</span>
              </div>
              <p className="text-[10px] text-cyan-700 dark:text-cyan-400 mt-1 font-mono truncate">
                sai1327y@gmail.com
              </p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                Sai@987654321
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="mt-2 py-1 px-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] transition-colors"
            >
              Auto Fill User
            </button>
          </div>
        </div>

        {/* Tabs: Sign In / Create Account */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('LOGIN');
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
              tab === 'LOGIN'
                ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-cyan-500/40 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
              tab === 'REGISTER'
                ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-cyan-500/40 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-600 dark:text-rose-400 font-semibold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Username
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="e.g. trader_pro"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#070A10] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#070A10] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {tab === 'REGISTER' && (
            <>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Starting Balance (USD)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['10000', '50000', '100000', '250000'].map((bal) => (
                    <button
                      key={bal}
                      type="button"
                      onClick={() => setInitialBalance(bal)}
                      className={`py-1 text-center rounded border text-[11px] font-bold transition-all ${
                        initialBalance === bal
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      ${parseInt(bal, 10).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Default Leverage
                </label>
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#070A10] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="50">1:50</option>
                  <option value="100">1:100 (Standard)</option>
                  <option value="200">1:200 (Pro)</option>
                  <option value="500">1:500 (High Risk)</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : tab === 'LOGIN' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In To Terminal</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Paper Trading Account</span>
              </>
            )}
          </button>
        </form>

        {/* Dedicated Login Page Link */}
        <div className="mt-3 text-center">
          <Link
            href="/login"
            onClick={onClose}
            className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>Open Dedicated Full-Screen Login Page</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Log Out Option if currently logged in */}
        {currentUser && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Active Session: <strong className="text-slate-800 dark:text-slate-200">@{currentUser.username}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-rose-600 dark:text-rose-400 hover:underline font-bold"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
