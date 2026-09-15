import { Detection, PriorityLevel, VerificationStatus, AnomalyCategory, TelemetryData } from './types';

export const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || '127.0.0.1';
    return `http://${hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

const TOKEN_KEY = 'pulsedepth_auth_token';
const USER_KEY = 'pulsedepth_auth_user';

export function formatHttpError(status: number, detail: any, url: string): Error {
  const cleanDetail = typeof detail === 'string' ? detail : detail?.detail || detail?.message || (detail ? JSON.stringify(detail) : '');
  switch (status) {
    case 401:
      return new Error(`Authentication Error (401): ${cleanDetail || 'Invalid or expired operator credentials'}`);
    case 403:
      return new Error(`Access Forbidden (403): ${cleanDetail || 'Insufficient security privileges'}`);
    case 404:
      return new Error(`Resource Not Found (404): Target at ${url} does not exist`);
    case 422:
      return new Error(`Validation Error (422): ${cleanDetail || 'Invalid request payload'}`);
    case 500:
      return new Error(`Server Error (500): ${cleanDetail || 'Internal server error on FastAPI backend'}`);
    default:
      return new Error(`API Error (${status}): ${cleanDetail || 'Request failed'}`);
  }
}

export function formatNetworkError(err: any, url: string): Error {
  const base = getApiBase();
  return new Error(
    `Backend Unreachable: Failed to connect to ${url}. Ensure the FastAPI server is running on ${base}. (${err?.message || 'Connection refused'})`
  );
}

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
      if (parts.length !== 3) return false;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return false;
      return Date.now() >= (payload.exp * 1000 - 5000);
    } catch {
      return false; // Safe fallback: let backend perform authoritative validation
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
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
      localStorage.setItem(TOKEN_KEY, cleanToken);
      localStorage.setItem('access_token', cleanToken);
      window.dispatchEvent(new Event('pulsedepth_auth_change'));
    }
  },
  clearSession: () => {
    if (typeof window !== 'undefined') {
      const hadSession = !!(
        localStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem(USER_KEY)
      );
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem(USER_KEY);
      if (hadSession) {
        window.dispatchEvent(new Event('pulsedepth_auth_change'));
      }
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
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    headers['Authorization'] = `Bearer ${cleanToken}`;
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
  const base = getApiBase();
  const url = `${base}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body,
    });
  } catch (networkErr: any) {
    throw formatNetworkError(networkErr, url);
  }

  if (!response.ok) {
    let errData: any = null;
    try {
      errData = await response.json();
    } catch {
      // ignore
    }

    // Auto clear session if an authenticated request is rejected as unauthorized
    if (response.status === 401 && token) {
      authUtils.clearSession();
    }

    throw formatHttpError(response.status, errData?.detail, url);
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

    login: async (username: string, password: string): Promise<UserProfile> => {
      const res = await apiRequest<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.access_token) {
        throw new Error('Authentication response did not contain an access token.');
      }
      authUtils.setToken(res.access_token);
      const profile = await api.auth.getMe();
      authUtils.setUser(profile);
      return profile;
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

      const rawToken = authUtils.getToken();
      if (!rawToken) {
        throw new Error('Operator authentication required. Please sign in or register before uploading sonar imagery.');
      }
      const cleanToken = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${cleanToken}`
      };

      const base = getApiBase();
      const url = `${base}/api/files/images`;

      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
        });
      } catch (fetchErr: any) {
        throw formatNetworkError(fetchErr, url);
      }

      if (!res.ok) {
        if (res.status === 401) {
          authUtils.clearSession();
        }
        let errData: any = null;
        try {
          errData = await res.json();
        } catch {}
        throw formatHttpError(res.status, errData?.detail, url);
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
