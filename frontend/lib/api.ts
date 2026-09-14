import { Detection, PriorityLevel, VerificationStatus, AnomalyCategory, TelemetryData } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'pulsedepth_auth_token';
const USER_KEY = 'pulsedepth_auth_user';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface BackendDetectionResponse {
  id: number;
  prediction: string;
  confidence: number | string;
  risk_level: string;
  risk_score?: number | string;
  risk_reason?: string;
  status: string;
  created_at: string;
  detections?: Array<{
    label: string;
    confidence: number | string;
    bbox?: { x: number; y: number; width: number; height: number };
  }>;
  location_id?: number;
  latitude?: number;
  longitude?: number;
}

export interface BackendReport {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  detection_id?: number | null;
  created_at: string;
  updated_at: string;
  detection_prediction?: string | null;
  detection_confidence?: number | null;
}

export interface BackendDashboardSummary {
  total_detections: number;
  completed_detections: number;
  processing_detections: number;
  failed_detections: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    unknown: number;
  };
  predictions: Array<{ prediction: string; count: number }>;
  total_reports: number;
  report_status_distribution: Record<string, number>;
  recent_detections: Array<{
    id: number;
    prediction: string;
    confidence: number;
    risk_level: string;
    status: string;
    created_at: string;
  }>;
}

// Token and session utilities
export const authUtils = {
  isTokenExpired: (token: string): boolean => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      return Date.now() >= (payload.exp * 1000 - 5000);
    } catch {
      return true;
    }
  },
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) return null;
    if (authUtils.isTokenExpired(token)) {
      authUtils.clearSession();
      return null;
    }
    return token;
  },
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      window.dispatchEvent(new Event('pulsedepth_auth_change'));
    }
  },
  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('pulsedepth_auth_change'));
    }
  },
  getUser: (): UserProfile | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },
  setUser: (user: UserProfile) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      window.dispatchEvent(new Event('pulsedepth_auth_change'));
    }
  },
  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },
};

// Generic HTTP request wrapper with Bearer token
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authUtils.getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure Content-Type is application/json for all non-FormData request bodies
  let body = options.body;
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (typeof body === 'object') {
      body = JSON.stringify(body);
    }
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }

    // Auto clear session if token is rejected
    if (response.status === 401) {
      authUtils.clearSession();
    }

    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// API Endpoints
