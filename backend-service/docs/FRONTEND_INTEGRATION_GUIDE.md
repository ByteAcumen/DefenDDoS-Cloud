# DefenDDoS - Complete Frontend Integration Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Authentication](#authentication)
6. [Real-Time Features](#real-time-features)
7. [Error Handling](#error-handling)
8. [Integration Examples](#integration-examples)
9. [Testing](#testing)

---

## 🎯 System Overview

**DefenDDoS** is a real-time DDoS detection and mitigation system with:
- **Backend**: Spring Boot 3.5.5 (Java 21) REST API
- **ML Service**: FastAPI (Python) with dual ML models
- **Database**: InfluxDB 2.7 (Time-series data)
- **Features**: Real-time detection, auto-blocking, ML-based threat assessment

### Base URLs
```
Backend API:  http://localhost:8082
ML Service:   http://localhost:8000
InfluxDB UI:  http://localhost:8086
```

### Technology Stack
- **Backend**: Spring Boot, Java 21, Maven
- **ML Models**: Random Forest + LSTM Autoencoder (TensorFlow)
- **Database**: InfluxDB (Time-series), In-memory (Blocked IPs)
- **Security**: Spring Security (Currently permitAll for testing)
- **Monitoring**: Actuator endpoints

---

## 🏗️ Architecture

### System Flow
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│  InfluxDB   │
│  (React/    │◀─────│  Spring Boot │◀─────│ (Time-series│
│   Vue/etc)  │      │   Port 8082  │      │  Database)  │
└─────────────┘      └──────┬───────┘      └─────────────┘
                            │
                            │
                     ┌──────▼───────┐
                     │  ML Service  │
                     │   FastAPI    │
                     │  Port 8000   │
                     │              │
                     │ ┌──────────┐ │
                     │ │  Random  │ │
                     │ │  Forest  │ │
                     │ └──────────┘ │
                     │ ┌──────────┐ │
                     │ │   LSTM   │ │
                     │ │Autoencoder│ │
                     │ └──────────┘ │
                     └──────────────┘
```

### Detection Pipeline
```
1. Traffic Ingestion
   └─> POST /api/v1/traffic/ingest

2. Storage
   └─> InfluxDB (time-series)

3. Automated Detection (Every 30 seconds)
   └─> DetectionService scans InfluxDB
   └─> Sends to ML Service for analysis

4. ML Analysis (Dual Models)
   ├─> Random Forest: Pattern detection
   └─> LSTM: Anomaly detection

5. Auto-Blocking (if threat detected)
   └─> MitigationService.blockIp()
   └─> Alert notifications

6. Frontend Display
   └─> GET /api/v1/mitigation/blocked
   └─> WebSocket (future enhancement)
```

---

## 🔌 API Endpoints

### Response Format
All endpoints return standardized `ApiResponse<T>` wrapper:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ },
  "error": null,
  "errorDetails": null,
  "timestamp": "2025-10-11T09:30:00Z"
}
```

---

## 1️⃣ Traffic Management API

### 1.1 Ingest Traffic Data
**Endpoint**: `POST /api/v1/traffic/ingest`  
**Purpose**: Submit network traffic for analysis  
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "sourceIp": "192.168.1.100",
  "destinationIp": "10.0.0.1",
  "packetCount": 1500,
  "byteCount": 96000,
  "timestamp": "2025-10-11T10:30:00Z"  // Optional, auto-set if not provided
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Traffic data ingested successfully",
  "data": {
    "sourceIp": "192.168.1.100",
    "destinationIp": "10.0.0.1",
    "packetCount": 1500,
    "byteCount": 96000,
    "timestamp": "2025-10-11T10:30:00.123456Z"
  },
  "timestamp": "2025-10-11T10:30:00.500Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid traffic data",
  "error": "VALIDATION_ERROR",
  "errorDetails": "Source IP and Destination IP are required",
  "timestamp": "2025-10-11T10:30:00.500Z"
}
```

---

### 1.2 Query Traffic Data
**Endpoint**: `GET /api/v1/traffic/query`  
**Purpose**: Retrieve historical traffic data  
**Query Parameters**:
- `range` (optional): Time range (default: `-1h`)
  - Examples: `-5m`, `-1h`, `-24h`, `-7d`

**Request**:
```
GET /api/v1/traffic/query?range=-1h
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Retrieved 150 traffic records",
  "data": [
    {
      "time": "2025-10-11T09:30:00Z",
      "sourceIp": "192.168.1.100",
      "destinationIp": "10.0.0.1",
      "field": "packetCount",
      "value": 1500
    },
    {
      "time": "2025-10-11T09:30:00Z",
      "sourceIp": "192.168.1.100",
      "destinationIp": "10.0.0.1",
      "field": "byteCount",
      "value": 96000
    }
    // ... more records
  ],
  "timestamp": "2025-10-11T10:30:00Z"
}
```

---

### 1.3 Get Traffic Summary
**Endpoint**: `GET /api/v1/traffic/summary`  
**Purpose**: Get aggregated traffic statistics  
**Query Parameters**:
- `duration` (optional): Time duration (default: `1h`)

**Request**:
```
GET /api/v1/traffic/summary?duration=1h
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Traffic summary retrieved successfully",
  "data": {
    "totalPackets": 125000,
    "totalBytes": 8000000,
    "recordCount": 3,
    "uniqueSourceIps": 3,
    "timeRange": "1h",
    "generatedAt": "2025-10-11T10:30:00Z"
  },
  "timestamp": "2025-10-11T10:30:00Z"
}
```

---

### 1.4 Get Traffic Visualization Data
**Endpoint**: `GET /api/v1/traffic/visualization`  
**Purpose**: Get time-series data for charts  
**Query Parameters**:
- `duration` (optional): Time duration (default: `1h`)
- `interval` (optional): Data point interval (default: `1m`)

**Request**:
```
GET /api/v1/traffic/visualization?duration=1h&interval=5m
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Visualization data prepared successfully",
  "data": {
    "timeSeriesData": [
      {
        "timestamp": "2025-10-11T09:00:00Z",
        "packetCount": 5000,
        "byteCount": 320000,
        "flowRate": 83.3
      },
      {
        "timestamp": "2025-10-11T09:05:00Z",
        "packetCount": 8500,
        "byteCount": 544000,
        "flowRate": 141.6
      }
      // ... more time points
    ],
    "summary": {
      "totalDataPoints": 12,
      "averagePacketRate": 2500,
      "peakPacketRate": 8500,
      "duration": "1h",
      "interval": "5m"
    }
  },
  "timestamp": "2025-10-11T10:30:00Z"
}
```

---

### 1.5 Predict Attack (Manual ML Analysis)
**Endpoint**: `POST /api/v1/traffic/predict-attack`  
**Purpose**: Manually trigger ML analysis on traffic  
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "sourceIp": "45.33.32.156",
  "destinationIp": "10.0.0.1",
  "packetCount": 125000,
  "byteCount": 8000000
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "ML prediction completed",
  "data": {
    "is_attack": true,
    "attack_type": "DDoS_ATTACK",
    "confidence": 0.58,
    "confidence_percentage": 58.0,
    "severity": "CRITICAL",
    "severity_color": "#dc3545",
    "threat_level": "CRITICAL",
    "recommended_action": "BLOCK_IMMEDIATELY",
    "rf_confidence": 58.0,
    "lstm_anomaly_score": 131.6,
    "should_block": true,
    "analysis_timestamp": "2025-10-11T10:30:00Z"
  },
  "timestamp": "2025-10-11T10:30:00Z"
}
```

