'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Radar,
  MapPin,
  Database,
  BarChart3,
  FileText,
  LogOut,
  UserCheck,
  ShieldCheck,
  Activity,
  ArrowLeft,
  Menu,
  X,
  Radio,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api, UserProfile } from '../lib/api';
import { playSonarPing } from '../lib/audioUtils';

export type InnerNavSection =
  | 'overview'
  | 'analysis'
  | 'map'
  | 'detections'
  | 'analytics'
  | 'reports';

interface AppShellProps {
  activeSection: InnerNavSection;
  children: React.ReactNode;
  isDemo?: boolean;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard', icon: Compass },
  { id: 'analysis', label: 'Sonar Analysis', href: '/analysis', icon: Radar },
  { id: 'map', label: 'Detection Map', href: '/map', icon: MapPin },
  { id: 'detections', label: 'Detections', href: '/detections', icon: Database },
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', href: '/reports', icon: FileText },
];

export default function AppShell({ activeSection, children, isDemo }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Auth protection
    if (!api.auth.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const cached = api.auth.getCachedUser();
    if (cached) {
      setCurrentUser(cached);
      setIsLoadingAuth(false);
    }

    api.auth
      .getMe()
      .then((user) => {
        setCurrentUser(user);
        setIsLoadingAuth(false);
      })
      .catch(() => {
        api.auth.clearSession();
        router.replace('/login');
      });

    const handleAuthChange = () => {
      const u = api.auth.getCachedUser();
      setCurrentUser(u);
    };
    window.addEventListener('pulsedepth_auth_change', handleAuthChange);
    return () => window.removeEventListener('pulsedepth_auth_change', handleAuthChange);
  }, [router]);

  const handleLogout = () => {
    playSonarPing(600, 0.3);
    api.auth.logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Animated Sonar Waves & Grids */}
      <div className="fixed inset-0 sonar-grid opacity-20 pointer-events-none z-0" />
      <div className="fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[130px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none z-0" />

      {/* ================================================== */}
      {/* SIDEBAR                                            */}
      {/* ================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-cyan-950/80 bg-[#061122]/95 backdrop-blur-xl z-30 select-none">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-cyan-950/80">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:border-cyan-400 transition-colors">
              <Radar className="h-5 w-5 animate-spin [animation-duration:12s] text-cyan-400" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                  PULSE<span className="text-cyan-400">DEPTH</span>
                </span>
                <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  S-44
                </span>
              </div>
              <span className="text-[9px] font-mono-code tracking-widest text-slate-400 uppercase">
                Sonar Monitoring
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items (6 requested sections) */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono-code font-bold uppercase tracking-widest text-slate-500">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-mono-code text-xs transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/60 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.15)] font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
              </Link>
            );
          })}
        </div>

        {/* Operator Profile & Logout at Bottom */}
        <div className="p-4 border-t border-cyan-950/80 bg-[#040c18]/90 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-mono-code font-bold text-white truncate">
                {currentUser ? currentUser.username : 'Operator'}
              </span>
              <span className="text-[10px] font-mono-code text-cyan-400/80 truncate">
                ID #{currentUser?.id ?? 1} • Authenticated
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-950/80 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:border-red-800 text-xs font-mono-code font-bold transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* ================================================== */}
      {/* MAIN VIEWPORT & TOPBAR                             */}
      {/* ================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        {/* Top Navigation HUD */}
        <header className="h-16 border-b border-cyan-950/80 bg-[#061122]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-cyan-900/60 bg-cyan-950/40 text-cyan-300"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-white">
                PULSE<span className="text-cyan-400">DEPTH</span>
              </span>
              <span className="hidden sm:inline-block text-slate-600">•</span>
              <span className="hidden sm:inline-block text-xs font-mono-code text-slate-400 uppercase">
                MISSION SECTOR 07
              </span>
            </div>
          </div>

          {/* System Online & Status Badges */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isDemo && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/60 animate-pulse">
                DEMO / MOCK DATA
              </span>
            )}

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-900/60 bg-emerald-950/40 text-emerald-400 text-[11px] font-mono-code font-bold uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYSTEM ONLINE</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono-code text-slate-400">
              <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-white font-bold">{currentUser?.username || 'dr_raman'}</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-900/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono-code transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PORTAL</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-b border-cyan-950 bg-[#061122]/95 backdrop-blur-xl p-4 space-y-2 z-30"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-mono-code text-xs ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-950 bg-red-950/20 text-red-400 text-xs font-mono-code font-bold mt-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>LOGOUT</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
