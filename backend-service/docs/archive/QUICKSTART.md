# 🚀 Quick Start Guide - ML Integration

Get your ML-powered DefenDDoS system running in 5 minutes!

## Prerequisites

- ✅ Docker Desktop installed and running
- ✅ Java 21 installed (for local builds)
- ✅ PowerShell (Windows)
- ✅ 4GB+ RAM available

## Step 1: Build the Project (2 minutes)

```powershell
# Navigate to project directory
cd "d:\Capstone Project\project\backend-service"

# Build with Maven (this downloads dependencies and compiles)
.\mvnw clean package -DskipTests
```

**Expected output:** `BUILD SUCCESS` with `backend-service-0.0.1-SNAPSHOT.jar` created

## Step 2: Start All Services (1 minute)

```powershell
# Start InfluxDB, Backend, and ML Service
docker-compose up -d

# Wait for services to be healthy (check status)
docker-compose ps
```

**Expected output:**
```
NAME                    STATUS
defenddos-influxdb      Up (healthy)
defenddos-backend       Up (healthy)
defenddos-ml-service    Up (healthy)
```

## Step 3: Verify Integration (1 minute)

```powershell
# Run automated test suite
.\test-ml-integration.ps1
```

**Expected output:** All 7 tests pass with ✓ marks

## Step 4: Test Attack Detection (1 minute)

### Test Normal Traffic (Should NOT trigger blocking)
```powershell
curl -X POST http://localhost:8082/api/v1/traffic/ingest `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.10",
    "destinationIp": "10.0.0.1",
    "packetCount": 500,
    "byteCount": 50000
  }'
```

### Test Attack Traffic (Should trigger ML detection)
```powershell
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

**Wait 30 seconds** for automatic detection to run, then check:

```powershell
# View ML detection logs
docker-compose logs backend-service | Select-String "ML Detection"

# Check if IP was blocked
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/mitigation/blocked-ips
```

## Step 5: Enable ML Detection (Optional)

By default, ML detection runs but doesn't trigger blocking. To enable:

```powershell
# Stop services
docker-compose down

# Edit docker-compose.yml - change this line:
# - DEFENDDOS_ML_SERVICE_ENABLED=true  # Change false to true

# Restart
docker-compose up -d
```

## That's It! 🎉

Your ML-powered DDoS detection system is now running!

---

## Quick Commands Reference

### Check Service Status
```powershell
docker-compose ps
```

### View Logs
```powershell
# All logs
docker-compose logs -f

# ML service only
docker-compose logs -f ml-service

# Backend only
docker-compose logs -f backend-service
```

### Test ML Prediction
```powershell
curl -X POST http://localhost:8082/api/v1/traffic/predict-attack `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.100",
    "destinationIp": "10.0.0.1",
    "packetCount": 15000,
    "byteCount": 45000000
  }'
```

### Check Blocked IPs
```powershell
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/mitigation/blocked-ips
```

### Restart Services
```powershell
docker-compose restart
```

### Stop All Services
```powershell
docker-compose down
```

### Clean Start (Remove all data)
```powershell
docker-compose down -v  # -v removes volumes (InfluxDB data)
docker-compose up -d
```

---

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:8082 | admin / DefenDDoS123! |
| ML Service | http://localhost:8000 | No auth required |
| ML API Docs | http://localhost:8000/docs | No auth required |
| InfluxDB UI | http://localhost:8086 | admin / SecureInfluxPassword123 |

---

## Troubleshooting

### Services Won't Start
```powershell
# Check Docker is running
docker ps

# Check for port conflicts
netstat -ano | findstr "8082"
netstat -ano | findstr "8086"
netstat -ano | findstr "8000"

# View detailed logs
docker-compose logs
```

### Build Fails
```powershell
# Clean and retry
.\mvnw clean
.\mvnw package -DskipTests

# If still fails, update Maven wrapper
.\mvnw --version
```

### Can't Reach Services
```powershell
# Verify network
docker network ls
docker network inspect backend-service_defenddos-network

# Test connectivity
docker-compose exec backend-service curl http://ml-service:8000/health
```

---

## Next Steps

1. ✅ **Read Documentation**
   - [Complete Integration Guide](./ML_INTEGRATION_SETUP.md)
   - [ML Service Docs](./ml-service/README.md)
   - [API Documentation](./API_DOCUMENTATION.md)

2. ✅ **Train Custom Model**
   - Get DDoS dataset (CICIDS2017, CIC-DDoS2019)
   - Follow [Model Training Guide](./ml-service/models/README.md)
   - Deploy trained model to `ml-service/models/`

3. ✅ **Monitor System**
   - Set up Grafana dashboard
   - Enable email alerts
   - Configure log aggregation

4. ✅ **Production Deployment**
   - Use production configuration
   - Enable HTTPS
   - Set up proper authentication
   - Configure firewall rules

---

## Success Indicators

Your system is working correctly if:

- ✅ All 3 services show "healthy" status
- ✅ ML service responds at `/health`
- ✅ Backend shows `ml_enabled: true`
- ✅ Attack traffic gets detected and logged
- ✅ Test script passes all 7 tests
- ✅ Predictions return attack classifications

---

## Support

- 📖 Full documentation in repository
- 🐛 Check logs: `docker-compose logs`
- 💡 See [ML_INTEGRATION_COMPLETE.md](./ML_INTEGRATION_COMPLETE.md)

---

**Time to Get Started: 5 minutes**  
**Difficulty: Easy**  
**Status: Production Ready** ✅