---

### 1.6 Check ML Service Health
**Endpoint**: `GET /api/v1/traffic/ml-health`  
**Purpose**: Verify ML service connectivity

**Response** (200 OK):
```json
{
  "success": true,
  "message": "ML service is healthy and accessible",
  "data": {
    "mlServiceHealthy": true,
    "responseTime": "45ms",
    "modelsLoaded": true
  },
  "timestamp": "2025-10-11T10:30:00Z"
}
```

---

## 2️⃣ Mitigation (IP Blocking) API

### 2.1 Block IP Address
**Endpoint**: `POST /api/v1/mitigation/block/{ipAddress}`  
**Purpose**: Manually block an IP address  
**Path Variable**: `ipAddress` - The IP to block

**Request**:
```
POST /api/v1/mitigation/block/45.33.32.156?reason=Manual%20block%20-%20suspicious%20activity
```

**Query Parameters**:
- `reason` (optional): Reason for blocking

**Response** (200 OK):
```json
{
  "success": true,
  "message": "IP 45.33.32.156 has been blocked successfully",
  "data": {
    "ip": "45.33.32.156",
    "status": "BLOCKED",
    "reason": "Manual block - suspicious activity",
    "blockedAt": "2025-10-11T10:30:00Z",
    "blockedBy": "manual"
  },
  "timestamp": "2025-10-11T10:30:00Z"
}
```

---

