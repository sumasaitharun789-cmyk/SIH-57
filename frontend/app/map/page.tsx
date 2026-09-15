'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '../../components/AppShell';
import DetectionMapView from '../../components/DetectionMapView';
import DetectionDetailModal from '../../components/DetectionDetailModal';
import { api, adaptBackendDetection } from '../../lib/api';
import { Detection } from '../../lib/types';
import { mockDetections } from '../../lib/mockData';

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [inspectDetection, setInspectDetection] = useState<Detection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetections();
  }, []);

  const loadDetections = async () => {
    try {
      const res = await api.detections.list(1, 100);
      if (res && res.items && res.items.length > 0) {
        const adapted = res.items.map(d => adaptBackendDetection(d));
        setDetections(adapted);
        checkInitialSelect(adapted);
      } else {
        setDetections(mockDetections);
        checkInitialSelect(mockDetections);
      }
    } catch (e) {
      setDetections(mockDetections);
      checkInitialSelect(mockDetections);
    } finally {
      setLoading(false);
    }
  };

  const checkInitialSelect = (dets: Detection[]) => {
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const idParam = searchParams.get('id');
    if (idParam) {
      const found = dets.find(d => d.id === idParam || String(d.numericId) === idParam);
      if (found) setSelectedDetection(found);
    } else if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      const found = dets.find(d => d.coordinates && Math.abs(d.coordinates.lat - lat) < 0.01 && Math.abs(d.coordinates.lng - lng) < 0.01);
      if (found) setSelectedDetection(found);
    }
  };

  return (
    <AppShell activeSection="map">
      <DetectionMapView
        detections={detections}
        selectedDetection={selectedDetection}
        onSelectDetection={(d: Detection) => setSelectedDetection(d)}
        onOpenDetailModal={(d: Detection) => setInspectDetection(d)}
        onNavigateToAnalysis={() => router.push('/analysis')}
        onNavigateToReports={(d: Detection) => router.push('/reports')}
      />
      {inspectDetection && (
        <DetectionDetailModal
          detection={inspectDetection}
          onClose={() => setInspectDetection(null)}
          onOpenOnMap={(d) => setSelectedDetection(d)}
          onGenerateReport={() => router.push('/reports')}
        />
      )}
    </AppShell>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#030712] flex items-center justify-center text-cyan-400 font-mono-code">Loading tactical map...</div>}>
      <MapContent />
    </Suspense>
  );
}
