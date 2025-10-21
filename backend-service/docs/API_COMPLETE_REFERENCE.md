# DefenDDoS Backend API - Complete Endpoint Reference

**Version**: 2.0  
**Last Updated**: October 2025  
**Base URL**: `http://localhost:8082`  
**Test Status**: ✅ 21/31 endpoints verified (67.7%)

---

## 📋 Table of Contents

1. [Traffic Management](#traffic-management)
2. [ML Prediction](#ml-prediction)
3. [Statistics & Analytics](#statistics--analytics)
4. [Data Retrieval](#data-retrieval)
5. [Mitigation & Blocking](#mitigation--blocking)
6. [Security](#security)
7. [Threat Intelligence](#threat-intelligence)
8. [System Health](#system-health)

---

## Traffic Management

### POST /api/v1/traffic/ingest
**Status**: ✅ WORKING  
**Description**: Ingest network traffic data

**Request Body**:
```json
{
  "sourceIp": "10.0.0.100",
  "destinationIp": "192.168.1.10",
  "packetCount": 1000,
  "byteCount": 64000
}
```

**Response**:
```json
{
  "success": true,
  "message": "Traffic data ingested successfully",
  "data": {
    "source_ip": "10.0.0.100",
    "destination_ip": "192.168.1.10",
    "packet_count": 1000,
    "byte_count": 64000,
    "timestamp": "2025-10-15T14:52:00.123Z"
  },
  "timestamp": "2025-10-15T14:52:00.456Z"
}
```

### GET /api/v1/traffic/query
**Status**: ✅ WORKING  
**Description**: Query traffic records  
**Parameters**: 
- `range` (optional): Time range (e.g., `-5m`, `-1h`, `-24h`)

**Example**: `/api/v1/traffic/query?range=-5m`

**Response**:
```json
{
  "success": true,
  "message": "Retrieved 2 traffic records",
  "data": [
    {
      "sourceIp": "10.0.0.100",
      "destinationIp": "192.168.1.10",
      "field": "packetCount",
      "value": 1000,
      "time": "2025-10-15T14:52:00Z"
    }
  ]
}
```

### GET /api/v1/traffic/summary
**Status**: ✅ WORKING  
**Description**: Get traffic summary grouped by source IP  
**Parameters**: `range` (optional)

**Example**: `/api/v1/traffic/summary?range=-1h`

**Response**:
```json
{
  "success": true,
  "message": "Retrieved summary for 5 IPs",
  "data": [
    {
      "sourceIp": "10.0.0.100",
      "totalPackets": 1000,
      "timeRange": "-1h"
    }
  ]
}
```

### GET /api/v1/traffic/visualization
**Status**: ✅ WORKING  
**Description**: Get time-series data for visualization  
**Parameters**: 
- `range` (optional): Time range
- `window` (optional): Aggregation window (e.g., `5m`, `1h`)

**Example**: `/api/v1/traffic/visualization?range=-1h&window=5m`

**Response**:
```json
{
  "success": true,
  "message": "Retrieved 65 visualization points",
  "data": [
    {
      "time": "2025-10-15T14:10:00Z",
      "totalPackets": 0
    }
  ]
}
```

### GET /api/v1/traffic/ml-health
**Status**: ✅ WORKING  
**Description**: Check ML service connection status

**Response**:
```json
{
  "success": true,
  "message": "ML service is operational",
  "data": {
    "status": "HEALTHY",
    "ml_service_status": "OPERATIONAL",
    "ml_models_loaded": true,
    "connected": true
  }
}
```

---

## ML Prediction

### POST /api/v1/traffic/predict-attack
**Status**: ✅ WORKING  
**Description**: Predict if traffic is an attack using ML models

**Request Body**:
```json
{
  "sourceIp": "10.0.0.101",
  "destinationIp": "192.168.1.10",
  "packetCount": 5000,
  "byteCount": 320000
}
```

**Response**:
```json
{
  "success": true,
  "message": "ML prediction completed",
  "data": {
    "is_attack": false,
    "attack_type": "BENIGN",
    "confidence": 0.714,
    "confidence_percentage": 71.4,
    "rf_confidence": 0.714,
    "lstm_anomaly_score": 0.0613,
    "severity": "NORMAL",
    "recommended_action": "ALLOW",
    "threat_level": 1,
    "severity_color": "green",
    "highConfidenceAttack": false,
    "criticalThreat": true,
    "timestamp": "2025-10-15T14:52:00Z",
    "model_version": "2.0.0",
    "detection_method": "combined",
    "source_ip": "10.0.0.101"
  }
}
```

**ML Prediction Fields**:
- `is_attack`: Boolean indicating if traffic is malicious
- `attack_type`: Type of attack (BENIGN, DOS, DDOS, etc.)
- `confidence`: ML model confidence (0-1)
- `rf_confidence`: Random Forest model confidence
- `lstm_anomaly_score`: LSTM anomaly detection score
- `severity`: NORMAL, LOW, MEDIUM, HIGH, CRITICAL
- `recommended_action`: ALLOW, MONITOR, ALERT, BLOCK

---

## Statistics & Analytics

### GET /api/v1/statistics/detailed
**Status**: ✅ WORKING  
**Description**: Get comprehensive statistics with all details  
**Parameters**: `range` (optional, default: `-1h`)

**Example**: `/api/v1/statistics/detailed?range=-1h`

**Response**:
```json
{
  "success": true,
  "message": "Detailed statistics retrieved",
  "data": {
    "totalPackets": 1000,
    "totalBytes": 64000,
    "totalConnections": 5,
    "averagePacketSize": 64.0,
    "attackEventsCount": 0,
    "blockedIpsCount": 2,
    "mlStats": {
      "totalPredictions": 10,
      "attackPredictions": 0,
      "benignPredictions": 10,
      "averageConfidence": 0.85,
      "highConfidenceAttacks": 0
    },
    "topThreats": [
      {
        "sourceIp": "203.0.113.50",
        "packetCount": 500000,
        "threatLevel": "CRITICAL"
      }
    ],
    "topTargets": [
      {
        "destinationIp": "192.168.1.1",
        "packetCount": 500000
      }
    ],
    "timeSeries": [
      {
        "timestamp": "2025-10-15T14:00:00Z",
        "packets": 10000,
        "bytes": 640000
      }
    ]
  }
}
```

### GET /api/v1/statistics/realtime
**Status**: ✅ WORKING  
**Description**: Get real-time metrics for live monitoring

**Response**:
```json
{
  "success": true,
  "message": "Real-time metrics retrieved",
  "data": {
    "currentPacketsPerSecond": 16,
    "currentBytesPerSecond": 1066,
    "activeThreatsCount": 0,
    "baseline": {
      "packetsPerSecond": 10,
      "bytesPerSecond": 640
    },
    "anomalyScore": 1.2
  }
}
```

### GET /api/v1/statistics/attack-analysis
**Status**: ✅ WORKING  
**Description**: Get detailed attack analysis report  
**Parameters**: 
- `range` (optional)
- `sourceIp` (optional): Filter by specific IP

**Example**: `/api/v1/statistics/attack-analysis?range=-1h`

**Response**:
```json
{
  "success": true,
  "message": "Attack analysis completed",
  "data": {
    "attackId": "42dc4c8a-5d3b-48e3-bc48-2491bd3d55b8",
    "attackType": "DDoS",
    "severity": "HIGH",
    "startTime": "2025-10-15T14:00:00Z",
    "duration": 120,
    "sourceIps": ["203.0.113.50", "198.51.100.99"],
    "targetIps": ["192.168.1.1"],
    "totalPackets": 500000,
    "peakPacketsPerSecond": 5000
  }
}
```

### GET /api/v1/statistics/ml-stats
**Status**: ✅ WORKING  
**Description**: Get ML model statistics  
**Parameters**: `range` (optional)

**Response**:
```json
{
  "success": true,
  "message": "ML statistics retrieved",
  "data": {
    "totalPredictions": 100,
    "attackPredictions": 5,
    "benignPredictions": 95,
    "averageConfidence": 0.85,
    "highConfidenceAttacks": 3,
    "modelAccuracy": 0.92
  }
}
```

---

## Data Retrieval

### GET /api/v1/data/traffic/all
**Status**: ✅ WORKING  
**Description**: Retrieve ALL traffic records from database  
**Parameters**: `range` (optional, default: `-24h`)

**Example**: `/api/v1/data/traffic/all?range=-1h`

**Response**:
```json
{
  "success": true,
  "message": "Retrieved 46 traffic records",
  "data": [
    {
      "sourceIp": "10.0.0.100",
      "destinationIp": "192.168.1.10",
      "field": "packetCount",
      "value": 1000,
      "time": "2025-10-15T14:52:00Z",
      "measurement": "traffic_data"
    }
  ]
}
```

### GET /api/v1/data/ml-predictions/all
**Status**: ✅ WORKING  
**Description**: Retrieve ALL ML prediction records  
**Parameters**: `range` (optional, default: `-24h`)

**Response**:
```json
{
  "success": true,
  "message": "Retrieved 400 ML predictions",
  "data": [
    {
      "sourceIp": "10.0.0.100",
      "destinationIp": "192.168.1.10",
      "isAttack": "false",
      "attackType": "BENIGN",
      "severity": "NORMAL",
      "field": "confidence",
      "value": 0.714,
      "time": "2025-10-15T14:52:00Z",
      "measurement": "ml_predictions"
    }
  ]
}
```

### GET /api/v1/data/detection-events/all
**Status**: ✅ WORKING  
**Description**: Retrieve ALL detection event records  
**Parameters**: `range` (optional, default: `-24h`)

**Response**:
```json
{
  "success": true,
  "message": "Retrieved 222 detection events",
  "data": [
    {
      "sourceIp": "203.0.113.50",
      "threatLevel": "CRITICAL",
      "mlDetected": "false",
      "knownThreat": "true",
      "field": "packetCount",
      "value": 500000,
      "time": "2025-10-15T14:44:30Z",
      "measurement": "detection_events"
    }
  ]
}
```

### GET /api/v1/data/blocked-ips/all
**Status**: ✅ WORKING  
**Description**: Retrieve ALL blocked IP records from database  
**Parameters**: `range` (optional, default: `-30d`)

**Response**:
```json
{
  "success": true,
  "message": "Retrieved 76 blocked IP records",
  "data": [
    {
      "ip": "203.0.113.50",
      "status": "blocked",
      "field": "timestamp",
      "value": "2025-10-15T14:44:30Z",
      "time": "2025-10-15T14:44:30Z",
      "measurement": "blocked_ips"
    }
  ]
}
```

### GET /api/v1/data/statistics
**Status**: ✅ WORKING  
**Description**: Get database-level statistics (record counts by measurement)

**Response**:
```json
{
  "success": true,
  "message": "Database statistics retrieved",
  "data": {
    "bucket": "ddos-bucket",
    "traffic_data_count": 46,
    "ml_predictions_count": 436,
    "detection_events_count": 222,
    "blocked_ips_count": 76,
    "total_records": 780
  }
}
```

---

## Mitigation & Blocking

### POST /api/v1/mitigation/block/{ip}
**Status**: ✅ WORKING  
**Description**: Manually block an IP address  
**Parameters**: 
- `ip` (path): IP address to block
- `reason` (query, optional): Reason for blocking

**Example**: `POST /api/v1/mitigation/block/192.0.2.100?reason=Manual%20block`

**Response**:
```json
{
  "success": true,
  "message": "IP successfully blocked",
  "data": {
    "ip": "192.0.2.100",
    "success": true,
    "reason": "Manual block",
    "message": "IP successfully blocked",
    "timestamp": 1760540726149
  }
}
```

**Features**:
- Automatically saves to database
- Persists across restarts
- Executes system-level iptables rules (if not dry-run)

### POST /api/v1/mitigation/unblock/{ip}
**Status**: ✅ WORKING  
**Description**: Unblock a previously blocked IP  
**Parameters**: `ip` (path): IP address to unblock

**Example**: `POST /api/v1/mitigation/unblock/192.0.2.100`

**Response**:
```json
{
  "success": true,
  "message": "IP successfully unblocked",
  "data": {
    "ip": "192.0.2.100",
    "success": true,
    "message": "IP successfully unblocked",
    "timestamp": 1760540726246
  }
}
```

### GET /api/v1/mitigation/is-blocked/{ip}
**Status**: ✅ WORKING  
**Description**: Check if specific IP is currently blocked  
**Parameters**: `ip` (path): IP address to check

**Example**: `GET /api/v1/mitigation/is-blocked/192.0.2.100`

**Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "ip": "192.0.2.100",
    "isBlocked": true,
    "status": "blocked"
  }
}
```

### GET /api/v1/mitigation/stats
**Status**: ✅ WORKING  
**Description**: Get mitigation statistics

**Response**:
```json
{
  "totalBlockedIps": 3,
  "activeBlocks": 3,
  "mitigationEnabled": true,
  "dryRunMode": false,
  "maxBlockedIps": 1000,
  "lastUpdated": 1760540726173
}
```

### GET /api/v1/mitigation/status
**Status**: ⚠️ Response format differs (but functional)  
**Description**: Get mitigation service status

### GET /api/v1/mitigation/blocked
**Status**: ⚠️ Response format differs (but functional)  
**Description**: Get list of currently blocked IPs

---

## System Health

### GET /actuator/health
**Status**: ✅ WORKING  
**Description**: Spring Boot Actuator health endpoint

**Response**:
```json
{
  "status": "UP"
}
```

### GET /health (ML Service)
**Status**: ✅ WORKING  
**Description**: ML service health check  
**URL**: `http://localhost:8000/health`

**Response**:
```json
{
  "status": "healthy",
  "rf_model_loaded": true,
  "scaler_loaded": true,
  "lstm_model_loaded": true,
  "selected_features_loaded": true
}
```

---

## Response Format

### Standard API Response Wrapper

Most endpoints return responses wrapped in this format:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array,
  "error": {
    "code": string,
    "message": string,
    "details": string
  },
  "timestamp": string (ISO 8601),
  "path": string
}
```

### Time Range Format

Time ranges use negative notation:
- `-5m` = Last 5 minutes
- `-1h` = Last 1 hour
- `-24h` = Last 24 hours
- `-7d` = Last 7 days
- `-30d` = Last 30 days

---

## Frontend Integration Examples

### JavaScript/TypeScript

```javascript
// Get real-time statistics (poll every 5 seconds)
async function fetchRealTimeMetrics() {
  const response = await fetch('http://localhost:8082/api/v1/statistics/realtime');
  const data = await response.json();
  
  if (data.success) {
    updateDashboard({
      packetsPerSecond: data.data.currentPacketsPerSecond,
      bytesPerSecond: data.data.currentBytesPerSecond,
      activeThreats: data.data.activeThreatsCount
    });
  }
}

// Ingest traffic data
async function ingestTraffic(sourceIp, destIp, packets, bytes) {
  const response = await fetch('http://localhost:8082/api/v1/traffic/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceIp,
      destinationIp: destIp,
      packetCount: packets,
      byteCount: bytes
    })
  });
  
  return await response.json();
}

// Get ML prediction
async function predictAttack(sourceIp, destIp, packets, bytes) {
  const response = await fetch('http://localhost:8082/api/v1/traffic/predict-attack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceIp,
      destinationIp: destIp,
      packetCount: packets,
      byteCount: bytes
    })
  });
  
  const data = await response.json();
  return data.success ? data.data : null;
}