### 2.2 Unblock IP Address
**Endpoint**: `POST /api/v1/mitigation/unblock/{ipAddress}`  
**Purpose**: Remove IP from blocked list  
**Path Variable**: `ipAddress` - The IP to unblock

**Request**:
```
POST /api/v1/mitigation/unblock/45.33.32.156
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "IP 45.33.32.156 has been unblocked successfully",
  "data": {
    "ip": "45.33.32.156",
    "status": "UNBLOCKED",
    "unblockedAt": "2025-10-11T10:35:00Z"
  },
  "timestamp": "2025-10-11T10:35:00Z"
}
```

---

### 2.3 Get All Blocked IPs
**Endpoint**: `GET /api/v1/mitigation/blocked`  
**Purpose**: Retrieve list of currently blocked IPs

**Request**:
```
GET /api/v1/mitigation/blocked
```

**Response** (200 OK):
```json
{
  "count": 3,
  "blockedIps": [
    "203.0.113.50",
    "192.0.2.10",
    "198.51.100.5"
  ],
  "timestamp": 1760174477188
}
```

**Note**: This endpoint returns a different format (not wrapped in ApiResponse)

---

### 2.4 Check if IP is Blocked
**Endpoint**: `GET /api/v1/mitigation/is-blocked/{ipAddress}`  
**Purpose**: Check block status of specific IP  
**Path Variable**: `ipAddress` - The IP to check

**Request**:
```
GET /api/v1/mitigation/is-blocked/45.33.32.156
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "IP block status retrieved",
  "data": {
    "ip": "45.33.32.156",
    "isBlocked": true,
    "blockedAt": "2025-10-11T10:30:00Z",
    "reason": "CRITICAL threat detected: 125000 packets"
  },
  "timestamp": "2025-10-11T10:35:00Z"
}
```

---

### 2.5 Get Mitigation Statistics
**Endpoint**: `GET /api/v1/mitigation/stats`  
**Purpose**: Get overall mitigation statistics

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Mitigation statistics retrieved",
  "data": {
    "totalBlockedIps": 3,
    "totalBlocksToday": 3,
    "totalUnblocksToday": 0,
    "autoBlockedCount": 3,
    "manualBlockedCount": 0,
    "lastBlockedIp": "203.0.113.50",
    "lastBlockedAt": "2025-10-11T10:25:00Z"
  },
  "timestamp": "2025-10-11T10:35:00Z"
}
```

---

## 3️⃣ Security Operations API

### 3.1 Get Security Dashboard
**Endpoint**: `GET /api/v1/security/dashboard`  
**Purpose**: Get security overview for dashboard

**Response** (200 OK):
```json
{
  "status": "operational",
  "detectionEnabled": true,
  "alertsEnabled": true,
  "lastScan": "2025-10-11T10:35:00Z",
  "systemHealth": "healthy",
  "activeThreats": 0
}
```

---

### 3.2 Manually Trigger Detection
**Endpoint**: `POST /api/v1/security/trigger-detection`  
**Purpose**: Force immediate threat detection scan

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Detection scan triggered successfully",
  "timestamp": "2025-10-11T10:35:00Z"
}
```

---

### 3.3 Analyze Specific IP
**Endpoint**: `POST /api/v1/security/analyze/{ipAddress}`  
**Purpose**: Perform detailed analysis on specific IP  
**Path Variable**: `ipAddress` - The IP to analyze

**Request**:
```
POST /api/v1/security/analyze/45.33.32.156
```

**Response** (200 OK):
```json
{
  "ipAddress": "45.33.32.156",
  "threatLevel": "CRITICAL",
  "analysisTime": "2025-10-11T10:35:00Z",
  "recommendation": "IMMEDIATE ACTION REQUIRED: Block IP address and investigate source"
}
```

---

### 3.4 Get System Status
**Endpoint**: `GET /api/v1/security/status`  
**Purpose**: Get overall system status

**Response** (200 OK):
```json
{
  "timestamp": "2025-10-11T10:35:00Z",
  "services": {
    "detection": "running",
    "alerts": "running",
    "database": "connected"
  },
  "uptime": "Available",
  "version": "2.0.0-SNAPSHOT"
}
```

---

### 3.5 Test Alert System
**Endpoint**: `POST /api/v1/security/test-alert`  
**Purpose**: Send test alert notification

**Response** (200 OK):
```json
{
  "message": "Test alert sent successfully"
}
```

---

## 4️⃣ ML Service Direct API

### 4.1 Health Check
**Endpoint**: `GET http://localhost:8000/health`  
**Purpose**: Check ML service and models status

