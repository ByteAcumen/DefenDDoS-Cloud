# DefenDDoS Deployment Guide 🚀

Complete guide for deploying DefenDDoS in development and production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Docker Desktop** 4.0+ with Docker Compose
- **Java 21** (OpenJDK recommended)
- **Maven 3.8+** (Maven wrapper included)
- **Python 3.10+** (for ML service development)

### Hardware Requirements

**Minimum:**
- 4 GB RAM
- 2 CPU cores
- 10 GB disk space

**Recommended:**
- 8 GB RAM
- 4 CPU cores
- 20 GB disk space

### Network Ports

Ensure these ports are available:
- `8082` - Backend REST API
- `8000` - ML Service API
- `8086` - InfluxDB HTTP API

---

## Development Setup

### 1. Clone Repository

```powershell
git clone <repository-url>
cd backend-service
```

### 2. Configure Environment

Create `.env` file (optional):

```env
SPRING_PROFILES_ACTIVE=dev
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token-here
INFLUXDB_ORG=defenddos-org
INFLUXDB_BUCKET=ddos-bucket
ML_SERVICE_URL=http://localhost:8000
```

### 3. Start Development Services

**Option A: Docker Compose (Recommended)**

```powershell
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Option B: Individual Services**

```powershell
# Terminal 1: Start InfluxDB
docker run -d -p 8086:8086 influxdb:2.7

# Terminal 2: Start ML Service
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 3: Start Backend
.\mvnw.cmd spring-boot:run
```

### 4. Verify Installation

```powershell
# Run complete test suite
.\test-complete-system.ps1

# Or test individual services
.\test-ml-service.ps1
```

Expected output:
```
[SUCCESS] All tests passed! Backend is fully operational!
Tests Passed: 10 / 10
Success Rate: 100%
```

---

## Docker Deployment

### Quick Start

```powershell
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend-service
```

### Service Details

#### 1. InfluxDB (Port 8086)

```yaml
influxdb:
  image: influxdb:2.7
  ports:
    - "8086:8086"
  environment:
    - DOCKER_INFLUXDB_INIT_MODE=setup
    - DOCKER_INFLUXDB_INIT_USERNAME=admin
    - DOCKER_INFLUXDB_INIT_PASSWORD=SecureInfluxPassword123
    - DOCKER_INFLUXDB_INIT_ORG=defenddos-org
    - DOCKER_INFLUXDB_INIT_BUCKET=ddos-bucket
```

**Health Check:**
```powershell
curl http://localhost:8086/health
# Expected: {"status": "pass", "message": "ready for queries and writes"}
```

#### 2. ML Service (Port 8000)

```yaml
ml-service:
  build:
    context: ./ml-service
  ports:
    - "8000:8000"
  volumes:
    - ./ml-service:/app
```

**Health Check:**
```powershell
curl http://localhost:8000/health
# Expected: {"status": "healthy", "rf_model_loaded": true, "lstm_model_loaded": true}
```

#### 3. Backend Service (Port 8082)

```yaml
backend-service:
  build:
    context: .
  ports:
    - "8082:8081"
  depends_on:
    - influxdb
    - ml-service
```

**Health Check:**
```powershell
curl http://localhost:8082/actuator/health
# Expected: {"status": "UP"}
```

### Build and Restart

```powershell
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build backend-service

# Rebuild without cache
docker-compose build --no-cache

# Restart services
docker-compose down
docker-compose up -d

# Restart specific service
docker-compose restart backend-service
```

### Data Persistence

Volumes ensure data persists across restarts:

```yaml
volumes:
  influxdb-data:      # InfluxDB time-series data
  influxdb-config:    # InfluxDB configuration
```

**Backup:**
```powershell
docker-compose down
docker run --rm -v backend-service_influxdb-data:/data -v ${PWD}:/backup ubuntu tar czf /backup/influxdb-backup.tar.gz /data
```

**Restore:**
```powershell
docker run --rm -v backend-service_influxdb-data:/data -v ${PWD}:/backup ubuntu tar xzf /backup/influxdb-backup.tar.gz -C /
docker-compose up -d
```

---

## Production Deployment

### 1. Environment Configuration

Create `application-prod.properties`:

```properties
# InfluxDB Configuration
influxdb.url=${DEFENDDOS_INFLUXDB_URL}
influxdb.token=${DEFENDDOS_INFLUXDB_TOKEN}
influxdb.org=${DEFENDDOS_INFLUXDB_ORG}
influxdb.bucket=${DEFENDDOS_INFLUXDB_BUCKET}

