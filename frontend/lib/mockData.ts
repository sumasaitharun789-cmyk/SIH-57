import {
  Detection,
  TelemetryData,
  MissionStats,
  AlertItem,
  TimelineEvent,
  SystemServiceHealth,
} from './types';

export const initialTelemetry: TelemetryData = {
  missionId: 'MISSION-042',
  missionName: 'Operation Ocean Sweep',
  vesselName: 'RV OCEAN EXPLORER',
  surveyArea: 'NORTH BAY / SECTOR 07',
  sector: 'Sector 07 (Coromandel Continental Shelf)',
  depth: 18.4,
  sonarFrequency: 455,
  signalQuality: 96,
  pingRate: 18,
  gainDb: 3.5,
  status: 'ACTIVE',
  vesselSpeedKnots: 4.2,
  headingDeg: 84,
  vesselPosition: {
    lat: 12.8452,
    lng: 80.1245,
  },
  towfishAltitude: 8.2,
  waterTemperatureC: 24.8,
  salinityPsu: 34.6,
};

export const initialStats: MissionStats = {
  sonarScans: 128,
  anomaliesDetected: 47,
  highPriorityCount: 9,
  surveyCoveragePct: 74,
  falsePositiveRejectionPct: 91.4,
  areaSurveyedKm2: 4.2,
  totalPingsProcessed: 452800,
  activeSector: 'SEC-07',
};