**Response** (200 OK):
```json
{
  "status": "healthy",
  "models": {
    "random_forest": true,
    "lstm_autoencoder": true
  },
  "version": "1.0.0"
}
```

---

### 4.2 Predict Attack (Direct ML)
**Endpoint**: `POST http://localhost:8000/predict`  
**Purpose**: Direct ML prediction (requires full feature set)  
**Content-Type**: `application/json`

**Request Body** (Full features):
```json
{
  "source_ip": "45.33.32.156",
  "destination_ip": "10.0.0.1",
  "source_port": 12345,
  "destination_port": 80,
  "protocol": 6,
  "flow_duration": 1000,
  "total_fwd_packets": 100000,
  "total_bwd_packets": 80,
  "total_length_fwd_packets": 6400000,
  "total_length_bwd_packets": 5120,
  "fwd_packet_length_max": 64,
  "fwd_packet_length_min": 64,
  "fwd_packet_length_mean": 64.0,
  "fwd_packet_length_std": 0.0,
  "bwd_packet_length_max": 64,
  "bwd_packet_length_min": 64,
  "bwd_packet_length_mean": 64.0,
  "bwd_packet_length_std": 0.0,
  "flow_bytes_per_s": 6400000.0,
  "flow_packets_per_s": 100000.0,
  "flow_iat_mean": 0.01,
  "flow_iat_std": 0.001,
  "flow_iat_max": 0.05,
  "flow_iat_min": 0.01,
  "fwd_iat_total": 1000,
  "fwd_iat_mean": 0.01,
  "fwd_iat_std": 0.001,
  "fwd_iat_max": 0.05,
  "fwd_iat_min": 0.01,
  "bwd_iat_total": 1000,
  "bwd_iat_mean": 12.5,
  "bwd_iat_std": 0.5,
  "bwd_iat_max": 13.0,
  "bwd_iat_min": 12.0,
  "fwd_psh_flags": 0,
  "bwd_psh_flags": 0,
  "fwd_urg_flags": 0,
  "bwd_urg_flags": 0,
  "fwd_header_length": 4000000,
  "bwd_header_length": 2000,
  "fwd_packets_per_s": 100000.0,
  "bwd_packets_per_s": 80.0,
  "min_packet_length": 64,
  "max_packet_length": 64,
  "packet_length_mean": 64.0,
  "packet_length_std": 0.2,
  "packet_length_variance": 0.04,
  "fin_flag_count": 0,
  "syn_flag_count": 100000,
  "rst_flag_count": 0,
  "psh_flag_count": 0,
  "ack_flag_count": 80,
  "urg_flag_count": 0,
  "cwe_flag_count": 0,
  "ece_flag_count": 0,
  "down_up_ratio": 1250.0,
  "average_packet_size": 64.0,
  "avg_fwd_segment_size": 64.0,
  "avg_bwd_segment_size": 64.0,
  "fwd_header_length_1": 40,
  "fwd_avg_bytes_bulk": 0,
  "fwd_avg_packets_bulk": 0,
  "fwd_avg_bulk_rate": 0.0,
  "bwd_avg_bytes_bulk": 0,
  "bwd_avg_packets_bulk": 0,
  "bwd_avg_bulk_rate": 0.0,
  "subflow_fwd_packets": 100000,
  "subflow_fwd_bytes": 6400000,
  "subflow_bwd_packets": 80,
  "subflow_bwd_bytes": 5120,
  "init_win_bytes_forward": 65535,
  "init_win_bytes_backward": 65535,
  "act_data_pkt_fwd": 100000,
  "min_seg_size_forward": 20,
  "active_mean": 500.0,
  "active_std": 50.0,
  "active_max": 600,
  "active_min": 400,
  "idle_mean": 100.0,
  "idle_std": 10.0,
  "idle_max": 120,
  "idle_min": 80
}
```

**Response** (200 OK):
```json
{
  "is_attack": true,
  "attack_type": "DDoS_ATTACK",
  "confidence": 0.58,
  "rf_confidence": 58.0,
  "lstm_anomaly_score": 131.6,
  "severity": "CRITICAL",
  "timestamp": "2025-10-11T10:35:00Z"
}
```

---

## 5️⃣ Health & Monitoring API

### 5.1 Backend Health Check
**Endpoint**: `GET /actuator/health`  
**Purpose**: Check backend service health

**Response** (200 OK):
```json
{
  "status": "UP"
}
```

---

### 5.2 Backend Info
**Endpoint**: `GET /actuator/info`  
**Purpose**: Get backend application info

