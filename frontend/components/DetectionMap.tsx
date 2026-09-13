'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Detection, TelemetryData } from '../lib/types';
import { Compass } from 'lucide-react';

interface DetectionMapProps {
  detections: Detection[];
  selectedDetection: Detection | null;
  onSelectDetection: (detection: Detection) => void;
  telemetry: TelemetryData;
}

// Dynamically import Leaflet with SSR disabled
const DynamicMapInner = dynamic(() => import('./DetectionMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center rounded-xl border border-cyan-950/80 bg-[#060e1e] p-6 text-center">
      <Compass className="h-10 w-10 text-cyan-400 animate-spin [animation-duration:3s]" />
      <div className="mt-3 text-xs font-mono-code font-bold text-cyan-300">
        INITIALIZING GEOSPATIAL MAP SERVICE...
      </div>
      <div className="mt-1 text-[11px] font-mono-code text-slate-500">
        Loading bathymetric coordinates & RTK telemetry
      </div>
    </div>
  ),
});

export default function DetectionMap(props: DetectionMapProps) {
  return <DynamicMapInner {...props} />;
}
