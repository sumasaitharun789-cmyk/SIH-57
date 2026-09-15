'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import ReportsView from '../../components/ReportsView';
import { api, adaptBackendDetection } from '../../lib/api';
import { Detection } from '../../lib/types';
import { mockDetections } from '../../lib/mockData';

export default function ReportsPage() {
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
    <AppShell activeSection="reports">
      <ReportsView detections={detections} />
    </AppShell>
  );
}
