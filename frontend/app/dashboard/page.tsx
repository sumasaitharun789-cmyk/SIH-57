'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import OverviewView from '../../components/OverviewView';
import DetectionDetailModal from '../../components/DetectionDetailModal';
import { api, adaptBackendDetection, BackendDashboardSummary } from '../../lib/api';
import { Detection } from '../../lib/types';
import { mockDetections } from '../../lib/mockData';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<BackendDashboardSummary | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sumData, detData] = await Promise.allSettled([
        api.dashboard.getSummary(),
        api.detections.list(1, 100),
      ]);

      if (sumData.status === 'fulfilled') {
        setSummary(sumData.value);
      }

      if (detData.status === 'fulfilled' && detData.value?.items?.length > 0) {
        setDetections(detData.value.items.map(d => adaptBackendDetection(d)));
      } else {
        setDetections(mockDetections);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
      setDetections(mockDetections);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeSection="overview">
      <OverviewView
        summary={summary}
        detections={detections}
        onSelectDetection={(d) => setSelectedDetection(d)}
        onNavigate={(sec) => {
          if (sec === 'analysis') router.push('/analysis');
          if (sec === 'map') router.push('/map');
          if (sec === 'detections') router.push('/detections');
        }}
      />
      {selectedDetection && (
        <DetectionDetailModal
          detection={selectedDetection}
          onClose={() => setSelectedDetection(null)}
          onOpenOnMap={(d) => router.push(`/map?lat=${d.coordinates?.lat}&lng=${d.coordinates?.lng}`)}
          onGenerateReport={() => router.push('/reports')}
        />
      )}
    </AppShell>
  );
}
