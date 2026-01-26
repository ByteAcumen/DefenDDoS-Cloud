// DefenDDoS Frontend API Service - All 31 Endpoints
// Last Updated: October 16, 2025
// API Version: 2.0

import axios, { AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8082';
const ML_SERVICE_URL = 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'defenddos-api-key',
  },
});

// Generic API response type
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Traffic data types
interface TrafficData {
  sourceIp: string;
  destinationIp: string;
  packetCount: number;
  byteCount: number;
  timestamp?: string;
}

interface TrafficRecord {
  sourceIp: string;
  destinationIp: string;
  field: string;
  value: number;
  time: string;
}

interface TrafficSummary {
  sourceIp: string;
  totalPackets: number;
  timeRange: string;
}

interface VisualizationPoint {
  time: string;
  totalPackets: number;
}

// ML Prediction types
interface MLPrediction {
  is_attack: boolean;
  attack_type: string;
  confidence: number;
  severity: string;
}

interface MLPredictionRecord {
  sourceIp: string;
  isAttack: boolean;
  attackType: string;
  confidence: number;
  timestamp: string;
}

// Statistics types
interface DetailedStats {
  totalPackets: number;
  totalBytes: number;
  totalConnections: number;
  attackEvents: number;
  blockedIps: number;
  timeRange: string;
}

interface RealtimeMetrics {
  currentPPS: number;
  currentBPS: number;
  activeThreats: number;
  window: string;
}

interface AttackAnalysis {
  attackId: string;
  attackType: string;
  attackCount: number;
  severity: string;
  timeRange: string;
}

interface MLStats {
  totalPredictions: number;
  attackPredictions: number;
  benignPredictions: number;
  averageConfidence: number;
  timeRange: string;
}

// Mitigation types
interface MitigationStatus {
  enabled: boolean;
  dryRunMode: boolean;
  blockedCount: number;
  maxBlockedIps: number;
  blockScriptPath: string;
  unblockScriptPath: string;
}

interface BlockedIpsResponse {
  timestamp: number;
  blockedIps: string[];
  count: number;
}

interface BlockResponse {
  ip: string;
  success: boolean;
  reason: string;
}

interface UnblockResponse {
  timestamp: number;
  message: string;
  ip: string;
  success: boolean;
}

interface IPCheckResponse {
  timestamp: number;
  ip: string;
  isBlocked: boolean;
  status: string;
}

interface MitigationStats {
  maxBlockedIps: number;
  lastUpdated: number;
  dryRunMode: boolean;
  blockedCount: number;
  enabled: boolean;
}

// Security types
interface SecurityDashboard {
  activeThreats: number;
  lastScan: string;
  systemHealth: string;
  detectionEnabled: boolean;
  alertsEnabled: boolean;
  status: string;
}

// Threat Intelligence types
interface ThreatCheck {
  riskLevel: string;
  isKnownThreat: boolean;
  ipAddress: string;
  reputationScore: number;
}

interface ReputationScore {
  riskLevel: string;
  ipAddress: string;
  reputationScore: number;
}

interface ThreatInfo {
  description: string;
  severity: string;
  timestamp: string;
}

// Database statistics
interface DatabaseStats {
  ml_predictions_count: number;
  bucket: string;
  blocked_ips_count: number;
  traffic_data_count: number;
  detection_events_count: number;
}

// Health check types
interface BackendHealth {
  status: 'UP' | 'DOWN';
}

interface MLHealth {
  status: string;
  rf_model_loaded: boolean;
  scaler_loaded: boolean;
  lstm_model_loaded: boolean;
}

interface MLConnectionHealth extends ApiResponse<{
  status: string;
  ml_service_status: string;
  ml_models_loaded: boolean;
}> { }