**Response** (200 OK):
```json
{
  "app": {
    "name": "DefenDDoS Backend Service",
    "version": "0.0.1-SNAPSHOT",
    "description": "DDoS Detection and Mitigation System"
  }
}
```

---

### 5.3 Metrics
**Endpoint**: `GET /actuator/metrics`  
**Purpose**: Get application metrics

**Response** (200 OK):
```json
{
  "names": [
    "jvm.memory.used",
    "jvm.memory.max",
    "http.server.requests",
    "system.cpu.usage"
    // ... more metrics
  ]
}
```

---

## 📊 Data Models

### TrafficPoint
```typescript
interface TrafficPoint {
  sourceIp: string;           // Required
  destinationIp: string;      // Required
  packetCount: number;        // Required
  byteCount: number;          // Required
  timestamp?: string;         // Optional, ISO-8601 format
}
```

### TrafficDataResponse
```typescript
interface TrafficDataResponse {
  sourceIp: string;
  destinationIp: string;
  packetCount: number;
  byteCount: number;
  timestamp: string;
}
```

### MLPredictionResponse
```typescript
interface MLPredictionResponse {
  is_attack: boolean;
  attack_type: string;                    // "DDoS_ATTACK" | "BENIGN"
  confidence: number;                     // 0.0 - 1.0
  confidence_percentage: number;          // 0 - 100
  severity: string;                       // "NORMAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  severity_color: string;                 // Hex color code
  threat_level: string;                   // Human-readable threat level
  recommended_action: string;             // Action recommendation
  rf_confidence: number;                  // Random Forest confidence (0-100)
  lstm_anomaly_score: number;            // LSTM anomaly score (0-300+)
  should_block: boolean;                 // Auto-block recommendation
  analysis_timestamp: string;            // ISO-8601 timestamp
}
```

### BlockedIpInfo
```typescript
interface BlockedIpInfo {
  ip: string;
  status: string;                        // "BLOCKED" | "UNBLOCKED"
  reason: string;
  blockedAt: string;                     // ISO-8601 timestamp
  blockedBy: string;                     // "manual" | "auto" | "detection"
  unblockedAt?: string;                  // Optional, when unblocked
}
```

### ApiResponse<T>
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  errorDetails: string | null;
  timestamp: string;                     // ISO-8601 timestamp
}
```

### TrafficSummary
```typescript
interface TrafficSummary {
  totalPackets: number;
  totalBytes: number;
  recordCount: number;
  uniqueSourceIps: number;
  timeRange: string;
  generatedAt: string;
}
```

### SecurityDashboard
```typescript
interface SecurityDashboard {
  status: string;                        // "operational" | "degraded" | "down"
  detectionEnabled: boolean;
  alertsEnabled: boolean;
  lastScan: string;
  systemHealth: string;
  activeThreats: number;
}
```

### MitigationStats
```typescript
interface MitigationStats {
  totalBlockedIps: number;
  totalBlocksToday: number;
  totalUnblocksToday: number;
  autoBlockedCount: number;
  manualBlockedCount: number;
  lastBlockedIp: string;
  lastBlockedAt: string;
}
```

---

## 🔐 Authentication & Security

### Current Status
**Security Mode**: `permitAll()` (Development/Testing)  
**Authentication**: Not required for any endpoints  
**CORS**: Configured to allow all origins (development)

### Future Implementation (Production)
```typescript
// JWT Token structure
interface JWTToken {
  token: string;
  type: "Bearer";
  expiresIn: number;
}

// Login request
interface LoginRequest {
  username: string;
  password: string;
}

// Headers for authenticated requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Security Best Practices for Frontend
```typescript
// 1. Store tokens securely
localStorage.setItem('auth_token', token);  // Or use httpOnly cookies

// 2. Add interceptor for auth headers
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Handle 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🔄 Real-Time Features

### Current Implementation
- **Polling**: Frontend should poll endpoints every 30-60 seconds
- **Detection Cycle**: Backend scans every 30 seconds

### Recommended Polling Intervals
```typescript
// Dashboard updates
const DASHBOARD_REFRESH = 30000;  // 30 seconds

// Blocked IPs list
const BLOCKED_IPS_REFRESH = 15000;  // 15 seconds

// Traffic visualization
const TRAFFIC_CHART_REFRESH = 10000;  // 10 seconds

// System health
const HEALTH_CHECK = 60000;  // 1 minute
```

### Future Enhancement: WebSocket
```typescript
// WebSocket connection (future)
const ws = new WebSocket('ws://localhost:8082/ws/alerts');

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  if (alert.type === 'IP_BLOCKED') {
    // Update blocked IPs list
    refreshBlockedIps();
  }
};
```

---

## ⚠️ Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error: string;              // Error code/type
  errorDetails: string;       // Detailed error message
  timestamp: string;
}
```

