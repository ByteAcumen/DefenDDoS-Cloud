// Base API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  errorDetails: string | null;
  timestamp: string;
}

// Traffic Management Types
export interface TrafficPoint {
  sourceIp: string;
  destinationIp: string;
  packetCount: number;
  byteCount: number;
  timestamp?: string;
}

export interface TrafficDataResponse {
  source_ip: string;
  destination_ip: string;
  packet_count: number;
  byte_count: number;
  timestamp: string;
  threat_level?: string;
  is_blocked?: boolean;
  packets_per_second?: number;
  bytes_per_second?: number;
}

export interface TrafficSummaryPoint {
  timestamp: string;
  totalPackets: number;
  totalBytes: number;
  uniqueSourceIps: number;
  averagePacketRate: number;
  peakPacketRate: number;
}

export interface TrafficSummary {
  totalPackets: number;
  totalBytes: number;
  recordCount: number;
  uniqueSourceIps: number;
  timeRange: string;
  generatedAt: string;
  sourceIp?: string;
}

// Backend API response format from TrafficController
export interface TrafficSummaryResponse {
  source_ip: string;
  total_packets: number;
  total_bytes: number;
  connection_count: number;
  avg_packet_size: number;
  threat_score: number;
  is_suspicious: boolean;
  first_seen: string;
  last_seen: string;
  destination_ips: string[];
  status: 'NORMAL' | 'SUSPICIOUS' | 'BLOCKED';
}

// Backend TrafficSummaryPoint from visualization endpoint
export interface BackendTrafficSummaryPoint {
  timestamp: string;
  totalPackets: number;
  totalBytes: number;
  uniqueSourceIps: number;
  averagePacketRate: number;
  peakPacketRate: number;
}

// ML Prediction Types - matching backend MLPredictionResponse
export interface MLPredictionResponse {
  isAttack: boolean;
  attackType: string;
  confidence: number; // 0.0 - 1.0
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
  threatLevel: number; // 1-5 scale
  sourceIp?: string;
  analysisTimestamp?: string;
  
  // Additional fields from backend enhancement
  rf_confidence?: number; // Random Forest confidence
  lstm_anomaly_score?: number; // LSTM anomaly detection score
  confidence_percentage?: number; // 0-100 for UI display
  
  // Legacy support (optional)
  is_attack?: boolean;
  attack_type?: string;
  threat_level?: string;
  should_block?: boolean;
}

// Mitigation/Blocking Types
export interface BlockedIPsResponse {
  count: number;
  blockedIps: string[];
  timestamp: number;
}

export interface BlockedIpInfo {
  ip: string;
  status: 'BLOCKED' | 'UNBLOCKED';
  reason: string;
  blockedAt: string;
  blockedBy: 'manual' | 'auto' | 'detection';
  unblockedAt?: string;
}

export interface MitigationStats {
  totalBlockedIps: number;
  activeBlocks: number;
  mitigationEnabled: boolean;
  dryRunMode: boolean;
  maxBlockedIps: number;
  lastUpdated: string;
}

// Security Dashboard Types
export interface SecurityDashboard {
  status: 'operational' | 'degraded' | 'down';
  detectionEnabled: boolean;
  alertsEnabled: boolean;
  lastScan: string;
  systemHealth: string;
  activeThreats: number;
}

export interface SystemStatus {
  timestamp: string;
  services: {
    detection: string;
    alerts: string;
    database: string;
  };
  uptime: string;
  version: string;
}

export interface SystemHealthResponse {
  timestamp: string;
  status: string;
  mlServiceStatus: string;
  mlModelsLoaded: boolean;
}

// Chart and Visualization Types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TrafficVisualization {
  timeSeriesData: Array<{
    timestamp: string;
    packetCount: number;
    byteCount: number;
    flowRate: number;
  }>;
  summary: {
    totalDataPoints: number;
    averagePacketRate: number;
    peakPacketRate: number;
    duration: string;
    interval: string;
  };
}

// Dashboard KPI Types
export interface DashboardKPIs {
  totalBlockedIps: number;
  totalPackets: number;
  uniqueSourceIps: number;
  activeThreats: number;
  detectionSuccessRate: number;
  systemHealthStatus: string;
}

// Alert and Notification Types
export interface Alert {
  id: string;
  type: 'THREAT_DETECTED' | 'IP_BLOCKED' | 'SYSTEM_ALERT' | 'ML_PREDICTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  sourceIp?: string;
  actionRequired?: boolean;
  isRead?: boolean;
}

export interface NotificationSettings {
  enableEmailAlerts: boolean;
  enablePushNotifications: boolean;
  alertThresholds: {
    criticalOnly: boolean;
    highAndAbove: boolean;
    allThreats: boolean;
  };
}

// Analysis and Threat Types
export interface ThreatAnalysis {
  ipAddress: string;
  threatLevel: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analysisTime: string;
  recommendation: string;
  confidence: number;
  riskFactors: string[];
  historicalData?: {
    previousAttacks: number;
    lastSeen: string;
    blockHistory: string[];
  };
}

// Error Types
export interface APIError {
  success: false;
  message: string;
  error: string;
  errorDetails: string;
  timestamp: string;
}

// Query Parameters
export interface TrafficQueryParams {
  // For /traffic/query
  sourceIp?: string;
  destinationIp?: string;
  from?: string; // ISO datetime
  to?: string; // ISO datetime
  limit?: number;
  range?: string; // -5m, -1h, -24h, -7d
  
  // For /traffic/summary
  duration?: string; // 1h, 24h, etc.
  groupBy?: 'ip' | 'sourceIp' | 'destinationIp';
  
  // For /traffic/visualization
  interval?: string; // 5m, 1h, etc.
  metric?: 'packetCount' | 'byteCount';
  duration?: string;
  interval?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Real-time Data Types
export interface RealTimeUpdate {
  type: 'TRAFFIC_UPDATE' | 'THREAT_DETECTED' | 'IP_BLOCKED' | 'SYSTEM_STATUS';
  data: TrafficDataResponse | ThreatAnalysis | BlockedIpInfo | SystemStatus | Record<string, unknown>;
  timestamp: string;
}

// Theme and UI Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
  animationsEnabled: boolean;
  reducedMotion: boolean;
}

// Export commonly used types
export type SeverityLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ThreatLevel = 1 | 2 | 3 | 4 | 5;
export type AttackType = 'DDoS_ATTACK' | 'BENIGN' | 'SUSPICIOUS' | 'UNKNOWN';