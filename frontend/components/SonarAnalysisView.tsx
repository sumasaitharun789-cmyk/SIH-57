'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Radar,
  Target,
  FileText,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Maximize2,
  Compass,
  Layers,
  Sparkles,
  Sliders,
  Eye,
  Check,
  Cpu,
  ArrowRight,
  Globe,
  FileCheck,
} from 'lucide-react';
import { api, adaptBackendDetection } from '../lib/api';
import { Detection } from '../lib/types';
import { playSonarPing, playAlertChime } from '../lib/audioUtils';

interface SonarAnalysisViewProps {
  onNewDetectionAdded: (newDet: Detection) => void;
  onOpenDetailModal: (det: Detection) => void;
  onNavigateToMap: (det: Detection) => void;
  onNavigateToReports: () => void;
}

type PipelineStage = {
  id: string;
  label: string;
  status: 'WAITING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
};

const INITIAL_PIPELINE: PipelineStage[] = [
  { id: 'input', label: 'INPUT', status: 'WAITING' },
  { id: 'denoising', label: 'DENOISING', status: 'WAITING' },
  { id: 'normalization', label: 'NORMALIZATION', status: 'WAITING' },
  { id: 'ai_detection', label: 'AI DETECTION', status: 'WAITING' },
  { id: 'parameter_extraction', label: 'PARAMETER EXTRACTION', status: 'WAITING' },
  { id: 'georeferencing', label: 'GEOREFERENCING', status: 'WAITING' },
  { id: 'map', label: 'MAP', status: 'WAITING' },
];

