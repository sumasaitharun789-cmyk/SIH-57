'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import DetectionDetailView from '../../../components/DetectionDetailView';

export default function DetectionDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  return (
    <AppShell activeSection="detections">
      <DetectionDetailView detectionId={id || ''} />
    </AppShell>
  );
}
