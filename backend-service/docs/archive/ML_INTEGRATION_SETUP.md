# ML Integration - Setup and Testing Guide

This guide walks you through setting up and testing the ML-powered DDoS detection integration.

## Overview

The integration adds machine learning capabilities to the DefenDDoS system using a microservices architecture:

```
┌─────────────────┐         HTTP/REST          ┌──────────────────┐
│                 │ ────────────────────────>  │                  │
│  Java Backend   │                            │  Python ML       │
│  (Spring Boot)  │ <────────────────────────  │  (FastAPI)       │
│                 │    Prediction Response      │                  │
└─────────────────┘                            └──────────────────┘
```

## What Was Changed

### 1. Dependencies Added (`pom.xml`)
- **spring-boot-starter-webflux**: For reactive HTTP client (WebClient)
- **spring-boot-starter-validation**: For DTO validation

### 2. Configuration Updated

#### `DefenDDoSProperties.java`
Added new ML service configuration class:
```java
public static class MlService {
    private boolean enabled = false;
    private String url = "http://localhost:8000";
    private int timeoutSeconds = 10;
    private int retryAttempts = 3;
}
```

#### `application.properties`
Added ML service properties:
```properties
defenddos.ml-service.enabled=false
defenddos.ml-service.url=http://localhost:8000
defenddos.ml-service.timeout-seconds=10
defenddos.ml-service.retry-attempts=3
```

### 3. New Model Classes

#### `EnrichedTrafficPoint.java`
Extended traffic model with 30 ML features:
- Packet statistics (5 features)
- Byte statistics (5 features)
- Flow characteristics (5 features)
- Direction ratios (5 features)
- TCP flags (5 features)
- Advanced metrics (5 features)

### 4. New DTO Classes

#### `MLPredictionRequest.java`
Request DTO with all 30 features mapped to snake_case JSON properties.

#### `MLPredictionResponse.java`
Response DTO containing:
- `is_attack`: Boolean attack flag
- `attack_type`: Type of attack detected
- `confidence`: Model confidence (0-1)
- `severity`: Threat severity level
- `timestamp`: Prediction timestamp
- `model_version`: ML model version

### 5. New Configuration

#### `WebClientConfig.java`
Configures WebClient for ML service communication:
- Connection timeout
- Read/Write timeouts
- Base URL configuration
- Default headers

### 6. New Service Layer

#### `MLDetectionService.java`
Main service for ML integration:
- `predict()`: Makes predictions via ML service
- `isMLServiceHealthy()`: Health check
- Automatic mitigation triggering
- Retry logic with exponential backoff
- Error handling and logging

### 7. Updated Services

#### `DetectionService.java`
Enhanced anomaly detection:
- Dual detection: Threshold-based + ML-based
- Converts basic traffic to enriched features
- Triggers ML predictions when enabled
- Combined threat assessment

### 8. Updated Controllers

#### `TrafficController.java`
Added ML endpoints:
- **POST /api/v1/traffic/predict-attack**: Manual ML prediction
- **GET /api/v1/traffic/ml-health**: ML service health check

### 9. ML Service Files

#### Python FastAPI Service (`ml-service/`)
- `main.py`: FastAPI application
- `requirements.txt`: Python dependencies
- `Dockerfile`: Container configuration
- `README.md`: ML service documentation

### 10. Docker Configuration

#### `docker-compose.yml`
Added ML service container:
- Python 3.11 slim image
- Health checks
- Network connectivity
- Volume mounting for models

## Setup Instructions

### Step 1: Build the Java Backend

```powershell
# Navigate to backend directory
cd "d:\Capstone Project\project\backend-service"

# Build with Maven (skip tests for faster build)
.\mvnw clean package -DskipTests

# Or build with tests
.\mvnw clean package
```

### Step 2: Start Services with Docker Compose

```powershell
# Start all services (InfluxDB, Backend, ML Service)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f ml-service
docker-compose logs -f backend-service
```

### Step 3: Verify ML Service

```powershell
# Health check
curl http://localhost:8000/health

# Model info
curl http://localhost:8000/model-info

# Root endpoint
curl http://localhost:8000/
```

Expected response from health check:
```json
{
  "status": "healthy",
  "model_loaded": false,
  "model_version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00"
}
```

Note: `model_loaded: false` is expected initially - the service uses mock predictions.

### Step 4: Verify Backend Integration

```powershell
# Check ML health via backend
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/traffic/ml-health

# Backend health check
curl http://localhost:8082/actuator/health
```

## Testing the Integration

### Test 1: Manual ML Prediction

Create a test file `test-ml-prediction.json`:
```json
{
  "sourceIp": "192.168.1.100",
  "destinationIp": "10.0.0.1",
  "packetCount": 15000,
  "byteCount": 45000000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Send prediction request:
```powershell
curl -X POST http://localhost:8082/api/v1/traffic/predict-attack `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d "@test-ml-prediction.json"
```

Expected response:
```json
{
  "ml_enabled": true,
  "prediction": {
    "is_attack": true,
    "attack_type": "DDoS",
    "confidence": 0.88,
    "severity": "HIGH",
    "timestamp": "2024-01-15T10:30:00",
    "model_version": "1.0.0"
  },
  "source_ip": "192.168.1.100",
  "destination_ip": "10.0.0.1",
  "packet_count": 15000,
  "byte_count": 45000000
}
```

### Test 2: Direct ML Service Test

Test the ML service directly:
```powershell
curl -X POST http://localhost:8000/predict `
  -H "Content-Type: application/json" `
  -d '{
    "source_ip": "192.168.1.100",
    "destination_ip": "10.0.0.1",
    "packet_count": 15000,
    "byte_count": 45000000,
    "fwd_packets_per_second": 5000.0,
    "bwd_packets_per_second": 100.0,
    "syn_flag_count": 3000
  }'
```

