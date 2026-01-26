# DefenDDoS Backend - Complete Load Testing & Verification Guide

## 📋 Table of Contents
1. [Prerequisites & Tools](#prerequisites--tools)
2. [Load Testing Strategy](#load-testing-strategy)
3. [Database Verification](#database-verification)
4. [Monitoring & Metrics](#monitoring--metrics)
5. [Test Scenarios](#test-scenarios)
6. [Running Tests](#running-tests)

---

## Prerequisites & Tools

### Install Required Tools

#### 1. **K6** (Recommended - Easy & Powerful)
```powershell
winget install k6
```

#### 2. **Apache JMeter** (GUI-based)
```powershell
winget install Apache.JMeter
```

#### 3. **Artillery** (Node.js based)
```powershell
npm install -g artillery
```

### Monitoring Stack
- **Spring Boot Actuator** (Already in your project)
- **Prometheus** (Metrics collection)
- **Grafana** (Visualization)

---

## Load Testing Strategy

### Test Types

| Test Type | Purpose | Tool | Duration |
|-----------|---------|------|----------|
| **Smoke Test** | Verify system works | K6 | 1 min |
| **Load Test** | Normal traffic | K6/JMeter | 10-30 min |
| **Stress Test** | Find breaking point | K6 | 20 min |
| **Spike Test** | Sudden traffic surge | K6 | 5 min |
| **Soak Test** | Memory leaks | K6 | 2-4 hours |

### Traffic Patterns

**Normal Traffic Profile:**
- 50% GET requests (read data)
- 30% POST requests (create data)
- 15% PUT requests (update data)
- 5% DELETE requests

**DDoS Attack Profile:**
- 90% rapid GET requests from multiple IPs
- 10% malformed requests
- Connection flooding
- Header injection attempts

---

## Test Scenarios

### Scenario 1: Normal User Traffic
**Goal:** Simulate 100-500 concurrent users

**Endpoints to Test:**
- `GET /api/v1/traffic/stats` - View statistics
- `POST /api/v1/auth/login` - User authentication  
- `GET /api/v1/mitigation/status` - Check protection status
- `POST /api/v1/data/events` - Log events

**Expected Results:**
- Response time < 200ms (p95)
- Error rate < 1%
- Throughput: 500-1000 req/sec

### Scenario 2: DDoS Attack Simulation
**Goal:** Test defense mechanisms

**Attack Patterns:**
- **HTTP Flood:** 10,000 req/sec from 100 IPs
- **Slowloris:** Slow HTTP requests
- **Connection Exhaustion:** Max connections
- **Application Layer:** Complex queries

**Expected Results:**
- Rate limiting activated
- Legitimate users still served
- Attack traffic blocked/throttled
- No service downtime

### Scenario 3: Mixed Traffic
**Goal:** Real users + bot traffic

**Distribution:**
- 70% legitimate users (100 concurrent)
- 30% bot/attack traffic (1000 req/sec)

**Expected Results:**
- Legitimate users: < 300ms response
- Bot traffic: Blocked/rate-limited
- Database: No corruption

---

## Database Verification

### Data Integrity Checks

#### 1. **Transaction Consistency**
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM traffic_events 
WHERE user_id NOT IN (SELECT id FROM users);

-- Verify totals match
SELECT 
  (SELECT SUM(request_count) FROM traffic_stats) as stats_total,
  (SELECT COUNT(*) FROM traffic_events) as events_total;
```

#### 2. **Concurrent Write Test**
```java
// Verify no race conditions
@Test
public void testConcurrentWrites() {
    ExecutorService executor = Executors.newFixedThreadPool(50);
    AtomicInteger successCount = new AtomicInteger(0);
    
    for (int i = 0; i < 1000; i++) {
        executor.submit(() -> {
            try {
                trafficService.logEvent(new TrafficEvent());
                successCount.incrementAndGet();
            } catch (Exception e) {
                // Log error
            }
        });
    }
    
    assertEquals(1000, successCount.get());
}
```

#### 3. **Data Loss Detection**
```powershell
# Script to verify all writes are persisted
$totalRequests = 10000
$endpoint = "http://localhost:8081/api/v1/data/test"

for ($i = 1; $i -le $totalRequests; $i++) {
    Invoke-RestMethod -Method POST -Uri $endpoint -Body (@{id=$i} | ConvertTo-Json)
}

# Verify count in database
$dbCount = Invoke-Sqlcmd -Query "SELECT COUNT(*) FROM test_data"
if ($dbCount -eq $totalRequests) {
    Write-Host "✅ No data loss - All $totalRequests records written"
} else {
    Write-Host "❌ Data loss detected: $($totalRequests - $dbCount) records missing"
}
```

### Connection Pool Monitoring

```java
// Monitor HikariCP metrics
@Autowired
private HikariDataSource dataSource;

public PoolMetrics getPoolMetrics() {
    HikariPoolMXBean pool = dataSource.getHikariPoolMXBean();
    
    return PoolMetrics.builder()
        .activeConnections(pool.getActiveConnections())
        .idleConnections(pool.getIdleConnections())
        .totalConnections(pool.getTotalConnections())
        .threadsAwaitingConnection(pool.getThreadsAwaitingConnection())
        .build();
}
```

---

## Monitoring & Metrics

### Key Metrics to Monitor

#### Application Metrics
- **Response Time:** p50, p95, p99 latency
- **Throughput:** Requests per second
- **Error Rate:** 4xx/5xx percentage
- **Active Connections:** Current open connections
- **Thread Pool:** Active/idle threads

#### Database Metrics
- **Query Time:** Average query duration
- **Connections:** Active vs max pool size
- **Slow Queries:** Queries > 1 second
- **Deadlocks:** Lock wait count
- **Transaction Rate:** Commits/rollbacks per second

#### System Metrics
- **CPU Usage:** Per core utilization
- **Memory:** Heap/non-heap usage
- **GC Activity:** Pause time and frequency
- **Disk I/O:** Read/write operations
- **Network:** Bandwidth in/out

### Actuator Endpoints

```bash
# Health check
curl http://localhost:8081/actuator/health

# Metrics
curl http://localhost:8081/actuator/metrics

# Specific metric
curl http://localhost:8081/actuator/metrics/http.server.requests

# Thread dump (for debugging)
curl http://localhost:8081/actuator/threaddump

# Heap dump (memory issues)
curl http://localhost:8081/actuator/heapdump > heap.dump
```

---

## Running Tests

### Quick Start Tests

#### Test 1: Smoke Test (1 minute)
```powershell
# Saved in: test-smoke.ps1
k6 run .\load-tests\smoke-test.js
```

#### Test 2: Load Test (10 minutes, 100 users)
```powershell
k6 run --vus 100 --duration 10m .\load-tests\load-test.js
```

#### Test 3: Stress Test (Find breaking point)
```powershell
k6 run --vus 500 --duration 20m .\load-tests\stress-test.js
```

#### Test 4: DDoS Simulation
```powershell
.\SIMULATE_DDOS_ATTACK.ps1 -Target "http://localhost:8081" -Duration 300
```

### Database Verification Tests

```powershell
# Test concurrent writes
.\test-db-concurrent-writes.ps1

# Check data integrity
.\test-db-integrity.ps1

# Monitor connection pool
.\test-db-connections.ps1
```

---

## Test Results Interpretation

### Success Criteria

| Metric | Target | Maximum |
|--------|--------|---------|
| Response Time (p95) | < 200ms | < 500ms |
| Error Rate | < 0.1% | < 1% |
| Throughput | > 500 req/s | - |
| CPU Usage | < 70% | < 90% |
| Memory Usage | < 80% | < 95% |
| DB Connections | < 50% pool | < 80% pool |

### Red Flags 🚩

- **Response time > 1s:** Database bottleneck or slow queries
- **Error rate > 5%:** System overloaded or bugs
- **Memory growing:** Possible memory leak
- **CPU at 100%:** Thread starvation or inefficient code
- **DB pool exhausted:** Too many concurrent queries

---

## Optimization Recommendations

### Based on Test Results

**If slow response times:**
- Add database indexes
- Implement caching (Redis)
- Optimize SQL queries
- Increase connection pool size

**If high memory usage:**
- Check for memory leaks
- Adjust JVM heap size
- Implement pagination
- Use streaming for large data

**If high CPU:**
- Profile code for hotspots
- Add more instances (horizontal scaling)
- Optimize algorithms
- Use async processing

**If database bottleneck:**
- Add read replicas
- Implement connection pooling
- Use caching layer
- Optimize indexes

---

## Next Steps

1. ✅ **Start your backend** (`.\START_EVERYTHING.ps1`)
2. ✅ **Run smoke test** to verify system works
3. ✅ **Run load test** with 100 concurrent users
4. ✅ **Run stress test** to find limits
5. ✅ **Run DDoS simulation** to test defenses
6. ✅ **Monitor metrics** during all tests
7. ✅ **Verify database** integrity after tests
8. ✅ **Analyze results** and optimize

---

## Tools Reference

### K6 Commands
```bash
# Basic load test
k6 run script.js

# With virtual users
k6 run --vus 100 --duration 30s script.js

# With stages
k6 run --stage 30s:10,1m:50,30s:0 script.js

# Output to file
k6 run --out json=results.json script.js
```

### JMeter Commands
```bash
# GUI mode
jmeter

# CLI mode
jmeter -n -t test-plan.jmx -l results.jtl

# Generate report
jmeter -g results.jtl -o report/
```

### Artillery Commands
```bash
# Run test
artillery run load-test.yml

# Quick test
artillery quick --duration 60 --rate 10 http://localhost:8081

# Report
artillery report results.json
```

---

**Ready to test your backend under real-world conditions! 🚀**