export const mockDetections: Detection[] = [
  {
    id: 'DET-042',
    name: 'Possible Ghost Net',
    category: 'Ghost Net',
    confidence: 94,
    fusedConfidence: 93,
    priority: 'HIGH',
    status: 'VERIFIED',
    depth: 18.4,
    range: 42.7,
    track: 'Port',
    coordinates: {
      lat: 12.8431,
      lng: 80.1232,
    },
    dimensions: {
      length: 14.2,
      width: 6.8,
      heightEstimate: 2.4,
    },
    timestamp: '2026-09-13 11:26:04 UTC',
    sonarBoundingBox: {
      x: 28,
      y: 35,
      width: 22,
      height: 18,
      shadowLength: 26,
    },
    evidence: {
      aiDetector: 94,
      shadowAnalysis: 91,
      geometryConsistency: 87,
      acousticSignature: 89,
      notes:
        'Large entangled fibrous mesh structure with continuous cast shadow indicative of vertical water column entanglement.',
    },
    spectralProfile: {
      specularReturn: 78,
      absorptionIndex: 84,
      seabedContrast: 12.4,
    },
    description:
      'Large abandoned nylon monofilament gillnet draped over a limestone outcrop. Cast acoustic shadow confirms vertical relief and entanglement threat to local cetaceans.',
    recommendation:
      'Dispatch ROV tagger or specialized recovery hook; urgent priority to prevent ghost fishing.',
  },
  {
    id: 'DET-043',
    name: 'Metallic Container Fragment',
    category: 'Metal Object',
    confidence: 81,
    fusedConfidence: 84,
    priority: 'MEDIUM',
    status: 'REVIEW',
    depth: 21.1,
    range: 28.5,
    track: 'Starboard',
    coordinates: {
      lat: 12.8475,
      lng: 80.1189,
    },
    dimensions: {
      length: 6.1,
      width: 2.4,
      heightEstimate: 1.8,
    },
    timestamp: '2026-09-13 11:42:19 UTC',
    sonarBoundingBox: {
      x: 64,
      y: 52,
      width: 18,
      height: 14,
      shadowLength: 20,
    },
    evidence: {
      aiDetector: 81,
      shadowAnalysis: 85,
      geometryConsistency: 88,
      acousticSignature: 84,
      notes:
        'High specular reflection on forward face accompanied by hard-edged geometric shadow typical of corrugated steel.',
    },
    spectralProfile: {
      specularReturn: 92,
      absorptionIndex: 22,
      seabedContrast: 16.8,
    },
    description:
      'Partially buried steel shipping container corner fitting. Highly reflective planar facet with sharp 90-degree acoustic shadow boundary.',
    recommendation:
      'Log coordinates with Chennai Maritime Port Authority for navigational clearance assessment.',
  },
  {
    id: 'DET-044',
    name: 'Natural Seabed Outcrop',
    category: 'Rock / Natural Feature',
    confidence: 67,
    fusedConfidence: 38,
    priority: 'LOW',
    status: 'REJECTED',
    depth: 16.9,
    range: 58.2,
    track: 'Port',
    coordinates: {
      lat: 12.8512,
      lng: 80.1163,
    },
    dimensions: {
      length: 8.5,
      width: 4.2,
      heightEstimate: 0.9,
    },
    timestamp: '2026-09-13 12:05:33 UTC',
    sonarBoundingBox: {
      x: 14,
      y: 68,
      width: 20,
      height: 16,
      shadowLength: 10,
    },
    evidence: {
      aiDetector: 67,
      shadowAnalysis: 32,
      geometryConsistency: 28,
      acousticSignature: 45,
      notes:
        'AI initially flagged as debris; rejected by Evidence Fusion due to gradual shadow gradient and natural fractal texture.',
    },
    spectralProfile: {
      specularReturn: 42,
      absorptionIndex: 61,
      seabedContrast: 4.2,
    },
    description:
      'Sedimentary sandstone shelf with sand ripple wash. Evidence fusion successfully filtered this false positive out from active threat alerts.',
    recommendation:
      'Marked as natural formation; no remediation required. Preserved in bathymetric baseline archive.',
  },
  {
    id: 'DET-045',
    name: 'Industrial Heavy Tire Cluster',
    category: 'Tire / Rubber',
    confidence: 91,
    fusedConfidence: 90,
    priority: 'HIGH',
    status: 'VERIFIED',
    depth: 17.2,
    range: 34.1,
    track: 'Port',
    coordinates: {
      lat: 12.8419,
      lng: 80.1274,
    },
    dimensions: {
      length: 4.8,
      width: 3.2,
      heightEstimate: 1.4,
    },
    timestamp: '2026-09-13 12:18:51 UTC',
    sonarBoundingBox: {
      x: 32,
      y: 18,
      width: 16,
      height: 15,
      shadowLength: 18,
    },
    evidence: {
      aiDetector: 91,
      shadowAnalysis: 88,
      geometryConsistency: 89,
      acousticSignature: 92,
      notes:
        'Distinct toroidal (donut-shaped) acoustic backscatter signatures clustered in an artificial triangle arrangement.',
    },
    spectralProfile: {
      specularReturn: 58,
      absorptionIndex: 79,
      seabedContrast: 9.8,
    },
    description:
      'Array of heavy machinery tires dumped off an unauthorized barge. Strong acoustic doughnut patterns with hollow center backscatter.',
    recommendation:
      'Designate for environmental dredging and heavy salvage cradle retrieval.',
  },
  {
    id: 'DET-046',
    name: 'Synthetic Polypropylene Tow Line',
    category: 'Plastic Debris',
    confidence: 78,
    fusedConfidence: 79,
    priority: 'MEDIUM',
    status: 'REVIEW',
    depth: 19.8,
    range: 51.0,
    track: 'Starboard',
    coordinates: {
      lat: 12.8491,
      lng: 80.1215,
    },
    dimensions: {
      length: 32.0,
      width: 0.4,
      heightEstimate: 0.6,
    },
    timestamp: '2026-09-13 12:34:10 UTC',
    sonarBoundingBox: {
      x: 76,
      y: 42,
      width: 14,
      height: 38,
      shadowLength: 12,
    },
    evidence: {
      aiDetector: 78,
      shadowAnalysis: 76,
      geometryConsistency: 82,
      acousticSignature: 79,
      notes:
        'Narrow continuous linear trace extending across three survey pings; linear correlation confirms artificial origin.',
    },
    spectralProfile: {
      specularReturn: 64,
      absorptionIndex: 71,
      seabedContrast: 8.5,
    },
    description:
      'Long marine mooring or tow cable snaking across silt bottom. High risk of snagging underwater survey equipment or ROV umbilical cords.',
    recommendation:
      'Caution notice to survey vessels; plan cutting blade ROV sweep on pass 3.',
  },
  {
    id: 'DET-047',
    name: 'Pressurized Chemical Canister',
    category: 'Munitions / Canister',
    confidence: 96,
    fusedConfidence: 95,
    priority: 'HIGH',
    status: 'VERIFIED',
    depth: 16.5,
    range: 19.2,
    track: 'Starboard',
    coordinates: {
      lat: 12.8462,
      lng: 80.1298,
    },
    dimensions: {
      length: 2.1,
      width: 0.9,
      heightEstimate: 0.9,
    },
    timestamp: '2026-09-13 12:49:02 UTC',
    sonarBoundingBox: {
      x: 58,
      y: 78,
      width: 12,
      height: 11,
      shadowLength: 16,
    },
    evidence: {
      aiDetector: 96,
      shadowAnalysis: 94,
      geometryConsistency: 95,
      acousticSignature: 91,
      notes:
        'Cylindrical symmetry verified with smooth specular highlight and uniform curved acoustic shadow gradient.',
    },
    spectralProfile: {
      specularReturn: 94,
      absorptionIndex: 18,
      seabedContrast: 18.2,
    },
    description:
      'Intact metallic pressurized cylinder resting on seabed. Possible industrial chemical container or obsolete naval test vessel component.',
    recommendation:
      'Notify Coast Guard hazmat unit; maintain 100m acoustic perimeter exclusion.',
  },
  {
    id: 'DET-048',
    name: 'Plastic Sheeting & Tarpaulin Trap',
    category: 'Plastic Debris',
    confidence: 74,
    fusedConfidence: 72,
    priority: 'MEDIUM',
    status: 'REVIEW',
    depth: 22.4,
    range: 46.8,
    track: 'Port',
    coordinates: {
      lat: 12.8398,
      lng: 80.1162,
    },
    dimensions: {
      length: 9.2,
      width: 5.5,
      heightEstimate: 0.7,
    },
    timestamp: '2026-09-13 13:01:22 UTC',
    sonarBoundingBox: {
      x: 22,
      y: 82,
      width: 19,
      height: 12,
      shadowLength: 10,
    },
    evidence: {
      aiDetector: 74,
      shadowAnalysis: 69,
      geometryConsistency: 71,
      acousticSignature: 72,
      notes:
        'Low-reflectance planar sheet capturing sediment. Diffuse edges with partial seabed transmission.',
    },
    spectralProfile: {
      specularReturn: 48,
      absorptionIndex: 82,
      seabedContrast: 6.9,
    },
    description:
      'Industrial plastic lining suffocating benthic flora. Sediment accumulation visible on trailing edge.',
    recommendation:
      'Schedule suction recovery during secondary environmental cleanup sweep.',
  },
  {
    id: 'DET-049',
    name: 'Cylindrical Pipe Section',
    category: 'Submerged Container',
    confidence: 92,
    fusedConfidence: 94,
    priority: 'HIGH',
    status: 'VERIFIED',
    depth: 18.9,
    range: 38.3,
    track: 'Port',
    coordinates: {
      lat: 12.8524,
      lng: 80.1251,
    },
    dimensions: {
      length: 11.4,
      width: 1.8,
      heightEstimate: 1.8,
    },
    timestamp: '2026-09-13 13:14:48 UTC',
    sonarBoundingBox: {
      x: 36,
      y: 60,
      width: 15,
      height: 22,
      shadowLength: 24,
    },
    evidence: {
      aiDetector: 92,
      shadowAnalysis: 95,
      geometryConsistency: 93,
      acousticSignature: 96,
      notes:
        'High-density metallic alloy signature with continuous rectangular shadow and crisp acoustic boundaries.',
    },
    spectralProfile: {
      specularReturn: 91,
      absorptionIndex: 25,
      seabedContrast: 15.6,
    },
    description:
      'Discarded oil drilling drill-casing section discarded during historical exploratory operations.',
    recommendation:
      'Add to national seabed obstruction registry; verify no residual petroleum products.',
  },
];