// Actuator types
interface MetricsResponse {
  names: string[];
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: new Date().getTime(),
    };

    // Add any auth tokens here in the future
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('⚠️ Request configuration error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Only log errors in development mode with meaningful info
    if (process.env.NODE_ENV === 'development') {
      const errorInfo = {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        message: error.message,
      };

      // Only log if we have useful information
      if (error.response?.status) {
        console.error(`🚨 API Error [${errorInfo.method} ${errorInfo.url}]: ${errorInfo.status} - ${error.response?.statusText || error.message}`);

        // Log response data if available and meaningful
        if (error.response?.data && typeof error.response.data === 'object' && Object.keys(error.response.data).length > 0) {
          console.error('Response:', error.response.data);
        }
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        console.error(`🔌 Network Error [${errorInfo.method} ${errorInfo.url}]: Cannot connect to backend`);
      }
    }

    // Handle different error scenarios silently
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error('Backend service unavailable'));
    }

    if (error.response) {
      // Server responded with error - return the error without additional logging
      return Promise.reject(error.response.data || error);
    } else if (error.request) {
      // Network error
      return Promise.reject(new Error('Network error'));
    }

    return Promise.reject(error);
  }
);

// Generic API request wrapper with error handling
export async function apiRequest<T>(
  requestFn: () => Promise<AxiosResponse<T>>
): Promise<T> {
  try {
    const response = await requestFn();
    return response.data;
  } catch (error) {
    // Error already logged in interceptor, just rethrow
    throw error;
  }
}

// Health check utility
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    // Use the proxy route for health checks
    const response = await axios.get('/api/health');
    return response.status === 200;
  } catch {
    return false;
  }
};

// ===== API SERVICE FUNCTIONS =====
// All API calls use Next.js proxy routes to avoid CORS issues

// Traffic API Services
export const trafficApi = {
  // POST /api/v1/traffic/ingest
  ingestTraffic: (trafficPoint: any) =>
    apiRequest(() => apiClient.post('/traffic/ingest', trafficPoint)),

  // GET /api/v1/traffic/query?range=-1h
  queryTraffic: (range = '-1h') =>
    apiRequest(() => apiClient.get(`/traffic/query?range=${range}`)),

  // GET /api/v1/traffic/summary?range=-1h
  getTrafficSummary: (range = '-1h') =>
    apiRequest(() => apiClient.get(`/traffic/summary?range=${range}`)),

  // GET /api/v1/traffic/visualization?range=-1h&window=1m
  getTrafficVisualization: (range = '-1h', window = '1m') =>
    apiRequest(() => apiClient.get(`/traffic/visualization?range=${range}&window=${window}`)),

  // POST /api/v1/traffic/predict-attack
  predictAttack: (trafficPoint: any) =>
    apiRequest(() => apiClient.post('/traffic/predict-attack', trafficPoint)),

  // GET /api/v1/traffic/ml-health
  checkMLHealth: () =>
    apiRequest(() => apiClient.get('/traffic/ml-health')),
};

// Statistics API Services (NEW)
export const statisticsApi = {
  // GET /api/v1/statistics/detailed?range=-1h
  getDetailedStats: (range = '-1h') =>
    apiRequest(() => apiClient.get(`/statistics/detailed?range=${range}`)),

  // GET /api/v1/statistics/realtime
  getRealtimeStats: () =>
    apiRequest(() => apiClient.get('/statistics/realtime')),

  // GET /api/v1/statistics/attack-analysis?range=-1h&sourceIp=
  getAttackAnalysis: (range = '-1h', sourceIp?: string) =>
    apiRequest(() => apiClient.get(`/statistics/attack-analysis`, {
      params: { range, ...(sourceIp && { sourceIp }) }
    })),
};

