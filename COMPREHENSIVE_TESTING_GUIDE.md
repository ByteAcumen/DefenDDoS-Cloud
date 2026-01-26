# DefenDDoS - Comprehensive Load Testing & Database Verification Guide

**Date:** January 26, 2026  
**Purpose:** Production-ready testing for real-world conditions

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Testing Tools Setup](#testing-tools-setup)
3. [Traffic Simulation Strategy](#traffic-simulation-strategy)
4. [Load Testing Scenarios](#load-testing-scenarios)
5. [Database Verification](#database-verification)
6. [Metrics Monitoring](#metrics-monitoring)
7. [Automated Test Suite](#automated-test-suite)

---

## Quick Start

### Run All Tests (Automated)
```powershell
# Complete test suite (30 minutes)
.\run-comprehensive-tests.ps1

# Individual test scenarios
.\run-comprehensive-tests.ps1 -TestType smoke      # 2 min - Basic functionality
.\run-comprehensive-tests.ps1 -TestType load       # 15 min - Normal traffic
.\run-comprehensive-tests.ps1 -TestType stress     # 30 min - Breaking point
.\run-comprehensive-tests.ps1 -TestType spike      # 5 min - Traffic surge
.\run-comprehensive-tests.ps1 -TestType database   # 10 min - Data integrity
```

---

## Testing Tools Setup

### Required Tools

#### 1. K6 (Primary Load Testing Tool)
```powershell
# Install k6
winget install k6.k6

# Or via Chocolatey
choco install k6

# Verify installation
k6 version
```

#### 2. InfluxDB CLI (Database Verification)
```powershell
# Already installed with InfluxDB Docker container
docker exec -it defenddos-influxdb influx --version
```

#### 3. Monitoring Tools
```powershell
# Docker stats for resource monitoring
docker stats --no-stream

# System resource monitor (Windows)
Get-Counter '\Processor(_Total)\% Processor Time'
```

---

## Traffic Simulation Strategy

### Traffic Types

| Traffic Type | Description | Percentage | Purpose |
|--------------|-------------|------------|---------|
| **Legitimate User** | Normal browsing, API calls | 60% | Baseline performance |
| **Bot Traffic** | Scrapers, crawlers | 20% | Real-world bot simulation |
| **Attack Traffic** | DDoS, floods, scans | 15% | ML model testing |
| **API Clients** | Automated integrations | 5% | Integration testing |

### Traffic Patterns

#### 1. Normal Business Hours Pattern
```
08:00 - 10:00: Gradual increase (10 → 100 req/s)
10:00 - 16:00: Peak load (100 → 200 req/s)
16:00 - 20:00: Gradual decrease (200 → 50 req/s)
20:00 - 08:00: Low traffic (10 → 20 req/s)
```

#### 2. Attack Pattern
```
- Initial: Normal traffic (50 req/s)
- Ramp-up: 5-minute increase (50 → 5000 req/s)
- Sustained: 10-minute attack (5000 req/s constant)
- Cool-down: 5-minute decrease (5000 → 50 req/s)
```

#### 3. Spike Pattern
```
- Baseline: 100 req/s
- Spike: 2000 req/s for 30 seconds
- Return: Back to 100 req/s
- Repeat: Every 5 minutes
```

---

## Load Testing Scenarios

### Scenario 1: Smoke Test (2 minutes)
**Purpose:** Verify system is functional before heavy testing

**Configuration:**
- Virtual Users: 5
- Duration: 2 minutes
- Requests/sec: 10-20

**Run:**
```powershell
k6 run --vus 5 --duration 2m .\tests\k6-smoke-test.js
```

**Expected Results:**
- ✅ HTTP success rate: 100%
- ✅ Response time p95: < 500ms
- ✅ No errors

---

### Scenario 2: Load Test (15 minutes)
**Purpose:** Test normal production load

**Configuration:**
- Virtual Users: Ramp 10 → 100 → 10
- Duration: 15 minutes
- Requests/sec: 100-200

**Run:**
```powershell
k6 run --vus 100 --duration 15m .\tests\k6-load-test.js
```

**Expected Results:**
- ✅ HTTP success rate: > 99%
- ✅ Response time p95: < 1000ms
- ✅ CPU usage: < 80%
- ✅ Memory usage: < 2GB

---

### Scenario 3: Stress Test (30 minutes)
**Purpose:** Find system breaking point

**Configuration:**
- Virtual Users: Ramp 10 → 500
- Duration: 30 minutes
- Requests/sec: 100 → 2000+

**Run:**
```powershell
k6 run .\tests\k6-stress-test.js
```

**Expected Results:**
- ⚠️ Find breaking point (when error rate > 5%)
- ⚠️ Identify bottlenecks
- ✅ System recovers after load decrease

---

### Scenario 4: Spike Test (5 minutes)
**Purpose:** Test sudden traffic surges

**Configuration:**
- Virtual Users: 50 → 500 → 50 (spikes every 2 min)
- Duration: 5 minutes
- Pattern: Sudden spikes

**Run:**
```powershell
k6 run .\tests\k6-spike-test.js
```

**Expected Results:**
- ✅ System handles spikes gracefully
- ✅ Auto-scaling triggered (if configured)
- ✅ No data loss during spikes

---

### Scenario 5: Soak Test (2 hours)
**Purpose:** Detect memory leaks, resource exhaustion

**Configuration:**
- Virtual Users: 50 (constant)
- Duration: 2 hours
- Requests/sec: 100 (constant)

**Run:**
```powershell
k6 run --vus 50 --duration 2h .\tests\k6-soak-test.js
```

**Expected Results:**
- ✅ No memory growth over time
- ✅ Consistent response times
- ✅ No connection leaks

---

## Database Verification

### Test 1: Data Insertion Verification

**Purpose:** Ensure all traffic data is stored in InfluxDB

**Steps:**
```powershell
# 1. Record initial count
.\tests\verify-database.ps1 -Action GetCount

# 2. Send 10,000 traffic records
.\tests\load-traffic-data.ps1 -RecordCount 10000

# 3. Verify count increased by 10,000
.\tests\verify-database.ps1 -Action VerifyInsert -ExpectedCount 10000
```

**Expected Results:**
- ✅ All 10,000 records inserted
- ✅ No data loss (count matches exactly)
- ✅ Insertion time < 10 seconds

---

### Test 2: Data Retrieval Performance

**Purpose:** Test query performance under load

**Steps:**
```powershell
# Test query speed with different time ranges
.\tests\test-query-performance.ps1 -TimeRange "-5m"   # Last 5 minutes
.\tests\test-query-performance.ps1 -TimeRange "-1h"   # Last hour
.\tests\test-query-performance.ps1 -TimeRange "-24h"  # Last day
```

**Expected Results:**
- ✅ 5-min query: < 100ms
- ✅ 1-hour query: < 500ms
- ✅ 24-hour query: < 2000ms

---

### Test 3: Concurrent Read/Write Operations

**Purpose:** Test database under simultaneous read/write load

**Steps:**
```powershell
# Run concurrent operations
.\tests\concurrent-db-test.ps1 -Writers 10 -Readers 20 -Duration 5m
```

**Expected Results:**
- ✅ No write conflicts
- ✅ Read consistency maintained
- ✅ No locked queries

---

### Test 4: Data Integrity Check

**Purpose:** Verify no data corruption or loss

**Steps:**
```powershell
# Generate checksum before load
.\tests\verify-database.ps1 -Action GenerateChecksum

# Run heavy load test
.\run-comprehensive-tests.ps1 -TestType stress

# Verify checksum after load
.\tests\verify-database.ps1 -Action VerifyChecksum
```

**Expected Results:**
- ✅ All records present
- ✅ No corrupted data
- ✅ Timestamps accurate

---

## Metrics Monitoring

### Key Metrics to Monitor

#### 1. Application Metrics

| Metric | Tool | Threshold | Action |
|--------|------|-----------|--------|
| Response Time p50 | K6 | < 200ms | ✅ Normal |
| Response Time p95 | K6 | < 1000ms | ⚠️ Monitor |
| Response Time p99 | K6 | < 2000ms | 🔴 Investigate |
| Error Rate | K6 | < 1% | ✅ Normal |
| Throughput | K6 | > 100 req/s | ✅ Normal |

#### 2. Database Metrics

| Metric | Tool | Threshold | Action |
|--------|------|-----------|--------|
| Write Operations/sec | InfluxDB | > 1000 | ✅ Normal |
| Query Response Time | InfluxDB | < 500ms | ✅ Normal |
| Disk Usage | Docker Stats | < 80% | ✅ Normal |
| Memory Usage | Docker Stats | < 2GB | ✅ Normal |

#### 3. System Metrics

| Metric | Tool | Threshold | Action |
|--------|------|-----------|--------|
| CPU Usage | Docker Stats | < 80% | ✅ Normal |
| Memory Usage | Docker Stats | < 4GB | ✅ Normal |
| Network I/O | Docker Stats | < 100MB/s | ✅ Normal |
| Disk I/O | Docker Stats | < 50MB/s | ✅ Normal |

---

### Monitoring Commands

#### Real-time Monitoring
```powershell
# Monitor all containers
docker stats

# Monitor specific service
docker stats defenddos-backend defenddos-influxdb

# Monitor InfluxDB metrics
docker exec defenddos-influxdb influx bucket list
docker exec defenddos-influxdb influx v1 dbrp list
```

#### Log Analysis
```powershell
# Backend errors
docker logs defenddos-backend --tail 100 | Select-String "ERROR|Exception"

# Traffic patterns
docker logs defenddos-backend --tail 1000 | Select-String "Traffic ingested"

# ML predictions
docker logs defenddos-backend --tail 100 | Select-String "ML prediction"
```

---

## Automated Test Suite

### Run Complete Test Suite
```powershell
# Full automated testing (30 minutes)
.\run-comprehensive-tests.ps1 -All

# Output: Detailed HTML report
# Location: .\test-reports\comprehensive-test-{timestamp}.html
```

### Test Report Includes:
- ✅ Load test results (all scenarios)
- ✅ Database verification results
- ✅ Performance metrics
- ✅ Error logs
- ✅ Bottleneck identification
- ✅ Recommendations

---

## Expected Performance Benchmarks

### Production-Ready Targets

| Scenario | Req/s | Success Rate | p95 Response | CPU | Memory |
|----------|-------|--------------|--------------|-----|--------|
| Smoke Test | 20 | 100% | < 500ms | < 30% | < 1GB |
| Load Test | 200 | > 99% | < 1000ms | < 70% | < 2GB |
| Stress Test | 500+ | > 95% | < 2000ms | < 90% | < 3GB |
| Spike Test | 1000 | > 98% | < 1500ms | < 85% | < 2.5GB |

---

## Troubleshooting

### Issue: High Error Rate (> 5%)

**Possible Causes:**
1. Database connection pool exhausted
2. Rate limiting triggered
3. Memory pressure

**Solutions:**
```powershell
# Increase connection pool
# Edit application.properties
spring.datasource.hikari.maximum-pool-size=50

# Check rate limits
docker logs defenddos-backend | Select-String "Rate limit"

# Increase memory
docker-compose up -d --scale backend-service=2
```

---

### Issue: Slow Response Times (> 2s)

**Possible Causes:**
1. Database query optimization needed
2. ML model inference slow
3. Network latency

**Solutions:**
```powershell
# Profile slow queries
docker exec defenddos-influxdb influx query 'SHOW QUERIES'

# Check ML service performance
curl http://localhost:8000/metrics

# Monitor network
docker network inspect defenddos-network
```

---

### Issue: Data Loss During Load

**Possible Causes:**
1. Write buffer overflow
2. Async write failures
3. Connection timeouts

**Solutions:**
```powershell
# Enable synchronous writes (slower but safer)
# Edit InfluxDB config
[data]
  wal-fsync-delay = "0s"

# Increase write timeout
defenddos.influx-db.write-timeout=30s

# Monitor write queue
docker exec defenddos-influxdb influx v1 query 'SHOW STATS FOR "write"'
```

---

## Next Steps After Testing

1. **Analyze Results:** Review test reports for bottlenecks
2. **Optimize:** Address performance issues
3. **Re-test:** Verify improvements
4. **Document:** Record baseline performance
5. **Monitor:** Set up production monitoring (Prometheus/Grafana)
6. **Scale:** Configure auto-scaling based on test results

---

## Additional Resources

- **K6 Documentation:** https://k6.io/docs/
- **InfluxDB Performance:** https://docs.influxdata.com/influxdb/v2.7/write-data/best-practices/
- **Spring Boot Performance:** https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html

---

**Status:** Ready for comprehensive testing  
**Estimated Time:** 30 minutes (all scenarios) - 4 hours (including soak test)