export const mockAlerts: AlertItem[] = [
  {
    id: 'ALT-101',
    detectionId: 'DET-042',
    title: 'High Priority Ghost Net Detected',
    message: 'Possible Ghost Net detected at 18.4m depth with 93% fused confidence. Severe snagging hazard.',
    priority: 'HIGH',
    timestamp: '11:26 UTC',
    read: false,
  },
  {
    id: 'ALT-102',
    detectionId: 'DET-047',
    title: 'Pressurized Canister Contact',
    message: 'High acoustic specular return detected on Starboard channel. Potential hazardous canister.',
    priority: 'HIGH',
    timestamp: '12:49 UTC',
    read: false,
  },
  {
    id: 'ALT-103',
    detectionId: 'DET-045',
    title: 'Submerged Tire Cluster Flagged',
    message: 'Artificial toroidal acoustic signatures verified by multi-factor evidence fusion (90%).',
    priority: 'HIGH',
    timestamp: '12:18 UTC',
    read: false,
  },
  {
    id: 'ALT-104',
    detectionId: 'DET-043',
    title: 'Metallic Container Anomaly',
    message: 'Corrugated steel corner detected at 28.5m range. Pending review.',
    priority: 'MEDIUM',
    timestamp: '11:42 UTC',
    read: true,
  },
];

