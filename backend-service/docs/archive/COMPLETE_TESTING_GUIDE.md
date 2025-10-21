# Complete System Startup and Testing Guide

## 🚀 Quick Start - Complete System

### Step 1: Start All Services (2 minutes)

```powershell
# Navigate to backend directory
cd "d:\Capstone Project\project\backend-service"

# Start all services (InfluxDB, Backend, ML Service)
docker-compose up -d

# Wait for services to be healthy (about 30 seconds)
Start-Sleep -Seconds 30

# Check service status
docker-compose ps
```

**Expected Output:**
```
NAME                    STATUS
defenddos-influxdb      Up (healthy)
defenddos-backend       Up (healthy)
defenddos-ml-service    Up (healthy)
```

---

### Step 2: Verify ML Models Loaded

```powershell
# Test trained models integration
.\test-trained-models.ps1
```

**Expected Output:**
- ✓ Random Forest Loaded: True
- ✓ Scaler Loaded: True
- ✓ Features Count: 30
- ✓ All tests passing

---

### Step 3: Test ML Service Directly

```powershell
# Test benign traffic prediction
curl -X POST http://localhost:8000/predict `
  -H "Content-Type: application/json" `
  -d (Get-Content test-benign-traffic.json -Raw)

# Test attack traffic prediction
curl -X POST http://localhost:8000/predict `
  -H "Content-Type: application/json" `
  -d (Get-Content test-attack-traffic.json -Raw)
```

**Expected Output:**
```json
{
  "is_attack": true,
  "attack_type": "DDoS_ATTACK",
  "confidence": 0.92,
  "severity": "HIGH",
  "timestamp": "2025-10-09T...",
  "model_version": "2.0.0"
}
```

---

### Step 4: Test Backend API

#### 4.1 Check Backend Health
```powershell
curl http://localhost:8082/actuator/health
```

#### 4.2 Check ML Integration Status
```powershell
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/traffic/ml-health
```

**Expected Output:**
```json
{
  "ml_enabled": true,
  "healthy": true,
  "status": "ML service is operational"
}
```

#### 4.3 Ingest Traffic Data
```powershell
# Ingest normal traffic
curl -X POST http://localhost:8082/api/v1/traffic/ingest `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.10",
    "destinationIp": "10.0.0.1",
    "packetCount": 500,
    "byteCount": 50000
  }'

# Ingest attack traffic (will trigger detection)
curl -X POST http://localhost:8082/api/v1/traffic/ingest `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.100",
    "destinationIp": "10.0.0.1",
    "packetCount": 20000,
    "byteCount": 60000000
  }'
```

#### 4.4 Wait for Auto-Detection (30 seconds)
```powershell
# Detection runs every 30 seconds
Write-Host "Waiting for scheduled detection to run..." -ForegroundColor Yellow
Start-Sleep -Seconds 35

# Check logs for ML detection
docker-compose logs backend-service | Select-String "ML Detection"
```

#### 4.5 Check Blocked IPs
```powershell
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/traffic/blocked-ips
```

---

### Step 5: Test All Backend Features

#### Security Features
```powershell
# Get threat summary
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/security/threat-summary

# Get recent attacks
curl -u admin:DefenDDoS123! "http://localhost:8082/api/v1/security/recent-attacks?limit=10"

# Check system status
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/security/system-status
```

#### Traffic Analysis
```powershell
# Get traffic summary
curl -u admin:DefenDDoS123! "http://localhost:8082/api/v1/traffic/summary?range=-1h"

# Get traffic visualization data
curl -u admin:DefenDDoS123! "http://localhost:8082/api/v1/traffic/visualization?range=-1h&window=1m"

# Query raw traffic
curl -u admin:DefenDDoS123! "http://localhost:8082/api/v1/traffic/query?range=-1h"
```

#### Mitigation Features
```powershell
# Get all blocked IPs
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/mitigation/blocked-ips

# Get mitigation history
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/mitigation/history

# Manually block an IP
curl -X POST http://localhost:8082/api/v1/mitigation/block `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "ip": "192.168.1.99",
    "reason": "Manual test block"
  }'

# Unblock an IP
curl -X POST http://localhost:8082/api/v1/mitigation/unblock `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "ip": "192.168.1.99"
  }'
```

---

### Step 6: Comprehensive Testing Script

Run the complete test suite:

```powershell
# Test everything
.\test-ml-integration.ps1

# Test trained models specifically
.\test-trained-models.ps1
```

---

## 🔍 Monitoring and Logs

### View Real-time Logs

```powershell
# All services
docker-compose logs -f

# ML service only
docker-compose logs -f ml-service

# Backend only
docker-compose logs -f backend-service

# Filter for ML detections
docker-compose logs backend-service | Select-String "ML"

# Filter for attack detections
docker-compose logs backend-service | Select-String "THREAT DETECTED"
```

### Check Service Health

```powershell
# Docker status
docker-compose ps

# Detailed container info
docker-compose logs --tail=50 ml-service
docker-compose logs --tail=50 backend-service

# Resource usage
docker stats
```

---

## 🎯 Testing ML Detection End-to-End

### Complete Flow Test

```powershell
Write-Host "=== ML Detection End-to-End Test ===" -ForegroundColor Cyan