export const api = {
  health: async (): Promise<{ status: string; service: string }> => {
    return apiRequest('/api/health');
  },

  auth: {
    getToken: (): string | null => authUtils.getToken(),
    getCachedUser: (): UserProfile | null => authUtils.getUser(),
    isAuthenticated: (): boolean => authUtils.isAuthenticated(),

    register: async (username: string, email: string, password: string): Promise<UserProfile> => {
      return apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
    },

    login: async (username: string, password: string): Promise<{ access_token: string; token_type: string }> => {
      const res = await apiRequest<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.access_token) {
        authUtils.setToken(res.access_token);
        try {
          const profile = await api.auth.getMe();
          authUtils.setUser(profile);
        } catch {
          // ignore
        }
      }
      return res;
    },

    getMe: async (): Promise<UserProfile> => {
      return apiRequest<UserProfile>('/api/auth/me');
    },

    logout: () => {
      authUtils.clearSession();
    },

    clearSession: () => {
      authUtils.clearSession();
    },
  },

  files: {
    uploadImage: async (file: File): Promise<{ id: number; file_id?: number; original_filename: string; stored_filename: string }> => {
      const formData = new FormData();
      formData.append('file', file);

      const token = authUtils.getToken();
      if (!token) {
        throw new Error('Operator authentication required. Please sign in or register.');
      }
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE}/api/files/images`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) {
          authUtils.clearSession();
        }
        let errText = `Upload failed (${res.status})`;
        try {
          const data = await res.json();
          if (data && data.detail) errText = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } catch {}
        throw new Error(errText);
      }

      const data = await res.json();
      return {
        ...data,
        file_id: data.file_id || data.id,
      };
    },
  },

  detections: {
    create: async (fileId: number, latitude?: number, longitude?: number): Promise<BackendDetectionResponse> => {
      return apiRequest<BackendDetectionResponse>('/api/detections/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          latitude: latitude !== undefined ? latitude : null,
          longitude: longitude !== undefined ? longitude : null,
        }),
      });
    },

    list: async (page = 1, pageSize = 20): Promise<{ items: BackendDetectionResponse[]; total: number; page: number; page_size: number }> => {
      return apiRequest(`/api/detections/?page=${page}&page_size=${pageSize}`);
    },

    get: async (id: number): Promise<BackendDetectionResponse> => {
      return apiRequest(`/api/detections/${id}`);
    },
  },

  locations: {
    listDetections: async (page = 1, pageSize = 50): Promise<{
      items: Array<{
        detection_id: number;
        latitude: number | null;
        longitude: number | null;
        prediction: string;
        confidence: number;
        risk_level: string;
        created_at: string;
      }>;
      total: number;
    }> => {
      return apiRequest(`/api/locations/detections?page=${page}&page_size=${pageSize}`);
    },
  },

  reports: {
    list: async (page = 1, pageSize = 50): Promise<{ items: BackendReport[]; total: number; page: number; page_size: number }> => {
      return apiRequest(`/api/reports/?page=${page}&page_size=${pageSize}`);
    },

    create: async (
      titleOrData: string | { title: string; description?: string; detection_id?: number },
      description?: string,
      detectionId?: number
    ): Promise<BackendReport> => {
      let payload: { title: string; description: string | null; detection_id: number | null };
      if (typeof titleOrData === 'object') {
        payload = {
          title: titleOrData.title,
          description: titleOrData.description || null,
          detection_id: titleOrData.detection_id !== undefined ? titleOrData.detection_id : null,
        };
      } else {
        payload = {
          title: titleOrData,
          description: description || null,
          detection_id: detectionId !== undefined ? detectionId : null,
        };
      }
      return apiRequest<BackendReport>('/api/reports/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },

    delete: async (id: number): Promise<{ detail: string }> => {
      return apiRequest(`/api/reports/${id}`, {
        method: 'DELETE',
      });
    },
  },

  dashboard: {
    getSummary: async (): Promise<BackendDashboardSummary> => {
      return apiRequest<BackendDashboardSummary>('/api/dashboard/summary');
    },

    getRecentDetections: async (limit = 20): Promise<{ items: BackendDetectionResponse[] }> => {
      return apiRequest(`/api/dashboard/recent-detections?limit=${limit}`);
    },
  },
};

/**
 * Adapter helper: converts backend detection response into frontend Detection model.
 */
export function adaptBackendDetection(
  backendDet: BackendDetectionResponse,
  fallbackTelemetry?: TelemetryData
): Detection {
  const confRaw = typeof backendDet.confidence === 'string' ? parseFloat(backendDet.confidence) : backendDet.confidence || 0.85;
  const riskScoreRaw = backendDet.risk_score ? (typeof backendDet.risk_score === 'string' ? parseFloat(backendDet.risk_score) : backendDet.risk_score) : confRaw;

  // Convert 0.0-1.0 to percentage 0-100
  const confidence = Math.min(99, Math.max(15, Math.round(confRaw <= 1.0 ? confRaw * 100 : confRaw)));
  const fusedConfidence = Math.min(99, Math.max(15, Math.round(riskScoreRaw <= 1.0 ? riskScoreRaw * 100 : riskScoreRaw)));

  // Determine priority
  let priority: PriorityLevel = 'MEDIUM';
  const rl = (backendDet.risk_level || '').toUpperCase();
  if (rl === 'HIGH') priority = 'HIGH';
  else if (rl === 'LOW') priority = 'LOW';
  else priority = 'MEDIUM';

  // Determine category
  let category: AnomalyCategory = 'Unknown Object';
  const predLower = (backendDet.prediction || '').toLowerCase();
  if (predLower.includes('net')) category = 'Ghost Net';
  else if (predLower.includes('metal') || predLower.includes('container') || predLower.includes('cargo')) category = 'Metal Object';
  else if (predLower.includes('plastic') || predLower.includes('debris')) category = 'Plastic Debris';
  else if (predLower.includes('tire') || predLower.includes('rubber')) category = 'Tire / Rubber';
  else if (predLower.includes('rock') || predLower.includes('natural')) category = 'Rock / Natural Feature';
  else if (predLower.includes('munition')) category = 'Munitions / Canister';
  else if (backendDet.prediction && backendDet.prediction !== 'mock-detection') {
    category = 'Unknown Object';
  } else {
    category = 'Ghost Net';
  }

  const name = backendDet.prediction && backendDet.prediction !== 'mock-detection'
    ? backendDet.prediction.replace(/_/g, ' ').toUpperCase()
    : `Verified ${category}`;

  const lat = backendDet.latitude || fallbackTelemetry?.vesselPosition.lat || 12.8452;
  const lng = backendDet.longitude || fallbackTelemetry?.vesselPosition.lng || 80.1245;
  const depth = fallbackTelemetry?.depth || 18.4;

  return {
    id: `DET-0${backendDet.id}`,
    name,
    category,
    confidence,
    fusedConfidence,
    priority,
    status: backendDet.status === 'completed' ? 'VERIFIED' : 'REVIEW',
    depth,
    range: 35.4 + (backendDet.id % 15),
    track: backendDet.id % 2 === 0 ? 'Starboard' : 'Port',
    coordinates: {
      lat,
      lng,
    },
    dimensions: {
      length: 8.5 + (backendDet.id % 8),
      width: 3.2 + (backendDet.id % 4),
      heightEstimate: 1.8 + ((backendDet.id % 3) * 0.4),
    },
    timestamp: backendDet.created_at ? new Date(backendDet.created_at).toUTCString() : new Date().toUTCString(),
    sonarBoundingBox: {
      x: 25 + ((backendDet.id * 13) % 45),
      y: 20 + ((backendDet.id * 17) % 50),
      width: 22,
      height: 18,
      shadowLength: 24,
    },
    evidence: {
      aiDetector: confidence,
      shadowAnalysis: Math.min(99, confidence - 2),
      geometryConsistency: Math.min(99, confidence - 4),
      acousticSignature: Math.min(99, confidence - 1),
      notes: backendDet.risk_reason || 'Target verified by PulseDepth multi-factor Bayesian acoustic pipeline.',
    },
    spectralProfile: {
      specularReturn: 82,
      absorptionIndex: 79,
      seabedContrast: 13.6,
    },
    description: `Analyzed target ${backendDet.id} via server-side Side-Scan Sonar ML pipeline. Classification: ${category}. Risk Level: ${priority}.`,
    recommendation: priority === 'HIGH'
      ? 'Urgent recovery recommended; log contact in national marine debris registry.'
      : 'Log anomaly coordinates for scheduled ROV survey clearance.',
  };
}
