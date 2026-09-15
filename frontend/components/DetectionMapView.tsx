'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Search,
  Filter,
  SlidersHorizontal,
  Compass,
  Layers,
  Sparkles,
  Target,
  RefreshCw,
} from 'lucide-react';
import { Detection } from '../lib/types';

interface DetectionMapViewProps {
  detections: Detection[];
  selectedDetection: Detection | null;
  onSelectDetection: (det: Detection) => void;
  onOpenDetailModal: (det: Detection) => void;
  onNavigateToAnalysis: () => void;
  onNavigateToReports: (det: Detection) => void;
}

// Dynamically import Leaflet with SSR disabled
const DynamicMap = dynamic(() => import('./DetectionMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] w-full flex-col items-center justify-center rounded-2xl border border-cyan-950/80 bg-[#060e1e] p-6 text-center">
      <Compass className="h-10 w-10 text-cyan-400 animate-spin [animation-duration:3s]" />
      <div className="mt-3 text-xs font-mono-code font-bold text-cyan-300">
        LOADING LEAFLET & OPENSTREETMAP GEOSPATIAL TILES...
      </div>
      <div className="mt-1 text-[11px] font-mono-code text-slate-500">
        Plotting bathymetric coordinates & marine debris markers
      </div>
    </div>
  ),
});

export default function DetectionMapView({
  detections,
  selectedDetection,
  onSelectDetection,
  onOpenDetailModal,
  onNavigateToAnalysis,
  onNavigateToReports,
}: DetectionMapViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Filter detections
  const filteredDetections = useMemo(() => {
    return detections.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        d.id.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);

      const matchesType =
        typeFilter === 'ALL' || d.category.toLowerCase().includes(typeFilter.toLowerCase());

      const matchesRisk = riskFilter === 'ALL' || d.priority === riskFilter;

      let matchesConf = true;
      if (confidenceFilter === '90') matchesConf = d.confidence >= 90;
      else if (confidenceFilter === '80') matchesConf = d.confidence >= 80;
      else if (confidenceFilter === '70') matchesConf = d.confidence >= 70;

      return matchesSearch && matchesType && matchesRisk && matchesConf;
    });
  }, [detections, searchQuery, typeFilter, confidenceFilter, riskFilter]);

  const fallbackTelemetry = {
    missionId: 'PD-S44-SURVEY',
    missionName: 'Sector 07 Coromandel',
    vesselName: 'RV Sagar Nidhi (ORV-44)',
    surveyArea: 'Bay of Bengal / Sector 07',
    sector: 'Sector 07 (Coromandel Deepwater)',
    depth: 22.4,
    sonarFrequency: 455 as const,
    signalQuality: 98,
    pingRate: 20,
    gainDb: 18,
    status: 'ACTIVE' as const,
    vesselSpeedKnots: 4.2,
    headingDeg: 88,
    vesselPosition: { lat: 12.8452, lng: 80.1245 },
    towfishAltitude: 8.5,
    waterTemperatureC: 26.4,
    salinityPsu: 34.8,
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Subtitle */}
      <div className="border-b border-cyan-950/80 pb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-[10px] font-mono-code font-bold uppercase tracking-wider mb-2">
          <MapPin className="h-3 w-3 text-cyan-400" />
          <span>GEOSPATIAL INTELLIGENCE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-mono-code text-white tracking-tight">
          DETECTION MAP
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase font-mono-code tracking-wider text-cyan-400">
          GEOSPATIAL VIEW OF UNDERWATER DETECTIONS
        </p>
      </div>

      {/* Top Controls & Filters */}
      <div className="rounded-2xl border border-cyan-950/80 bg-[#061122]/90 backdrop-blur-md p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH DETECTION ID OR CLASS..."
            className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-9 pr-3 py-2 text-xs font-mono-code text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code">
          {/* Object Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">TYPE:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="net">GHOST NETS</option>
              <option value="ship">SHIPWRECKS</option>
              <option value="gear">FISHING GEAR</option>
              <option value="pipe">PIPES / CYLINDERS</option>
              <option value="debris">OTHER DEBRIS</option>
            </select>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">CONFIDENCE:</span>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">ALL</option>
              <option value="90">≥ 90%</option>
              <option value="80">≥ 80%</option>
              <option value="70">≥ 70%</option>
            </select>
          </div>

          {/* Risk */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">RISK:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">ALL RISKS</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {(searchQuery || typeFilter !== 'ALL' || confidenceFilter !== 'ALL' || riskFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setConfidenceFilter('ALL');
                setRiskFilter('ALL');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 text-[10px] uppercase font-bold transition-colors"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* Map Display Card */}
      <div className="rounded-2xl border border-cyan-950/80 bg-[#061122]/90 backdrop-blur-md overflow-hidden shadow-xl relative">
        <div className="h-[580px] w-full relative z-10">
          <DynamicMap
            detections={filteredDetections}
            selectedDetection={selectedDetection}
            onSelectDetection={onSelectDetection}
            telemetry={fallbackTelemetry}
          />
        </div>

        {/* Tactical Legend Banner */}
        <div className="p-4 border-t border-cyan-950/80 bg-[#040e1c] flex flex-wrap items-center justify-between gap-4 text-xs font-mono-code text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-cyan-400 font-bold uppercase text-[10px]">MAP LEGEND:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <span>Ghost Net (High)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              <span>Shipwreck / Debris (Med)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <span>Pipe / Low Hazard</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            SHOWING {filteredDetections.length} OF {detections.length} CONTACTS • OPENSTREETMAP LEAFLET TILE ENGINE
          </div>
        </div>
      </div>
    </div>
  );
}
