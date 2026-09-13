'use client';

import React, { useState, useEffect, useId } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Info,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Eye,
  Box,
  Radio,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Detection } from '../lib/types';
import { calculateFusedConfidence } from '../lib/sonarService';

interface EvidenceFusionProps {
  selectedDetection: Detection | null;
}

export default function EvidenceFusion({ selectedDetection }: EvidenceFusionProps) {
  // Interactive what-if simulation sliders
  const [aiScore, setAiScore] = useState<number>(
    selectedDetection ? selectedDetection.evidence.aiDetector : 94
  );
  const [shadowScore, setShadowScore] = useState<number>(
    selectedDetection ? selectedDetection.evidence.shadowAnalysis : 91
  );
  const [geometryScore, setGeometryScore] = useState<number>(
    selectedDetection ? selectedDetection.evidence.geometryConsistency : 87
  );
  const [acousticScore, setAcousticScore] = useState<number>(
    selectedDetection ? selectedDetection.evidence.acousticSignature : 89
  );

  const aiSliderId = useId();
  const shadowSliderId = useId();
  const geometrySliderId = useId();
  const acousticSliderId = useId();

  // Sync with selected detection when changed
  useEffect(() => {
    if (selectedDetection) {
      setAiScore(selectedDetection.evidence.aiDetector);
      setShadowScore(selectedDetection.evidence.shadowAnalysis);
      setGeometryScore(selectedDetection.evidence.geometryConsistency);
      setAcousticScore(selectedDetection.evidence.acousticSignature);
    }
  }, [selectedDetection]);

  // Real-time calculation of fused score using Bayesian calculation
  const { fused, isVerified } = calculateFusedConfidence(
    aiScore,
    shadowScore,
    geometryScore,
    acousticScore
  );

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-[#0a1628]/90 to-[#071324]/90 p-6 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              INNOVATION HIGHLIGHT • BAYESIAN MULTI-FACTOR ENGINE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-cyan-400" />
            EVIDENCE FUSION & FALSE-POSITIVE ELIMINATION
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Side-Scan Sonar is notoriously prone to false detections from sand ripples, kelp beds, and
            basalt ridges. PULSEDEPTH fuses four distinct acoustic feature vectors so only verified
            threats trigger remediation.
          </p>
        </div>

        {/* Selected target indicator */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-cyan-900/60 bg-slate-950/60 shrink-0 text-xs font-mono-code">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">ACTIVE TARGET VECTOR:</span>
            <span className="text-sm font-bold text-cyan-300">
              {selectedDetection ? selectedDetection.id : 'DET-042 (Possible Ghost Net)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Fusion Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: The 4 Evidence Pillars (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">4-CHANNEL EVIDENCE METRICS</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-mono-code text-slate-400">
                Drag sliders for what-if scenarios
              </span>
              <button
                onClick={() => {
                  if (selectedDetection) {
                    setAiScore(selectedDetection.evidence.aiDetector);
                    setShadowScore(selectedDetection.evidence.shadowAnalysis);
                    setGeometryScore(selectedDetection.evidence.geometryConsistency);
                    setAcousticScore(selectedDetection.evidence.acousticSignature);
                  } else {
                    setAiScore(94);
                    setShadowScore(91);
                    setGeometryScore(87);
                    setAcousticScore(89);
                  }
                }}
                className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-slate-900 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-950 hover:border-cyan-400 transition-colors"
                title="Reset sliders to detected baseline"
              >
                Reset Baseline
              </button>
            </div>
          </div>

          {/* Factor 1: AI Detector */}
          <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <BrainCircuit className="h-4 w-4 text-cyan-400" />
                <label htmlFor={aiSliderId} className="cursor-pointer">
                  01. AI OBJECT DETECTOR (YOLOv8)
                </label>
              </div>
              <span className="font-mono-code font-bold text-sm text-cyan-300">{aiScore}%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Trained deep convolutional network classifying raw side-scan backscatter intensity patches.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <input
                id={aiSliderId}
                type="range"
                min="10"
                max="100"
                value={aiScore}
                onChange={(e) => setAiScore(parseInt(e.target.value))}
                className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                aria-label="AI Object Detector Score"
              />
            </div>
          </div>

          {/* Factor 2: Acoustic Shadow Analysis */}
          <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Eye className="h-4 w-4 text-cyan-400" />
                <label htmlFor={shadowSliderId} className="cursor-pointer">
                  02. ACOUSTIC SHADOW ANALYSIS
                </label>
              </div>
              <span className="font-mono-code font-bold text-sm text-cyan-300">
                {shadowScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Triangulates shadow length with towfish altitude: $H_o = (H_t \times L_s) / (R_s + L_s)$.
              Confirms vertical elevation off the seabed.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <input
                id={shadowSliderId}
                type="range"
                min="10"
                max="100"
                value={shadowScore}
                onChange={(e) => setShadowScore(parseInt(e.target.value))}
                className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                aria-label="Acoustic Shadow Analysis Score"
              />
            </div>
          </div>

          {/* Factor 3: Geometry Consistency */}
          <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Box className="h-4 w-4 text-cyan-400" />
                <label htmlFor={geometrySliderId} className="cursor-pointer">
                  03. GEOMETRY & SKELETON CONSISTENCY
                </label>
              </div>
              <span className="font-mono-code font-bold text-sm text-cyan-300">
                {geometryScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Morphological edge perimeter and linearity ratio. Artificial debris exhibits sharp edges and regular patterns.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <input
                id={geometrySliderId}
                type="range"
                min="10"
                max="100"
                value={geometryScore}
                onChange={(e) => setGeometryScore(parseInt(e.target.value))}
                className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                aria-label="Geometry Consistency Score"
              />
            </div>
          </div>

          {/* Factor 4: Acoustic Signature */}
          <div className="rounded-lg border border-cyan-900/40 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Radio className="h-4 w-4 text-cyan-400" />
                <label htmlFor={acousticSliderId} className="cursor-pointer">
                  04. ACOUSTIC BACKSCATTER SIGNATURE
                </label>
              </div>
              <span className="font-mono-code font-bold text-sm text-cyan-300">
                {acousticScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Evaluates specular reflectance vs. diffuse seabed absorption (synthetic nylon vs. limestone vs. silt).
            </p>
            <div className="flex items-center gap-3 pt-1">
              <input
                id={acousticSliderId}
                type="range"
                min="10"
                max="100"
                value={acousticScore}
                onChange={(e) => setAcousticScore(parseInt(e.target.value))}
                className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                aria-label="Acoustic Backscatter Signature Score"
              />
            </div>
          </div>
        </div>

        {/* Right: The Fused Bayesian Outcome (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-5 backdrop-blur-md space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-cyan-950/80 pb-3">
              <span className="text-xs font-mono-code font-bold text-slate-400 uppercase tracking-wider">
                BAYESIAN BELIEF OUTCOME
              </span>
              <span className="text-[10px] font-mono-code text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                DYNAMIC FUSION
              </span>
            </div>

            {/* Circular Gauge / Giant Score */}
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <motion.div
                key={fused}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative flex items-center justify-center h-44 w-44 rounded-full border-4 border-slate-800 bg-slate-950/80 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
              >
                {/* Colored ring indicator */}
                <div
                  style={{
                    borderColor: isVerified ? '#10b981' : '#f59e0b',
                  }}
                  className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent animate-spin [animation-duration:8s]"
                />

                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black font-mono-code text-white tracking-tight">
                    {fused}%
                  </span>
                  <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest mt-1">
                    FUSED CONFIDENCE
                  </span>
                </div>
              </motion.div>

              {/* Status Outcome Banner */}
              <div className="mt-5">
                {isVerified ? (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-mono-code font-bold tracking-wider">
                      VERIFIED ANOMALY (TARGET CONFIRMED)
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <XCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-mono-code font-bold tracking-wider">
                      FALSE POSITIVE REJECTED (LOW CONFIDENCE)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mathematical Visual Equation */}
          <div className="rounded-lg border border-cyan-950/90 bg-slate-950/70 p-4 space-y-2 text-xs">
            <div className="font-mono-code text-[11px] text-cyan-300 font-bold uppercase">
              FUSION FORMULATION:
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-slate-300 font-mono-code text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">AI (35%)</span>
              <span>+</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Shadow (25%)</span>
              <span>+</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Geometry (20%)</span>
              <span>+</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Acoustic (20%)</span>
              <span>=</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                Fused Score
              </span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
              Multi-factor verification eliminates acoustic false alarms caused by sand ripples,
              natural outcrops, and kelp forests without requiring human intervention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
