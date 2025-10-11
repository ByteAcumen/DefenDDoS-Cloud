# DefenDDoS - Complete Startup Guide

## 🚀 Fresh Start Instructions

This guide will help you start the DefenDDoS backend from scratch.

---

## 📋 Prerequisites

### Required Software
- **Docker Desktop** (Windows/Mac) or Docker Engine (Linux)
- **Docker Compose** v2.0+
- **Git** (for cloning the repository)
- **Java 21** (if building locally)
- **Maven 3.9+** (if building locally)

### Check Your Installation
```powershell
# Check Docker
docker --version
docker-compose --version

# Check Java (optional for local build)
java -version

# Check Maven (optional for local build)
mvn --version
```

---

## 🎯 Quick Start (Recommended - Using Docker)

### Step 1: Clone the Repository
```powershell
cd "D:\Capstone Project"
git clone https://github.com/ByteAcumen/DefenDDoS-Cloud.git
cd DefenDDoS-Cloud
git checkout development
```

### Step 2: Navigate to Backend Directory
```powershell
cd backend-service
```

### Step 3: Clean Any Previous Containers
```powershell
# Stop and remove all existing containers
docker-compose down -v

# Remove old images (optional but recommended for fresh start)
docker system prune -a --volumes
```

### Step 4: Build and Start Services
```powershell
# Build all services (backend, ML service, InfluxDB)
docker-compose build --no-cache

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 5: Verify Services
```powershell
# Check running containers
docker-compose ps

# Test Backend API
curl http://localhost:8082/actuator/health

# Test ML Service
curl http://localhost:8000/health

