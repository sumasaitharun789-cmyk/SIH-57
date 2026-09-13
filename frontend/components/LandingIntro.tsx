'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Waves,
  Radar,
  ShieldCheck,
  ArrowRight,
  Compass,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { playSonarPing } from '../lib/audioUtils';

interface LandingIntroProps {
  onEnterDashboard: () => void;
}

export default function LandingIntro({ onEnterDashboard }: LandingIntroProps) {
  const handleEnter = () => {
    playSonarPing(980, 0.6);
    onEnterDashboard();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] overflow-hidden">
      {/* Background Animated Sonar Waves & Grids */}
      <div className="absolute inset-0 sonar-grid opacity-30 pointer-events-none" />

      {/* Atmospheric Radial Glow */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Radar Concentric Rings */}
      <div className="absolute flex items-center justify-center pointer-events-none">
        <div className="h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full border border-cyan-500/10 animate-ping [animation-duration:6s]" />
        <div className="absolute h-[200px] w-[200px] sm:h-[350px] sm:w-[350px] rounded-full border border-cyan-500/15" />
        <div className="absolute h-[100px] w-[100px] sm:h-[200px] sm:w-[200px] rounded-full border border-cyan-500/20" />
      </div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 max-w-2xl px-6 py-12 text-center"
      >
        {/* System Category Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 text-cyan-300 text-xs font-mono-code font-bold uppercase tracking-wider mb-6 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>ADVANCED ACOUSTIC DEFENSE & DEBRIS SURVEILLANCE PLATFORM</span>
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
          PULSE<span className="text-cyan-400">DEPTH</span>
        </h1>

        {/* Subtitle Tagline */}
        <p className="mt-3 text-sm sm:text-base font-mono-code tracking-[0.25em] text-cyan-300 uppercase">
          &ldquo;INTELLIGENCE BENEATH THE SURFACE&rdquo;
        </p>

        {/* Problem Statement Headline */}
        <p className="mt-6 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
          AI-Powered Automated Underwater Marine Debris and Anomaly Detection System using
          Side-Scan Sonar Imagery, Acoustic Shadow Triangulation & Bayesian Evidence Fusion.
        </p>

        {/* 3 Value Pillars */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold font-mono-code">
              <Radar className="h-4 w-4 text-cyan-400" />
              <span>Side-Scan Acoustic Swath</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              455/900 kHz dual-frequency high-gain waterfall feed
            </p>
          </div>

          <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold font-mono-code">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Evidence Fusion</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              91.4% false-positive rejection against natural seabed
            </p>
          </div>

          <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold font-mono-code">
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>Geo Intelligence</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Real-time RTK GPS swath bathymetric projection
            </p>
          </div>
        </div>

        {/* Enter Mission Control CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleEnter}
            className="group flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-8 py-3.5 text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95 transition-all"
          >
            <span>ENTER MISSION CONTROL</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="mt-8 text-[11px] font-mono-code text-slate-500">
          OPERATIONAL PLATFORM • RV OCEAN EXPLORER • SECTOR 07 ACTIVE
        </div>
      </motion.div>
    </div>
  );
}
