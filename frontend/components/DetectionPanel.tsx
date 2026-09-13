'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ScanEye,
  AlertTriangle,
  Compass,
  Ruler,
  Maximize,
  CheckCircle,
  Clock,
  Shield,
  FileDown,
  Navigation2,
  Anchor,
} from 'lucide-react';
import { Detection } from '../lib/types';
import { playAlertChime } from '../lib/audioUtils';

interface DetectionPanelProps {
  detection: Detection | null;
  onOpenModal: () => void;
  onViewOnMap: () => void;
  onStatusChange?: (id: string, newStatus: 'VERIFIED' | 'REVIEW' | 'REJECTED') => void;
}

export default function DetectionPanel({
  detection,
  onOpenModal,
  onViewOnMap,
  onStatusChange,
}: DetectionPanelProps) {
  if (!detection) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl border border-cyan-950/70 bg-[#0a1628]/80 p-6 text-center backdrop-blur-md">
        <ScanEye className="h-12 w-12 text-slate-600 animate-pulse" />
        <h4 className="mt-3 text-sm font-bold text-slate-300">NO ANOMALY SELECTED</h4>
        <p className="mt-1 text-xs text-slate-500 max-w-xs">
          Click any target bounding box in the Sonar Waterfall or select a record from the Anomaly Database.
        </p>
      </div>
    );
  }

  const priorityStyles = {
    HIGH: 'bg-red-950/70 border-red-500/60 text-red-300 ring-1 ring-red-500/30',
    MEDIUM: 'bg-amber-950/70 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/30',
    LOW: 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30',
  }[detection.priority];

  const statusStyles = {
    VERIFIED: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300',
    REVIEW: 'bg-amber-950/60 border-amber-500/50 text-amber-300',
    REJECTED: 'bg-slate-800 border-slate-600 text-slate-400',
  }[detection.status];

  // Category probability simulation based on class
  const categories = [
    {
      name: 'Ghost Net',
      score: detection.category === 'Ghost Net' ? detection.confidence : 18,
    },
    {
      name: 'Metal Object',
      score: detection.category === 'Metal Object' ? detection.confidence : 24,
    },
    {
      name: 'Plastic Debris',
      score: detection.category === 'Plastic Debris' ? detection.confidence : 14,
    },
    {
      name: 'Rock / Natural',
      score: detection.category === 'Rock / Natural Feature' ? detection.confidence : 9,
    },
    {
      name: 'Unknown Object',
      score: 11,
    },
  ];

  return (
    <motion.div
      key={detection.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md space-y-5 shadow-xl"
    >
      {/* Target ID, Priority, and Status Badges */}
      <div className="flex items-start justify-between border-b border-cyan-950/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold font-mono-code text-cyan-300 tracking-wider">
              {detection.id}
            </span>
            <span
              className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded border uppercase ${priorityStyles}`}
            >
              {detection.priority} PRIORITY
            </span>
            <span
              className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded border uppercase ${statusStyles}`}
            >
              {detection.status}
            </span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-white tracking-tight">{detection.name}</h3>
        </div>

        <button
          onClick={onOpenModal}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
          title="Open deep inspection modal"
          aria-label="Open deep inspection modal"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>

      {/* AI Confidence & Fused Confidence Bars */}
      <div className="space-y-3 rounded-lg border border-cyan-900/40 bg-slate-950/60 p-4">
        <div>
          <div className="flex justify-between text-xs font-mono-code mb-1">
            <span className="text-slate-400">RAW AI CONFIDENCE:</span>
            <span className="font-bold text-cyan-300">{detection.confidence}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${detection.confidence}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono-code mb-1">
            <span className="text-slate-400">MULTI-FACTOR FUSED CONFIDENCE:</span>
            <span className="font-bold text-emerald-400">{detection.fusedConfidence}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${detection.fusedConfidence}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"
            />
          </div>
        </div>
      </div>

      {/* Spatial Telemetry Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono-code">
        <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">ESTIMATED DEPTH</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">{detection.depth.toFixed(1)} m</div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">SLANT RANGE</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">{detection.range.toFixed(1)} m</div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">SWATH CHANNEL</div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">{detection.track} Channel</div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">ESTIMATED RELIEF</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">
            {detection.dimensions.heightEstimate.toFixed(1)} m off bed
          </div>
        </div>
      </div>

      {/* Classification Probability Breakdown */}
      <div className="space-y-2">
        <div className="text-xs font-mono-code font-bold text-slate-300">
          CLASSIFICATION PROBABILITY
        </div>
        <div className="space-y-1.5 text-xs">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2">
              <span className="w-32 truncate text-slate-400 font-mono-code text-[11px]">
                {cat.name}
              </span>
              <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${cat.score}%` }}
                  className={`h-full rounded-full ${
                    cat.score > 70 ? 'bg-cyan-400' : 'bg-slate-500'
                  }`}
                />
              </div>
              <span className="w-8 text-right font-mono-code text-[11px] text-slate-300">
                {cat.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Coordinates & Action CTAs */}
      <div className="pt-2 border-t border-cyan-950/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
          <span className="flex items-center gap-1">
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
            {detection.coordinates.lat.toFixed(4)}° N, {detection.coordinates.lng.toFixed(4)}° E
          </span>
          <span>{detection.timestamp.split(' ')[1]}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onViewOnMap}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-cyan-600/50 bg-cyan-950/40 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 transition-colors"
          >
            <Navigation2 className="h-3.5 w-3.5" />
            <span>LOCATE ON MAP</span>
          </button>

          {onStatusChange && (
            <button
              onClick={() => {
                onStatusChange(detection.id, 'VERIFIED');
                playAlertChime();
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 transition-colors"
              title="Confirm verified anomaly"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>VERIFY</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
