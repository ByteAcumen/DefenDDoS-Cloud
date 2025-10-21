import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      requestId?: string;
      startTime?: number;
      attempt?: number;
      maxAttempts?: number;
    };
  }
}

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details: string;
  };
  timestamp: string;
  path?: string;
}

export interface TrafficPoint {
  sourceIp: string;
  destinationIp: string;
  packetCount: number;
  byteCount: number;
  timestamp?: string;
}

export interface MLPredictionResponse {
  is_attack: boolean;
  attack_type?: string;
  confidence: number;
  confidence_percentage: number;
  rf_confidence?: number;
  lstm_anomaly_score?: number;
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommended_action: 'ALLOW' | 'MONITOR' | 'ALERT' | 'BLOCK';
  threat_level: number;
  severity_color: string;
  highConfidenceAttack: boolean;
  criticalThreat: boolean;
  timestamp: string;
  model_version?: string;
  detection_method?: string;
  source_ip: string;
}

export interface DetailedStatistics {
  totalPackets: number;
  totalBytes: number;
  totalConnections: number;
  averagePacketSize: number;
  attackEventsCount: number;
  blockedIpsCount: number;
  mlStats: {
    totalPredictions: number;
    attackPredictions: number;
    benignPredictions: number;
    averageConfidence: number;
    highConfidenceAttacks: number;
  };
  topThreats: Array<{
    sourceIp: string;
    packetCount: number;
    threatLevel: string;
  }>;
  topTargets: Array<{
    destinationIp: string;
    packetCount: number;
  }>;
  timeSeries: Array<{
    timestamp: string;
    packets: number;
    bytes: number;
  }>;
}

export interface RealtimeMetrics {
  currentPacketsPerSecond: number;
  currentBytesPerSecond: number;
  activeThreatsCount: number;
  baseline: {
    packetsPerSecond: number;
    bytesPerSecond: number;
  };
  anomalyScore: number;
}

export interface BlockedIPsResponse {
  blockedIps: string[];
  count: number;
  timestamp: number;
}

export interface MitigationStats {
  totalBlockedIps: number;
  activeBlocks: number;
  mitigationEnabled: boolean;
  dryRunMode: boolean;
  maxBlockedIps: number;
  lastUpdated: number;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private mlServiceURL: string;
  private isOnline: boolean = true;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 60000; // 1 minute

  constructor() {
    // Use the exact URLs from the API documentation
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
    this.mlServiceURL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    
    // Initial health check
    if (typeof window !== 'undefined') {
      this.performHealthCheck();
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for debugging
        const requestId = Math.random().toString(36).substr(2, 9);
        config.metadata = { requestId, startTime: Date.now() };
        
        console.log(`🚀 [${requestId}] API Request: ${config.method?.toUpperCase()} ${this.baseURL}${config.url}`);
        if (config.data) {
          console.log(`📤 [${requestId}] Request Data:`, config.data);
        }
        if (config.params) {
          console.log(`🔧 [${requestId}] Request Params:`, config.params);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request setup error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const requestId = response.config.metadata?.requestId || 'unknown';
        const duration = Date.now() - (response.config.metadata?.startTime || 0);
        
        console.log(`✅ [${requestId}] API Success: ${response.config.url} - ${response.status} (${duration}ms)`);
        
        // Log response data for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`📥 [${requestId}] Response:`, {
            status: response.status,
            data: response.data,
            headers: response.headers
          });
        }
        