# 1. Ingest attack traffic
Write-Host "`n[1] Ingesting attack traffic..." -ForegroundColor Yellow
curl -X POST http://localhost:8082/api/v1/traffic/ingest `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.200",
    "destinationIp": "10.0.0.1",
    "packetCount": 25000,
    "byteCount": 75000000
  }'

# 2. Wait for scheduled detection
Write-Host "`n[2] Waiting for scheduled detection (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 35

# 3. Check logs for ML detection
Write-Host "`n[3] Checking ML detection logs..." -ForegroundColor Yellow
docker-compose logs backend-service | Select-String "ML Detection" | Select-Object -Last 5

# 4. Verify IP was blocked
Write-Host "`n[4] Checking if IP was blocked..." -ForegroundColor Yellow
$blockedIps = curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/mitigation/blocked-ips | ConvertFrom-Json
if ($blockedIps -match "192.168.1.200") {
    Write-Host "✓ IP 192.168.1.200 was blocked!" -ForegroundColor Green
} else {
    Write-Host "⚠ IP not blocked - check ML service configuration" -ForegroundColor Yellow
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
```

---

## 📊 Access Web Interfaces

| Service | URL | Credentials |
|---------|-----|-------------|
| **Backend API** | http://localhost:8082 | admin / DefenDDoS123! |
| **ML Service** | http://localhost:8000 | No auth |
| **ML API Docs** | http://localhost:8000/docs | No auth |
| **Backend Health** | http://localhost:8082/actuator/health | No auth |
| **InfluxDB UI** | http://localhost:8086 | admin / SecureInfluxPassword123 |

---

## 🧪 Testing Scenarios

### Scenario 1: Normal Traffic
```powershell
# Should NOT trigger detection
curl -X POST http://localhost:8082/api/v1/traffic/ingest `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.50",
    "packetCount": 100,
    "byteCount": 10000
  }'
```

### Scenario 2: Low-Volume Attack
```powershell
# Should detect but might not block (depends on confidence)
curl -X POST http://localhost:8082/api/v1/traffic/ingest `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.51",
    "packetCount": 5500,
    "byteCount": 16500000
  }'
```

### Scenario 3: High-Volume Attack
```powershell
# Should detect and block immediately
curl -X POST http://localhost:8082/api/v1/traffic/ingest `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.52",
    "packetCount": 50000,
    "byteCount": 150000000
  }'
```

---

## 🐛 Troubleshooting

### Services Won't Start
```powershell
# Check Docker
docker ps

# View errors
docker-compose logs

# Restart services
docker-compose restart

# Clean restart
docker-compose down
docker-compose up -d
```

### ML Models Not Loading
```powershell
# Check model files exist
ls ml-service\models\

# View ML service logs
docker-compose logs ml-service | Select-String "model"

# Restart ML service
docker-compose restart ml-service
```

### Backend Can't Reach ML Service
```powershell
# Test connectivity from backend container
docker-compose exec backend-service curl http://ml-service:8000/health

# Check network
docker network ls
docker network inspect backend-service_defenddos-network
```

### No Detections Happening
```powershell
# Check detection is enabled
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/security/system-status

# Check logs
docker-compose logs backend-service | Select-String "detection"

# Verify ML service is enabled (check docker-compose.yml)
# DEFENDDOS_ML_SERVICE_ENABLED should be true
```

---

## 📝 Configuration

### Enable/Disable ML Detection

**Option 1: Environment Variable (Docker)**
Edit `docker-compose.yml`:
```yaml
environment:
  - DEFENDDOS_ML_SERVICE_ENABLED=true  # Change to false to disable
```

**Option 2: Application Properties**
Edit `src/main/resources/application.properties`:
```properties
defenddos.ml-service.enabled=true
```

Then restart:
```powershell
docker-compose restart backend-service
```

---

## 🎓 Next Steps

1. **Test with Real Traffic**
   - Capture real network traffic
   - Extract 30 features using CICFlowMeter
   - Send to ML service for prediction

2. **Fine-tune Thresholds**
   - Adjust confidence thresholds
   - Modify severity levels
   - Update auto-blocking rules

3. **Monitor Performance**
   - Track prediction accuracy
   - Monitor false positives/negatives
   - Analyze blocked IPs

4. **Production Deployment**
   - Use production configuration
   - Enable HTTPS
   - Set up proper authentication
   - Configure firewall rules

---

## 📚 Documentation Reference

- **QUICKSTART.md** - 5-minute quick start
- **FEATURE_MAPPING.md** - 30 ML features explained
- **ML_INTEGRATION_COMPLETE.md** - Complete integration summary
- **ML_INTEGRATION_SETUP.md** - Detailed setup guide
- **API_DOCUMENTATION.md** - All API endpoints

---

## ✅ Success Checklist

- [ ] All 3 services running (InfluxDB, Backend, ML Service)
- [ ] ML models loaded (Random Forest + Scaler)
- [ ] Health checks passing
- [ ] Test predictions working
- [ ] Traffic ingestion working
- [ ] Auto-detection running every 30 seconds
- [ ] IP blocking functional
- [ ] Logs showing ML detections

---

## 🎉 You're All Set!

Your complete DefenDDoS system with ML integration is now running!

**Quick Commands:**
```powershell
# Start everything
docker-compose up -d

# Test everything
.\test-trained-models.ps1

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**Need Help?** Check the documentation files or run the test scripts for detailed diagnostics.
