'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import AnalyticsView from '../../components/AnalyticsView';
import { api, adaptBackendDetection } from '../../lib/api';
import { Detection } from '../../lib/types';
import { mockDetections } from '../../lib/mockData';

export default function AnalyticsPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
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
    <AppShell activeSection="analytics">
      <AnalyticsView detections={detections} />
    </AppShell>
  );
}
