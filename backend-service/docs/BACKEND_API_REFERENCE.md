# Backend API Reference (DefenDDoS Backend Service)

**Version: 2.0**  
**Last Updated: October 2025**

This document lists all REST API endpoints exposed by the backend service, including new comprehensive data retrieval, statistics, and enhanced mitigation features.

## Base URL

- **Development**: `http://localhost:8082`
- **Production**: Configure via environment
- **API Base Path**: `/api/v1/`

## Key Features

✅ **Comprehensive Data Persistence** - All traffic, ML predictions, detection events, and blocked IPs saved to InfluxDB  
✅ **Auto-Detection** - Automated threat detection every 15 seconds  
✅ **Auto-Blocking** - Critical threats automatically blocked  
✅ **ML Integration** - Random Forest + LSTM models with confidence scoring  
✅ **Real-time Statistics** - Comprehensive analytics and metrics  
✅ **Full Data Retrieval** - Access to all historical data  

## Security and Headers

- **Authentication**: Current deployment does not enforce JWT (configurable via `SecurityConfig`)
- **Common Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`
- **Rate Limiting**: 100 requests per minute per IP (configurable via `application.properties`)

## Response Format

All endpoints return a standardized `ApiResponse<T>` wrapper:

```json
{
  "success": boolean,
  "message": string,
  "data": T,
  "error": {
    "code": string,
    "message": string,
    "details": string
  },
  "timestamp": string (ISO 8601),
  "path": string
}
```

---

## Controllers and Endpoints

### 1. Traffic Controller
**Base Path**: `/api/v1/traffic`

Manages traffic data ingestion, querying, and ML predictions.

#### POST `/api/v1/traffic/ingest`
  - ipAddress (string) — the IP to analyze
- Request body: none
- Response (200): map containing ipAddress, threatLevel (e.g. CRITICAL/HIGH/MEDIUM/LOW), analysisTime, recommendation
- Error: returns 400 with error message on failure

Example response.data:

  {
    "ipAddress": "1.2.3.4",
    "threatLevel": "LOW",
    "analysisTime": "2025-10-13T...Z",
    "recommendation": "LOW RISK: Continue monitoring"
  }

3) POST /api/v1/security/test-alert
- Description: Fire a test alert via alerting subsystem.
- Request: none
- Response (200): { "message": "<result from alertService>" }

4) GET /api/v1/security/status
- Description: Get detailed system status for security subsystems.
- Request: none
- Response.data: map with timestamp, services (map), uptime, version

5) POST /api/v1/security/trigger-detection
- Description: Trigger a manual detection scan (testing utility).
- Request: none
- Response.data: { success: boolean, message: string, timestamp }


## Traffic Controller
Base path: `/api/v1/traffic`

Most traffic endpoints return `ApiResponse<T>` where T is described per endpoint.

1) POST /api/v1/traffic/ingest
- Description: Ingest a traffic data point into the system (Persisted to InfluxDB).
- Request headers: Content-Type: application/json
- Request body: `TrafficPoint` JSON

TrafficPoint fields:

  {
    "sourceIp": "string",
    "destinationIp": "string",
    "packetCount": number,
    "byteCount": number,
    "timestamp": "ISO8601 string (optional)"
  }

- Validation: sourceIp and destinationIp required and must be valid IPv4 (controller checks). If timestamp omitted, server will set current time.
- Success response.data: `TrafficDataResponse` object

TrafficDataResponse fields:

  {
    "source_ip": string,
    "destination_ip": string,
    "packet_count": number,
    "byte_count": number,
    "timestamp": string,
    "threat_level": string?,
    "is_blocked": boolean?,
    "packets_per_second": number?,
    "bytes_per_second": number?
  }

Example request:

  {
    "sourceIp": "10.0.0.1",
    "destinationIp": "10.0.0.2",
    "packetCount": 120,
    "byteCount": 15000
  }

2) GET /api/v1/traffic/query?range=<range>
- Description: Query recent traffic points. `range` defaults to `-1h` (supports formats like -5m, -1h).
- Response.data: List of maps; each map is implementation-defined by `trafficService.getTrafficData(range)` but typically contains timestamp, source/destination, packet/byte counts and metadata.

3) GET /api/v1/traffic/summary?range=<range>
- Description: Aggregated summary by IP for given range (default -1h).
- Response.data: List of maps or `TrafficSummaryResponse` structures. Each item typically contains source_ip, total_packets, total_bytes, threat_score, status, etc.

TrafficSummaryResponse fields (possible keys):

  {
    "source_ip": string,
    "total_packets": number,
    "total_bytes": number,
    "connection_count": number,
    "avg_packet_size": number,
    "threat_score": number,
    "is_suspicious": boolean,
    "first_seen": string,
    "last_seen": string,
    "destination_ips": [string],
    "status": "NORMAL|SUSPICIOUS|BLOCKED"
  }

4) GET /api/v1/traffic/visualization?range=<range>&window=<window>
- Description: Returns time-series points for charting. Defaults: range=-1h, window=1m
- Response.data: List of `TrafficSummaryPoint` objects with fields (time, totalPackets)

TrafficSummaryPoint fields:
  - time: ISO timestamp
  - totalPackets: number

5) POST /api/v1/traffic/predict-attack
- Description: Submit a traffic point for ML-based attack prediction. Uses `MLDetectionService` if configured.
- Request body: `TrafficPoint` (same as ingest) or `MLPredictionRequest` style features if advanced input is prepared by frontend.

If ML service is not configured, response will be an ApiResponse error with code `ML_DISABLED`.

On success, response.data is `MLPredictionResponse` with these fields:

  {
    "is_attack": boolean,
    "attack_type": string?,
    "confidence": number (0.0-1.0),
    "rf_confidence": number?,
    "lstm_anomaly_score": number?,
    "severity": "CRITICAL|HIGH|MEDIUM|LOW",
    "timestamp": string,
    "model_version": string?,
    "detection_method": string?,
    "source_ip": string,
    "recommended_action": string (BLOCK_IP|MONITOR|ALLOW),
    "threat_level": number (0-5)
  }

Notes for frontend: the backend may augment severity -> threatLevel mapping (0-5). Use `recommended_action` and `threat_level` to drive UI actions.

6) GET /api/v1/traffic/ml-health
- Description: Health check for ML service. If ML not configured, returns status `ML_DISABLED` and `mlModelsLoaded=false` inside `SystemHealthResponse`.
- Response.data: `SystemHealthResponse` with fields: status, backend_status, ml_service_status, database_status, ml_models_loaded, active_connections, uptime_seconds, version, timestamp


## Mitigation Controller
Base path: `/api/v1/mitigation`

1) GET /api/v1/mitigation/status
- Description: Returns a `MitigationStatus` object from `MitigationService`.
- Response body (direct object or wrapped) contains fields:

  {
    "enabled": boolean,
    "dryRunMode": boolean,
    "blockedCount": number,
    "maxBlockedIps": number,
    "blockScriptPath": string,
    "unblockScriptPath": string
  }

2) GET /api/v1/mitigation/blocked
- Description: Retrieve the currently blocked IPs. Response.data is a map with keys `blockedIps` (array), `count` and `timestamp`.

3) POST /api/v1/mitigation/block/{ip}?reason=<reason>
- Description: Manually block a single IP. `reason` query param optional (default "Manual block via API").
- Path param: ip (string)
- Success response.data contains success, message, ip, reason, timestamp. If failure, 400 with success=false and message.

4) POST /api/v1/mitigation/unblock/{ip}
- Description: Manually unblock an IP. Returns success boolean and message.

5) POST /api/v1/mitigation/block/bulk
- Description: Bulk block multiple IPs. Request body JSON must contain `ips`: array of IP strings, optional `reason`.
- Example request:

  {
---

## 2. Statistics Controller
**Base Path**: `/api/v1/statistics`

**NEW**: Provides comprehensive statistics and analytics for dashboards.

#### GET `/api/v1/statistics/detailed`
**Description**: Get comprehensive statistics with all details  
**Query Parameters**:
- `range` (optional): Time range (e.g., `-1h`, `-24h`, `-7d`), default: `-1h`

**Response Data**:
```json
{
  "totalPackets": 1000000,
  "totalBytes": 64000000,
  "totalConnections": 500,
  "averagePacketSize": 64.0,
  "attackEventsCount": 5,
  "blockedIpsCount": 2,
  "mlStats": {
    "totalPredictions": 1000,
    "attackPredictions": 5,
    "benignPredictions": 995,
    "averageConfidence": 0.85,
    "highConfidenceAttacks": 3
  },
  "topThreats": [
    {"sourceIp": "203.0.113.50", "packetCount": 500000, "threatLevel": "CRITICAL"}
  ],
  "topTargets": [
    {"destinationIp": "192.168.1.1", "packetCount": 500000}
  ],
  "timeSeries": [
    {"timestamp": "2025-10-15T14:00:00Z", "packets": 10000, "bytes": 640000}
  ]
}
```

#### GET `/api/v1/statistics/realtime`
**Description**: Get real-time metrics for live monitoring  
**Response Data**: Current per-second traffic, active threats, baseline comparisons

#### GET `/api/v1/statistics/attack-analysis`
**Description**: Get detailed attack analysis report  
**Query Parameters**: `range` (optional), `sourceIp` (optional)

---

## 3. Data Retrieval Controller
**Base Path**: `/api/v1/data`

**NEW**: Comprehensive access to all stored data in InfluxDB.

#### GET `/api/v1/data/traffic/all`
**Description**: Retrieve ALL traffic records from database  
**Query Parameters**: `range` (optional, default: `-24h`)

**Response**: Array of all traffic data points with fields, values, timestamps

#### GET `/api/v1/data/ml-predictions/all`
**Description**: Retrieve ALL ML prediction records  
**Query Parameters**: `range` (optional, default: `-24h`)

**Response**: Array of ML predictions with confidence, attack type, severity

#### GET `/api/v1/data/detection-events/all`
**Description**: Retrieve ALL detection event records  
**Query Parameters**: `range` (optional, default: `-24h`)

**Response**: Array of detection events with threat levels, ML flags, reputation scores

#### GET `/api/v1/data/blocked-ips/all`
**Description**: Retrieve ALL blocked IP records from database  
**Query Parameters**: `range` (optional, default: `-30d`)

**Response**: Array of blocked IP history with block/unblock timestamps, reasons

#### GET `/api/v1/data/statistics`
**Description**: Get database-level statistics (record counts by measurement)

#### GET `/api/v1/data/export`
**Description**: Export all data for backup/analysis  
**Query Parameters**: `range` (optional)

**Response**: Complete data export with all measurements

---

## 4. Mitigation Controller (Enhanced)
**Base Path**: `/api/v1/mitigation`

**ENHANCED**: Now includes automatic persistence to database and auto-restore on startup.

#### GET `/api/v1/mitigation/status`
**Description**: Get mitigation service status  
**Response Data**:
```json
{
  "active": true,
  "dryRunMode": false,
  "blockedIpsCount": 2,
  "autoDetectionEnabled": true,
  "autoBlockingEnabled": true,
  "lastUpdated": "2025-10-15T14:30:00Z"
}
```

#### GET `/api/v1/mitigation/blocked`
**Description**: Get currently blocked IPs  
**Response Data**:
```json
{
  "blockedIps": ["203.0.113.50", "198.51.100.99"],
  "count": 2,
  "timestamp": 1697380800000
}
```

#### POST `/api/v1/mitigation/block/{ip}`
**Description**: Manually block an IP address  
**Path Parameters**: `ip` (IP address to block)  
**Query Parameters**: `reason` (optional, default: "Manual block")  
**Features**: 
- Automatically saves to database
- Persists across restarts
- Executes system-level iptables rules

#### POST `/api/v1/mitigation/unblock/{ip}`
**Description**: Unblock a previously blocked IP  
**Path Parameters**: `ip` (IP address to unblock)

#### POST `/api/v1/mitigation/block/bulk`
**Description**: Block multiple IPs at once  
**Request Body**:
```json
{
  "ips": ["1.2.3.4", "5.6.7.8"],
  "reason": "Bulk block operation"
}
```

#### POST `/api/v1/mitigation/clear`
**Description**: Emergency clear - unblock all IPs

#### GET `/api/v1/mitigation/check/{ip}`
**Description**: Check if specific IP is blocked

#### GET `/api/v1/mitigation/stats`
**Description**: Mitigation statistics

**Key Feature**: **Auto-Restore on Startup**
- MitigationService automatically loads blocked IPs from InfluxDB on startup
- Ensures blocked IPs persist across container restarts
- No manual intervention required

---

## 5. Security Controller
**Base Path**: `/api/v1/security`

#### GET `/api/v1/security/dashboard`
**Description**: Security dashboard overview  
**Response Data**:
```json
{
  "status": "operational",
  "detectionEnabled": true,
  "alertsEnabled": true,
  "lastScan": "2025-10-15T14:30:00Z",
  "systemHealth": "healthy",
  "activeThreats": 2
}
```

#### POST `/api/v1/security/analyze/{ipAddress}`
**Description**: Manually analyze a specific IP address
- IP validation: controllers validate basic IPv4 format for some endpoints; MitigationService supports IPv4 and basic IPv6 regex.
- Some endpoints (ML) are optional and depend on `MLDetectionService` bean being available; check `/api/v1/traffic/ml-health` before using ML endpoints.

Next steps (optional)
- I can add example request/response curl snippets for each endpoint, and generate a Postman collection or OpenAPI spec (Swagger) from code if you want. Ask which format you prefer.

---
Generated from the repository source on 2025-10-13.
