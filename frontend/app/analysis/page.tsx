'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import SonarAnalysisView from '../../components/SonarAnalysisView';
import DetectionDetailModal from '../../components/DetectionDetailModal';
import { Detection } from '../../lib/types';

export default function AnalysisPage() {
  const router = useRouter();
  const [inspectDetection, setInspectDetection] = useState<Detection | null>(null);

  return (
    <AppShell activeSection="analysis">
      <SonarAnalysisView
        onNewDetectionAdded={(newDet: Detection) => {
          console.log('New detection added:', newDet);
        }}
        onOpenDetailModal={(det: Detection) => {
          setInspectDetection(det);
        }}
        onNavigateToMap={(det: Detection) => {
          if (det?.coordinates) {
            router.push(`/map?lat=${det.coordinates.lat}&lng=${det.coordinates.lng}`);
          } else {
            router.push('/map');
          }
        }}
        onNavigateToReports={() => {
          router.push('/reports');
        }}
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
