export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationStatus = 'VERIFIED' | 'REVIEW' | 'REJECTED';

export type AnomalyCategory =
  | 'Ghost Net'
  | 'Fishing Gear'
  | 'Pipe / Cylinder'
  | 'Shipwreck'
  | 'Other Debris'
  | 'Suspicious Object'
  | 'Metal Object'
  | 'Plastic Debris'
  | 'Rock / Natural Feature'
  | 'Munitions / Canister'
  | 'Tire / Rubber'
  | 'Submerged Container'
  | 'Unknown Object';

export interface EvidenceScore {
  aiDetector: number; // 0-100%
  shadowAnalysis: number; // 0-100%
  geometryConsistency: number; // 0-100%
  acousticSignature: number; // 0-100%
  notes: string;
}

export interface SonarBoundingBox {
  x: number; // percentage 0-100 of channel width
  y: number; // percentage 0-100 of waterfall height
  width: number;
  height: number;
  shadowLength: number;
}

export interface Detection {
  id: string;
  numericId?: number;
  uploadedFileId?: number;
  name: string;
  category: AnomalyCategory;
  confidence: number;
  fusedConfidence: number;
  priority: PriorityLevel;
  riskLevel?: PriorityLevel | string;
  status: VerificationStatus;
  depth: number; // meters
  range: number; // meters from towfish
  track: 'Port' | 'Starboard';
  acrossTrack?: number; // meters
  alongTrack?: number; // meters
  heading?: number; // degrees
  imageUrl?: string;
  boundingBox?: any;
  evidenceFlags?: any;
  coordinates: {
    lat: number;
    lng: number;
  };
  dimensions: {
    length: number; // meters
    width: number; // meters
    heightEstimate: number; // meters
  };
  timestamp: string;
  sonarBoundingBox: SonarBoundingBox;
  evidence: EvidenceScore;
  spectralProfile: {
    specularReturn: number; // %
    absorptionIndex: number; // %
    seabedContrast: number; // dB
  };
  description: string;
  recommendation: string;
}

export interface TelemetryData {
  missionId: string;
  missionName: string;
  vesselName: string;
  surveyArea: string;
  sector: string;
  depth: number;
  sonarFrequency: 455 | 900;
  signalQuality: number;
  pingRate: number;
  gainDb: number;
  status: 'ACTIVE' | 'STANDBY' | 'CALIBRATING';
  vesselSpeedKnots: number;
  headingDeg: number;
  vesselPosition: {
    lat: number;
    lng: number;
  };
  towfishAltitude: number;
  waterTemperatureC: number;
  salinityPsu: number;
}

export interface MissionStats {
  sonarScans: number;
  anomaliesDetected: number;
  highPriorityCount: number;
  surveyCoveragePct: number;
  falsePositiveRejectionPct: number;
  areaSurveyedKm2: number;
  totalPingsProcessed: number;
  activeSector: string;
}

export interface AlertItem {
  id: string;
  detectionId: string;
  title: string;
  message: string;
  priority: PriorityLevel;
  timestamp: string;
  read: boolean;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'system' | 'detection' | 'fusion' | 'sector' | 'alert';
  priority?: PriorityLevel;
  detectionId?: string;
}

export interface SystemServiceHealth {
  id: string;
  name: string;
  status: 'ONLINE' | 'DEGRADED' | 'STANDBY';
  latencyMs: number;
  metrics: string;
  loadPct: number;
}

export interface ProcessingStep {
  step: number;
  name: string;
  key: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metric?: string;
}

export type SonarPalette = 'copper' | 'cyan' | 'monochrome' | 'emerald';
