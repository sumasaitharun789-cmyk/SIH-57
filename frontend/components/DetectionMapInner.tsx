'use client';

import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Detection, TelemetryData } from '../lib/types';
import { Layers, Compass, Eye, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

interface DetectionMapInnerProps {
  detections: Detection[];
  selectedDetection: Detection | null;
  onSelectDetection: (detection: Detection) => void;
  telemetry: TelemetryData;
}

// Custom Leaflet DivIcons with tactical styling
const createCustomMarker = (priority: string, isSelected: boolean, isHigh: boolean) => {
  const color =
    priority === 'HIGH' ? '#ef4444' : priority === 'MEDIUM' ? '#f59e0b' : '#22d3ee';
  const pulseClass = isHigh ? 'animate-ping opacity-75' : '';

  return L.divIcon({
    className: 'custom-sonar-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        ${
          isHigh
            ? `<div class="${pulseClass}" style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: ${color}; opacity: 0.4;"></div>`
            : ''
        }
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${color}; ${
      isSelected ? 'transform: scale(1.3); border-color: #38bdf8;' : ''
    }"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const vesselIcon = L.divIcon({
  className: 'custom-vessel-pin',
  html: `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 1px dashed #22d3ee; animation: spin 10s linear infinite;"></div>
      <div style="width: 18px; height: 18px; border-radius: 4px; background-color: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 0 12px #22d3ee; display: flex; align-items: center; justify-content: center; transform: rotate(45deg);"></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Map controller to smoothly fly to selected detection
function MapController({ selectedDetection }: { selectedDetection: Detection | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedDetection) {
      map.flyTo(
        [selectedDetection.coordinates.lat, selectedDetection.coordinates.lng],
        15,
        { duration: 1.2 }
      );
    }
  }, [selectedDetection, map]);
  return null;
}

export default function DetectionMapInner({
  detections,
  selectedDetection,
  onSelectDetection,
  telemetry,
}: DetectionMapInnerProps) {
  const [showSwath, setShowSwath] = useState(true);
  const [showTrack, setShowTrack] = useState(true);
  const [mapStyle, setMapStyle] = useState<'dark' | 'ocean'>('dark');

  // Survey route waypoints (Sector 07 Coromandel Coast)
  const surveyRoute: [number, number][] = [
    [12.836, 80.112],
    [12.84, 80.118],
    [12.8452, 80.1245], // Current vessel position
    [12.851, 80.131],
    [12.857, 80.138],
  ];

  // Sonar Swath corridor polygon
  const swathPolygon: [number, number][] = [
    [12.835, 80.11],
    [12.839, 80.116],
    [12.85, 80.13],
    [12.858, 80.136],
    [12.856, 80.14],
    [12.848, 80.133],
    [12.838, 80.121],
    [12.834, 80.114],
  ];

  const center: [number, number] = [telemetry.vesselPosition.lat, telemetry.vesselPosition.lng];

  return (
    <div className="relative h-full w-full flex flex-col rounded-xl border border-cyan-950/80 bg-[#060e1e] overflow-hidden">
      {/* Top Map HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-950/80 bg-[#0a1628]/95 px-4 py-3 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400 animate-spin [animation-duration:12s]" />
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-cyan-300">
              GEO INTELLIGENCE • BATHYMETRIC OVERLAY
            </h3>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono-code text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            SECTOR 07 GRID • RTK-GPS FIXED
          </span>
        </div>

        {/* Map Layers Toggles */}
        <div className="flex items-center gap-2 text-xs font-mono-code">
          <button
            onClick={() => setShowSwath(!showSwath)}
            className={`px-2.5 py-1 rounded border text-[10px] font-semibold transition-colors ${
              showSwath
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            SWATH CORRIDOR
          </button>

          <button
            onClick={() => setShowTrack(!showTrack)}
            className={`px-2.5 py-1 rounded border text-[10px] font-semibold transition-colors ${
              showTrack
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            VESSEL TRACK
          </button>

          <button
            onClick={() => setMapStyle(mapStyle === 'dark' ? 'ocean' : 'dark')}
            className={`px-2.5 py-1 rounded border text-[10px] font-semibold transition-colors ${
              mapStyle === 'ocean'
                ? 'bg-blue-950/70 border-blue-500/50 text-blue-300'
                : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
            }`}
            title="Toggle between Tactical Dark Gray Canvas and Hydrographic Ocean Bathymetry"
          >
            {mapStyle === 'ocean' ? 'OCEAN BATHY' : 'TACTICAL DARK'}
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative flex-1 min-h-[420px] w-full">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          {/* High-Contrast Watermark-Free Tactical Basemap */}
          {process.env.NEXT_PUBLIC_CARTO_API_KEY ? (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`}
            />
          ) : mapStyle === 'ocean' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri Ocean Basemap</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri Dark Canvas</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            />
          )}

          <MapController selectedDetection={selectedDetection} />

          {/* Sonar Swath Polygon */}
          {showSwath && (
            <Polygon
              positions={swathPolygon}
              pathOptions={{
                color: '#22d3ee',
                weight: 1,
                dashArray: '4, 4',
                fillColor: '#0891b2',
                fillOpacity: 0.15,
              }}
            />
          )}

          {/* Survey Track Polyline */}
          {showTrack && (
            <Polyline
              positions={surveyRoute}
              pathOptions={{
                color: '#38bdf8',
                weight: 2,
                dashArray: '6, 6',
              }}
            />
          )}

          {/* Vessel Marker */}
          <Marker
            position={[telemetry.vesselPosition.lat, telemetry.vesselPosition.lng]}
            icon={vesselIcon}
          >
            <Popup>
              <div className="text-xs font-mono-code space-y-1">
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                  {telemetry.vesselName}
                </div>
                <div className="text-slate-300">Speed: {telemetry.vesselSpeedKnots} kn</div>
                <div className="text-slate-300">Heading: {telemetry.headingDeg}°</div>
                <div className="text-slate-400 text-[10px]">
                  {telemetry.vesselPosition.lat.toFixed(4)}°N, {telemetry.vesselPosition.lng.toFixed(4)}°E
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Anomaly Detection Markers */}
          {detections.map((det) => {
            const isSelected = selectedDetection?.id === det.id;
            const isHigh = det.priority === 'HIGH';

            return (
              <Marker
                key={det.id}
                position={[det.coordinates.lat, det.coordinates.lng]}
                icon={createCustomMarker(det.priority, isSelected, isHigh)}
                eventHandlers={{
                  click: () => onSelectDetection(det),
                }}
              >
                <Popup>
                  <div className="text-xs font-mono-code space-y-1.5 min-w-[180px]">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <span className="font-bold text-cyan-300">{det.id}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          det.priority === 'HIGH'
                            ? 'bg-red-950 text-red-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {det.priority}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-100">{det.name}</div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                      <div>Confidence: <strong className="text-white">{det.fusedConfidence}%</strong></div>
                      <div>Depth: <strong className="text-white">{det.depth}m</strong></div>
                    </div>

                    <div className="text-[9px] text-emerald-400 font-bold">
                      STATUS: {det.status}
                    </div>

                    <button
                      onClick={() => onSelectDetection(det)}
                      className="w-full mt-1 px-2 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-bold hover:bg-cyan-900 hover:border-cyan-500 transition-colors"
                    >
                      INSPECT CONTACT &rarr;
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Zero contacts banner */}
        {detections.length === 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-lg bg-[#0a1628]/95 border border-cyan-900/80 backdrop-blur-md text-xs font-mono-code text-slate-300 shadow-xl pointer-events-none">
            NO GEOSPATIAL TARGETS • UPLOAD SONAR TO LOG ANOMALY CONTACTS
          </div>
        )}

        {/* Legend Overlay in Bottom Right */}
        <div className="absolute bottom-4 right-4 z-[400] rounded-lg border border-cyan-900/60 bg-[#0a1628]/90 p-3 text-[11px] font-mono-code text-slate-300 backdrop-blur-md space-y-1.5 shadow-xl">
          <div className="text-[10px] text-cyan-400 font-bold border-b border-slate-800 pb-1">
            TARGET CLASSIFICATION
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            <span>High Priority Anomaly</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
            <span>Medium Priority Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            <span>Verified Seabed Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded bg-cyan-500/30 border border-cyan-400" />
            <span>150m Sonar Swath Width</span>
          </div>
        </div>
      </div>
    </div>
  );
}