# ML Service Configuration
ml.service.url=${DEFENDDOS_ML_SERVICE_URL:http://ml-service:8000}
ml.service.timeout=10s
ml.service.retry.max-attempts=3

# Detection Configuration
detection.threshold=${DEFENDDOS_DETECTION_THRESHOLD:100}
detection.window=${DEFENDDOS_DETECTION_WINDOW:60000}

# Rate Limiting
rate.limit.requests-per-minute=${DEFENDDOS_RATE_LIMIT_REQUESTS_PER_MINUTE:100}
```

### 2. Security Hardening

#### Enable Authentication

Edit `src/main/java/com/defenddos/backend_service/config/SecurityConfig.java`:

```java
// Change from permitAll() to authenticated()
.requestMatchers("/api/v1/**").authenticated()
```

Rebuild:
```powershell
.\mvnw.cmd clean package
docker-compose build backend-service
docker-compose up -d backend-service
```

#### Change Default Passwords

```yaml
# docker-compose.yml
environment:
  - DOCKER_INFLUXDB_INIT_PASSWORD=<STRONG_PASSWORD>
  - DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=<GENERATE_NEW_TOKEN>
```

Generate new token:
```powershell
# Generate 64-character random token
$token = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host $token
```

#### Configure CORS

Edit `WebConfig.java`:
```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins("https://your-frontend-domain.com")  // Specific domain
        .allowedMethods("GET", "POST", "PUT", "DELETE")
        .allowCredentials(true);
}
```

### 3. Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  backend-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
  
  ml-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 4. Logging Configuration

**Backend Logging** (`application-prod.properties`):

```properties
# Logging Configuration
logging.level.root=INFO
logging.level.com.defenddos=DEBUG
logging.file.name=logs/defenddos-backend.log
logging.file.max-size=10MB
logging.file.max-history=30
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
```

**ML Service Logging** (`ml-service/main.py`):

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/ml-service.log'),
        logging.StreamHandler()
    ]
)
```

### 5. Reverse Proxy (Nginx)

Create `nginx.conf`:

```nginx
upstream backend {
    server localhost:8082;
}

server {
    listen 80;
    server_name api.defenddos.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Add to `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
  depends_on:
    - backend-service
```

### 6. HTTPS/SSL

**Let's Encrypt with Certbot:**

```powershell
# Generate SSL certificate
docker run -it --rm \
  -v ${PWD}/certbot:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d api.defenddos.com \
  --email your-email@example.com
```

Update `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    server_name api.defenddos.com;

    ssl_certificate /etc/letsencrypt/live/api.defenddos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.defenddos.com/privkey.pem;

    location / {
        proxy_pass http://backend;
    }
}
```

---

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `dev` | No |
| `DEFENDDOS_INFLUXDB_URL` | InfluxDB URL | `http://influxdb:8086` | Yes |
| `DEFENDDOS_INFLUXDB_TOKEN` | InfluxDB auth token | - | Yes |
| `DEFENDDOS_INFLUXDB_ORG` | InfluxDB organization | `defenddos-org` | Yes |
| `DEFENDDOS_INFLUXDB_BUCKET` | InfluxDB bucket name | `ddos-bucket` | Yes |
| `DEFENDDOS_ML_SERVICE_URL` | ML service URL | `http://ml-service:8000` | No |
| `DEFENDDOS_DETECTION_THRESHOLD` | Detection threshold | `100` | No |
| `DEFENDDOS_RATE_LIMIT_REQUESTS_PER_MINUTE` | Rate limit | `100` | No |

### Profiles

**Development** (`application-dev.properties`):
- Local database connections
- Debug logging enabled
- CORS allows all origins
- Authentication disabled

**Production** (`application-prod.properties`):
- Container-based connections
- Info-level logging
- CORS restricted to specific domain
- Authentication enabled

---

## Monitoring

### Health Endpoints

```powershell
# Backend health
curl http://localhost:8082/actuator/health

# Backend info
curl http://localhost:8082/actuator/info

# ML Service health
curl http://localhost:8000/health

# InfluxDB health
curl http://localhost:8086/health
```

### Metrics

**Spring Boot Actuator:**

Enable in `application-prod.properties`:
```properties
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.show-details=always
```

Access metrics:
```powershell
curl http://localhost:8082/actuator/metrics
curl http://localhost:8082/actuator/prometheus
```

### Log Aggregation

**Docker Logs:**
```powershell
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend-service

# Last 100 lines
docker-compose logs --tail=100 ml-service
```