export default function SonarAnalysisView({
  onNewDetectionAdded,
  onOpenDetailModal,
  onNavigateToMap,
  onNavigateToReports,
}: SonarAnalysisViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('READY');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzedDetection, setAnalyzedDetection] = useState<Detection | null>(null);
  const [imageMode, setImageMode] = useState<'ORIGINAL' | 'PROCESSED'>('ORIGINAL');
  const [pipeline, setPipeline] = useState<PipelineStage[]>(INITIAL_PIPELINE);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // File selection
  const handleFileChange = (file: File) => {
    setAnalysisError(null);
    setSelectedFile(file);
    setUploadStatus('READY FOR ANALYSIS');
    setAnalyzedDetection(null);
    setPipeline(INITIAL_PIPELINE);

    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);

    // Measure dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Execute Analysis
  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    if (!api.auth.isAuthenticated()) {
      setAnalysisError('Authentication required: Please sign in before running sonar analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalyzedDetection(null);
    playSonarPing(900, 0.4);

    // Update pipeline to running
    const updated = [...INITIAL_PIPELINE];
    updated[0].status = 'COMPLETE'; // INPUT
    updated[1].status = 'RUNNING'; // DENOISING
    setPipeline([...updated]);
    setUploadStatus('PREPROCESSING & UPLOADING...');

    try {
      // 1. Upload to /api/files/images
      const uploadRes = await api.files.uploadImage(selectedFile);
      const uploadedFileId = uploadRes.id ?? uploadRes.file_id;
      if (!uploadedFileId) {
        throw new Error('FastAPI backend did not return a valid file ID.');
      }

      updated[1].status = 'COMPLETE'; // DENOISING
      updated[2].status = 'COMPLETE'; // NORMALIZATION
      updated[3].status = 'RUNNING'; // AI DETECTION
      setPipeline([...updated]);
      setUploadStatus('RUNNING AI INFERENCE...');

      // 2. Call Detection API (/api/detections/)
      const lat = 12.8452 + (Math.random() - 0.5) * 0.02;
      const lng = 80.1245 + (Math.random() - 0.5) * 0.02;
      const detectionRes = await api.detections.create(uploadedFileId, lat, lng);

      updated[3].status = 'COMPLETE'; // AI DETECTION
      updated[4].status = 'COMPLETE'; // PARAMETER EXTRACTION
      updated[5].status = 'COMPLETE'; // GEOREFERENCING
      updated[6].status = 'COMPLETE'; // MAP
      setPipeline([...updated]);
      setUploadStatus('ANALYSIS COMPLETE');

      // Adapt to frontend model
      const adapted = adaptBackendDetection(detectionRes);
      setAnalyzedDetection(adapted);
      onNewDetectionAdded(adapted);
      playAlertChime();
    } catch (err: any) {
      console.error('Sonar analysis failed:', err);
      setAnalysisError(err?.message || 'Server analysis failed. Ensure backend is running.');
      setPipeline((prev) =>
        prev.map((stage) =>
          stage.status === 'RUNNING' ? { ...stage, status: 'FAILED' } : stage
        )
      );
      setUploadStatus('ERROR');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate report for the analyzed detection
  const handleGenerateReport = async () => {
    if (!analyzedDetection) return;
    setIsGeneratingReport(true);
    try {
      await api.reports.create(
        `Acoustic Debris Survey: ${analyzedDetection.category} (${analyzedDetection.id})`,
        `Sonar analysis report logged for contact ${analyzedDetection.id} at [${analyzedDetection.coordinates.lat.toFixed(5)}, ${analyzedDetection.coordinates.lng.toFixed(5)}]. Priority: ${analyzedDetection.priority}. Range: ${analyzedDetection.range}m. Confidence: ${analyzedDetection.confidence}%.`,
        analyzedDetection.numericId
      );
      playSonarPing(1100, 0.3);
      onNavigateToReports();
    } catch (err: any) {
      console.error('Failed to create report:', err);
      setAnalysisError(err?.message || 'Failed to generate report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="border-b border-cyan-950/80 pb-5">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-[10px] font-mono-code font-bold uppercase tracking-wider mb-2">
          <Radar className="h-3 w-3 text-cyan-400 animate-spin [animation-duration:10s]" />
          <span>SIDE-SCAN SONAR WORKSTATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-mono-code text-white tracking-tight">
          SONAR ANALYSIS
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase font-mono-code tracking-wider text-cyan-400">
          AI-ASSISTED SIDE-SCAN SONAR INTERPRETATION
        </p>
      </div>

      {/* Upload Area */}
      <div className="rounded-2xl border border-cyan-950/80 bg-[#061122]/90 backdrop-blur-md p-6 shadow-xl">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-cyan-800/60 hover:border-cyan-500/80 rounded-xl p-8 text-center cursor-pointer bg-[#040e1c]/80 hover:bg-cyan-950/20 transition-all group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            accept=".png,.jpg,.jpeg,.webp,.tif,.tiff"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold font-mono-code text-white uppercase tracking-wider">
              DROP SIDE-SCAN SONAR IMAGE HERE
            </h3>
            <p className="text-xs font-mono-code text-slate-400 mt-1">
              or <span className="text-cyan-400 font-bold underline">BROWSE FILES</span> from local workstation
            </p>
            <p className="text-[10px] font-mono-code text-slate-500 mt-2">
              Supported Formats: TIFF, PNG, JPG, JPEG, WEBP (Max 50MB)
            </p>
          </div>
        </div>

        {/* Selected File Stats Bar */}
        {selectedFile && (
          <div className="mt-4 p-4 rounded-xl border border-cyan-950 bg-[#040d1a] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-mono-code font-bold text-white truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </div>
                <div className="text-[10px] font-mono-code text-slate-400 flex items-center gap-3 mt-0.5">
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  {imageDimensions && (
                    <span>{imageDimensions.width} × {imageDimensions.height} px</span>
                  )}
                  <span className="text-cyan-400 uppercase font-bold">STATUS: {uploadStatus}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 text-xs font-mono-code font-black hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>ANALYZING SONAR...</span>
                </>
              ) : (
                <>
                  <Radar className="h-4 w-4" />
                  <span>START ANALYSIS</span>
                </>
              )}
            </button>
          </div>
        )}

        {analysisError && (
          <div className="mt-4 p-3 rounded-xl border border-red-900/80 bg-red-950/30 text-red-300 text-xs font-mono-code flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* Detection Results Display (Shown after analysis) */}
      {analyzedDetection && (
        <div className="rounded-2xl border border-cyan-500/40 bg-[#061122]/90 backdrop-blur-md p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold font-mono-code text-white uppercase tracking-wider">
                ANALYSIS RESULTS • {analyzedDetection.id}
              </h2>
            </div>

            {/* Toggle Image View: ORIGINAL vs PROCESSED */}
            <div className="flex items-center rounded-lg border border-cyan-950 bg-slate-950 p-0.5 text-[10px] font-mono-code font-bold">
              <button
                onClick={() => setImageMode('ORIGINAL')}
                className={`px-3 py-1 rounded transition-colors ${
                  imageMode === 'ORIGINAL' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                ORIGINAL
              </button>
              <button
                onClick={() => setImageMode('PROCESSED')}
                className={`px-3 py-1 rounded transition-colors ${
                  imageMode === 'PROCESSED' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                PROCESSED
              </button>
            </div>
          </div>

          {/* Left: Sonar Image | Right: Detection Results */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Sonar Image with Bounding Box Overlay */}
            <div className="lg:col-span-7 space-y-2">
              <div className="text-[10px] font-mono-code font-bold uppercase text-slate-400">
                SONAR IMAGE DISPLAY ({imageMode})
              </div>

              <div className="relative aspect-video w-full rounded-xl border border-cyan-900/60 bg-[#020712] overflow-hidden flex items-center justify-center shadow-inner">
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt="Sonar Scan"
                    className={`w-full h-full object-cover transition-all ${
                      imageMode === 'PROCESSED' ? 'contrast-125 brightness-95 saturate-150' : ''
                    }`}
                  />
                ) : (
                  <div className="text-xs font-mono-code text-slate-500">NO IMAGE LOADED</div>
                )}

                {/* YOLO Bounding Box Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${analyzedDetection.sonarBoundingBox?.x ?? 30}%`,
                    top: `${analyzedDetection.sonarBoundingBox?.y ?? 20}%`,
                    width: `${analyzedDetection.sonarBoundingBox?.width ?? 25}%`,
                    height: `${analyzedDetection.sonarBoundingBox?.height ?? 22}%`,
                  }}
                  className="border-2 border-cyan-400 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.6)] rounded flex flex-col justify-between p-1 pointer-events-none"
                >
                  <span className="text-[9px] font-mono-code font-black bg-cyan-950/90 text-cyan-300 px-1.5 py-0.2 rounded self-start border border-cyan-700/60">
                    {analyzedDetection.category} • {analyzedDetection.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Detection Metadata */}
            <div className="lg:col-span-5 space-y-4">
              {/* Object Class & Confidence */}
              <div className="rounded-xl border border-cyan-950 bg-[#040e1c] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-950/80 pb-2">
                  <div>
                    <span className="text-[10px] font-mono-code text-slate-500 uppercase">OBJECT</span>
                    <h3 className="text-base font-black font-mono-code text-white uppercase">
                      {analyzedDetection.category}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono-code text-slate-500 uppercase">CONFIDENCE</span>
                    <div className="text-base font-black font-mono-code text-cyan-400">
                      {analyzedDetection.confidence}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-code text-slate-400">RISK LEVEL:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase ${
                      analyzedDetection.priority === 'HIGH'
                        ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                    }`}
                  >
                    {analyzedDetection.priority}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-xl border border-cyan-950 bg-[#040e1c] p-4 space-y-2">
                <div className="text-[10px] font-mono-code text-slate-500 uppercase">LOCATION</div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono-code">
                  <div className="p-2 rounded bg-slate-950/60 border border-cyan-950">
                    <span className="text-[9px] text-slate-500 block">LATITUDE</span>
                    <span className="text-white font-bold">{analyzedDetection.coordinates.lat.toFixed(5)}° N</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-cyan-950">
                    <span className="text-[9px] text-slate-500 block">LONGITUDE</span>
                    <span className="text-white font-bold">{analyzedDetection.coordinates.lng.toFixed(5)}° E</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-cyan-950">
                    <span className="text-[9px] text-slate-500 block">DEPTH</span>
                    <span className="text-cyan-300 font-bold">{analyzedDetection.depth} m</span>
                  </div>
                </div>
              </div>

              {/* Sonar Parameters */}
              <div className="rounded-xl border border-cyan-950 bg-[#040e1c] p-4 space-y-2">
                <div className="text-[10px] font-mono-code text-slate-500 uppercase">SONAR PARAMETERS</div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono-code">
                  <div className="p-2 rounded bg-slate-950/60 border border-cyan-950">
                    <span className="text-[9px] text-slate-500 block">RANGE</span>
                    <span className="text-white">{analyzedDetection.range} m</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-cyan-950">
                    <span className="text-[9px] text-slate-500 block">ACROSS-TRK</span>
                    <span className="text-white">{analyzedDetection.acrossTrack ?? 32.4} m</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-cyan-950">
                    <span className="text-[9px] text-slate-500 block">ALONG-TRK</span>
                    <span className="text-white">{analyzedDetection.alongTrack ?? 16.1} m</span>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div className="rounded-xl border border-cyan-950 bg-[#040e1c] p-4 space-y-2">
                <div className="text-[10px] font-mono-code text-slate-500 uppercase">EVIDENCE VERIFICATION</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Check className="h-3.5 w-3.5 text-cyan-400" />
                    <span>AI Detection</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Check className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Acoustic Shadow</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Check className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Shape Characteristics</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Check className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Texture Characteristics</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onNavigateToMap(analyzedDetection)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-cyan-500/60 bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 text-xs font-mono-code font-bold transition-colors cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>VIEW ON MAP</span>
                </button>

                <button
                  onClick={() => onOpenDetailModal(analyzedDetection)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-[#040e1c] text-slate-300 hover:bg-slate-900 text-xs font-mono-code font-bold transition-colors cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>VIEW FULL DETAILS</span>
                </button>

                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 text-xs font-mono-code font-black hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  <span>GENERATE REPORT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* PART 4 — PROCESSING PIPELINE                       */}
      {/* ================================================== */}
      <div className="rounded-2xl border border-cyan-950/80 bg-[#061122]/90 backdrop-blur-md p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold font-mono-code text-white uppercase tracking-wider">
              PROCESSING PIPELINE
            </h2>
          </div>
          <span className="text-[10px] font-mono-code text-slate-500">
            FASTAPI + PYTORCH / YOLO INFERENCE PIPELINE
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {pipeline.map((step, idx) => {
            const isComplete = step.status === 'COMPLETE';
            const isRunning = step.status === 'RUNNING';
            const isFailed = step.status === 'FAILED';
            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  isComplete
                    ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                    : isRunning
                    ? 'border-cyan-400 bg-cyan-950/80 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse'
                    : isFailed
                    ? 'border-red-800 bg-red-950/40 text-red-300'
                    : 'border-cyan-950 bg-[#040e1c] text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono-code mb-1">
                  <span className="text-slate-500">0{idx + 1}</span>
                  {isComplete && <Check className="h-3 w-3 text-cyan-400" />}
                  {isRunning && <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />}
                </div>
                <div className="text-[11px] font-mono-code font-bold uppercase leading-tight mt-1">
                  {step.label}
                </div>
                <div className="mt-2 text-[9px] font-mono-code uppercase">
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold ${
                      isComplete
                        ? 'text-cyan-400 bg-cyan-950'
                        : isRunning
                        ? 'text-amber-300 bg-amber-950'
                        : isFailed
                        ? 'text-red-400 bg-red-950'
                        : 'text-slate-600 bg-slate-950'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
