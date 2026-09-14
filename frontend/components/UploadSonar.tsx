'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileImage,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radar,
  Info,
  Layers,
  AlertCircle,
  X,
} from 'lucide-react';
import { Detection, ProcessingStep, TelemetryData } from '../lib/types';
import { PROCESSING_STEPS } from '../lib/sonarService';
import { mockSampleImages } from '../lib/mockData';
import { playAlertChime, playSonarPing } from '../lib/audioUtils';
import { api, adaptBackendDetection, BackendDetectionResponse } from '../lib/api';

interface UploadSonarProps {
  onNewDetectionAdded: (detection: Detection) => void;
  onNavigateToSonar: () => void;
  telemetry?: TelemetryData;
  onOpenAuth?: () => void;
}

export default function UploadSonar({
  onNewDetectionAdded,
  onNavigateToSonar,
  telemetry,
  onOpenAuth,
}: UploadSonarProps) {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    resolution: string;
    previewUrl?: string;
  } | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [backendDetectionId, setBackendDetectionId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>(
    PROCESSING_STEPS.map((s) => ({ ...s, status: 'pending' }))
  );
  const [analyzedDetection, setAnalyzedDetection] = useState<Detection | null>(null);

  // Dropzone callback with strict size and format validation
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setUploadError(null);

    if (fileRejections && fileRejections.length > 0) {
      const rej = fileRejections[0];
      if (rej.errors?.some((e: any) => e.code === 'file-too-large')) {
        setUploadError('File size exceeds the 10 MB maximum allowed upload size.');
      } else {
        setUploadError('Unsupported file type. Supported: TIFF, PNG, JPG, JPEG, WEBP.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds the 10 MB maximum allowed upload size.');
        return;
      }

      setFileObject(file);
      const preview = URL.createObjectURL(file);
      setSelectedFile({
        name: file.name,
        size: file.size,
        resolution: '2048 x 1024 (Auto-mapped)',
        previewUrl: preview,
      });
      setBackendDetectionId(null);
      setAnalyzedDetection(null);
      setSteps(PROCESSING_STEPS.map((s) => ({ ...s, status: 'pending' })));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/tiff': ['.tif', '.tiff'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  // Load sample image with valid PNG binary data
  const handleSelectSample = (sample: (typeof mockSampleImages)[0]) => {
    setUploadError(null);
    // Minimal 1x1 valid PNG binary representation
    const pngBinary = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    const pngBytes = new Uint8Array(pngBinary.length);
    for (let i = 0; i < pngBinary.length; i++) {
      pngBytes[i] = pngBinary.charCodeAt(i);
    }
    const sampleBlob = new Blob([pngBytes], { type: 'image/png' });
    const sampleFile = new File([sampleBlob], sample.filename, { type: 'image/png' });
    setFileObject(sampleFile);

    setSelectedFile({
      name: sample.filename,
      size: 3800000,
      resolution: sample.resolution,
    });
    setBackendDetectionId(null);
    setAnalyzedDetection(null);
    setSteps(PROCESSING_STEPS.map((s) => ({ ...s, status: 'pending' })));
  };

  // Run AI processing pipeline strictly via FastAPI backend
  const handleStartAnalysis = async () => {
    if (!selectedFile || !fileObject) return;

    // Check authentication
    if (!api.auth.isAuthenticated()) {
      setUploadError('Operator Authentication Required: Please sign in or register before uploading and analyzing sonar scans.');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsProcessing(true);
    setAnalyzedDetection(null);
    setBackendDetectionId(null);
    setUploadError(null);
    playSonarPing(880, 0.4);

    const localSteps: ProcessingStep[] = PROCESSING_STEPS.map((s, idx) => ({
      ...s,
      status: idx === 0 ? 'processing' : 'pending',
    }));
    setSteps([...localSteps]);

    try {
      // Stage 1: Received & Header verification
      await new Promise((r) => setTimeout(r, 350));
      localSteps[0].status = 'completed';
      localSteps[1].status = 'processing';
      setSteps([...localSteps]);

      // Stage 2: Preprocessing & Backend File Upload (multipart/form-data to /api/files/images)
      const uploadRes = await api.files.uploadImage(fileObject);
      const uploadedFileId = uploadRes.id ?? uploadRes.file_id;
      if (!uploadedFileId) {
        throw new Error('Backend failed to return a valid uploaded file ID.');
      }

      await new Promise((r) => setTimeout(r, 450));
      localSteps[1].status = 'completed';
      localSteps[2].status = 'processing';
      setSteps([...localSteps]);

      // Stage 3: AI Detection (YOLOv8 & Mock ML Service on FastAPI)
      const lat = telemetry?.vesselPosition?.lat ?? 12.8421;
      const lng = telemetry?.vesselPosition?.lng ?? 80.2456;
      const backendDet = await api.detections.create(uploadedFileId, lat, lng);
      if (!backendDet || !backendDet.id) {
        throw new Error('Backend detection endpoint failed to return valid analysis results.');
      }

      await new Promise((r) => setTimeout(r, 550));
      localSteps[2].status = 'completed';
      localSteps[3].status = 'processing';
      setSteps([...localSteps]);

      // Stage 4: Acoustic Shadow Triangulation
      await new Promise((r) => setTimeout(r, 450));
      localSteps[3].status = 'completed';
      localSteps[4].status = 'processing';
      setSteps([...localSteps]);

      // Stage 5: Geometry Consistency & Symmetry Check
      await new Promise((r) => setTimeout(r, 400));
      localSteps[4].status = 'completed';
      localSteps[5].status = 'processing';
      setSteps([...localSteps]);

      // Stage 6: Bayesian Multi-Factor Evidence Fusion & Risk Calculation
      await new Promise((r) => setTimeout(r, 450));
      localSteps[5].status = 'completed';
      localSteps[6].status = 'processing';
      setSteps([...localSteps]);

      // Stage 7: Result Verified & Database Commit
      await new Promise((r) => setTimeout(r, 300));
      localSteps[6].status = 'completed';
      setSteps([...localSteps]);

      const finalDetection = adaptBackendDetection(backendDet, telemetry);
      setBackendDetectionId(backendDet.id);
      setAnalyzedDetection(finalDetection);
      onNewDetectionAdded(finalDetection);
      playAlertChime();
    } catch (err: any) {
      console.error('Error during sonar analysis:', err);
      const errMsg = err?.message || 'Acoustic processing failed on the backend server.';
      const isAuthErr =
        errMsg.toLowerCase().includes('credential') ||
        errMsg.toLowerCase().includes('token') ||
        errMsg.toLowerCase().includes('auth') ||
        errMsg.toLowerCase().includes('unauthorized') ||
        errMsg.toLowerCase().includes('expired') ||
        errMsg.toLowerCase().includes('401');

      if (isAuthErr) {
        api.auth.clearSession();
        setUploadError('Tactical Operator session expired or unauthorized. Please sign in to authenticate with the detection server.');
        if (onOpenAuth) onOpenAuth();
      } else {
        setUploadError(errMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-cyan-950/80 bg-[#0a1628]/90 p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              ACOUSTIC SONAR INGESTION & PIPELINE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ingest raw Side-Scan Sonar imagery (TIFF, PNG, JPEG) to run YOLOv8 detection, shadow
            triangulation, and Bayesian evidence fusion.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-800/40 bg-cyan-950/40 text-cyan-300 text-xs font-mono-code">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>FASTAPI & YOLOV8 INTEGRATION READY</span>
        </div>
      </div>

      {/* Main Upload / Drop Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dropzone & File Details (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 bg-[#060e1e]/80 ${
              isDragActive
                ? 'border-cyan-400 bg-cyan-950/30 scale-[0.99]'
                : 'border-cyan-900/50 hover:border-cyan-500/60 hover:bg-slate-900/40'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-950/70 border border-cyan-700/50 text-cyan-300 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h3 className="text-sm font-bold text-slate-100">
              DROP SIDE-SCAN SONAR IMAGE HERE
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              or <span className="text-cyan-400 underline font-semibold">browse files</span> from your
              hydrographic workstation
            </p>
            <div className="mt-3 text-[10px] font-mono-code text-slate-500">
              SUPPORTS: TIFF, PNG, JPG, JPEG, WEBP (UP TO 10 MB)
            </div>
          </div>

          {/* Error Alert Display */}
          {uploadError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/60 bg-red-950/40 p-4 text-xs text-red-200 backdrop-blur-md">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-bold font-mono-code text-red-300 uppercase tracking-wider">
                  INGESTION / PIPELINE ALERT
                </div>
                <div className="text-[11px] leading-relaxed text-slate-300">{uploadError}</div>
                {(!api.auth.isAuthenticated() || uploadError.toLowerCase().includes('sign in') || uploadError.toLowerCase().includes('auth') || uploadError.toLowerCase().includes('session') || uploadError.toLowerCase().includes('credential')) && onOpenAuth && (
                  <button
                    onClick={onOpenAuth}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-[11px] font-mono-code hover:bg-cyan-400 transition-colors"
                  >
                    <span>SIGN IN AS OPERATOR &rarr;</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Quick Select Sample Sonar Images */}
          <div className="rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-4 backdrop-blur-md">
            <div className="text-xs font-mono-code font-bold text-cyan-400 uppercase mb-3">
              OR TEST WITH SAMPLE HYDROGRAPHIC SURVEY DATA:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {mockSampleImages.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="flex flex-col text-left rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 hover:border-cyan-500/60 transition-colors"
                >
                  <span className="font-bold text-slate-200 truncate">{sample.name}</span>
                  <span className="text-[10px] font-mono-code text-cyan-400 mt-1">
                    {sample.detectedType}
                  </span>
                  <span className="text-[9px] font-mono-code text-slate-500 mt-0.5">
                    {sample.resolution} • {sample.size}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected File Card & Analyze CTA */}
          {selectedFile && (
            <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/20 p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300">
                  <FileImage className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate font-mono-code">
                    {selectedFile.name}
                  </div>
                  <div className="text-[10px] font-mono-code text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.resolution}
                  </div>
                </div>
              </div>

              <button
                disabled={isProcessing}
                onClick={handleStartAnalysis}
                className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all disabled:opacity-50 active:scale-95 shrink-0"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>ANALYZING SONAR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>RUN AI DETECTION PIPELINE</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: The 7-Stage Pipeline Live Progression (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-cyan-950/80 bg-[#0a1628]/80 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-3">
            <h3 className="text-xs font-mono-code font-bold text-cyan-400 uppercase tracking-wider">
              7-STAGE PROCESSING SEQUENCE
            </h3>
            <span className="text-[10px] font-mono-code text-slate-400">
              {isProcessing ? 'PROCESSING PIPELINE ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="space-y-2.5">
            {steps.map((step) => {
              const isDone = step.status === 'completed';
              const isCurrent = step.status === 'processing';

              return (
                <div
                  key={step.key}
                  className={`flex items-start gap-3 rounded-lg border p-2.5 transition-all text-xs ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-950/20 text-slate-200'
                      : isCurrent
                      ? 'border-cyan-500/60 bg-cyan-950/30 text-white shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-500'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-700 text-[10px] font-mono-code flex items-center justify-center">
                        {step.step}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-mono-code font-bold text-[11px] flex justify-between">
                      <span className={isCurrent ? 'text-cyan-300' : ''}>{step.name}</span>
                      <span className="text-[9px] uppercase">
                        {isDone ? 'COMPLETE' : isCurrent ? 'RUNNING' : 'WAITING'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analysis Complete Success Card */}
          <AnimatePresence>
            {analyzedDetection && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="rounded-lg border border-emerald-500/50 bg-emerald-950/40 p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-mono-code">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>SONAR ANALYSIS COMPLETE • CONTACT VERIFIED</span>
                </div>

                <div className="text-xs space-y-1 font-mono-code">
                  <div className="flex justify-between text-slate-200">
                    <span>Target ID:</span>
                    <strong className="text-cyan-300">{analyzedDetection.id}</strong>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>Classification:</span>
                    <strong className="text-white">{analyzedDetection.name}</strong>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>Fused Confidence:</span>
                    <strong className="text-emerald-400">
                      {analyzedDetection.fusedConfidence}%
                    </strong>
                  </div>
                  {backendDetectionId && (
                    <div className="flex items-center justify-between text-cyan-300 pt-1 border-t border-emerald-800/40 text-[10px]">
                      <span>Backend DB Record:</span>
                      <span className="font-bold">SAVED (ID #{backendDetectionId})</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={onNavigateToSonar}
                  className="w-full flex items-center justify-center gap-2 rounded bg-cyan-500 hover:bg-cyan-400 py-2 text-xs font-bold text-slate-950 transition-colors"
                >
                  <Radar className="h-4 w-4" />
                  <span>VIEW TARGET IN LIVE SONAR</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
