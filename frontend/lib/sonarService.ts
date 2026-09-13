import { Detection, ProcessingStep } from './types';

export const PROCESSING_STEPS: Omit<ProcessingStep, 'status'>[] = [
  {
    step: 1,
    key: 'received',
    name: '01 IMAGE RECEIVED',
    description: 'Acoustic imagery loaded, header verified, resolution mapped.',
  },
  {
    step: 2,
    key: 'preprocess',
    name: '02 PREPROCESSING',
    description: 'Slant-range correction, Lee filter despeckling, and TVG normalization.',
  },
  {
    step: 3,
    key: 'ai_detection',
    name: '03 AI DETECTION (YOLOv8)',
    description: 'Acoustic feature extraction & bounding box localization.',
  },
  {
    step: 4,
    key: 'shadow_analysis',
    name: '04 SHADOW ANALYSIS',
    description: 'Acoustic shadow length, towfish altitude angle & 3D relief triangulation.',
  },
  {
    step: 5,
    key: 'geometry_check',
    name: '05 GEOMETRY CONSISTENCY',
    description: 'Edge linearity, orthogonal angles, and artificial symmetry check.',
  },
  {
    step: 6,
    key: 'evidence_fusion',
    name: '06 EVIDENCE FUSION',
    description: 'Bayesian multi-factor belief update & false positive rejection.',
  },
  {
    step: 7,
    key: 'result_ready',
    name: '07 RESULT VERIFIED',
    description: 'Marine debris classification confirmed; geospatial coordinates registered.',
  },
];

/**
 * Calculates Bayesian Fused Confidence from four independent evidence channels.
 * Multi-factor verification heavily penalizes false positives (e.g. natural rock outcrops).
 */
export function calculateFusedConfidence(
  aiScore: number,
  shadowScore: number,
  geometryScore: number,
  acousticScore: number
): { fused: number; isVerified: boolean } {
  // Weighted Bayesian evidence fusion
  // Weights: AI (0.35), Shadow (0.25), Geometry (0.20), Acoustic (0.20)
  const weighted =
    aiScore * 0.35 +
    shadowScore * 0.25 +
    geometryScore * 0.20 +
    acousticScore * 0.20;

  // Penalize if shadow or geometry drastically conflicts with AI detection (hallucination defense)
  let penalty = 0;
  if (Math.abs(aiScore - shadowScore) > 40) {
    penalty += 12;
  }
  if (geometryScore < 40 && aiScore > 70) {
    penalty += 18;
  }

  const fused = Math.max(15, Math.min(99, Math.round(weighted - penalty)));
  const isVerified = fused >= 75;

  return { fused, isVerified };
}

/**
 * Simulates a realistic multi-stage AI analysis pipeline with asynchronous step progression.
 * In a production deployment, this function connects to the Python FastAPI backend:
 * POST /api/v1/sonar/process
 */
export async function runSimulatedAnalysis(
  fileName: string,
  onStepUpdate: (steps: ProcessingStep[]) => void
): Promise<Detection> {
  const steps: ProcessingStep[] = PROCESSING_STEPS.map((s, idx) => ({
    ...s,
    status: idx === 0 ? 'processing' : 'pending',
  }));

  onStepUpdate([...steps]);

  const stepDelays = [400, 650, 750, 600, 550, 650, 500];

  for (let i = 0; i < steps.length; i++) {
    steps[i].status = 'processing';
    onStepUpdate([...steps]);

    await new Promise((resolve) => setTimeout(resolve, stepDelays[i]));

    steps[i].status = 'completed';
    if (i < steps.length - 1) {
      steps[i + 1].status = 'processing';
    }
    onStepUpdate([...steps]);
  }

  // Generate newly detected marine debris contact
  const isGhostNet = fileName.toLowerCase().includes('net');
  const isContainer = fileName.toLowerCase().includes('cargo') || fileName.toLowerCase().includes('container');
  const isTire = fileName.toLowerCase().includes('tire') || fileName.toLowerCase().includes('cable');

  const randomId = `DET-0${Math.floor(50 + Math.random() * 49)}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const newDetection: Detection = {
    id: randomId,
    name: isGhostNet
      ? 'Verified Ghost Net'
      : isContainer
      ? 'Submerged Cargo Hull'
      : isTire
      ? 'Industrial Debris Bed'
      : 'Acoustic Debris Anomaly',
    category: isGhostNet
      ? 'Ghost Net'
      : isContainer
      ? 'Metal Object'
      : isTire
      ? 'Tire / Rubber'
      : 'Plastic Debris',
    confidence: isGhostNet ? 95 : 88,
    fusedConfidence: isGhostNet ? 94 : 89,
    priority: 'HIGH',
    status: 'VERIFIED',
    depth: 18.2 + Number((Math.random() * 3).toFixed(1)),
    range: 36.4 + Number((Math.random() * 10).toFixed(1)),
    track: Math.random() > 0.5 ? 'Port' : 'Starboard',
    coordinates: {
      lat: 12.844 + (Math.random() - 0.5) * 0.015,
      lng: 80.122 + (Math.random() - 0.5) * 0.015,
    },
    dimensions: {
      length: Number((6.5 + Math.random() * 8).toFixed(1)),
      width: Number((3.0 + Math.random() * 4).toFixed(1)),
      heightEstimate: Number((1.2 + Math.random() * 1.8).toFixed(1)),
    },
    timestamp: now,
    sonarBoundingBox: {
      x: 30 + Math.floor(Math.random() * 40),
      y: 25 + Math.floor(Math.random() * 45),
      width: 20,
      height: 18,
      shadowLength: 22,
    },
    evidence: {
      aiDetector: 95,
      shadowAnalysis: 92,
      geometryConsistency: 89,
      acousticSignature: 91,
      notes:
        'Uploaded scan processed through multi-factor pipeline. Sharp acoustic shadow confirms vertical seabed elevation.',
    },
    spectralProfile: {
      specularReturn: 86,
      absorptionIndex: 78,
      seabedContrast: 14.2,
    },
    description: `Analyzed from uploaded sonar swath "${fileName}". Multi-source evidence fusion verified anomalous seabed target without false positive interference.`,
    recommendation: 'Log target in national marine debris registry and dispatch survey inspection ROV.',
  };

  return newDetection;
}
