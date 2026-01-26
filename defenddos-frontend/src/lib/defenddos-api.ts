import axios from 'axios';
import { toast } from 'react-hot-toast';

// Base API configuration - CORRECTED to match backend port
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'; // FIXED: Backend runs on 8081
const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || 'defenddos-api-key',
  },
});

// Add Request Interceptor to inject Token
api.interceptors.request.use(
  (config) => {
    // Client-side only
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('defenddos_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Create separate ML service client
const mlApi = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Enhanced request caching with LRU eviction
class LRUCache {
  private cache: Map<string, { data: any; timestamp: number }>;
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 50, ttl: number = 60000) { // 60 seconds default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item is expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any): void {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Create cache instance with optimized settings
const requestCache = new LRUCache(30, 45000); // 30 items, 45 seconds TTL

// Function to generate cache key
const generateCacheKey = (url: string, params: any = {}) => {
  return `${url}?${JSON.stringify(params)}`;
};

// Track if we've shown connection errors to avoid spam
let connectionErrorShown = false;
let lastErrorTime = 0;

// Response interceptor to handle the ApiResponse wrapper
api.interceptors.response.use(
  (response) => {
    // Reset error flag on successful connection
    connectionErrorShown = false;

    // Handle wrapped responses (ApiResponse format)
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return { ...response, data: response.data.data };
      } else {
        const errorMsg = response.data.message || 'API request failed';
        // Silently log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('API Response Error:', response.data);
        }
        throw new Error(errorMsg);
      }
    }
    // Return direct responses (for endpoints that don't use ApiResponse wrapper)
    return response;
  },
  (error) => {
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTime;

    // Enhanced error handling with throttling - silently handle connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      // Silently fail - no toasts or console errors for connection issues
      connectionErrorShown = true;
      lastErrorTime = now;
    } else if (error.response?.status === 404 && timeSinceLastError > 10000) {
      // Only log 404 errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`API endpoint not found: ${error.config?.url}`);
      }
      lastErrorTime = now;
    } else if (error.response?.status >= 500 && timeSinceLastError > 10000) {
      // Only show server errors occasionally
      if (process.env.NODE_ENV === 'development') {
        console.error(`Server error: ${error.response.data?.message || 'Internal server error'}`);
      }
      lastErrorTime = now;
    }

    // Silently handle errors - no console spam
    return Promise.reject(error);
  }
);

// Track ML service errors separately
let mlErrorShown = false;
let lastMlErrorTime = 0;

// ML Service interceptor
mlApi.interceptors.response.use(
  (response) => {
    mlErrorShown = false;
    return response;
  },
  (error) => {
    // Silently fail - no toasts or console errors for ML service connection issues
    const now = Date.now();
    mlErrorShown = true;
    lastMlErrorTime = now;
    return Promise.reject(error);
  }
);

