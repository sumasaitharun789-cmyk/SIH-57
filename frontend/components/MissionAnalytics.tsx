'use client';

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { BarChart3, TrendingUp, Filter, ShieldCheck, Activity, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  mockScanTimeSeries,
  mockCategoryDistribution,
  mockSurveySectors,
} from '../lib/mockData';
import { BackendDashboardSummary } from '../lib/api';
import { Detection } from '../lib/types';

interface MissionAnalyticsProps {
  summary?: BackendDashboardSummary | null;
  detections?: Detection[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  ghost_net: '#ef4444',
  'ghost net': '#ef4444',
  metal_object: '#06b6d4',
  'metal object': '#06b6d4',
  plastic_debris: '#a855f7',
  'plastic debris': '#a855f7',
  tire: '#f59e0b',
  'tire / rubber': '#f59e0b',
  rock: '#10b981',
  'rock / natural feature': '#10b981',
  munitions: '#f43f5e',
  unknown: '#64748b',
};

const PALETTE = ['#22d3ee', '#f59e0b', '#ef4444', '#10b981', '#a855f7', '#38bdf8', '#fb923c'];

export default function MissionAnalytics({
  summary,
  detections,
  onRefresh,
  isLoading,
}: MissionAnalyticsProps) {
  const [timeFilter, setTimeFilter] = useState<'MISSION' | 'DAILY' | 'SURVEY'>('MISSION');

  // Compute live category distribution from summary or fallback
  const categoryData = useMemo(() => {
    if (summary?.predictions && summary.predictions.length > 0) {
      const total = summary.predictions.reduce((acc, p) => acc + p.count, 0) || 1;
      return summary.predictions.map((p, idx) => {
        const predKey = p.prediction.toLowerCase();
        const color = CATEGORY_COLORS[predKey] || PALETTE[idx % PALETTE.length];
        const name = p.prediction.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        return {
          name,
          count: p.count,
          percentage: Math.round((p.count / total) * 100),
          color,
        };
      });
    }
    return mockCategoryDistribution;
  }, [summary]);

  // Radar chart data for evidence channel performance
  const radarData = [
    { subject: 'AI YOLOv8', A: 94, fullMark: 100 },
    { subject: 'Shadow Triangulation', A: 91, fullMark: 100 },
    { subject: 'Geometry Linearity', A: 87, fullMark: 100 },
    { subject: 'Acoustic Backscatter', A: 89, fullMark: 100 },
    { subject: 'Slant Correction', A: 96, fullMark: 100 },
    { subject: 'SNR Ratio', A: 92, fullMark: 100 },
  ];

  return (
    <div className="flex flex-col space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              MISSION ANALYTICS & ACOUSTIC TELEMETRY
            </h2>
            {summary && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono-code px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/80 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SQLITE LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ping throughput, anomaly occurrence frequency, and multi-factor performance metrics.
          </p>
        </div>

        {/* Filter Tabs & Sync Button */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-800/60 bg-cyan-950/40 text-cyan-300 text-xs font-mono-code hover:border-cyan-500 transition-colors disabled:opacity-50"
              title="Refresh mission analytics from FastAPI backend"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>SYNC</span>
            </button>
          )}

          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/80 p-1 text-xs font-mono-code">
            {(['DAILY', 'MISSION', 'SURVEY'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  timeFilter === filter
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backend Live Metrics Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-code">
          <div className="rounded-lg border border-cyan-950/80 bg-[#0a1628]/80 p-3">
            <span className="text-[10px] text-slate-400 uppercase">DATABASE DETECTIONS</span>
            <div className="text-lg font-bold text-cyan-300 mt-1">{summary.total_detections}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{summary.completed_detections} completed • {summary.processing_detections} active</div>
          </div>

          <div className="rounded-lg border border-cyan-950/80 bg-[#0a1628]/80 p-3">
            <span className="text-[10px] text-slate-400 uppercase">HIGH RISK CONTACTS</span>
            <div className="text-lg font-bold text-red-400 mt-1">{summary.risk_distribution.high}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{summary.risk_distribution.medium} medium • {summary.risk_distribution.low} low</div>
          </div>

          <div className="rounded-lg border border-cyan-950/80 bg-[#0a1628]/80 p-3">
            <span className="text-[10px] text-slate-400 uppercase">ASSESSMENT REPORTS</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">{summary.total_reports}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">IHO S-44 Compliant</div>
          </div>

          <div className="rounded-lg border border-cyan-950/80 bg-[#0a1628]/80 p-3">
            <span className="text-[10px] text-slate-400 uppercase">SERVER ENGINE</span>
            <div className="text-lg font-bold text-slate-100 mt-1">FASTAPI + ML</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">REST API Connected</div>
          </div>
        </div>
      )}

      {/* Row 1: Acoustic Pings & Anomaly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pings Processed Over Time */}
        <div className="flex flex-col rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-mono-code font-bold text-cyan-300 uppercase">
                SONAR SCANS & ACOUSTIC PINGS PROCESSED
              </h3>
              <p className="text-[11px] text-slate-400">Total volume accumulated across Sector 07</p>
            </div>
            <span className="text-[11px] font-mono-code text-emerald-400 font-bold">
              +18 pings/sec
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockScanTimeSeries}>
                <defs>
                  <linearGradient id="colorPings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pingsProcessed"
                  name="Acoustic Pings"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Anomalies Detected vs. False Positives Filtered */}
        <div className="flex flex-col rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-mono-code font-bold text-cyan-300 uppercase">
                DETECTIONS VS. FALSE POSITIVES FILTERED
              </h3>
              <p className="text-[11px] text-slate-400">
                Demonstrating false-alarm rejection over time
              </p>
            </div>
            <span className="text-[11px] font-mono-code text-cyan-400 font-bold">
              91.4% Rejection Rate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockScanTimeSeries}>
                <XAxis
                  dataKey="time"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar
                  dataKey="anomalies"
                  name="Verified Anomalies"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="falsePositivesRejected"
                  name="Natural Seabed Filtered"
                  fill="#3b82f6"
                  opacity={0.4}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Category Breakdown & Radar Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut: Anomaly Category Distribution */}
        <div className="flex flex-col rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-5 backdrop-blur-md">
          <h3 className="text-xs font-mono-code font-bold text-cyan-300 uppercase border-b border-cyan-950/80 pb-3 mb-4">
            TARGET CLASSIFICATION RATIO
          </h3>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-code mt-2">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 truncate">{item.name}</span>
                <span className="text-slate-500 ml-auto">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar: Multi-Parameter Model Performance */}
        <div className="flex flex-col rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-5 backdrop-blur-md">
          <h3 className="text-xs font-mono-code font-bold text-cyan-300 uppercase border-b border-cyan-950/80 pb-3 mb-4">
            EVIDENCE CHANNEL ACCURACY
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <PolarRadiusAxis stroke="#334155" />
                <Radar
                  name="Accuracy Score"
                  dataKey="A"
                  stroke="#22d3ee"
                  fill="#06b6d4"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Bathymetric Coverage Progress */}
        <div className="flex flex-col rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-5 backdrop-blur-md">
          <h3 className="text-xs font-mono-code font-bold text-cyan-300 uppercase border-b border-cyan-950/80 pb-3 mb-4">
            SECTOR SURVEY COMPLETION
          </h3>

          <div className="space-y-3 overflow-y-auto max-h-60 pr-1 text-xs font-mono-code">
            {mockSurveySectors.map((sec) => (
              <div key={sec.sector} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">{sec.sector}</span>
                  <span className="text-cyan-400 font-bold">{sec.coverage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${sec.coverage}%` }}
                    className={`h-full rounded-full ${
                      sec.coverage === 100
                        ? 'bg-emerald-400'
                        : sec.coverage > 50
                        ? 'bg-cyan-400'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
