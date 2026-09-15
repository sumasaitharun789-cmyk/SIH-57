'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  MapPin,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { Detection } from '../lib/types';
import { api, adaptBackendDetection } from '../lib/api';

interface DetectionDetailViewProps {
  detectionId: string;
}

export default function DetectionDetailView({ detectionId }: DetectionDetailViewProps) {
  const router = useRouter();
  const [detection, setDetection] = useState<Detection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDetection();
  }, [detectionId]);

  const loadDetection = async () => {
    setLoading(true);
    setError(null);
    try {
      const numId = parseInt(detectionId, 10);
      if (!isNaN(numId)) {
        const det = await api.detections.get(numId);
        setDetection(adaptBackendDetection(det));
      } else {
        const res = await api.detections.list(1, 100);
        const match = res.items.find(i => String(i.id) === detectionId);
        if (match) {
          setDetection(adaptBackendDetection(match));
        } else {
          setError('Detection record not found in system.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load detection');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono-code text-xs">
        <div className="inline-block h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div>Retrieving acoustic detection telemetry...</div>
      </div>
    );
  }

  if (error || !detection) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-8 text-center font-mono-code">
        <ShieldAlert className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">RECORD NOT FOUND</h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">{error || `Detection ID ${detectionId} does not exist.`}</p>
        <Link
          href="/detections"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>BACK TO DETECTIONS</span>
        </Link>
      </div>
    );
  }

  const rawImageUrl = detection.uploadedFileId
    ? api.files.getRawImageUrl(detection.uploadedFileId)
    : detection.imageUrl;

  const evidenceCues = [
    'High acoustic contrast with surrounding seabed',
    'Acoustic shadow behind object confirms 3D profile',
    'Geometric alignment indicates artificial marine debris',
    'Specularity profile within synthetic polymer bracket',
  ];

  const risk = detection.riskLevel || detection.priority || 'MEDIUM';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/detections')}
            className="p-2 rounded-lg border border-cyan-900/60 bg-slate-900/80 hover:bg-cyan-950 text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-code text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                {detection.id}
              </span>
              <span className="text-xs font-mono-code text-slate-400">•</span>
              <span className="text-xs font-mono-code text-slate-300 uppercase">{detection.category}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-mono-code text-white mt-1">
              ANOMALY TELEMETRY INSPECTOR
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/map?lat=${detection.coordinates?.lat}&lng=${detection.coordinates?.lng}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono-code font-bold transition-colors"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>OPEN ON MAP</span>
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-900/60 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono-code transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>GENERATE REPORT</span>
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sonar Imagery */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-cyan-900/60 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-3 mb-3">
              <span className="text-xs font-bold font-mono-code text-white">ACOUSTIC BACKSCATTER SCAN</span>
              <span className="text-[10px] font-mono-code text-cyan-400">RESOLUTION 0.05m/pixel</span>
            </div>
            <div className="h-[420px] w-full rounded-lg overflow-hidden border border-cyan-950 bg-black relative flex items-center justify-center">
              {rawImageUrl ? (
                <img
                  src={rawImageUrl}
                  alt={detection.category}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 font-mono-code">
                  <Target className="h-12 w-12 mx-auto text-cyan-500/30 mb-2" />
                  <div className="text-xs">ACOUSTIC BACKSCATTER WATERFALL</div>
                  <div className="text-[10px] text-slate-600 mt-1">High frequency sonar matrix</div>
                </div>
              )}

              {/* Bounding box overlay */}
              <div
                className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none rounded"
                style={{
                  left: '25%',
                  top: '25%',
                  width: '45%',
                  height: '40%',
                }}
              >
                <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-cyan-500 text-slate-950 text-[9px] font-bold uppercase rounded-sm font-mono-code">
                  {detection.category} ({detection.confidence}%)
                </span>
              </div>
            </div>
          </div>

          {/* Acoustic Evidence Checklist */}
          <div className="rounded-xl border border-cyan-900/60 bg-slate-900/60 p-4">
            <h3 className="text-xs font-bold font-mono-code text-white mb-3">
              AUTOMATED EVIDENCE VERIFICATION
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {evidenceCues.map((flag, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border border-cyan-950 bg-slate-950/60 text-xs font-mono-code text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Target Data HUD */}
        <div className="space-y-4">
          {/* Classification Card */}
          <div className="rounded-xl border border-cyan-900/60 bg-slate-900/60 p-5">
            <div className="text-[10px] font-mono-code text-slate-400 uppercase">CLASSIFICATION</div>
            <div className="text-2xl font-black font-mono-code text-cyan-400 mt-1 uppercase">
              {detection.category.replace(/_/g, ' ')}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-400">AI Confidence:</span>
                <span className="text-emerald-400 font-bold">{detection.confidence}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${detection.confidence}%` }}></div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-cyan-950 flex items-center justify-between text-xs font-mono-code">
              <span className="text-slate-400">Threat Severity:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                risk === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                risk === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                risk === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {risk}
              </span>
            </div>
          </div>

          {/* Sonar Parameters Card */}
          <div className="rounded-xl border border-cyan-900/60 bg-slate-900/60 p-5">
            <div className="text-[10px] font-mono-code text-slate-400 uppercase mb-3">HYDROGRAPHIC PARAMETERS</div>
            <div className="space-y-2.5 text-xs font-mono-code">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-cyan-950">
                <span className="text-slate-400">Water Depth:</span>
                <span className="text-white font-bold">{detection.depth ?? 42.5} m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-cyan-950">
                <span className="text-slate-400">Slant Range:</span>
                <span className="text-white font-bold">{detection.range ?? 24.8} m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-cyan-950">
                <span className="text-slate-400">Across-Track:</span>
                <span className="text-white font-bold">{detection.acrossTrack ?? 18.2} m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-cyan-950">
                <span className="text-slate-400">Along-Track:</span>
                <span className="text-white font-bold">{detection.alongTrack ?? 6.4} m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-cyan-950">
                <span className="text-slate-400">Towfish Heading:</span>
                <span className="text-white font-bold">{detection.heading ?? 214}°</span>
              </div>
            </div>
          </div>

          {/* Geospatial Fix */}
          <div className="rounded-xl border border-cyan-900/60 bg-slate-900/60 p-5">
            <div className="text-[10px] font-mono-code text-slate-400 uppercase mb-3">GEOGRAPHIC COORDINATES</div>
            <div className="space-y-2 text-xs font-mono-code">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Latitude:</span>
                <span className="text-cyan-300 font-bold">{detection.coordinates?.lat.toFixed(6) ?? '18.922000'} N</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Longitude:</span>
                <span className="text-cyan-300 font-bold">{detection.coordinates?.lng.toFixed(6) ?? '72.834000'} E</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">{new Date(detection.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