### Test 3: Ingest Traffic and Auto-Detection

```powershell
# Ingest normal traffic (should NOT trigger ML detection)
curl -X POST http://localhost:8082/api/v1/traffic/ingest `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d '{
    "sourceIp": "192.168.1.10",
    "destinationIp": "10.0.0.1",
    "packetCount": 500,
    "byteCount": 50000
  }'

# Ingest attack traffic (should trigger ML detection and blocking)
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

Wait 30 seconds for scheduled detection, then check logs:
```powershell
docker-compose logs backend-service | Select-String "ML"
```

### Test 4: Check Blocked IPs

```powershell
# Get list of blocked IPs
curl -u admin:DefenDDoS123! http://localhost:8082/api/v1/mitigation/blocked-ips
```

Should show `192.168.1.100` if ML detected the attack.

## Enabling ML Detection in Production

### Option 1: Environment Variables (Docker)

Update `docker-compose.yml`:
```yaml
environment:
  - DEFENDDOS_ML_SERVICE_ENABLED=true
```

Restart services:
```powershell
docker-compose restart backend-service
```

### Option 2: Application Properties

Edit `application.properties`:
```properties
defenddos.ml-service.enabled=true
```

Rebuild and restart:
```powershell
.\mvnw clean package -DskipTests
docker-compose up --build -d
```

## Monitoring

### View Logs

```powershell
# ML Service logs
docker-compose logs -f ml-service

# Backend logs
docker-compose logs -f backend-service

# All logs
docker-compose logs -f
```

### Key Log Patterns

**ML Service:**
- `Prediction for <IP>: <attack_type>` - Successful prediction
- `Model loaded successfully` - Model initialization

**Backend:**
- `ML Detection: Attack detected from <IP>` - Attack detected by ML
- `ML service error for IP <IP>` - Communication error
- `Successfully applied mitigation for IP <IP>` - Blocking triggered

## Troubleshooting

### Issue: ML Service Not Reachable

**Symptoms:**
- Backend logs show "ML service error"
- Health check fails

**Solutions:**
1. Check if ML service is running:
   ```powershell
   docker-compose ps ml-service
   ```

2. Check network connectivity:
   ```powershell
   docker-compose exec backend-service curl http://ml-service:8000/health
   ```

3. Restart ML service:
   ```powershell
   docker-compose restart ml-service
   ```

### Issue: Model Not Loading

**Symptoms:**
- `model_loaded: false` in health check
- Using mock predictions

**Solutions:**
This is expected behavior initially. The service will use heuristic-based predictions until you provide a trained model.

To add a trained model:
1. Train a model (see ML_INTEGRATION_GUIDE.md)
2. Save as `ml-service/models/ddos_detection_model.pkl`
3. Rebuild ML service:
   ```powershell
   docker-compose build ml-service
   docker-compose up -d ml-service
   ```

### Issue: WebFlux Dependency Not Found

**Symptoms:**
- Compilation errors about WebClient
- Missing reactive classes

**Solutions:**
1. Clean and rebuild:
   ```powershell
   .\mvnw clean install
   ```

2. Update Maven dependencies:
   ```powershell
   .\mvnw dependency:resolve
   ```

### Issue: ML Predictions Not Triggering Mitigation

**Symptoms:**
- ML detects attack but IP not blocked
- No mitigation logs

**Solutions:**
1. Check detection thresholds in ML service
2. Verify mitigation is enabled:
   ```properties
   defenddos.mitigation.enabled=true
   defenddos.mitigation.dry-run=false
   ```
3. Check backend has proper permissions (privileged mode in Docker)

## Performance Tuning

### Adjust ML Service Timeout

For slower predictions, increase timeout:
```properties
defenddos.ml-service.timeout-seconds=30
```

### Adjust Retry Attempts

For unreliable networks:
```properties
defenddos.ml-service.retry-attempts=5
```

### Scale ML Service

For high traffic, scale ML service horizontally:
```yaml
ml-service:
  deploy:
    replicas: 3
```

## Next Steps

1. **Train Custom Model**: Use your own DDoS dataset to train a production model
2. **Feature Engineering**: Implement packet capture to extract all 30 features accurately
3. **Monitoring Dashboard**: Add Grafana dashboard for ML predictions
4. **Alert Integration**: Configure email alerts for ML-detected attacks
5. **Model Updates**: Implement model versioning and hot-swapping

## API Reference

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/traffic/predict-attack` | POST | Manual ML prediction |
| `/api/v1/traffic/ml-health` | GET | ML service health check |
| `/api/v1/traffic/ingest` | POST | Ingest traffic (auto-detection) |
| `/api/v1/mitigation/blocked-ips` | GET | List blocked IPs |

### ML Service Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Get attack prediction |
| `/health` | GET | Health check |
| `/model-info` | GET | Model information |
| `/` | GET | Service info |

## Security Considerations

1. **Authentication**: Backend uses HTTP Basic Auth
2. **Network Isolation**: ML service only accessible via internal network
3. **Input Validation**: All inputs validated via Pydantic/Jakarta Validation
4. **Rate Limiting**: Backend has rate limiting (60 req/min default)

## Conclusion

Your ML integration is now complete! The system will:
- ✅ Use ML predictions alongside threshold-based detection
- ✅ Automatically block high-confidence attacks
- ✅ Log all ML predictions and actions
- ✅ Provide API endpoints for testing and monitoring

For production use, train a custom model with your traffic data for best results.