// Traffic API - Category 2: Traffic Endpoints (4-8)
export const trafficAPI = {
  // 4. Ingest Traffic Data
  async ingestTraffic(data: {
    sourceIp: string;
    destinationIp: string;
    packetCount: number;
    byteCount: number;
    timestamp?: string;
  }) {
    // Clear cache when new data is ingested
    requestCache.clear();
    const response = await api.post('/api/v1/traffic/ingest', data);
    return response.data;
  },

  // 5. Query Traffic Records
  async queryTraffic(range: string = '-1h') {
    const cacheKey = generateCacheKey('/api/v1/traffic/query', { range });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/traffic/query?range=${range}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  // 6. Traffic Summary by IP
  async getTrafficSummary(range: string = '-1h') {
    const cacheKey = generateCacheKey('/api/v1/traffic/summary', { range });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/traffic/summary?range=${range}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  // 7. Traffic Visualization (Time Series)
  async getTrafficVisualization(range: string = '-1h', window: string = '5m') {
    const cacheKey = generateCacheKey('/api/v1/traffic/visualization', { range, window });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/traffic/visualization?range=${range}&window=${window}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  // 8. Predict if Traffic is Attack
  async predictAttack(data: {
    sourceIp: string;
    destinationIp: string;
    packetCount: number;
    byteCount: number;
  }) {
    const response = await api.post('/api/v1/traffic/predict-attack', data);
    return response.data;
  },

  // 3. ML Connection via Backend
  async getMLHealth() {
    const cacheKey = generateCacheKey('/api/v1/traffic/ml-health');
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get('/api/v1/traffic/ml-health');
    requestCache.set(cacheKey, response.data);
    return response.data;
  },
};

// Statistics API - Category 4: Statistics (9-12)
export const statisticsAPI = {
  // 9. Detailed Statistics
  async getDetailedStatistics(range: string = '-1h') {
    const cacheKey = generateCacheKey('/api/v1/statistics/detailed', { range });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/statistics/detailed?range=${range}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  // 10. Real-time Metrics
  async getRealtimeMetrics(window: string = '1m') {
    const cacheKey = generateCacheKey('/api/v1/statistics/realtime', { window });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/statistics/realtime?window=${window}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  // 11. Attack Analysis
  async getAttackAnalysis(range: string = '-1h', sourceIp?: string) {
    const params: any = { range };
    if (sourceIp) params.sourceIp = sourceIp;
    const cacheKey = generateCacheKey('/api/v1/statistics/attack-analysis', params);
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get('/api/v1/statistics/attack-analysis', { params });
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  // 12. ML Statistics
  async getMLStats(range: string = '-1h') {
    const cacheKey = generateCacheKey('/api/v1/statistics/ml-stats', { range });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/statistics/ml-stats?range=${range}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },
};

// Data Retrieval API (New in v2.0)
export const dataAPI = {
  async getAllTrafficData(range: string = '-24h') {
    const cacheKey = generateCacheKey('/api/v1/data/traffic/all', { range });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/data/traffic/all?range=${range}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  async getAllMLPredictions(range: string = '-24h') {
    const cacheKey = generateCacheKey('/api/v1/data/ml-predictions/all', { range });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/data/ml-predictions/all?range=${range}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  async getAllDetectionEvents(range: string = '-24h') {
    const cacheKey = generateCacheKey('/api/v1/data/detection-events/all', { range });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/data/detection-events/all?range=${range}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  async getAllBlockedIPs(range: string = '-30d') {
    const cacheKey = generateCacheKey('/api/v1/data/blocked-ips/all', { range });
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/api/v1/data/blocked-ips/all?range=${range}`);
    requestCache.set(cacheKey, response.data);
    return response.data;
  },

  async getDatabaseStatistics() {
    const cacheKey = generateCacheKey('/api/v1/data/statistics');
    const cached = requestCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get('/api/v1/data/statistics');
    requestCache.set(cacheKey, response.data);
    return response.data;
  },
};

// Mitigation API - Category 6: Mitigation (18-24)
export const mitigationAPI = {
  // 18. Get Mitigation Status
  async getMitigationStatus() {
    // Note: Returns direct format (no ApiResponse wrapper)
    const response = await axios.get(`${API_BASE}/api/v1/mitigation/status`);
    return response.data;
  },

  // 19. Get Currently Blocked IPs
  async getBlockedIPs() {
    // Note: Returns direct format (no ApiResponse wrapper)
    const response = await axios.get(`${API_BASE}/api/v1/mitigation/blocked`);
    return response.data;
  },

  // 20. Block IP Address
  async blockIP(ip: string, reason: string = 'Manual block via frontend') {
    // Clear cache when IP is blocked
    requestCache.clear();
    const response = await api.post(`/api/v1/mitigation/block/${ip}?reason=${encodeURIComponent(reason)}`);
    return response.data;
  },

  // 21. Unblock IP Address
  async unblockIP(ip: string) {
    // Clear cache when IP is unblocked
    requestCache.clear();
    // Note: Returns direct format (no ApiResponse wrapper)
    const response = await axios.post(`${API_BASE}/api/v1/mitigation/unblock/${ip}`);
    return response.data;
  },

  // 22. Check if IP is Blocked (Method 1)
  async checkIPBlocked(ip: string) {
    // Note: Returns direct format (no ApiResponse wrapper)
    const response = await axios.get(`${API_BASE}/api/v1/mitigation/check/${ip}`);
    return response.data;
  },

  // 23. Check if IP is Blocked (Method 2)
  async isIPBlocked(ip: string) {
    // Note: Returns direct format (no ApiResponse wrapper)
    const response = await axios.get(`${API_BASE}/api/v1/mitigation/is-blocked/${ip}`);
    return response.data;
  },

  // 24. Get Mitigation Statistics
  async getMitigationStats() {
    // Note: Returns direct format (no ApiResponse wrapper)
    const response = await axios.get(`${API_BASE}/api/v1/mitigation/stats`);
    return response.data;
  },
};

// Security API
export const securityAPI = {
  async getDashboard() {
    // Note: This endpoint returns direct data (not wrapped in ApiResponse)
    const response = await axios.get(`${API_BASE}/api/v1/security/dashboard`);
    return response.data;
  },

  async getStatus() {
    // Note: This endpoint returns direct data (not wrapped in ApiResponse)
    const response = await axios.get(`${API_BASE}/api/v1/security/status`);
    return response.data;
  },

  async triggerDetection() {
    // Clear cache when detection is triggered
    requestCache.clear();
    const response = await api.post('/api/v1/security/trigger-detection');
    return response.data;
  },

  async analyzeIP(ip: string) {
    // Note: This endpoint returns direct data (not wrapped in ApiResponse)
    const response = await axios.get(`${API_BASE}/api/v1/security/analyze/${ip}`);
    return response.data;
  },

  async testAlert() {
    // Note: This endpoint returns direct data (not wrapped in ApiResponse)
    const response = await axios.get(`${API_BASE}/api/v1/security/test-alert`);
    return response.data;
  },
};

// Threat Intelligence API - Category 8: Threat Intelligence (26-28)
export const threatIntelligenceAPI = {
  // 26. Check IP Reputation
  async checkIPReputation(ip: string) {
    const response = await api.get(`/api/v1/threat-intelligence/check/${ip}`);
    return response.data;
  },

  // 27. Get Reputation Score
  async getReputationScore(ip: string) {
    const response = await api.get(`/api/v1/threat-intelligence/reputation/${ip}`);
    return response.data;
  },

  // 28. Get All Known Threats
  async getAllKnownThreats() {
    const response = await api.get('/api/v1/threat-intelligence/threats');
    return response.data;
  },
};

// Health API - Category 1: Health Checks (1-3)
// Use Next.js API proxy to avoid CORS issues
export const healthAPI = {
  // 1. Backend Health - Use Next.js API route proxy
  async getBackendHealth() {
    const response = await axios.get('/api/health', {
      timeout: 10000,
    });
    return response.data;
  },

  // 2. ML Service Health (Direct) - Returns {status: "healthy"}
  async getMLServiceHealth() {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  },

  // 3. ML Connection via Backend (covered in trafficAPI.getMLHealth)

  // Actuator endpoints - Category 9: Actuator/Monitoring (29-31)
  // 29. Actuator Info
  async getActuatorInfo() {
    const response = await axios.get(`${API_BASE}/actuator/info`);
    return response.data;
  },

  // 30. Actuator Metrics List
  async getActuatorMetrics() {
    const response = await axios.get(`${API_BASE}/actuator/metrics`);
    return response.data;
  },

  // Get specific metric
  async getActuatorMetric(metricName: string) {
    const response = await axios.get(`${API_BASE}/actuator/metrics/${metricName}`);
    return response.data;
  },

  // 31. Prometheus Metrics
  async getPrometheusMetrics() {
    const response = await axios.get(`${API_BASE}/actuator/prometheus`);
    return response.data; // Returns text format
  },
};

// Combined API for easy access - All 31 Endpoints
export const defenddosAPI = {
  // Category 1: Health Checks (3 endpoints)
  health: healthAPI,

  // Category 2: Traffic Endpoints (5 endpoints)
  traffic: trafficAPI,

  // Category 3: ML Prediction (1 endpoint - included in traffic)

  // Category 4: Statistics (4 endpoints)
  statistics: statisticsAPI,

  // Category 5: Data Retrieval (5 endpoints)
  data: dataAPI,

  // Category 6: Mitigation (7 endpoints)
  mitigation: mitigationAPI,

  // Category 7: Security (1 endpoint)
  security: securityAPI,

  // Category 8: Threat Intelligence (3 endpoints)
  threatIntelligence: threatIntelligenceAPI,

  // Category 9: Actuator/Monitoring (3 endpoints - included in health)

  // Utility methods
  async testAllConnections() {
    const results = {
      backend: false,
      mlService: false,
      errors: [] as string[]
    };

    try {
      await this.health.getBackendHealth();
      results.backend = true;
    } catch (error: any) {
      results.errors.push(`Backend: ${error.message}`);
    }

    try {
      await this.health.getMLServiceHealth();
      results.mlService = true;
    } catch (error: any) {
      results.errors.push(`ML Service: ${error.message}`);
    }

    return results;
  },

  async getDashboardData() {
    const [stats, blocked, security] = await Promise.allSettled([
      this.statistics.getDetailedStatistics('-1h'),
      this.mitigation.getBlockedIPs(),
      this.security.getDashboard()
    ]);

    return {
      statistics: stats.status === 'fulfilled' ? stats.value : null,
      blockedIPs: blocked.status === 'fulfilled' ? blocked.value : null,
      security: security.status === 'fulfilled' ? security.value : null,
    };
  }
};

export default defenddosAPI;