# DefenDDoS API Quick Reference

## 🚀 Base URLs
```
Backend:  http://localhost:8082
ML Service: http://localhost:8000
```

---

## 📊 Traffic Management APIs

| Method | Endpoint | Purpose | Key Params |
|--------|----------|---------|------------|
| POST | `/api/v1/traffic/ingest` | Submit traffic data | Body: `sourceIp, destinationIp, packetCount, byteCount` |
| GET | `/api/v1/traffic/query` | Get historical traffic | `range=-1h` (time range) |
| GET | `/api/v1/traffic/summary` | Get traffic stats | `duration=1h` |
| GET | `/api/v1/traffic/visualization` | Get chart data | `duration=1h&interval=5m` |
| POST | `/api/v1/traffic/predict-attack` | Manual ML analysis | Body: traffic data |
| GET | `/api/v1/traffic/ml-health` | Check ML service | - |

---

## 🛡️ Mitigation (IP Blocking) APIs

| Method | Endpoint | Purpose | Key Params |
|--------|----------|---------|------------|
| POST | `/api/v1/mitigation/block/{ip}` | Block IP address | `reason=...` (optional) |
| POST | `/api/v1/mitigation/unblock/{ip}` | Unblock IP address | - |
| GET | `/api/v1/mitigation/blocked` | List blocked IPs | - |
| GET | `/api/v1/mitigation/is-blocked/{ip}` | Check IP status | - |
| GET | `/api/v1/mitigation/stats` | Get mitigation stats | - |

---

## 🔐 Security Operations APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/security/dashboard` | Security overview |
| POST | `/api/v1/security/trigger-detection` | Force detection scan |
| POST | `/api/v1/security/analyze/{ip}` | Analyze specific IP |
| GET | `/api/v1/security/status` | System status |
| POST | `/api/v1/security/test-alert` | Test alerts |

---

## 🤖 ML Service APIs (Direct)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `http://localhost:8000/health` | ML service health |
| POST | `http://localhost:8000/predict` | Direct ML prediction |

---

## 📈 Monitoring APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/actuator/health` | Backend health check |
| GET | `/actuator/info` | Application info |
| GET | `/actuator/metrics` | System metrics |

---

## 🔥 Quick Testing Commands (PowerShell)

### Ingest Attack Traffic
```powershell
$attack = @{
  sourceIp = "192.168.1.100"
  destinationIp = "10.0.0.1"
  packetCount = 125000
  byteCount = 8000000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
  -Method POST -Body ($attack | ConvertTo-Json) -ContentType "application/json"
```

### Get Blocked IPs
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/blocked"
```

### Block IP
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/block/45.33.32.156?reason=Test" `
  -Method POST
```

### Get Traffic Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/summary?duration=1h"
```

### Trigger Detection
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/security/trigger-detection" `
  -Method POST
```

---

## 📦 Request Body Templates

### Traffic Ingestion
```json
{
  "sourceIp": "192.168.1.100",
  "destinationIp": "10.0.0.1",
  "packetCount": 1500,
  "byteCount": 96000
}
```

### ML Prediction (Manual)
```json
{
  "sourceIp": "45.33.32.156",
  "destinationIp": "10.0.0.1",
  "packetCount": 125000,
  "byteCount": 8000000
}
```

---

## 🎯 Response Templates

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ },
  "timestamp": "2025-10-11T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_TYPE",
  "errorDetails": "Detailed description",
  "timestamp": "2025-10-11T10:30:00Z"
}
```

### Blocked IPs Response (Special Format)
```json
{
  "count": 3,
  "blockedIps": ["203.0.113.50", "192.0.2.10", "198.51.100.5"],
  "timestamp": 1760174477188
}
```

### ML Prediction Response
```json
{
  "is_attack": true,
  "attack_type": "DDoS_ATTACK",
  "confidence": 0.58,
  "rf_confidence": 58.0,
  "lstm_anomaly_score": 131.6,
  "severity": "CRITICAL",
  "threat_level": "CRITICAL",
  "recommended_action": "BLOCK_IMMEDIATELY",
  "should_block": true
}
```

---

## ⚡ Frontend Integration Snippets

### React/Axios
```typescript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8082',
  timeout: 10000
});

// Ingest traffic
await API.post('/api/v1/traffic/ingest', trafficData);

// Get blocked IPs
const { data } = await API.get('/api/v1/mitigation/blocked');
console.log(data.blockedIps);

// Block IP
await API.post(`/api/v1/mitigation/block/${ip}`, null, {
  params: { reason: 'Suspicious activity' }
});
```