**Export Logs:**
```powershell
docker-compose logs > all-logs.txt
docker-compose logs backend-service > backend-logs.txt
```

---

## Troubleshooting

### Issue: Services Won't Start

**Check ports:**
```powershell
netstat -ano | findstr "8082"
netstat -ano | findstr "8000"
netstat -ano | findstr "8086"
```

**Solution:**
```powershell
# Stop conflicting services
docker-compose down

# Kill process using port (Windows)
taskkill /PID <PID> /F
```

### Issue: ML Models Not Loading

**Symptoms:**
```
{"status": "unhealthy", "rf_model_loaded": false}
```

**Check:**
```powershell
# Verify model files exist
ls ml-service/*.joblib
ls ml-service/*.keras

# Check ML service logs
docker-compose logs ml-service
```

**Solution:**
```powershell
# Rebuild ML service
docker-compose build ml-service --no-cache
docker-compose up -d ml-service
```

### Issue: InfluxDB Connection Errors

**Symptoms:**
```
Connection refused: http://influxdb:8086
```

**Check:**
```powershell
# Verify InfluxDB is running
docker-compose ps influxdb

# Check InfluxDB logs
docker-compose logs influxdb
```

**Solution:**
```powershell
# Restart InfluxDB
docker-compose restart influxdb

# Wait for health check
docker-compose ps
```

### Issue: Authentication Errors (401)

**Symptoms:**
```
HTTP 401 Unauthorized
```

**Solution:**
```powershell
# Disable authentication for testing
# Edit SecurityConfig.java: Change .authenticated() to .permitAll()
.\mvnw.cmd clean package
docker-compose build backend-service
docker-compose up -d backend-service
```

### Issue: High Memory Usage

**Check resource usage:**
```powershell
docker stats
```

**Solution:**
```powershell
# Add memory limits to docker-compose.yml
# Set lower max heap for Java
environment:
  - JAVA_OPTS=-Xmx512m -Xms256m
```

---

## Performance Tuning

### Java (Backend)

**Heap Size:**
```yaml
environment:
  - JAVA_OPTS=-Xmx1g -Xms512m
```

**Garbage Collection:**
```yaml
environment:
  - JAVA_OPTS=-XX:+UseG1GC -XX:MaxGCPauseMillis=200
```

### Python (ML Service)

**Gunicorn Workers:**
```dockerfile
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### InfluxDB

**Retention Policy:**
```powershell
# Connect to InfluxDB
docker exec -it defenddos-influxdb influx

# Set retention (30 days)
> CREATE RETENTION POLICY "30_days" ON "ddos_traffic" DURATION 30d REPLICATION 1 DEFAULT
```

---

## Backup and Recovery

### Backup Script

Create `backup.ps1`:

```powershell
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "backups/$DATE"

# Create backup directory
New-Item -ItemType Directory -Path $BACKUP_DIR

# Backup InfluxDB
docker exec defenddos-influxdb influx backup /backup
docker cp defenddos-influxdb:/backup "$BACKUP_DIR/influxdb"

# Backup configuration
Copy-Item docker-compose.yml "$BACKUP_DIR/"
Copy-Item application-prod.properties "$BACKUP_DIR/"

Write-Host "Backup completed: $BACKUP_DIR"
```

### Recovery Script

Create `restore.ps1`:

```powershell
param($BackupPath)

# Stop services
docker-compose down

# Restore InfluxDB
docker-compose up -d influxdb
Start-Sleep -Seconds 10
docker cp "$BackupPath/influxdb" defenddos-influxdb:/restore
docker exec defenddos-influxdb influx restore /restore

# Start all services
docker-compose up -d

Write-Host "Recovery completed from: $BackupPath"
```

---

## Scaling

### Horizontal Scaling

**Multiple Backend Instances:**

```yaml
backend-service:
  deploy:
    replicas: 3
  ports:
    - "8082-8084:8081"
```

**Load Balancer (Nginx):**

```nginx
upstream backend {
    server backend-1:8081;
    server backend-2:8081;
    server backend-3:8081;
}
```

### Vertical Scaling

**Increase Resources:**

```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

---

## Next Steps

1. ✅ Deploy to development
2. ✅ Run complete test suite
3. ⬜ Configure production environment
4. ⬜ Set up monitoring and alerting
5. ⬜ Configure backup automation
6. ⬜ Deploy to production

---

**Support**: For issues, check logs first: `docker-compose logs -f`

**Documentation**: See [README.md](README.md) for API details

Last Updated: 2025