export const mockTimeline: TimelineEvent[] = [
  {
    id: 'TL-1',
    time: '08:42 UTC',
    title: 'Survey Initiated',
    description: 'RV Ocean Explorer commenced survey line Alpha along Sector 07 Coromandel Shelf.',
    type: 'system',
  },
  {
    id: 'TL-2',
    time: '09:17 UTC',
    title: 'Sonar Stream Established',
    description: 'Dual-frequency 455/900 kHz side-scan towfish streaming at 18 pings/sec with 96% signal SNR.',
    type: 'system',
  },
  {
    id: 'TL-3',
    time: '10:04 UTC',
    title: 'First Anomaly Detected',
    description: 'Automated YOLOv8 acoustic model registered candidate target on port channel swath.',
    type: 'detection',
  },
  {
    id: 'TL-4',
    time: '11:26 UTC',
    title: 'High-Priority Contact Identified (DET-042)',
    description: 'Possible Ghost Net detected. Acoustic shadow geometry confirms large vertical relief.',
    type: 'alert',
    priority: 'HIGH',
    detectionId: 'DET-042',
  },
  {
    id: 'TL-5',
    time: '12:05 UTC',
    title: 'False Positive Rejection (DET-044)',
    description: 'Multi-factor evidence fusion rejected candidate rock ridge, reducing survey false alarms.',
    type: 'fusion',
    priority: 'LOW',
    detectionId: 'DET-044',
  },
  {
    id: 'TL-6',
    time: '12:41 UTC',
    title: 'Evidence Fusion Engine Batch Verified',
    description: 'Multi-channel Bayesian fusion confirmed 4 anomalies with >90% aggregate confidence.',
    type: 'fusion',
  },
  {
    id: 'TL-7',
    time: '13:05 UTC',
    title: 'Mission Sector 07 Progress Milestone',
    description: '74% survey coverage completed across 4.2 sq km bathymetric grid.',
    type: 'sector',
  },
];

export const mockSystemHealth: SystemServiceHealth[] = [
  {
    id: 'SH-1',
    name: 'SONAR SENSOR (TOWFISH)',
    status: 'ONLINE',
    latencyMs: 12,
    metrics: '455 kHz Dual • 18 Hz Ping',
    loadPct: 34,
  },
  {
    id: 'SH-2',
    name: 'AI INFERENCE ENGINE (YOLOv8)',
    status: 'ONLINE',
    latencyMs: 28,
    metrics: 'CUDA Core RT • 35 FPS',
    loadPct: 62,
  },
  {
    id: 'SH-3',
    name: 'SHADOW MORPHOLOGY PIPELINE',
    status: 'ONLINE',
    latencyMs: 14,
    metrics: 'Slant-Range Corrected',
    loadPct: 29,
  },
  {
    id: 'SH-4',
    name: 'GEOMETRY & SKELETON ANALYZER',
    status: 'ONLINE',
    latencyMs: 19,
    metrics: 'Fractal / Edge Curvature',
    loadPct: 38,
  },
  {
    id: 'SH-5',
    name: 'EVIDENCE FUSION ENGINE',
    status: 'ONLINE',
    latencyMs: 8,
    metrics: 'Bayesian / Dempster-Shafer',
    loadPct: 21,
  },
  {
    id: 'SH-6',
    name: 'GEOSPATIAL RTK-GPS SERVICE',
    status: 'ONLINE',
    latencyMs: 5,
    metrics: '±0.04m Position Accuracy',
    loadPct: 15,
  },
  {
    id: 'SH-7',
    name: 'DATABASE & TELEMETRY STREAM',
    status: 'ONLINE',
    latencyMs: 11,
    metrics: 'TimescaleDB • 250ms Sync',
    loadPct: 41,
  },
  {
    id: 'SH-8',
    name: 'API GATEWAY (FASTAPI READY)',
    status: 'ONLINE',
    latencyMs: 9,
    metrics: 'HTTP/2 REST + WebSockets',
    loadPct: 18,
  },
];

