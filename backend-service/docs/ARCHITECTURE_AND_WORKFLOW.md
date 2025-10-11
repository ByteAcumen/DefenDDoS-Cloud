# DefenDDoS Backend - Complete Architecture & Workflow Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Complete Workflow](#complete-workflow)
4. [Data Flow](#data-flow)
5. [ML Integration Plan](#ml-integration-plan)
6. [Configuration Deep Dive](#configuration-deep-dive)

---

## 🏗️ System Overview

**DefenDDoS** is a Spring Boot-based DDoS detection and mitigation system that:
- Ingests network traffic data in real-time
- Stores time-series data in InfluxDB
- Detects anomalies using threshold-based detection (currently) + ML (to be integrated)
- Automatically blocks malicious IPs using iptables
- Sends alerts for detected threats
- Provides REST APIs for monitoring and management

### Technology Stack
- **Backend Framework**: Spring Boot 3.5.5 (Java 21)
- **Database**: InfluxDB 2.7 (Time-series)
- **Security**: Spring Security (HTTP Basic Auth)
- **Rate Limiting**: Bucket4j
- **Containerization**: Docker + Docker Compose
- **IP Blocking**: iptables (Linux firewall)

---

## 🧩 Architecture Components

### 1. **Application Entry Point**
**File**: `BackendServiceApplication.java`

```java
@SpringBootApplication
@EnableScheduling        // Enables scheduled tasks (detection scans)
@EnableConfigurationProperties  // Enables custom configuration
```

**Key Annotations:**
- `@EnableScheduling`: Allows `@Scheduled` methods to run periodically
- `@EnableConfigurationProperties`: Binds `application.properties` to Java objects

---

### 2. **Configuration Layer**

#### 2.1 DefenDDoSProperties (`config/DefenDDoSProperties.java`)
**Purpose**: Centralized type-safe configuration management

**Structure**:
```
defenddos
├── influx-db
│   ├── url: http://localhost:8086
│   ├── token: authentication-token
│   ├── org: defenddos-org
│   └── bucket: ddos-bucket
├── detection
│   ├── enabled: true
│   ├── packet-threshold: 1000
│   └── time-window: -5m
├── mitigation
│   ├── enabled: true
│   ├── dry-run: false
│   ├── auto-block: true
│   ├── block-script-path: /usr/local/bin/block_ip.sh
│   ├── unblock-script-path: /usr/local/bin/unblock_ip.sh
│   ├── max-blocked-ips: 100
│   └── auto-unblock-hours: 24
└── alerts
    ├── enabled: true
    └── email
        ├── enabled: false
        ├── to: admin@defenddos.com
        ├── from: defenddos@noreply.com
        └── subject: DefenDDoS Alert
```

#### 2.2 InfluxDBConfig (`config/InfluxDBConfig.java`)
**Purpose**: Creates InfluxDB client connection

```java
@Bean
public InfluxDBClient influxDBClient() {
    return InfluxDBClientFactory.create(url, token, org);
}
```

#### 2.3 SecurityConfig (`config/SecurityConfig.java`)
**Purpose**: Configures authentication and authorization

**Security Rules**:
- `/api/v1/**` → Requires authentication (HTTP Basic)
- `/actuator/**` → Public (for health checks)
- CSRF disabled (stateless REST API)

#### 2.4 WebConfig (`config/WebConfig.java`)
**Purpose**: Registers rate limiting interceptor

#### 2.5 RateLimitInterceptor (`config/RateLimitInterceptor.java`)
**Purpose**: Prevents API abuse using token bucket algorithm

**Implementation**:
- **Limit**: 60 requests per minute per IP
- **Algorithm**: Token bucket with Bucket4j
- **Storage**: In-memory ConcurrentHashMap (keyed by IP)
- **Response**: 429 Too Many Requests when exceeded

---

### 3. **Service Layer** (Core Business Logic)

#### 3.1 TrafficService (`service/TrafficService.java`)
**Responsibilities**:
1. **Ingest Traffic Data** → Write to InfluxDB
2. **Query Traffic Data** → Retrieve for analysis
3. **Aggregate Traffic** → Summarize by IP
4. **Generate Visualization Data** → Time-series for charts

**Key Methods**:

```java
// Write traffic data to InfluxDB
public void save(TrafficPoint trafficPoint) {
    writeApi.writeMeasurement(bucket, org, WritePrecision.NS, trafficPoint);
}

// Query raw traffic data
public List<Map<String, Object>> getTrafficData(String timeRange) {
    String fluxQuery = "from(bucket: \"ddos-bucket\") 
                       |> range(start: -1h) 
                       |> filter(fn: (r) => r._measurement == \"traffic_data\")";
    // Returns list of traffic records
}

// Aggregate by source IP
public List<Map<String, Object>> getTrafficSummaryByIp(String timeRange) {
    String fluxQuery = "from(bucket: \"ddos-bucket\") 
                       |> range(start: -1h) 
                       |> filter(fn: (r) => r._field == \"packetCount\") 
                       |> group(columns: [\"sourceIp\"]) 
                       |> sum()";
    // Returns: [{sourceIp: "x.x.x.x", totalPackets: 5000}, ...]
}

// Time-series aggregation for charts
public List<TrafficSummaryPoint> getTrafficSummary(String timeRange, String window) {
    String fluxQuery = "from(bucket: \"ddos-bucket\") 
                       |> range(start: -1h) 
                       |> aggregateWindow(every: 5m, fn: sum)";
    // Returns: [{time: "2025-09-20T18:00:00Z", totalPackets: 100}, ...]
}
```

**Flux Query Language**: InfluxDB's query language (similar to SQL but for time-series)

---

#### 3.2 DetectionService (`service/DetectionService.java`)
**Responsibilities**:
1. **Scheduled Anomaly Detection** (runs every 30 seconds)
2. **Manual IP Analysis**
3. **Threat Classification**
4. **Auto-trigger Mitigation**

**Current Detection Logic**:

```java
@Scheduled(fixedRate = 30000) // Every 30 seconds
public void checkForAnomalies() {
    // Query traffic in last 1 minute
    String fluxQuery = "from(bucket: \"ddos-bucket\") 
                       |> range(start: -1m) 
                       |> filter(fn: (r) => r._field == \"packetCount\") 
                       |> group(columns: [\"sourceIp\"]) 
                       |> sum()";
    
    // For each source IP:
    // 1. Get total packets in last minute
    // 2. Classify threat level
    // 3. Send alert if threat detected
    // 4. Auto-block for HIGH/CRITICAL threats
}
```

**Threat Classification Thresholds**:
```
NORMAL    → < 1,000 packets/minute
LOW       → 1,000 - 4,999 packets/minute
MEDIUM    → 5,000 - 14,999 packets/minute
HIGH      → 15,000 - 49,999 packets/minute
CRITICAL  → ≥ 50,000 packets/minute
```

**Auto-Mitigation Logic**:
```java
if (threatLevel.equals("HIGH") || threatLevel.equals("CRITICAL")) {
    boolean blocked = mitigationService.blockIp(sourceIp, reason);
    
    if (blocked) {
        alertService.sendCustomAlert("Automated Mitigation Applied", details);
    }
}
```

---

#### 3.3 MitigationService (`service/MitigationService.java`)
**Responsibilities**:
1. **Block IPs** using iptables
2. **Unblock IPs**
3. **Track Blocked IPs** in memory
4. **Validate IP addresses**
5. **Protect critical IPs** from accidental blocking

**Safety Mechanisms**:

```java
// 1. IP Format Validation
private boolean isValidIpAddress(String ip) {
    return IP_PATTERN.matcher(ip).matches();
}

// 2. Protected IP Check (prevents blocking critical systems)
private boolean isProtectedIp(String ip) {
    return ip.equals("127.0.0.1") ||      // localhost
           ip.startsWith("192.168.") ||    // local network
           ip.startsWith("10.") ||         // private network
           ip.startsWith("172.16.");       // private network
}

// 3. Max Blocked IPs Limit
if (blockedIps.size() >= maxBlockedIps) {
    logger.warn("Maximum blocked IPs limit reached");
    return false;
}

// 4. Duplicate Check
if (blockedIps.contains(ipAddress)) {
    logger.info("IP already blocked");
    return true;
}
```

**Blocking Mechanism**:

```java
// Production Mode (dryRun = false)
private void executeBlockCommand(String ipAddress) {
    String[] command = {"/usr/local/bin/block_ip.sh", ipAddress};
    Process process = new ProcessBuilder(command).start();
    // Wait for completion and check exit code
}

// Dry Run Mode (dryRun = true)
private void simulateBlock(String ipAddress) {
    logger.info("[DRY RUN] Would block IP: {}", ipAddress);
    // Only logs, doesn't actually block
}
```

**Shell Script** (`scripts/block_ip.sh`):
```bash
#!/bin/bash
IP_ADDRESS="$1"

# Add iptables rule to drop packets
iptables -I INPUT -s "$IP_ADDRESS" -j DROP

# Log the action
echo "[$TIMESTAMP] BLOCKED: $IP_ADDRESS" >> /app/logs/blocked_ips.log
```

---

#### 3.4 AlertService (`service/AlertService.java`)
**Responsibilities**:
1. **Send Threat Alerts**
2. **Send Custom Alerts**
3. **Email Notifications** (optional)
4. **Console Logging** (fallback)

**Alert Methods**:

```java
@Async  // Runs in separate thread, doesn't block main execution
public void sendThreatAlert(String sourceIp, long trafficVolume, String threatLevel) {
    if (!alertsEnabled) return;
    
    if (emailAlertsEnabled) {
        // Send email via JavaMailSender
        mailSender.send(message);
    } else {
        // Fallback to console
        System.out.printf("[ALERT] %s threat from %s - %d packets\n", 
                         threatLevel, sourceIp, trafficVolume);
    }
}
```

**Alert Triggers**:
- Traffic anomaly detected (LOW/MEDIUM/HIGH/CRITICAL)
- Automated mitigation applied
- Manual test alerts

---

### 4. **Controller Layer** (REST API)

#### 4.1 TrafficController (`controller/TrafficController.java`)
**Endpoints**:

```java
POST   /api/v1/traffic/ingest              // Submit traffic data
GET    /api/v1/traffic/query?range=-1h     // Query traffic data
GET    /api/v1/traffic/summary?range=-1h   // Aggregate by IP
GET    /api/v1/traffic/visualization        // Time-series for charts
```

**Validation**:
- `@Valid` annotation triggers Bean Validation
- `sourceIp` & `destinationIp` must match IPv4 regex
- `packetCount` must be 1-1,000,000
- `byteCount` must be 1-1,000,000,000

#### 4.2 SecurityController (`controller/SecurityController.java`)
**Endpoints**:

```java
GET    /api/v1/security/dashboard           // Security overview
GET    /api/v1/security/status              // System status
POST   /api/v1/security/analyze/{ip}        // Analyze specific IP
POST   /api/v1/security/test-alert          // Test alert system
POST   /api/v1/security/trigger-detection   // Manual threat scan
```

#### 4.3 MitigationController (`controller/MitigationController.java`)
**Endpoints**:

```java
GET    /api/v1/mitigation/status            // Service status
GET    /api/v1/mitigation/blocked           // List blocked IPs
GET    /api/v1/mitigation/check/{ip}        // Check if IP blocked
POST   /api/v1/mitigation/block/{ip}        // Block single IP
POST   /api/v1/mitigation/unblock/{ip}      // Unblock single IP
POST   /api/v1/mitigation/block/bulk        // Block multiple IPs
POST   /api/v1/mitigation/clear             // Emergency unblock all
```

---

### 5. **Error Handling**

#### GlobalExceptionHandler (`controller/GlobalExceptionHandler.java`)
**Purpose**: Centralized error handling for consistent responses

**Handled Exceptions**:

```java
@ExceptionHandler(InfluxException.class)
→ 503 Service Unavailable (Database issues)

@ExceptionHandler(AccessDeniedException.class)
→ 403 Forbidden (Authentication failures)

@ExceptionHandler(MethodArgumentNotValidException.class)
→ 400 Bad Request (Validation errors)

@ExceptionHandler(Exception.class)
→ 500 Internal Server Error (Unexpected errors)
```

**Error Response Format**:
```json
{
  "error": "DATABASE_ERROR",
  "message": "Database operation failed",
  "details": "Could not connect to InfluxDB",
  "timestamp": "2025-09-20T18:30:00Z",
  "status": 503
}
```

---

## 🔄 Complete Workflow

### Scenario 1: Normal Traffic Ingestion

```
1. Client sends POST /api/v1/traffic/ingest
   ↓
2. RateLimitInterceptor checks rate limit (60 req/min)
   ↓
3. SecurityConfig validates authentication
   ↓
4. TrafficController receives request
   ↓
5. @Valid annotation triggers validation
   ↓
6. TrafficService.save() called
   ↓
7. Data written to InfluxDB
   ↓
8. Response 200 OK: "Traffic data ingested successfully"
```

### Scenario 2: DDoS Attack Detection & Auto-Mitigation

```
[Every 30 seconds - Scheduled Task]

1. DetectionService.checkForAnomalies() triggered
   ↓
2. Query InfluxDB for traffic in last 1 minute
   ↓
3. Group by sourceIp and sum packetCount
   ↓
4. For each IP:
   ├─ Calculate total packets
   ├─ Classify threat level
   └─ If LOW/MEDIUM/HIGH/CRITICAL:
       ├─ Log warning
       ├─ AlertService.sendThreatAlert()
       └─ If HIGH or CRITICAL:
           ├─ MitigationService.blockIp()
           ├─ Execute block_ip.sh script
           ├─ Add to blockedIps set
           ├─ Log success
           └─ AlertService.sendCustomAlert("Mitigation Applied")
```

### Scenario 3: Manual IP Analysis

```
1. Client sends POST /api/v1/security/analyze/192.168.1.100
   ↓
2. SecurityController.analyzeIpAddress()
   ↓
3. DetectionService.analyzeIpAddress()
   ↓
4. Query InfluxDB for traffic from that IP in last 5 minutes
   ↓
5. Sum total packets
   ↓
6. Classify threat level
   ↓
7. Return analysis:
   {
     "ipAddress": "192.168.1.100",
     "threatLevel": "LOW",
     "analysisTime": "2025-09-20T18:30:00Z",
     "recommendation": "LOW RISK: Continue monitoring"
   }
```

---

## 📊 Data Flow

### Traffic Data Storage (InfluxDB)

**Measurement**: `traffic_data`

**Schema**:
```
Tags (Indexed):
- sourceIp: "192.168.1.100"
- destinationIp: "203.0.113.1"

Fields:
- packetCount: 150
- byteCount: 65000

Timestamp:
- 2025-09-20T18:30:00Z (nanosecond precision)
```

**Storage Format**:
```
traffic_data,sourceIp=192.168.1.100,destinationIp=203.0.113.1 packetCount=150i,byteCount=65000i 1695228000000000000
```

**Query Example**:
```flux
from(bucket: "ddos-bucket")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "traffic_data")
  |> filter(fn: (r) => r._field == "packetCount")
  |> group(columns: ["sourceIp"])
  |> sum()
```

**Result**:
```json
[
  {"sourceIp": "192.168.1.100", "totalPackets": 100},
  {"sourceIp": "192.168.1.200", "totalPackets": 11000}
]
```

---

## 🤖 ML Integration Plan

### Current State
- **Detection Method**: Threshold-based (simple packet count comparison)
- **Limitation**: Cannot detect sophisticated attacks that stay below thresholds

### Proposed ML Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Spring Boot Backend                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  TrafficController (receives traffic data)        │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│                       ↓                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  TrafficService (stores to InfluxDB)              │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│                       ↓                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  NEW: MLDetectionService                          │  │
│  │  - Extracts 30 ML features from traffic           │  │
│  │  - Calls Python ML Service via HTTP               │  │
│  │  - Receives prediction (0=Benign, 1=Attack)       │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│                       ↓                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  If Attack Detected (prediction=1):               │  │
│  │  - AlertService.sendThreatAlert()                 │  │
│  │  - MitigationService.blockIp()                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                       ↓ HTTP POST
┌─────────────────────────────────────────────────────────┐
│            Python FastAPI ML Service                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  POST /predict                                    │  │
│  │  - Receives 30 traffic features                   │  │
│  │  - Applies scaler transformation                  │  │
│  │  - Random Forest model prediction                 │  │
│  │  - Returns: {is_attack_prediction: 1, confidence} │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Artifacts:                                              │
│  - random_forest_tuned_final.joblib                     │
│  - scaler.joblib                                        │
│  - selected_features.json                               │
└─────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: Extend TrafficPoint Model
**Current** (4 features):
- sourceIp
- destinationIp
- packetCount
- byteCount

**Required** (30+ features for ML):
```java
@Data
@Measurement(name = "traffic_data_ml")
public class EnrichedTrafficPoint {
    // Basic features (current)
    private String sourceIp;
    private String destinationIp;
    private Long packetCount;
    private Long byteCount;
    
    // ML-required features (30 total - from your model)
    private Double urgFlagCount;
    private Double bwdPacketLengthMean;
    private Double bwdPacketsPerSecond;
    private Double subflowBwdBytes;
    private Double initBwdWinBytes;
    // ... 25 more features
    private Double totalBackwardPackets;
    
    private Instant timestamp;
}
```

#### Step 2: Create DTOs for ML Service Communication
```java
public record MLPredictionRequest(
    @JsonProperty("urg_flag_count") Double urgFlagCount,
    @JsonProperty("bwd_packet_length_mean") Double bwdPacketLengthMean,
    @JsonProperty("bwd_packets/s") Double bwdPacketsPerSecond,
    // ... all 30 features
    @JsonProperty("total_backward_packets") Double totalBackwardPackets
) {}

public record MLPredictionResponse(
    @JsonProperty("is_attack_prediction") int isAttackPrediction,
    @JsonProperty("confidence") double confidence
) {}
```

#### Step 3: Create ML Detection Service
```java
@Service
public class MLDetectionService {
    private final WebClient mlServiceClient;
    private final AlertService alertService;
    private final MitigationService mitigationService;
    
    public Mono<MLPredictionResponse> analyzeTraffic(EnrichedTrafficPoint traffic) {
        // 1. Create prediction request
        MLPredictionRequest request = createRequest(traffic);
        
        // 2. Call Python ML service
        return mlServiceClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(MLPredictionResponse.class)
                .doOnSuccess(response -> {
                    if (response.isAttackPrediction() == 1) {
                        // Attack detected!
                        handleAttackDetection(traffic, response);
                    }
                });
    }
    
    private void handleAttackDetection(EnrichedTrafficPoint traffic, 
                                      MLPredictionResponse prediction) {
        String reason = String.format(
            "ML-detected attack (confidence: %.2f%%)", 
            prediction.confidence() * 100
        );
        
        // Send alert
        alertService.sendCustomAlert("ML Attack Detection", reason);
        
        // Auto-block
        mitigationService.blockIp(traffic.getSourceIp(), reason);
    }
}
```

#### Step 4: Update Detection Service
```java
@Service
public class DetectionService {
    private final MLDetectionService mlDetectionService;  // NEW
    
    @Scheduled(fixedRate = 30000)
    public void checkForAnomalies() {
        // Option 1: Use ML for all traffic (recommended)
        queryRecentTraffic().forEach(traffic -> {
            mlDetectionService.analyzeTraffic(traffic).subscribe();
        });
        
        // Option 2: Hybrid approach
        // - Use threshold detection as first filter
        // - Use ML for borderline cases
    }
}
```

---

## ⚙️ Configuration Deep Dive

### Environment-Specific Configurations

#### Development (`application.properties`)
```properties
defenddos.mitigation.dry-run=true          # Safe testing
defenddos.alerts.email.enabled=false       # Console only
```

#### Production (`application-prod.properties`)
```properties
defenddos.mitigation.dry-run=false         # Real blocking
defenddos.alerts.email.enabled=true        # Real emails
INFLUXDB_TOKEN=${INFLUXDB_TOKEN}           # From environment
```

### Docker Compose Configuration

```yaml
services:
  influxdb:
    volumes:
      - influxdb-data:/var/lib/influxdb2    # Persistent storage
      - influxdb-config:/etc/influxdb2
    environment:
      - DOCKER_INFLUXDB_INIT_ORG=defenddos-org
      - DOCKER_INFLUXDB_INIT_BUCKET=ddos-bucket
  
  backend-service:
    privileged: true                         # Required for iptables
    environment:
      - INFLUXDB_URL=http://influxdb:8086   # Container networking
      - SPRING_PROFILES_ACTIVE=prod
```

---

## 🔐 Security Considerations

### Current Implementation
1. **HTTP Basic Authentication** (auto-generated password)
2. **Rate Limiting** (60 req/min per IP)
3. **Input Validation** (Bean Validation)
4. **Protected IPs** (prevents blocking critical systems)
5. **CSRF Disabled** (stateless API)

### Recommendations for Production
1. **Use JWT tokens** instead of Basic Auth
2. **Enable HTTPS** (TLS/SSL certificates)
3. **Implement API keys** for service-to-service communication
4. **Add request signing** for ML service communication
5. **Enable audit logging**
6. **Implement IP whitelisting** for admin endpoints

---

## 📈 Performance Considerations

### Current Optimizations
1. **Async Operations**: Alerts run in separate threads (`@Async`)
2. **Connection Pooling**: InfluxDB client reuses connections
3. **In-memory Tracking**: Blocked IPs stored in `ConcurrentHashMap`
4. **Batch Writes**: InfluxDB supports batching (can be configured)

### Scalability Recommendations
1. **Redis Cache**: Store blocked IPs for distributed systems
2. **Message Queue**: Use Kafka/RabbitMQ for async processing
3. **Load Balancer**: Distribute traffic across multiple instances
4. **Database Sharding**: Partition InfluxDB by time ranges
5. **ML Service Scaling**: Deploy multiple Python service instances

---

## 🎯 Next Steps for ML Integration

1. ✅ Create Python FastAPI service with your trained model
2. ✅ Add `spring-boot-starter-webflux` dependency
3. ⬜ Extend `TrafficPoint` model with 30 ML features
4. ⬜ Create `MLPredictionRequest` and `MLPredictionResponse` DTOs
5. ⬜ Implement `MLDetectionService`
6. ⬜ Configure `WebClient` bean
7. ⬜ Update `TrafficController` to accept enriched data
8. ⬜ Test end-to-end workflow
9. ⬜ Deploy both services with Docker Compose

---

## 📚 Additional Resources

- **Spring Boot Documentation**: https://spring.io/projects/spring-boot
- **InfluxDB Flux Query Language**: https://docs.influxdata.com/flux/
- **Bucket4j Rate Limiting**: https://github.com/bucket4j/bucket4j
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Docker Compose**: https://docs.docker.com/compose/

---

**Last Updated**: October 9, 2025  
**Version**: 2.0.0  
**Maintainer**: DefenDDoS Development Team
