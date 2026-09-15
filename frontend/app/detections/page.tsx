'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import DetectionsView from '../../components/DetectionsView';
import DetectionDetailModal from '../../components/DetectionDetailModal';
import { api, adaptBackendDetection } from '../../lib/api';
import { Detection } from '../../lib/types';
import { mockDetections } from '../../lib/mockData';

export default function DetectionsPage() {
  const router = useRouter();
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
        setDetections(res.items.map(d => adaptBackendDetection(d)));
      } else {
        setDetections(mockDetections);
      }
    } catch (e) {
      setDetections(mockDetections);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeSection="detections">
      <DetectionsView
        detections={detections}
        onSelectDetection={(d: Detection) => {
          setSelectedDetection(d);
          setInspectDetection(d);
        }}
        onRefresh={loadDetections}
        isLoading={loading}
      />
      {inspectDetection && (
        <DetectionDetailModal
          detection={inspectDetection}
          onClose={() => setInspectDetection(null)}
          onOpenOnMap={(d) => router.push(`/map?lat=${d.coordinates?.lat}&lng=${d.coordinates?.lng}`)}
          onGenerateReport={() => router.push('/reports')}
        />
      )}
    </AppShell>
  );
}
