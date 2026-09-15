'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Radar,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { api } from '../../lib/api';
import { playSonarPing, playAlertChime } from '../../lib/audioUtils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to Dashboard
  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please enter your username / callsign.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.login(cleanUsername, password);
      playSonarPing(1200, 0.4);
      router.push('/dashboard');
    } catch (err: any) {
      playAlertChime();
      console.error('Operator sign-in failed:', err);
      let userMsg = err?.message || 'Authentication failed. Please check credentials.';
      const lower = userMsg.toLowerCase();
      if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
        userMsg = 'Unable to connect to authentication server (FastAPI 127.0.0.1:8000). Verify backend is running.';
      } else if (lower.includes('incorrect') || lower.includes('unauthorized') || lower.includes('401')) {
        userMsg = 'Invalid username or password.';
      }
      setError(userMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Animated Sonar Waves & Grids */}
      <div className="fixed inset-0 sonar-grid opacity-25 pointer-events-none z-0" />
      <div className="fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none z-0" />

      {/* Navigation Return Link */}
      <div className="relative z-10 w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono-code text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>RETURN TO PORTAL</span>
        </Link>
        <span className="text-[11px] font-mono-code text-cyan-500/80 uppercase">
          SECURE SECTOR 07
        </span>
      </div>

      {/* Main Tactical Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-cyan-900/80 bg-[#061224]/90 p-8 shadow-[0_0_50px_rgba(34,211,238,0.1)] backdrop-blur-xl"
      >
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_20px_rgba(34,211,238,0.25)] mb-4">
            <KeyRound className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            OPERATOR SIGN IN
          </h1>
          <p className="mt-1 text-xs font-mono-code tracking-wider text-cyan-400 uppercase">
            FASTAPI JWT AUTHORIZATION
          </p>
        </div>

        {/* Registration Success Banner */}
        {registered && (
          <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ACCOUNT CREATED SUCCESSFULLY</p>
              <p className="text-[11px] text-emerald-400/90 mt-0.5">
                Your credentials are saved in SQLite. Enter credentials below to authorize.
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed font-mono-code">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* USERNAME / CALLSIGN */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              USERNAME / CALLSIGN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="h-4 w-4 text-cyan-400/70" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                className="w-full rounded-lg border border-cyan-900/60 bg-[#030914] pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono-code transition-colors"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4 text-cyan-400/70" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full rounded-lg border border-cyan-900/60 bg-[#030914] pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono-code transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Primary Button: AUTHORIZE & ENTER → */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 py-3.5 px-4 text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>AUTHORIZING...</span>
              </>
            ) : (
              <>
                <span>AUTHORIZE &amp; ENTER →</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Below: DON'T HAVE AN ACCOUNT? CREATE ACCOUNT */}
        <div className="mt-8 pt-6 border-t border-cyan-950/80 text-center">
          <p className="text-xs text-slate-400">
            DON&apos;T HAVE AN ACCOUNT?{' '}
            <Link
              href="/register"
              className="font-mono-code font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 ml-1 transition-colors"
            >
              CREATE ACCOUNT
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Security & Compliance Footer Tag */}
      <div className="mt-8 text-[11px] font-mono-code text-slate-500 flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-cyan-500/70" />
        <span>FASTAPI OAUTH2 BEARER TOKEN • ARGON2ID ENCRYPTED</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030712] flex items-center justify-center text-cyan-400 font-mono-code">
          INITIALIZING OPERATOR SECURITY HUD...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