### Common Error Codes
| Status Code | Error Type | Description |
|-------------|-----------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request data |
| 404 | `NOT_FOUND` | Resource not found |
| 500 | `INGESTION_ERROR` | Failed to save data |
| 500 | `QUERY_ERROR` | Failed to retrieve data |
| 500 | `ML_SERVICE_ERROR` | ML service unavailable |
| 503 | `SERVICE_UNAVAILABLE` | Backend service down |

### Frontend Error Handling
```typescript
async function ingestTraffic(data: TrafficPoint) {
  try {
    const response = await axios.post(
      'http://localhost:8082/api/v1/traffic/ingest',
      data
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error
        const errorData = error.response.data;
        console.error('API Error:', errorData.message);
        console.error('Details:', errorData.errorDetails);
        throw new Error(errorData.message);
      } else if (error.request) {
        // No response received
        console.error('Network Error: No response from server');
        throw new Error('Network error. Please check your connection.');
      }
    }
    throw error;
  }
}
```

---

## 💻 Integration Examples

### React Example

#### 1. Setup Axios Instance
```typescript
// src/api/axiosConfig.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8082',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
```

#### 2. Traffic Service
```typescript
// src/services/trafficService.ts
import api from '../api/axiosConfig';
import { TrafficPoint, ApiResponse, TrafficDataResponse } from '../types';

export const trafficService = {
  // Ingest traffic
  async ingestTraffic(data: TrafficPoint): Promise<TrafficDataResponse> {
    const response = await api.post<ApiResponse<TrafficDataResponse>>(
      '/api/v1/traffic/ingest',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    return response.data.data!;
  },

  // Get traffic summary
  async getSummary(duration: string = '1h') {
    const response = await api.get<ApiResponse<any>>(
      `/api/v1/traffic/summary?duration=${duration}`
    );
    return response.data.data;
  },

  // Get visualization data
  async getVisualization(duration: string = '1h', interval: string = '5m') {
    const response = await api.get<ApiResponse<any>>(
      `/api/v1/traffic/visualization?duration=${duration}&interval=${interval}`
    );
    return response.data.data;
  },

  // Predict attack
  async predictAttack(data: TrafficPoint) {
    const response = await api.post<ApiResponse<any>>(
      '/api/v1/traffic/predict-attack',
      data
    );
    return response.data.data;
  }
};
```

#### 3. Mitigation Service
```typescript
// src/services/mitigationService.ts
import api from '../api/axiosConfig';

export const mitigationService = {
  // Get blocked IPs
  async getBlockedIps() {
    const response = await api.get('/api/v1/mitigation/blocked');
    return response.data;
  },

  // Block IP
  async blockIp(ip: string, reason?: string) {
    const url = `/api/v1/mitigation/block/${ip}`;
    const params = reason ? { reason } : {};
    const response = await api.post(url, null, { params });
    return response.data;
  },

  // Unblock IP
  async unblockIp(ip: string) {
    const response = await api.post(`/api/v1/mitigation/unblock/${ip}`);
    return response.data;
  },

  // Check if IP is blocked
  async isBlocked(ip: string) {
    const response = await api.get(`/api/v1/mitigation/is-blocked/${ip}`);
    return response.data;
  },

  // Get statistics
  async getStats() {
    const response = await api.get('/api/v1/mitigation/stats');
    return response.data;
  }
};
```

#### 4. Dashboard Component
```typescript
// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { trafficService, mitigationService } from '../services';

const Dashboard: React.FC = () => {
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [blocked, trafficSum] = await Promise.all([
        mitigationService.getBlockedIps(),
        trafficService.getSummary('1h')
      ]);
      
      setBlockedIps(blocked.blockedIps || []);
      setSummary(trafficSum);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>DefenDDoS Dashboard</h1>
      
      <div className="stats">
        <div className="stat-card">
          <h3>Blocked IPs</h3>
          <p className="stat-value">{blockedIps.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Packets</h3>
          <p className="stat-value">{summary?.totalPackets || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>Unique IPs</h3>
          <p className="stat-value">{summary?.uniqueSourceIps || 0}</p>
        </div>
      </div>

      <div className="blocked-ips">
        <h2>Blocked IP Addresses</h2>
        {blockedIps.length === 0 ? (
          <p>No IPs currently blocked</p>
        ) : (
          <ul>
            {blockedIps.map(ip => (
              <li key={ip}>
                {ip}
                <button onClick={() => handleUnblock(ip)}>Unblock</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  async function handleUnblock(ip: string) {
    try {
      await mitigationService.unblockIp(ip);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to unblock IP:', error);
    }
  }
};

export default Dashboard;
```