export const mockScanTimeSeries = [
  { time: '08:00', pingsProcessed: 28000, anomalies: 3, falsePositivesRejected: 8 },
  { time: '09:00', pingsProcessed: 64000, anomalies: 8, falsePositivesRejected: 19 },
  { time: '10:00', pingsProcessed: 112000, anomalies: 14, falsePositivesRejected: 34 },
  { time: '11:00', pingsProcessed: 178000, anomalies: 23, falsePositivesRejected: 52 },
  { time: '12:00', pingsProcessed: 245000, anomalies: 36, falsePositivesRejected: 71 },
  { time: '13:00', pingsProcessed: 320000, anomalies: 43, falsePositivesRejected: 88 },
  { time: '14:00', pingsProcessed: 452800, anomalies: 47, falsePositivesRejected: 104 },
];

export const mockCategoryDistribution = [
  { name: 'Ghost Nets', count: 16, percentage: 34, color: '#06b6d4' },
  { name: 'Metal Objects', count: 11, percentage: 23, color: '#38bdf8' },
  { name: 'Plastic Debris', count: 9, percentage: 19, color: '#818cf8' },
  { name: 'Tires / Rubber', count: 5, percentage: 11, color: '#f59e0b' },
  { name: 'Canisters / Ordnance', count: 4, percentage: 9, color: '#ef4444' },
  { name: 'Submerged Containers', count: 2, percentage: 4, color: '#10b981' },
];

export const mockSurveySectors = [
  { sector: 'Sector 01', coverage: 100, anomalies: 6, priority: 'LOW' },
  { sector: 'Sector 02', coverage: 100, anomalies: 8, priority: 'MEDIUM' },
  { sector: 'Sector 03', coverage: 100, anomalies: 5, priority: 'LOW' },
  { sector: 'Sector 04', coverage: 95, anomalies: 9, priority: 'HIGH' },
  { sector: 'Sector 05', coverage: 88, anomalies: 7, priority: 'MEDIUM' },
  { sector: 'Sector 06', coverage: 82, anomalies: 3, priority: 'LOW' },
  { sector: 'Sector 07 (Active)', coverage: 74, anomalies: 9, priority: 'HIGH' },
  { sector: 'Sector 08 (Scheduled)', coverage: 0, anomalies: 0, priority: 'PENDING' },
];

export const mockSampleImages = [
  {
    id: 'sample-1',
    name: 'Sample Sonar: Ghost Net (Sector 07)',
    filename: 'sonar_sample_ghost_net_455khz.png',
    resolution: '2048 x 1024',
    size: '3.4 MB',
    detectedType: 'Ghost Net',
    fusedConfidence: 94,
    previewColor: '#06b6d4',
  },
  {
    id: 'sample-2',
    name: 'Sample Sonar: Metallic Debris / Container',
    filename: 'sonar_sample_cargo_box_900khz.png',
    resolution: '1920 x 1080',
    size: '4.1 MB',
    detectedType: 'Metal Object',
    fusedConfidence: 88,
    previewColor: '#f59e0b',
  },
  {
    id: 'sample-3',
    name: 'Sample Sonar: Seabed Cable & Tire Bed',
    filename: 'sonar_sample_cable_tires_455khz.png',
    resolution: '2560 x 1280',
    size: '5.2 MB',
    detectedType: 'Tire / Rubber',
    fusedConfidence: 91,
    previewColor: '#10b981',
  },
];