# Test InfluxDB
curl http://localhost:8086/health
```

### Step 6: Test Auto-Blocking
```powershell
# Ingest attack traffic
$attack = @{
  sourceIp = "192.168.1.100"
  destinationIp = "10.0.0.1"
  packetCount = 125000
  byteCount = 8000000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
  -Method POST `
  -Body ($attack | ConvertTo-Json) `
  -ContentType "application/json"

# Wait 35 seconds for detection
Start-Sleep -Seconds 35

# Check blocked IPs
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/blocked"
```

**Expected Output**:
```json
{
  "count": 1,
  "blockedIps": ["192.168.1.100"],
  "timestamp": 1760174477188
}
```

---

## 🔧 Alternative: Local Build (Without Docker)

### Step 1: Install InfluxDB
```powershell
# Download InfluxDB 2.7 from https://portal.influxdata.com/downloads/
# Or use Docker for InfluxDB only:
docker run -d -p 8086:8086 `
  --name influxdb `
  -e INFLUXDB_DB=defenddos `
  -e INFLUXDB_ADMIN_USER=admin `
  -e INFLUXDB_ADMIN_PASSWORD=adminpassword `
  influxdb:2.7
```

### Step 2: Build Backend
```powershell
cd backend-service

# Clean and build
mvn clean package -DskipTests

# Verify JAR created
ls target/backend-service-0.0.1-SNAPSHOT.jar
```

### Step 3: Install Python Dependencies
```powershell
cd ml-service

# Create virtual environment (optional)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Start ML Service
```powershell
# From ml-service directory
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 5: Start Backend
```powershell
# From backend-service directory (new terminal)
java -jar target/backend-service-0.0.1-SNAPSHOT.jar
```

### Step 6: Verify Services
```powershell
# Backend
curl http://localhost:8082/actuator/health

# ML Service
curl http://localhost:8000/health
```

---

## 🐳 Docker Configuration

### docker-compose.yml Overview
```yaml
services:
  # Backend Spring Boot Service
  backend-service:
    build: .
    ports:
      - "8082:8082"
    depends_on:
      - influxdb
      - ml-service
    environment:
      - SPRING_PROFILES_ACTIVE=prod

  # ML Service (FastAPI)
  ml-service:
    build: ./ml-service
    ports:
      - "8000:8000"
    volumes:
      - ./ml-service:/app

  # InfluxDB Time-Series Database
  influxdb:
    image: influxdb:2.7
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=defenddos
      - INFLUXDB_ADMIN_USER=admin
      - INFLUXDB_ADMIN_PASSWORD=adminpassword
    volumes:
      - influxdb-data:/var/lib/influxdb2
```

---

## 📦 Services Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Backend Service                      │
│              Spring Boot 3.5.5 (Java 21)               │
│                    Port: 8082                          │
│                                                        │
│  Features:                                             │
│  • REST API (21 endpoints)                            │
│  • Auto-detection (every 30 seconds)                  │
│  • Auto-blocking                                      │
│  • InfluxDB integration                               │
└────────────┬──────────────────────┬────────────────────┘
             │                      │
             ▼                      ▼
┌─────────────────────┐  ┌──────────────────────────────┐
│   ML Service        │  │       InfluxDB               │
│   FastAPI (Python)  │  │   Time-Series Database       │
│   Port: 8000        │  │   Port: 8086                 │
│                     │  │                              │
│  • Random Forest    │  │  • Traffic data storage      │
│  • LSTM Autoencoder │  │  • Time-based queries        │
└─────────────────────┘  └──────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Issue 1: Port Already in Use
```powershell
# Find process using port 8082
netstat -ano | findstr :8082

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or stop Docker containers
docker-compose down
```

### Issue 2: Docker Build Fails
```powershell
# Clean Docker cache
docker system prune -a --volumes

# Rebuild without cache
docker-compose build --no-cache
```

### Issue 3: Services Not Communicating
```powershell
# Check if all services are running
docker-compose ps

# View logs for specific service
docker-compose logs backend-service
docker-compose logs ml-service
docker-compose logs influxdb

# Restart services
docker-compose restart
```

### Issue 4: InfluxDB Connection Failed
```powershell
# Check InfluxDB health
curl http://localhost:8086/health

# Recreate InfluxDB with fresh data
docker-compose down -v
docker-compose up -d influxdb

# Wait for InfluxDB to be ready (30 seconds)
Start-Sleep -Seconds 30
```

### Issue 5: ML Service Not Loading Models
```powershell
# Check ML service logs
docker-compose logs ml-service

# Verify model files exist
ls ml-service/models/

# Expected files:
# - random_forest_TUNED_model.joblib
# - lstm_autoencoder_TUNED_model.keras
# - scaler.joblib
# - selected_features.json

# Rebuild ML service if needed
docker-compose build --no-cache ml-service
docker-compose up -d ml-service
```

### Issue 6: Auto-Detection Not Working
```powershell
# Check backend logs for detection messages
docker-compose logs backend-service | Select-String "detectAnomalies"

# Manually trigger detection
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/security/trigger-detection" -Method POST

# Check if DetectionService is running
docker-compose exec backend-service jps
```

---

## 🧪 Testing the System

### 1. Health Checks
```powershell
# Backend
Invoke-RestMethod -Uri "http://localhost:8082/actuator/health"

# ML Service
Invoke-RestMethod -Uri "http://localhost:8000/health"

# InfluxDB
Invoke-RestMethod -Uri "http://localhost:8086/health"
```

### 2. Ingest Normal Traffic
```powershell
$normal = @{
  sourceIp = "192.168.1.1"
  destinationIp = "10.0.0.1"
  packetCount = 500
  byteCount = 32000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
  -Method POST `
  -Body ($normal | ConvertTo-Json) `
  -ContentType "application/json"
```

### 3. Ingest Attack Traffic
```powershell
$attack = @{
  sourceIp = "45.33.32.156"
  destinationIp = "10.0.0.1"
  packetCount = 125000
  byteCount = 8000000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/ingest" `
  -Method POST `
  -Body ($attack | ConvertTo-Json) `
  -ContentType "application/json"
```

### 4. Check Blocked IPs
```powershell
# After 35 seconds
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/mitigation/blocked"
```

### 5. Get Traffic Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/summary?duration=1h"
```

### 6. Manual ML Analysis
```powershell
$testData = @{
  sourceIp = "203.0.113.50"
  destinationIp = "10.0.0.1"
  packetCount = 150000
  byteCount = 9600000
}
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/traffic/predict-attack" `
  -Method POST `
  -Body ($testData | ConvertTo-Json) `
  -ContentType "application/json"
```

---

## 📊 Monitoring

### View Real-Time Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend-service
docker-compose logs -f ml-service
docker-compose logs -f influxdb

# Last 100 lines
docker-compose logs --tail=100 backend-service
```

### Check Container Status
```powershell
# List running containers
docker-compose ps

# Check resource usage
docker stats
```

### Access Container Shell
```powershell
# Backend
docker-compose exec backend-service sh

# ML Service
docker-compose exec ml-service sh

# InfluxDB
docker-compose exec influxdb sh
```

---

## 🛑 Stopping Services

### Graceful Shutdown
```powershell
# Stop all services (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove everything including volumes (CLEAN SLATE)
docker-compose down -v
```

### Complete Cleanup
```powershell
# Remove all containers, images, volumes
docker-compose down -v --rmi all

# Remove all Docker data (CAUTION: Affects all Docker projects)
docker system prune -a --volumes
```

---

## 🔄 Updating the System

### Update Code from GitHub
```powershell
cd "D:\Capstone Project\project"

# Pull latest changes
git pull origin development

# Navigate to backend
cd backend-service

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Update Only Backend
```powershell
# Rebuild backend only
docker-compose build --no-cache backend-service
docker-compose up -d backend-service
```

### Update Only ML Service
```powershell
# Rebuild ML service only
docker-compose build --no-cache ml-service
docker-compose up -d ml-service
```

---

## 📝 Configuration Files

### Backend Configuration
**Location**: `src/main/resources/application-prod.properties`

```properties
# Server
server.port=8082

# InfluxDB
spring.influx.url=http://influxdb:8086
spring.influx.token=your-token
spring.influx.org=defenddos
spring.influx.bucket=defenddos

# ML Service
ml.service.url=http://ml-service:8000
```

### ML Service Configuration
**Location**: `ml-service/main.py`

```python
# Model paths
RANDOM_FOREST_MODEL = "models/random_forest_TUNED_model.joblib"
LSTM_MODEL = "models/lstm_autoencoder_TUNED_model.keras"
SCALER = "models/scaler.joblib"
SELECTED_FEATURES = "models/selected_features.json"

# Thresholds
CONFIDENCE_THRESHOLD = 0.5
LSTM_ANOMALY_THRESHOLD = 100.0
```

---

## ✅ Verification Checklist

After starting the system, verify:

- [ ] Docker containers running: `docker-compose ps`
- [ ] Backend health: `curl http://localhost:8082/actuator/health`
- [ ] ML service health: `curl http://localhost:8000/health`
- [ ] InfluxDB health: `curl http://localhost:8086/health`
- [ ] Traffic ingestion: Successfully POST to `/api/v1/traffic/ingest`
- [ ] Auto-detection: Logs show scheduled scans every 30 seconds
- [ ] Auto-blocking: Attack traffic gets blocked within 30 seconds
- [ ] ML models: Both Random Forest and LSTM operational
- [ ] Blocked IPs API: Returns list via `/api/v1/mitigation/blocked`

---

## 🎯 System Status Indicators

### Healthy System
```
✅ Backend Service:        RUNNING (Port 8082)
✅ ML Service:             RUNNING (Port 8000)
✅ InfluxDB:               RUNNING (Port 8086)
✅ Auto-Detection:         ACTIVE (Every 30s)
✅ Auto-Blocking:          FUNCTIONAL
✅ Both ML Models:         OPERATIONAL
```

### Check System Status
```powershell
# Quick status check script
$backend = (Invoke-RestMethod -Uri "http://localhost:8082/actuator/health" -ErrorAction SilentlyContinue).status
$ml = (Invoke-RestMethod -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue).status
$influx = (Invoke-RestMethod -Uri "http://localhost:8086/health" -ErrorAction SilentlyContinue).status

Write-Host "Backend: $backend"
Write-Host "ML Service: $ml"
Write-Host "InfluxDB: $influx"
```

---

## 📞 Support

### Documentation
- **Frontend Integration**: `docs/FRONTEND_INTEGRATION_GUIDE.md`
- **API Reference**: `docs/API_QUICK_REFERENCE.md`
- **Project Overview**: `docs/PROJECT_OVERVIEW.md`
- **ML Models**: `docs/ML_MODELS_INTEGRATION.md`

### Common Commands
```powershell
# View all documentation
ls docs/

# Start fresh
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## 🚀 Ready to Go!

Your DefenDDoS backend is now running and ready to:
- ✅ Accept traffic data
- ✅ Detect threats with ML
- ✅ Auto-block malicious IPs
- ✅ Provide APIs for frontend

**Next Steps**:
1. Test the APIs using the examples above
2. Read `docs/FRONTEND_INTEGRATION_GUIDE.md`
3. Start building your frontend!

---

**Last Updated**: October 11, 2025  
**Version**: 2.0.0-SNAPSHOT  
**Status**: Production Ready
