'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Radar,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  UserPlus,
  Check,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { playSonarPing, playAlertChime } from '../../lib/audioUtils';

export default function RegisterPage() {
  const router = useRouter();

  // All fields initially EMPTY
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field validation states & errors
  const [touched, setTouched] = useState<{
    username?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      router.push('/?enter=true');
    }
  }, [router]);

  // Real-time password criteria evaluation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  // Email format regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate fields dynamically
  const validate = () => {
    const errors: typeof fieldErrors = {};

    // 1. Username / Callsign
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      errors.username = 'Username / Callsign is required.';
    }

    // 2. Email Address
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    // 3. Password
    if (!password) {
      errors.password = 'Password is required.';
    } else if (!isPasswordValid) {
      errors.password =
        'Password must contain at least 8 characters, 1 uppercase letter and 1 number.';
    }

    // 4. Confirm Password
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validate();
    setFieldErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Mark all touched
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      playAlertChime();
      return;
    }

    setIsLoading(true);
    try {
      const cleanUsername = username.trim();
      const cleanEmail = email.trim();

      // Backend expects username, email, password
      await api.auth.register(cleanUsername, cleanEmail, password);
      playSonarPing(1300, 0.45);
      router.push('/login?registered=true');
    } catch (err: any) {
      playAlertChime();
      console.error('Registration failed:', err);

      let msg = err?.message || 'Registration failed. Please try again.';
      const lower = msg.toLowerCase();
      if (
        lower.includes('already registered') ||
        lower.includes('already exists') ||
        lower.includes('409')
      ) {
        msg = 'USERNAME OR EMAIL ALREADY EXISTS.';
      } else if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
        msg = 'Unable to connect to authentication server (FastAPI 127.0.0.1:8000).';
      }
      setServerError(msg);
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
      <div className="relative z-10 w-full max-w-lg mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono-code text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>RETURN TO PORTAL</span>
        </Link>
        <span className="text-[11px] font-mono-code text-cyan-500/80 uppercase">
          SECURE REGISTRATION
        </span>
      </div>

      {/* Main Tactical Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-cyan-900/80 bg-[#061224]/90 p-8 shadow-[0_0_50px_rgba(34,211,238,0.1)] backdrop-blur-xl"
      >
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_20px_rgba(34,211,238,0.25)] mb-4">
            <UserPlus className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            CREATE OPERATOR ACCOUNT
          </h1>
          <p className="mt-1 text-xs font-mono-code tracking-wider text-cyan-400 uppercase">
            FASTAPI SECURE PERSISTENCE
          </p>
        </div>

        {/* Server Error Notification */}
        {serverError && (
          <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed font-mono-code font-bold">{serverError}</div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USERNAME / CALLSIGN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300"
              >
                USERNAME / CALLSIGN
              </label>
              {touched.username && fieldErrors.username && (
                <span className="text-[11px] font-mono-code text-rose-400">
                  {fieldErrors.username}
                </span>
              )}
            </div>
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
                onBlur={() => handleBlur('username')}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (touched.username) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      username: e.target.value.trim()
                        ? undefined
                        : 'Username / Callsign is required.',
                    }));
                  }
                }}
                placeholder="username"
                required
                className={`w-full rounded-lg border bg-[#030914] pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 font-mono-code transition-colors ${
                  touched.username && fieldErrors.username
                    ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-400'
                    : 'border-cyan-900/60 focus:border-cyan-400 focus:ring-cyan-400'
                }`}
              />
            </div>
          </div>

          {/* EMAIL ADDRESS */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300"
              >
                EMAIL ADDRESS
              </label>
              {touched.email && fieldErrors.email && (
                <span className="text-[11px] font-mono-code text-rose-400">
                  {fieldErrors.email}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4 w-4 text-cyan-400/70" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onBlur={() => handleBlur('email')}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      email: emailRegex.test(e.target.value.trim())
                        ? undefined
                        : 'Please enter a valid email address.',
                    }));
                  }
                }}
                placeholder="username@example.com"
                required
                className={`w-full rounded-lg border bg-[#030914] pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 font-mono-code transition-colors ${
                  touched.email && fieldErrors.email
                    ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-400'
                    : 'border-cyan-900/60 focus:border-cyan-400 focus:ring-cyan-400'
                }`}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300"
              >
                PASSWORD
              </label>
              {touched.password && fieldErrors.password && (
                <span className="text-[11px] font-mono-code text-rose-400">
                  {fieldErrors.password}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4 text-cyan-400/70" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onBlur={() => handleBlur('password')}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  if (touched.password) {
                    const valid = val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val);
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: valid
                        ? undefined
                        : 'Password must contain at least 8 characters, 1 uppercase letter and 1 number.',
                    }));
                  }
                }}
                placeholder="Minimum 8 characters, 1 uppercase, 1 number"
                required
                className={`w-full rounded-lg border bg-[#030914] pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 font-mono-code transition-colors ${
                  touched.password && fieldErrors.password
                    ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-400'
                    : 'border-cyan-900/60 focus:border-cyan-400 focus:ring-cyan-400'
                }`}
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

            {/* Live Password Strength Requirements Checklist */}
            <div className="mt-2.5 p-2.5 rounded-lg border border-cyan-950/70 bg-[#030914]/80 space-y-1 text-[11px] font-mono-code">
              <div
                className={`flex items-center gap-1.5 ${
                  hasMinLength ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>At least 8 characters</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  hasUppercase ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>At least 1 uppercase letter (A-Z)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  hasNumber ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>At least 1 number (0-9)</span>
              </div>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300"
              >
                CONFIRM PASSWORD
              </label>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <span className="text-[11px] font-mono-code text-rose-400">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4 text-cyan-400/70" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onBlur={() => handleBlur('confirmPassword')}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (touched.confirmPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword:
                        e.target.value === password ? undefined : 'Passwords do not match.',
                    }));
                  }
                }}
                placeholder="Re-enter password"
                required
                className={`w-full rounded-lg border bg-[#030914] pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 font-mono-code transition-colors ${
                  touched.confirmPassword && fieldErrors.confirmPassword
                    ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-400'
                    : 'border-cyan-900/60 focus:border-cyan-400 focus:ring-cyan-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 py-3.5 px-4 text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>CREATING OPERATOR ACCOUNT...</span>
              </>
            ) : (
              <>
                <span>CREATE ACCOUNT</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Sign In */}
        <div className="mt-8 pt-6 border-t border-cyan-950/80 text-center">
          <p className="text-xs text-slate-400">
            ALREADY HAVE AN ACCOUNT?{' '}
            <Link
              href="/login"
              className="font-mono-code font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 ml-1 transition-colors"
            >
              SIGN IN
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Security & Compliance Footer Tag */}
      <div className="mt-8 text-[11px] font-mono-code text-slate-500 flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-cyan-500/70" />
        <span>FASTAPI SQLALCHEMY PERSISTENCE • ARGON2ID SECURE HASHING</span>
      </div>
    </div>
  );
}