// Data Retrieval API Services (NEW)
export const dataApi = {
  // GET /api/v1/data/traffic/all?range=-24h
  getAllTrafficData: (range = '-24h') =>
    apiRequest(() => apiClient.get(`/data/traffic/all?range=${range}`)),

  // GET /api/v1/data/ml-predictions/all?range=-24h
  getAllMLPredictions: (range = '-24h') =>
    apiRequest(() => apiClient.get(`/data/ml-predictions/all?range=${range}`)),

  // GET /api/v1/data/detection-events/all?range=-24h
  getAllDetectionEvents: (range = '-24h') =>
    apiRequest(() => apiClient.get(`/data/detection-events/all?range=${range}`)),

  // GET /api/v1/data/blocked-ips/all?range=-30d
  getAllBlockedIPs: (range = '-30d') =>
    apiRequest(() => apiClient.get(`/data/blocked-ips/all?range=${range}`)),

  // GET /api/v1/data/statistics
  getDatabaseStats: () =>
    apiRequest(() => apiClient.get('/data/statistics')),

  // GET /api/v1/data/export?range=-24h
  exportAllData: (range = '-24h') =>
    apiRequest(() => apiClient.get(`/data/export?range=${range}`)),
};

// Mitigation API Services
export const mitigationApi = {
  // GET /api/v1/mitigation/status
  getStatus: () =>
    apiRequest(() => apiClient.get('/mitigation/status')),

  // GET /api/v1/mitigation/blocked
  getBlockedIps: () =>
    apiRequest(() => apiClient.get('/mitigation/blocked')),

  // POST /api/v1/mitigation/block/{ip}
  blockIp: (ip: string, reason = 'Manual block via frontend') =>
    apiRequest(() => apiClient.post(`/mitigation/block/${ip}?reason=${encodeURIComponent(reason)}`)),

  // POST /api/v1/mitigation/unblock/{ip}
  unblockIp: (ip: string) =>
    apiRequest(() => apiClient.post(`/mitigation/unblock/${ip}`)),

  // POST /api/v1/mitigation/block/bulk
  blockMultipleIps: (ips: string[], reason = 'Bulk block via frontend') =>
    apiRequest(() => apiClient.post('/mitigation/block/bulk', { ips, reason })),

  // POST /api/v1/mitigation/clear
  clearAllBlocks: () =>
    apiRequest(() => apiClient.post('/mitigation/clear')),

  // GET /api/v1/mitigation/check/{ip}
  checkIpStatus: (ip: string) =>
    apiRequest(() => apiClient.get(`/mitigation/check/${ip}`)),

  // GET /api/v1/mitigation/stats
  getMitigationStats: () =>
    apiRequest(() => apiClient.get('/mitigation/stats')),
};

// Security API Services
export const securityApi = {
  // GET /api/v1/security/dashboard
  getDashboard: () =>
    apiRequest(() => apiClient.get('/security/dashboard')),

  // POST /api/v1/security/analyze/{ipAddress}
  analyzeIpAddress: (ipAddress: string) =>
    apiRequest(() => apiClient.post(`/security/analyze/${ipAddress}`)),

  // POST /api/v1/security/test-alert
  testAlert: () =>
    apiRequest(() => apiClient.post('/security/test-alert')),

  // GET /api/v1/security/status
  getStatus: () =>
    apiRequest(() => apiClient.get('/security/status')),

  // POST /api/v1/security/trigger-detection
  triggerDetection: () =>
    apiRequest(() => apiClient.post('/security/trigger-detection')),
};

// Combined API Services
export const defendDosApi = {
  traffic: trafficApi,
  statistics: statisticsApi,
  data: dataApi,
  mitigation: mitigationApi,
  security: securityApi,

  // Convenience methods
  getAllDashboardData: async () => {
    try {
      const [statistics, blocked, security, mlHealth] = await Promise.allSettled([
        statisticsApi.getDetailedStats('-1h'),
        mitigationApi.getBlockedIps(),
        securityApi.getDashboard(),
        trafficApi.checkMLHealth()
      ]);

      return {
        statistics: statistics.status === 'fulfilled' ? statistics.value : null,
        blocked: blocked.status === 'fulfilled' ? blocked.value : null,
        security: security.status === 'fulfilled' ? security.value : null,
        mlHealth: mlHealth.status === 'fulfilled' ? mlHealth.value : null,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  },
};

// Export the configured API client as default
export default apiClient;
