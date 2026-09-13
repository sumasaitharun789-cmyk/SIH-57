'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  AlertTriangle,
  Flame,
  PieChart,
  ShieldAlert,
  ArrowUpRight,
  UploadCloud,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import StatCard from './StatCard';
import { MissionStats, TelemetryData } from '../lib/types';

interface MissionOverviewProps {
  stats: MissionStats;
  telemetry: TelemetryData;
  onNavigate: (
    section: 'sonar' | 'detection' | 'fusion' | 'database' | 'geo' | 'upload'
  ) => void;
}

export default function MissionOverview({
  stats,
  telemetry,
  onNavigate,
}: MissionOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-[#0a1628]/95 via-[#0c1c33]/90 to-[#071324]/95 p-6 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              AUTONOMOUS ACOUSTIC INTELLIGENCE PLATFORM
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono-code text-slate-400">
              Coromandel Coastal Hydrographic Survey
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            MISSION OVERVIEW
          </h1>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Automated underwater marine debris and anomaly detection using Side-Scan Sonar
            intelligence, multi-modal acoustic shadow triangulation, and Bayesian evidence fusion to
            drastically eliminate false seabed detections.
          </p>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('sonar')}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all active:scale-95"
          >
            <Radar className="h-4 w-4" />
            <span>OPEN LIVE SONAR</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onNavigate('fusion')}
            className="flex items-center gap-2 rounded-lg border border-cyan-600/50 bg-cyan-950/40 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 transition-all active:scale-95"
          >
            <ShieldAlert className="h-4 w-4 text-cyan-400" />
            <span>EVIDENCE FUSION</span>
          </button>

          <button
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-all active:scale-95"
          >
            <UploadCloud className="h-4 w-4 text-slate-400" />
            <span>UPLOAD SONAR</span>
          </button>
        </div>
      </div>

      {/* 4 Major Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="SONAR SCANS"
          value={stats.sonarScans}
          icon={Radar}
          trend={{ value: '+14 pings/min', isPositive: true }}
          accentColor="cyan"
          subLabel="Towfish Swath Active"
          delay={0.05}
        />

        <StatCard
          label="ANOMALIES DETECTED"
          value={stats.anomaliesDetected}
          icon={AlertTriangle}
          trend={{ value: '+3 in Sector 07', isPositive: false }}
          accentColor="amber"
          subLabel="Total Target Contacts"
          delay={0.1}
        />

        <StatCard
          label="HIGH PRIORITY"
          value={stats.highPriorityCount}
          prefix="0"
          icon={Flame}
          trend={{ value: 'Ghost Nets & Ordnance', isPositive: false }}
          accentColor="red"
          subLabel="Requires Immediate Tagging"
          delay={0.15}
        />

        <StatCard
          label="SURVEY COVERAGE"
          value={stats.surveyCoveragePct}
          suffix="%"
          icon={PieChart}
          trend={{ value: '4.2 km² mapped', isPositive: true }}
          accentColor="emerald"
          subLabel="Sector 07 Grid"
          delay={0.2}
        />
      </div>

      {/* Technical Innovation Synopsis Card */}
      <div className="rounded-xl border border-cyan-900/40 bg-[#0a1628]/60 p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-700/50 text-cyan-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Core Innovation: Multi-Factor False Positive Reduction
              </h3>
              <p className="text-xs text-slate-400">
                Overcoming raw computer vision limitations on side-scan acoustic speckle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-code">
            <div className="px-3 py-1 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">FALSE POSITIVE REJECTION: </span>
              <span className="font-bold text-emerald-400">{stats.falsePositiveRejectionPct}%</span>
            </div>
            <div className="px-3 py-1 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">TOTAL ACOUSTIC PINGS: </span>
              <span className="font-bold text-cyan-300">{stats.totalPingsProcessed.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 4 Architecture Pillars Visual flow */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-cyan-950/80 bg-slate-950/50 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono-code font-bold text-cyan-400">01. YOLOv8 DETECTOR</span>
              <span className="text-[10px] font-mono-code text-slate-400">WEIGHT: 35%</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Detects acoustic backscatter anomalies in side-scan waterfall imagery using trained marine debris weights.
            </p>
          </div>

          <div className="rounded-lg border border-cyan-950/80 bg-slate-950/50 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono-code font-bold text-cyan-400">02. SHADOW GEOMETRY</span>
              <span className="text-[10px] font-mono-code text-slate-400">WEIGHT: 25%</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Triangulates acoustic shadow length with towfish altitude to compute true 3D object relief off the seabed.
            </p>
          </div>

          <div className="rounded-lg border border-cyan-950/80 bg-slate-950/50 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono-code font-bold text-cyan-400">03. STRUCTURAL SYMMETRY</span>
              <span className="text-[10px] font-mono-code text-slate-400">WEIGHT: 20%</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Evaluates morphological edge linearity and fractal dimensions to differentiate man-made items from natural rock reefs.
            </p>
          </div>

          <div className="rounded-lg border border-cyan-950/80 bg-slate-950/50 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono-code font-bold text-emerald-400">04. EVIDENCE FUSION</span>
              <span className="text-[10px] font-mono-code text-emerald-400">BAYESIAN FUSION</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Fuses all 4 channels mathematically. Only anomalies passing the multi-factor threshold trigger operational alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