#### 5. Traffic Chart Component
```typescript
// src/components/TrafficChart.tsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { trafficService } from '../services';

const TrafficChart: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchChartData = async () => {
    try {
      const data = await trafficService.getVisualization('1h', '5m');
      
      setChartData({
        labels: data.timeSeriesData.map((d: any) => 
          new Date(d.timestamp).toLocaleTimeString()
        ),
        datasets: [
          {
            label: 'Packet Count',
            data: data.timeSeriesData.map((d: any) => d.packetCount),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
  };

  if (!chartData) return <div>Loading chart...</div>;

  return (
    <div className="traffic-chart">
      <h2>Traffic Over Time</h2>
      <Line data={chartData} options={{
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Network Traffic (Last Hour)' }
        }
      }} />
    </div>
  );
};

export default TrafficChart;
```

---

### Vue.js Example

#### 1. Traffic Store (Pinia)
```typescript
// src/stores/trafficStore.ts
import { defineStore } from 'pinia';
import axios from 'axios';

const API_BASE = 'http://localhost:8082';

export const useTrafficStore = defineStore('traffic', {
  state: () => ({
    summary: null as any,
    blockedIps: [] as string[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchSummary(duration: string = '1h') {
      this.loading = true;
      try {
        const response = await axios.get(
          `${API_BASE}/api/v1/traffic/summary?duration=${duration}`
        );
        this.summary = response.data.data;
      } catch (error) {
        this.error = 'Failed to fetch traffic summary';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchBlockedIps() {
      try {
        const response = await axios.get(
          `${API_BASE}/api/v1/mitigation/blocked`
        );
        this.blockedIps = response.data.blockedIps || [];
      } catch (error) {
        console.error('Failed to fetch blocked IPs:', error);
      }
    },

    async blockIp(ip: string, reason?: string) {
      const url = `${API_BASE}/api/v1/mitigation/block/${ip}`;
      const params = reason ? { reason } : {};
      await axios.post(url, null, { params });
      await this.fetchBlockedIps(); // Refresh
    },

    async unblockIp(ip: string) {
      await axios.post(`${API_BASE}/api/v1/mitigation/unblock/${ip}`);
      await this.fetchBlockedIps(); // Refresh
    }
  }
});
```

#### 2. Dashboard Component
```vue
<!-- src/components/Dashboard.vue -->
<template>
  <div class="dashboard">
    <h1>DefenDDoS Dashboard</h1>
    
    <div v-if="loading">Loading...</div>
    
    <div v-else class="stats">
      <div class="stat-card">
        <h3>Blocked IPs</h3>
        <p class="stat-value">{{ blockedIps.length }}</p>
      </div>
      
      <div class="stat-card">
        <h3>Total Packets</h3>
        <p class="stat-value">{{ summary?.totalPackets || 0 }}</p>
      </div>
    </div>

    <div class="blocked-ips">
      <h2>Blocked IP Addresses</h2>
      <ul v-if="blockedIps.length > 0">
        <li v-for="ip in blockedIps" :key="ip">
          {{ ip }}
          <button @click="handleUnblock(ip)">Unblock</button>
        </li>
      </ul>
      <p v-else>No IPs currently blocked</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTrafficStore } from '../stores/trafficStore';
import { storeToRefs } from 'pinia';

const trafficStore = useTrafficStore();
const { summary, blockedIps, loading } = storeToRefs(trafficStore);

let refreshInterval: number;

onMounted(() => {
  fetchData();
  refreshInterval = setInterval(fetchData, 30000); // Refresh every 30s
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});

const fetchData = async () => {
  await Promise.all([
    trafficStore.fetchSummary('1h'),
    trafficStore.fetchBlockedIps()
  ]);
};

const handleUnblock = async (ip: string) => {
  try {
    await trafficStore.unblockIp(ip);
  } catch (error) {
    console.error('Failed to unblock IP:', error);
  }
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.stat-card {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: #333;
}

.blocked-ips {
  margin-top: 30px;
}

.blocked-ips ul {
  list-style: none;
  padding: 0;
}

.blocked-ips li {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #fff;
  margin: 5px 0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #c82333;
}
</style>
```

---

## 🧪 Testing

### API Testing with cURL

