'use client';

import React, { useState } from 'react';
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
import { BarChart3, TrendingUp, Filter, ShieldCheck, Activity } from 'lucide-react';
import {
  mockScanTimeSeries,
  mockCategoryDistribution,
  mockSurveySectors,
} from '../lib/mockData';

export default function MissionAnalytics() {
  const [timeFilter, setTimeFilter] = useState<'MISSION' | 'DAILY' | 'SURVEY'>('MISSION');

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
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ping throughput, anomaly occurrence frequency, and multi-factor performance metrics.
          </p>
        </div>

        {/* Filter Tabs */}
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
                  data={mockCategoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {mockCategoryDistribution.map((entry, index) => (
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
            {mockCategoryDistribution.map((item) => (
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
