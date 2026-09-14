'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Ruler,
  Layers,
  MapPin,
  CheckCircle,
  FileDown,
  Shield,
  Clock,
  Sparkles,
  Radio,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Detection } from '../lib/types';
import { api, BackendDetectionResponse } from '../lib/api';

interface DetectionModalProps {
  detection: Detection | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOnMap: () => void;
}

export default function DetectionModal({
  detection,
  isOpen,
  onClose,
  onViewOnMap,
}: DetectionModalProps) {
  const [serverDetail, setServerDetail] = useState<BackendDetectionResponse | null>(null);
  const [isLoadingServerDetail, setIsLoadingServerDetail] = useState(false);

  useEffect(() => {
    if (isOpen && detection) {
      const numId = parseInt(detection.id.replace(/\D/g, ''), 10);
      if (!isNaN(numId) && numId > 0 && api.auth.isAuthenticated()) {
        setIsLoadingServerDetail(true);
        api.detections
          .get(numId)
          .then((data) => setServerDetail(data))
          .catch(() => setServerDetail(null))
          .finally(() => setIsLoadingServerDetail(false));
      } else {
        setServerDetail(null);
      }
    } else {
      setServerDetail(null);
    }
  }, [isOpen, detection]);

  if (!isOpen || !detection) return null;

  const priorityStyles = {
    HIGH: 'bg-red-950 border-red-500 text-red-300',
    MEDIUM: 'bg-amber-950 border-amber-500 text-amber-300',
    LOW: 'bg-cyan-950 border-cyan-500 text-cyan-300',
  }[detection.priority];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-900/80 bg-[#0a1628] shadow-2xl"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-cyan-950/80 bg-[#060e1e] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-base font-extrabold font-mono-code text-cyan-300">
                {detection.id}
              </span>
              <span
                className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded border uppercase ${priorityStyles}`}
              >
                {detection.priority} PRIORITY
              </span>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300">
                {detection.status}
              </span>
              {isLoadingServerDetail && (
                <span className="flex items-center gap-1 text-[10px] font-mono-code text-cyan-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Syncing...</span>
                </span>
              )}
              {serverDetail && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                  <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                  FASTAPI RECORD #{serverDetail.id}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{detection.name}</h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {detection.description}
              </p>
            </div>

            {/* Fused Metric Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-code">
              <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase">FUSED CONFIDENCE</span>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {detection.fusedConfidence}%
                </div>
              </div>

              <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase">TARGET DEPTH</span>
                <div className="text-lg font-bold text-slate-100 mt-1">
                  {detection.depth.toFixed(1)} m
                </div>
              </div>

              <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase">SLANT RANGE</span>
                <div className="text-lg font-bold text-slate-100 mt-1">
                  {detection.range.toFixed(1)} m
                </div>
              </div>

              <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-3">
                <span className="text-[10px] text-slate-400 uppercase">CHANNEL TRACK</span>
                <div className="text-lg font-bold text-cyan-300 mt-1">{detection.track}</div>
              </div>
            </div>

            {/* 4 Pillars Evidence Breakdown */}
            <div className="rounded-xl border border-cyan-950/90 bg-slate-950/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono-code font-bold text-cyan-400 uppercase">
                <Layers className="h-4 w-4" />
                <span>MULTI-FACTOR EVIDENCE VERIFICATION BREAKDOWN</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono-code">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>AI Detector (YOLOv8):</span>
                    <strong className="text-cyan-300">{detection.evidence.aiDetector}%</strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${detection.evidence.aiDetector}%` }}
                      className="h-full rounded-full bg-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Shadow Geometry:</span>
                    <strong className="text-cyan-300">{detection.evidence.shadowAnalysis}%</strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${detection.evidence.shadowAnalysis}%` }}
                      className="h-full rounded-full bg-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Geometry Consistency:</span>
                    <strong className="text-cyan-300">
                      {detection.evidence.geometryConsistency}%
                    </strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${detection.evidence.geometryConsistency}%` }}
                      className="h-full rounded-full bg-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Acoustic Signature:</span>
                    <strong className="text-cyan-300">
                      {detection.evidence.acousticSignature}%
                    </strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${detection.evidence.acousticSignature}%` }}
                      className="h-full rounded-full bg-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800/80">
                &ldquo;{serverDetail?.risk_reason || detection.evidence.notes}&rdquo;
              </p>
            </div>

            {/* Server ML Detections if available */}
            {serverDetail?.detections && serverDetail.detections.length > 0 && (
              <div className="rounded-xl border border-cyan-950/90 bg-slate-950/70 p-4 space-y-2 font-mono-code text-xs">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">SERVER ML MODEL DETECTIONS</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {serverDetail.detections.map((d, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-[11px]">
                      {d.label}: {Math.round(Number(d.confidence) * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensions and Recommendation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1 font-mono-code">
                <span className="text-[10px] text-slate-400 uppercase">ACOUSTIC DIMENSIONS</span>
                <div className="text-slate-200">
                  Length: <strong>{detection.dimensions.length}m</strong> • Width:{' '}
                  <strong>{detection.dimensions.width}m</strong>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Estimated Relief Height: <strong>{detection.dimensions.heightEstimate}m</strong>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="text-[10px] font-mono-code text-slate-400 uppercase">
                  OPERATIONAL RECOMMENDATION
                </span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {detection.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer CTAs */}
          <div className="flex items-center justify-between border-t border-cyan-950/80 bg-[#060e1e] px-6 py-4">
            <span className="text-xs font-mono-code text-slate-400">
              Coordinates: {((serverDetail?.latitude ?? detection.coordinates.lat)).toFixed(4)}°N, {((serverDetail?.longitude ?? detection.coordinates.lng)).toFixed(4)}°E
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => {
                  onViewOnMap();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>VIEW ON MAP</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