#### Test Traffic Ingestion
```bash
curl -X POST http://localhost:8082/api/v1/traffic/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceIp": "192.168.1.100",
    "destinationIp": "10.0.0.1",
    "packetCount": 1500,
    "byteCount": 96000
  }'
```

#### Get Blocked IPs
```bash
curl http://localhost:8082/api/v1/mitigation/blocked
```

#### Block IP
```bash
curl -X POST "http://localhost:8082/api/v1/mitigation/block/45.33.32.156?reason=Test%20block"
```

#### Trigger Detection
```bash
curl -X POST http://localhost:8082/api/v1/security/trigger-detection
```

### Frontend Testing Checklist
- [ ] Traffic ingestion works
- [ ] Dashboard displays real-time data
- [ ] Blocked IPs list updates automatically
- [ ] Manual blocking/unblocking works
- [ ] Charts render correctly
- [ ] Error handling displays user-friendly messages
- [ ] Loading states work properly
- [ ] Polling doesn't cause memory leaks
- [ ] API rate limiting doesn't cause issues
- [ ] Mobile responsive design

---

## 📱 Recommended Frontend Features

### Essential Pages
1. **Dashboard** - Overview of system status
2. **Traffic Monitor** - Real-time traffic visualization
3. **Blocked IPs** - Manage blocked addresses
4. **Threat Detection** - ML analysis results
5. **Alerts** - Notification history
6. **Settings** - System configuration

### UI Components
```typescript
// Suggested component structure
├── components/
│   ├── Dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── TrafficChart.tsx
│   │   └── RecentAlerts.tsx
│   ├── BlockedIPs/
│   │   ├── BlockedIPList.tsx
│   │   ├── BlockIPForm.tsx
│   │   └── IPDetails.tsx
│   ├── Traffic/
│   │   ├── TrafficTable.tsx
│   │   ├── TrafficChart.tsx
│   │   └── TrafficStats.tsx
│   ├── Alerts/
│   │   ├── AlertList.tsx
│   │   └── AlertDetails.tsx
│   └── Common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       └── ConfirmDialog.tsx
```

### Visualizations
1. **Traffic Over Time** - Line chart (packets/s, bytes/s)
2. **Threat Severity** - Gauge or pie chart
3. **Top Source IPs** - Bar chart
4. **Detection Success Rate** - Donut chart
5. **Attack Types** - Pie chart
6. **System Health** - Status indicators

---

## 🚀 Quick Start Guide

### 1. Start Backend Services
```bash
cd backend-service
docker-compose up -d
```

### 2. Verify Services
```bash
# Backend health
curl http://localhost:8082/actuator/health

# ML service health
curl http://localhost:8000/health

# Get blocked IPs
curl http://localhost:8082/api/v1/mitigation/blocked
```

### 3. Test API
```bash
# Ingest test traffic
curl -X POST http://localhost:8082/api/v1/traffic/ingest \
  -H "Content-Type: application/json" \
  -d '{"sourceIp":"192.168.1.1","destinationIp":"10.0.0.1","packetCount":100,"byteCount":6400}'
```

### 4. Frontend Development
```bash
# Install dependencies
npm install axios chart.js react-chartjs-2

# Add type definitions
npm install --save-dev @types/node
```

---

## 📞 Support & Resources

### Documentation
- **API Guide**: This file
- **ML Models**: `docs/ML_MODELS_INTEGRATION.md`
- **Deployment**: `docs/DOCKER_DEPLOYMENT.md`

### Key Directories
```
backend-service/
├── src/main/java/          # Backend source code
├── ml-service/             # ML service (Python)
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

### Testing Endpoints
All endpoints are accessible without authentication during development.

### Performance Considerations
- **Detection Scan**: Runs every 30 seconds
- **Recommended Polling**: 10-30 seconds for frontend
- **API Response Time**: < 100ms for most endpoints
- **ML Prediction**: 50-200ms depending on complexity

---

## ✅ Summary

Your backend provides:
- ✅ **6 Traffic Management APIs** (ingest, query, summary, visualization, prediction, health)
- ✅ **5 Mitigation APIs** (block, unblock, list, check, stats)
- ✅ **5 Security APIs** (dashboard, trigger, analyze, status, alerts)
- ✅ **2 ML Service APIs** (health, predict)
- ✅ **3 Monitoring APIs** (health, info, metrics)

**Total: 21 API endpoints ready for frontend integration!**

All endpoints return consistent JSON responses with proper error handling and are documented with request/response examples.

---

**Last Updated**: October 11, 2025  
**Version**: 2.0.0-SNAPSHOT  
**Status**: ✅ Ready for Frontend Development
