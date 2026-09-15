'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { api, UserProfile } from '../lib/api';
import { playSonarPing, playAlertChime } from '../lib/audioUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    playSonarPing(880, 0.3);

    try {
      if (mode === 'register') {
        if (!username.trim() || !email.trim() || !password) {
          throw new Error('All fields are required.');
        }
        await api.auth.register(username.trim(), email.trim(), password);
        // Automatically login after registration
        const me = await api.auth.login(username.trim(), password);
        playAlertChime();
        onSuccess(me);
        onClose();
      } else {
        if (!username.trim() || !password) {
          throw new Error('Username and password are required.');
        }
        const me = await api.auth.login(username.trim(), password);
        playAlertChime();
        onSuccess(me);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-900/80 bg-[#060e1e] p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-cyan-950/80">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono-code text-white tracking-wider">
                  TACTICAL OPERATOR AUTH
                </h3>
                <span className="text-[10px] font-mono-code text-cyan-400">
                  FASTAPI JWT AUTHORIZATION
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-950/80 p-1 font-mono-code text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`rounded py-1.5 font-bold transition-all ${
                mode === 'login'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OPERATOR LOGIN
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`rounded py-1.5 font-bold transition-all ${
                mode === 'register'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NEW OPERATOR
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs font-mono-code">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                OPERATOR CALLSIGN / USERNAME
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr_raman or admin"
                  className="w-full rounded-lg border border-cyan-950/80 bg-slate-950/70 pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-[11px] text-slate-400 mb-1">
                  OFFICIAL MARITIME EMAIL
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@maritime.gov.in"
                    className="w-full rounded-lg border border-cyan-950/80 bg-slate-950/70 pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                TACTICAL ACCESS KEY / PASSWORD
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-cyan-950/80 bg-slate-950/70 pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 py-2.5 font-bold text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AUTHENTICATING WITH FASTAPI...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'AUTHORIZE & ENTER' : 'REGISTER & INITIALIZE'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Notice */}
          <div className="mt-5 text-center text-[10px] font-mono-code text-slate-500 border-t border-cyan-950/80 pt-3">
            PROTECTED BY 256-BIT JWT • LOCAL AUTHORIZATION SERVER
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