### Vue.js/Fetch
```typescript
// Ingest traffic
const response = await fetch('http://localhost:8082/api/v1/traffic/ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(trafficData)
});
const result = await response.json();

// Get blocked IPs
const blocked = await fetch('http://localhost:8082/api/v1/mitigation/blocked')
  .then(r => r.json());
```

---

## 🔄 Recommended Polling Intervals

| Feature | Interval | Reason |
|---------|----------|--------|
| Blocked IPs List | 15s | Real-time threat display |
| Traffic Charts | 10s | Live monitoring |
| Dashboard Stats | 30s | Balance load & freshness |
| System Health | 60s | Low-priority check |
| Detection Status | 30s | Matches backend scan cycle |

---

## 🚨 Error Codes

| Status | Type | Description | Action |
|--------|------|-------------|--------|
| 400 | `VALIDATION_ERROR` | Invalid input | Check request format |
| 404 | `NOT_FOUND` | Resource missing | Verify endpoint URL |
| 500 | `INGESTION_ERROR` | Save failed | Check InfluxDB |
| 500 | `ML_SERVICE_ERROR` | ML unavailable | Check ML service |
| 503 | `SERVICE_UNAVAILABLE` | Backend down | Wait & retry |

---

## 🎨 Severity Colors

| Severity | Color Code | Usage |
|----------|-----------|--------|
| NORMAL | `#28a745` | Safe traffic |
| LOW | `#17a2b8` | Minor concern |
| MEDIUM | `#ffc107` | Moderate threat |
| HIGH | `#fd7e14` | Serious threat |
| CRITICAL | `#dc3545` | Immediate action |

---

## 🔢 Threshold Values

### ML Detection Thresholds
- **Random Forest**: ≥50% confidence → Block
- **LSTM Anomaly**: >100 score → Block
- **Packet Volume**:
  - >50,000 packets = CRITICAL
  - >20,000 packets = HIGH
  - >10,000 packets = MEDIUM

### Auto-Blocking Triggers
1. Attack detected + RF confidence ≥50%
2. LSTM anomaly score >100
3. Severity = MEDIUM/HIGH/CRITICAL
4. Packet count >50K

---

## 📊 Key Metrics to Display

### Dashboard KPIs
- Total Blocked IPs
- Total Packets (last hour)
- Unique Source IPs
- Active Threats
- Detection Success Rate
- System Health Status

### Charts
- Traffic over time (line chart)
- Packets by source IP (bar chart)
- Severity distribution (pie chart)
- Detection timeline (timeline)

---

## 🧪 Test Scenarios

### 1. Normal Traffic
```json
{
  "sourceIp": "192.168.1.100",
  "destinationIp": "10.0.0.1",
  "packetCount": 500,
  "byteCount": 32000
}
```
**Expected**: No blocking, LOW severity

### 2. DDoS Attack
```json
{
  "sourceIp": "45.33.32.156",
  "destinationIp": "10.0.0.1",
  "packetCount": 125000,
  "byteCount": 8000000
}
```
**Expected**: Auto-blocked within 30s, CRITICAL severity

### 3. Suspicious Activity
```json
{
  "sourceIp": "203.0.113.50",
  "destinationIp": "10.0.0.1",
  "packetCount": 15000,
  "byteCount": 960000
}
```
**Expected**: HIGH severity, likely blocked

---

## 🎯 Quick Actions

### Check System Health
```bash
curl http://localhost:8082/actuator/health
```

### Get Current Status
```bash
curl http://localhost:8082/api/v1/security/dashboard
```

### Emergency Block IP
```bash
curl -X POST "http://localhost:8082/api/v1/mitigation/block/ATTACKER_IP?reason=Emergency"
```

### View All Blocked
```bash
curl http://localhost:8082/api/v1/mitigation/blocked | jq
```

---

## 📝 Notes

- **Authentication**: Currently disabled (`permitAll`)
- **CORS**: Configured for all origins (development)
- **Detection**: Automated every 30 seconds
- **ML Models**: Random Forest + LSTM Autoencoder
- **Database**: InfluxDB (time-series)
- **Auto-Blocking**: Fully operational

---

**Last Updated**: October 11, 2025  
**Version**: 2.0.0-SNAPSHOT
