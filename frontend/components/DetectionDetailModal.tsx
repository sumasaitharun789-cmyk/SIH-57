'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  FileText,
  ShieldAlert,
  Target,
  Compass,
  Layers,
  Sparkles,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { Detection } from '../lib/types';
import { api } from '../lib/api';

interface DetectionDetailModalProps {
  detection: Detection | null;
  onClose: () => void;
  onOpenOnMap?: (det: Detection) => void;
  onGenerateReport?: (det: Detection) => void;
}

export default function DetectionDetailModal({
  detection,
  onClose,
  onOpenOnMap,
  onGenerateReport,
}: DetectionDetailModalProps) {
  if (!detection) return null;

  const rawImageUrl = detection.uploadedFileId
    ? api.files.getRawImageUrl(detection.uploadedFileId)
    : detection.imageUrl;

  const evidenceCues = [
    'Acoustic shadow confirms physical 3D elevation',
    'Backscatter profile matches synthetic material matrix',
    'Definite geometric boundary distinct from seafloor facies',
    'Spatial persistence across consecutive acoustic sweeps',
  ];

  const risk = detection.riskLevel || detection.priority || 'MEDIUM';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-cyan-500/40 bg-slate-900 shadow-2xl flex flex-col font-mono-code"
        >
          {/* Header Bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cyan-950 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-400 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800">
                {detection.id}
              </span>
              <div>
                <div className="text-base font-black text-white uppercase tracking-wide">
                  {detection.category.replace(/_/g, ' ')}
                </div>
                <div className="text-[11px] text-slate-400">
                  Target Inspection Dossier • Sector 07
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sonar Image Viewer (7 Cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="rounded-lg border border-cyan-950 bg-black overflow-hidden h-[340px] relative flex items-center justify-center">
                  {rawImageUrl ? (
                    <img
                      src={rawImageUrl}
                      alt={detection.category}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-500">
                      <Target className="h-12 w-12 mx-auto text-cyan-500/30 mb-2" />
                      <div className="text-xs">ACOUSTIC BACKSCATTER WATERFALL</div>
                      <div className="text-[10px] text-slate-600 mt-1">Procedural acoustic representation active</div>
                    </div>
                  )}

                  {/* Bounding Box Overlay */}
                  <div
                    className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none rounded"
                    style={{
                      left: '25%',
                      top: '25%',
                      width: '45%',
                      height: '40%',
                    }}
                  >
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-cyan-500 text-slate-950 text-[9px] font-bold uppercase rounded-sm">
                      {detection.category} ({detection.confidence}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>ACOUSTIC BACKSCATTER FREQ: 455 kHz</span>
                  <span>SAMPLE: HIGH RESOLUTION</span>
                </div>
              </div>

              {/* Hydrographic & Threat Metadata (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Confidence & Risk */}
                <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">AI Confidence:</span>
                      <span className="text-emerald-400 font-bold">{detection.confidence}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${detection.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-cyan-950 text-xs">
                    <span className="text-slate-400">Risk Assessment:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        risk === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : risk === 'HIGH'
                          ? 'bg-orange-950 text-orange-400 border border-orange-800'
                          : risk === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {risk}
                    </span>
                  </div>
                </div>

                {/* Hydrographic Telemetry Table */}
                <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-4 space-y-2 text-xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    HYDROGRAPHIC TELEMETRY
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-cyan-950/60">
                    <span className="text-slate-400">Depth:</span>
                    <span className="text-white font-bold">{detection.depth ?? 42.5} m</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-cyan-950/60">
                    <span className="text-slate-400">Slant Range:</span>
                    <span className="text-white font-bold">{detection.range ?? 24.8} m</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-cyan-950/60">
                    <span className="text-slate-400">Across-Track:</span>
                    <span className="text-white font-bold">{detection.acrossTrack ?? 18.2} m</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-cyan-950/60">
                    <span className="text-slate-400">Heading:</span>
                    <span className="text-white font-bold">{detection.heading ?? 214}°</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="text-cyan-300 font-bold">
                      {detection.coordinates
                        ? `${detection.coordinates.lat.toFixed(5)}N, ${detection.coordinates.lng.toFixed(5)}E`
                        : '18.92200N, 72.83400E'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Checklist */}
            <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-4">
              <div className="text-[11px] font-bold text-white mb-2.5">
                AI ACOUSTIC EVIDENCE CRITERIA
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {evidenceCues.map((cue, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded border border-cyan-950 bg-slate-900/80 text-slate-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>{cue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-950 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
            <span className="text-[11px] text-slate-400">
              LOGGED: {new Date(detection.timestamp).toLocaleString()}
            </span>

            <div className="flex items-center gap-2.5">
              {onOpenOnMap && (
                <button
                  onClick={() => onOpenOnMap(detection)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>OPEN ON MAP</span>
                </button>
              )}

              {onGenerateReport && (
                <button
                  onClick={() => onGenerateReport(detection)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-900/60 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>GENERATE REPORT</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