// Get all traffic data for visualization
async function fetchTrafficHistory(range = '-1h') {
  const response = await fetch(`http://localhost:8082/api/v1/data/traffic/all?range=${range}`);
  const data = await response.json();
  return data.success ? data.data : [];
}
```

### PowerShell

```powershell
# Ingest traffic
$traffic = @{
    sourceIp = "10.0.0.1"
    destinationIp = "192.168.1.1"
    packetCount = 5000
    byteCount = 320000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
    -Method POST `
    -Body ($traffic | ConvertTo-Json) `
    -ContentType "application/json"

# Get detailed statistics
$stats = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/statistics/detailed?range=-1h"
Write-Host "Total Packets: $($stats.data.totalPackets)"
Write-Host "Blocked IPs: $($stats.data.blockedIpsCount)"

# Block an IP
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/block/203.0.113.50?reason=Manual" `
    -Method POST
```

---

## Polling Recommendations for Frontend

- **Real-time Metrics**: Poll every **5 seconds** for live dashboard
- **Statistics**: Poll every **30 seconds** for detailed stats
- **Detection Events**: Poll every **15 seconds** for new alerts
- **Blocked IPs**: Poll every **10 seconds** for mitigation status
- **Traffic Data**: Poll every **60 seconds** for historical charts

---

## Error Handling

### Common HTTP Status Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Endpoint or resource not found
- `500 Internal Server Error`: Server-side error

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message",
    "details": "Stack trace or additional info"
  },
  "timestamp": "2025-10-15T14:52:00Z",
  "path": "/api/v1/endpoint"
}
```

---

## Testing

Run comprehensive endpoint tests:

```powershell
.\test-all-endpoints.ps1
```

Run feature tests:

```powershell
.\test-all-features.ps1
```

---

## Summary

### ✅ Working Endpoints (21/31)

**Traffic**: 5/5 endpoints  
**ML Prediction**: 1/1 endpoint  
**Statistics**: 4/4 endpoints  
**Data Retrieval**: 5/5 endpoints  
**Mitigation**: 5/8 endpoints (3 have format differences but functional)  
**Health**: 2/2 endpoints  

### ⚠️ Endpoints with Format Differences (3)

These work but don't return standard ApiResponse wrapper:
- `/api/v1/mitigation/status`
- `/api/v1/mitigation/blocked`
- `/api/v1/security/dashboard`

### ❌ Not Working (7)

- Threat Intelligence endpoints (500 errors)
- Actuator endpoints (different format, not critical)

---

**Last Verified**: October 15, 2025  
**Backend Version**: 2.0  
**Test Success Rate**: 67.7% (21/31 core endpoints working)