        return response;
      },
      (error) => {
        const requestId = error.config?.metadata?.requestId || 'unknown';
        const duration = Date.now() - (error.config?.metadata?.startTime || 0);
        const url = error.config?.url || 'unknown';
        const method = error.config?.method?.toUpperCase() || 'unknown';
        
        // Enhanced error logging
        console.error(`❌ [${requestId}] API Error: ${method} ${url} (${duration}ms)`);
        console.error(`📍 [${requestId}] Error Details:`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            timeout: error.config?.timeout,
            data: error.config?.data,
            params: error.config?.params
          }
        });
        
        // Enhanced error handling with specific messages
        if (error.code === 'ECONNABORTED') {
          console.warn(`⏰ [${requestId}] Request timeout after ${duration}ms`);
          toast.error(`Request timeout (${(duration/1000).toFixed(1)}s). Please check your connection.`);
        } else if (error.code === 'ECONNREFUSED') {
          console.error(`🔌 [${requestId}] Connection refused - Backend may be down`);
          toast.error('Cannot connect to backend service. Please ensure it\'s running on port 8082.');
        } else if (error.response?.status === 404) {
          console.warn(`🔍 [${requestId}] Endpoint not found: ${method} ${url}`);
          toast.error(`API endpoint not found: ${url}`);
        } else if (error.response?.status === 500) {
          console.error(`💥 [${requestId}] Server error: ${error.response.data?.message || 'Internal server error'}`);
          toast.error(`Server error: ${error.response.data?.message || 'Internal server error'}. Check backend logs.`);
        } else if (error.response?.status === 503) {
          console.error(`🚫 [${requestId}] Service unavailable`);
          toast.error('Backend service is temporarily unavailable. Please try again later.');
        } else if (error.response?.status >= 400 && error.response?.status < 500) {
          console.warn(`⚠️ [${requestId}] Client error: ${error.response.status} - ${error.response.statusText}`);
          toast.error(`Request error: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.response?.status >= 500) {
          console.error(`💥 [${requestId}] Server error: ${error.response.status} - ${error.response.statusText}`);
          toast.error(`Server error (${error.response.status}): Please check backend logs and try again.`);
        } else if (!error.response) {
          console.error(`🌐 [${requestId}] Network error - no response received`);
          toast.error('Network error: Cannot reach backend. Check connection and backend status.');
        } else {
          console.error(`❓ [${requestId}] Unknown error:`, error);
          toast.error('An unexpected error occurred. Please try again.');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic request method with retry logic
  private async request<T>(config: AxiosRequestConfig, retries = 2): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add attempt info to config
        const requestConfig = {
          ...config,
          metadata: {
            ...config.metadata,
            attempt: attempt + 1,
            maxAttempts: retries + 1
          }
        };
        
        const response = await this.client.request<ApiResponse<T>>(requestConfig);
        
        // Handle wrapped API responses
        if (response.data && typeof response.data === 'object' && 'success' in response.data) {
          if (!response.data.success) {
            const errorMsg = response.data.message || 'API request failed';
            console.error(`API returned success=false: ${errorMsg}`, response.data.error);
            throw new Error(errorMsg);
          }
          return response.data.data;
        }
        
        // Handle direct responses (some endpoints don't use ApiResponse wrapper)
        return response.data as unknown as T;
        
      } catch (error: any) {
        lastError = error;
        const requestId = config.metadata?.requestId || 'unknown';
        
        // Don't retry on client errors (4xx) or specific server errors
        const shouldRetry = attempt < retries && 
                           (!error.response || 
                            (error.response.status >= 500 && error.response.status !== 501) || 
                            error.code === 'ECONNABORTED' || 
                            error.code === 'ENOTFOUND' ||
                            error.code === 'ECONNREFUSED');
        
        if (shouldRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
          console.warn(`🔄 [${requestId}] Retrying request in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        console.error(`💀 [${requestId}] Request failed after ${attempt + 1} attempts:`, error.message);
        throw error;
      }
    }
    
    throw lastError;
  }

  // Health check method - Uses /actuator/health endpoint that returns {status: "UP"}
  private async performHealthCheck(): Promise<boolean> {
    const now = Date.now();
    
    // Skip if we've checked recently
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isOnline;
    }
    
    this.lastHealthCheck = now;
    
    try {
      const response = await axios.get(`${this.baseURL}/actuator/health`, { 
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Backend health endpoint returns {status: "UP"}
      this.isOnline = response.status === 200 && response.data?.status === 'UP';
      
      return this.isOnline;
    } catch (error: any) {
      this.isOnline = false;
      return false;
    }
  }

  // Public method to get backend status
  public async getBackendStatus(): Promise<{ online: boolean; message: string }> {
    const isOnline = await this.performHealthCheck();
    
    return {
      online: isOnline,
      message: isOnline 
        ? 'Backend connection is healthy' 
        : 'Backend is not responding. Please check if the service is running.'
    };
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string }> {
    return this.request({
      method: 'GET',
      url: '/actuator/health'
    });
  }

  // Traffic Management
  async ingestTraffic(trafficPoint: TrafficPoint): Promise<any> {
    return this.request({
      method: 'POST',
      url: '/api/v1/traffic/ingest',
      data: trafficPoint
    });
  }

  async queryTraffic(range: string = '-1h'): Promise<any[]> {
    return this.request({
      method: 'GET',
      url: '/api/v1/traffic/query',
      params: { range }
    });
  }

  async getTrafficSummary(range: string = '-1h'): Promise<any[]> {
    return this.request({
      method: 'GET',
      url: '/api/v1/traffic/summary',
      params: { range }
    });
  }

  async getTrafficVisualization(range: string = '-1h', window: string = '5m'): Promise<any[]> {
    return this.request({
      method: 'GET',
      url: '/api/v1/traffic/visualization',
      params: { range, window }
    });
  }

  async predictAttack(trafficPoint: TrafficPoint): Promise<MLPredictionResponse> {
    return this.request({
      method: 'POST',
      url: '/api/v1/traffic/predict-attack',
      data: trafficPoint
    });
  }

  async getMLHealth(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/v1/traffic/ml-health'
    });
  }

  // Statistics & Analytics
  async getDetailedStatistics(range: string = '-1h'): Promise<DetailedStatistics> {
    return this.request({
      method: 'GET',
      url: '/api/v1/statistics/detailed',
      params: { range }
    });
  }

  async getRealtimeMetrics(window: string = '1m'): Promise<RealtimeMetrics> {
    return this.request({
      method: 'GET',
      url: '/api/v1/statistics/realtime',
      params: { window }
    });
  }

  // Backend health and ML connection endpoints

  async getAttackAnalysis(range: string = '-1h', sourceIp?: string): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/v1/statistics/attack-analysis',
      params: { range, ...(sourceIp && { sourceIp }) }
    });
  }

  async getMLStats(range: string = '-1h'): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/v1/statistics/ml-stats',
      params: { range }
    });
  }

  // Data Retrieval
  async getAllTrafficData(range: string = '-24h'): Promise<any[]> {
    return this.request({
      method: 'GET',
      url: '/api/v1/data/traffic/all',
      params: { range }
    });
  }

  async getAllMLPredictions(range: string = '-24h'): Promise<any[]> {
    return this.request({
      method: 'GET',
      url: '/api/v1/data/ml-predictions/all',
      params: { range }
    });
  }

  async getAllDetectionEvents(range: string = '-24h'): Promise<any[]> {
    return this.request({
      method: 'GET',
      url: '/api/v1/data/detection-events/all',
      params: { range }
    });
  }

  async getAllBlockedIPs(range: string = '-30d'): Promise<any[]> {
    return this.request({
      method: 'GET',
      url: '/api/v1/data/blocked-ips/all',
      params: { range }
    });
  }

  async getDatabaseStatistics(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/v1/data/statistics'
    });
  }

  // Mitigation & Blocking
  async getMitigationStatus(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/v1/mitigation/status'
    });
  }

  async getBlockedIPs(): Promise<BlockedIPsResponse> {
    return this.request({
      method: 'GET',
      url: '/api/v1/mitigation/blocked'
    });
  }

  async blockIP(ip: string, reason?: string): Promise<any> {
    return this.request({
      method: 'POST',
      url: `/api/v1/mitigation/block/${ip}`,
      params: reason ? { reason } : {}
    });
  }

  async unblockIP(ip: string): Promise<any> {
    return this.request({
      method: 'POST',
      url: `/api/v1/mitigation/unblock/${ip}`
    });
  }

  async bulkBlockIPs(ips: string[], reason?: string): Promise<any> {
    return this.request({
      method: 'POST',
      url: '/api/v1/mitigation/bulk',
      data: { ips, reason }
    });
  }

  async clearAllBlocks(): Promise<any> {
    return this.request({
      method: 'POST',
      url: '/api/v1/mitigation/clear'
    });
  }

  async checkIPBlocked(ip: string): Promise<any> {
    return this.request({
      method: 'GET',
      url: `/api/v1/mitigation/check/${ip}`
    });
  }

  async isIPBlocked(ip: string): Promise<any> {
    return this.request({
      method: 'GET',
      url: `/api/v1/mitigation/is-blocked/${ip}`
    });
  }

  async getMitigationStats(): Promise<MitigationStats> {
    return this.request({
      method: 'GET',
      url: '/api/v1/mitigation/stats'
    });
  }

  // Security (31 endpoints - Category 7)
  async getSecurityDashboard(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/v1/security/dashboard'
    });
  }

  async analyzeIP(ip: string): Promise<any> {
    return this.request({
      method: 'POST',
      url: `/api/v1/security/analyze/${ip}`
    });
  }

  async triggerDetection(): Promise<any> {
    return this.request({
      method: 'POST',
      url: '/api/v1/security/trigger-detection'
    });
  }

  async testAlert(): Promise<any> {
    return this.request({
      method: 'POST',
      url: '/api/v1/security/test-alert'
    });
  }

  async getSecurityStatus(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/v1/security/status'
    });
  }

  // Threat Intelligence (Category 8: 26-28)
  async checkIPReputation(ip: string): Promise<any> {
    return this.request({
      method: 'GET',
      url: `/api/v1/threat-intelligence/check/${ip}`
    });
  }

  async getReputationScore(ip: string): Promise<any> {
    return this.request({
      method: 'GET',
      url: `/api/v1/threat-intelligence/reputation/${ip}`
    });
  }

  async getAllKnownThreats(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/v1/threat-intelligence/threats'
    });
  }

  // Actuator/Monitoring (Category 9: 29-31)
  async getActuatorInfo(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/actuator/info'
    });
  }

  async getActuatorMetrics(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/actuator/metrics'
    });
  }

  async getActuatorMetric(metricName: string): Promise<any> {
    return this.request({
      method: 'GET',
      url: `/actuator/metrics/${metricName}`
    });
  }

  async getPrometheusMetrics(): Promise<string> {
    const response = await this.client.get('/actuator/prometheus');
    return response.data;
  }

  // ML Service Direct Endpoints
  async getMLServiceHealth(): Promise<any> {
    try {
      const response = await axios.get(`${this.mlServiceURL}/health`, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error: any) {
      // Only log meaningful errors in development
      if (process.env.NODE_ENV === 'development' && error?.message && error?.code !== 'ECONNREFUSED') {
        console.error('ML Service Error:', error.message);
      }
      throw error;
    }
  }

  // Utility methods
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Batch operations for dashboard
  async getDashboardData(): Promise<{
    realtimeMetrics: RealtimeMetrics;
    detailedStats: DetailedStatistics;
    blockedIPs: BlockedIPsResponse;
    mitigationStats: MitigationStats;
  }> {
    const [realtimeMetrics, detailedStats, blockedIPs, mitigationStats] = await Promise.all([
      this.getRealtimeMetrics(),
      this.getDetailedStatistics(),
      this.getBlockedIPs(),
      this.getMitigationStats()
    ]);

    return {
      realtimeMetrics,
      detailedStats,
      blockedIPs,
      mitigationStats
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;