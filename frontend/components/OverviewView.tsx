'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Compass,
  Radar,
  MapPin,
  Database,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Target,
  BarChart3,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Detection } from '../lib/types';
import { BackendDashboardSummary } from '../lib/api';

interface OverviewViewProps {
  summary: BackendDashboardSummary | null;
  detections: Detection[];
  onSelectDetection: (det: Detection) => void;
  onNavigate: (section: 'analysis' | 'map' | 'detections') => void;
}

export default function OverviewView({
  summary,
  detections,
  onSelectDetection,
  onNavigate,
}: OverviewViewProps) {
  // Derive metrics from summary or detections
  const totalCount = summary?.total_detections ?? detections.length;
  const ghostNets = detections.filter((d) => d.category.toLowerCase().includes('net')).length;
  const shipwrecks = detections.filter((d) => d.category.toLowerCase().includes('ship') || d.category.toLowerCase().includes('wreck')).length;
  
  const confidences = detections.map((d) => d.confidence);
  const avgConfidence = confidences.length > 0
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 94;

  const recentDetections = detections.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Page Title & Mission Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-[10px] font-mono-code font-bold uppercase tracking-wider mb-2">
            <Compass className="h-3 w-3 text-cyan-400" />
            <span>MISSION CONTROL • SECTOR 07</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono-code text-white tracking-tight">
            OVERVIEW
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time acoustic surveillance, automated marine debris cataloging & tactical mission stats
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/analysis"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 text-xs font-mono-code font-black hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(34,211,238,0.3)] cursor-pointer"
          >
            <Radar className="h-4 w-4" />
            <span>NEW SONAR ANALYSIS</span>
          </Link>
          <Link
            href="/map"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cyan-800/80 bg-[#061426] hover:bg-cyan-950 text-cyan-300 text-xs font-mono-code font-bold transition-colors"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>VIEW DETECTION MAP</span>
          </Link>
          <Link
            href="/detections"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-[#040e1c] hover:bg-slate-900 text-slate-300 text-xs font-mono-code font-bold transition-colors"
          >
            <Database className="h-3.5 w-3.5" />
            <span>VIEW ALL DETECTIONS</span>
          </Link>
        </div>
      </div>

      {/* 4 Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL DETECTIONS */}
        <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/90 p-5 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400">
              TOTAL DETECTIONS
            </span>
            <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono-code text-white">
            {totalCount}
          </div>
          <p className="mt-2 text-[10px] font-mono-code text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">● Active Database</span>
            <span>from FastAPI SQLite</span>
          </p>
        </div>

        {/* GHOST NETS */}
        <div className="rounded-2xl border border-red-950/80 bg-[#0a101d]/90 p-5 backdrop-blur-md relative overflow-hidden group hover:border-red-800/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400">
              GHOST NETS
            </span>
            <div className="p-2 rounded-lg border border-red-500/20 bg-red-950/60 text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono-code text-red-400">
            {ghostNets}
          </div>
          <p className="mt-2 text-[10px] font-mono-code text-slate-500">
            High-hazard navigational & ecological entanglement
          </p>
        </div>

        {/* SHIPWRECKS */}
        <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/90 p-5 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400">
              SHIPWRECKS
            </span>
            <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-300">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono-code text-white">
            {shipwrecks}
          </div>
          <p className="mt-2 text-[10px] font-mono-code text-slate-500">
            Submerged hulls, debris fields & structures
          </p>
        </div>

        {/* AVERAGE CONFIDENCE */}
        <div className="rounded-2xl border border-cyan-900/60 bg-[#061224]/90 p-5 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-400">
              AVERAGE CONFIDENCE
            </span>
            <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-950/60 text-cyan-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono-code text-cyan-400">
            {avgConfidence}%
          </div>
          <p className="mt-2 text-[10px] font-mono-code text-slate-500">
            Acoustic & shadow triangulation agreement
          </p>
        </div>
      </div>

      {/* Recent Detections Section */}
      <div className="rounded-2xl border border-cyan-950/80 bg-[#061122]/90 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-cyan-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono-code text-white uppercase tracking-wider">
              RECENT DETECTIONS
            </h2>
          </div>
          <Link
            href="/detections"
            className="text-xs font-mono-code text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>FULL DATABASE</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Detections Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-code text-xs">
            <thead>
              <tr className="border-b border-cyan-950/80 bg-[#040e1c] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">OBJECT</th>
                <th className="py-3 px-4">CONFIDENCE</th>
                <th className="py-3 px-4">LATITUDE</th>
                <th className="py-3 px-4">LONGITUDE</th>
                <th className="py-3 px-4">RISK</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">TIME</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/50">
              {recentDetections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono-code">
                    NO DETECTIONS IN DATABASE • START A NEW SONAR ANALYSIS TO LOG CONTACTS
                  </td>
                </tr>
              ) : (
                recentDetections.map((d) => {
                  const isHigh = d.priority === 'HIGH';
                  const isMed = d.priority === 'MEDIUM';
                  return (
                    <tr
                      key={d.id}
                      onClick={() => onSelectDetection(d)}
                      className="hover:bg-cyan-950/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {d.category}
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-bold">
                        {d.confidence}%
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {d.coordinates.lat.toFixed(5)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {d.coordinates.lng.toFixed(5)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHigh
                              ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                              : isMed
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                          }`}
                        >
                          {d.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-400">
                        {d.timestamp.includes('GMT') || d.timestamp.includes('UTC')
                          ? d.timestamp.split(' ').slice(0, 4).join(' ')
                          : d.timestamp}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDetection(d);
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900 text-[10px] font-bold transition-colors"
                        >
                          VIEW
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
