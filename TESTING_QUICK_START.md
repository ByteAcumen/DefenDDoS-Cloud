# DefenDDoS - Quick Start Testing Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install K6 (if not already installed)
```powershell
# Windows - Option 1: Winget
winget install k6.k6

# Windows - Option 2: Chocolatey
choco install k6

# Windows - Option 3: Scoop
scoop install k6

# Verify installation
k6 version
```

### Step 2: Ensure Services Are Running
```powershell
# Check running services
docker ps

# Start all services if not running
cd backend-service
docker-compose up -d

# Wait 30 seconds for services to be ready
Start-Sleep -Seconds 30
```

### Step 3: Run Quick Smoke Test (2 minutes)
```powershell
# Run basic functionality test
k6 run .\tests\k6-smoke-test.js

# Expected output:
# ✅ 100% success rate
# ✅ All requests < 500ms
```

---

## 📊 Test Scenarios

### Scenario 1: Quick Validation (5 minutes total)
**Purpose:** Verify system is working before presentation/demo

```powershell
# Run smoke test + database verification
.\run-comprehensive-tests.ps1 -TestType smoke
.\tests\verify-database.ps1 -Action GetCount
```

**What it tests:**
- ✅ Backend health
- ✅ Traffic ingestion
- ✅ Statistics API
- ✅ Database connectivity

---

### Scenario 2: Performance Baseline (20 minutes)
**Purpose:** Establish normal performance metrics

```powershell
# Run load test to simulate normal traffic
.\run-comprehensive-tests.ps1 -TestType load
```

**What it tests:**
- ✅ 100 concurrent users
- ✅ 15-minute sustained load
- ✅ Mixed traffic patterns (60% legitimate, 20% bot, 20% attack)
- ✅ Response time p95 < 1s

**Expected Metrics:**
- Throughput: 100-200 req/s
- Error rate: < 1%
- Response time p95: < 1000ms
- CPU usage: < 70%
- Memory usage: < 2GB

---

### Scenario 3: Breaking Point Test (40 minutes)
**Purpose:** Find maximum capacity

```powershell
# Run stress test to find limits
.\run-comprehensive-tests.ps1 -TestType stress
```

**What it tests:**
- ✅ Gradual ramp-up: 10 → 500 users
- ✅ 30-minute duration
- ✅ Heavy attack traffic
- ✅ System recovery after load

**Expected Results:**
- Breaking point: ~300-400 concurrent users
- System remains responsive until breaking point
- Graceful degradation (no crashes)
- Recovery after load decrease

---

### Scenario 4: Traffic Spike Simulation (10 minutes)
**Purpose:** Test auto-scaling and rate limiting

```powershell
# Simulate sudden traffic surges
.\run-comprehensive-tests.ps1 -TestType spike
```

**What it tests:**
- ✅ Sudden spikes: 50 → 500 → 50 users
- ✅ Multiple spike cycles
- ✅ Rate limiting activation
- ✅ Queue management

**Expected Behavior:**
- Rate limiting kicks in at high load
- No data loss during spikes
- System stabilizes after spike

---

### Scenario 5: Database Integrity (15 minutes)
**Purpose:** Verify data persistence and accuracy

```powershell
# Comprehensive database testing
.\tests\verify-database.ps1 -Action All
```

**What it tests:**
1. **Data Insertion:** Insert 500 records, verify all saved
2. **Query Performance:** Test different time ranges
3. **Data Integrity:** Verify no corruption
4. **Concurrent Operations:** Simultaneous read/write

**Expected Results:**
- ✅ 100% insertion success rate
- ✅ All queries < 500ms
- ✅ No data corruption
- ✅ No write conflicts

---

### Scenario 6: Complete Test Suite (60+ minutes)
**Purpose:** Full production readiness assessment

```powershell
# Run everything (automated, with report generation)
.\run-comprehensive-tests.ps1 -TestType all
```

**What it includes:**
1. Smoke Test (2 min)
2. Load Test (15 min)
3. Spike Test (5 min)
4. Database Verification (10 min)
5. Stress Test (30 min) - Optional
6. Generate HTML report

**Output:**
- ✅ Comprehensive HTML report
- ✅ Performance metrics
- ✅ Bottleneck identification
- ✅ Recommendations

---

## 🎯 Real-World Simulation Recipes

### Recipe 1: E-commerce Flash Sale
**Scenario:** 1000+ users hitting site simultaneously

```powershell
# Modify k6-spike-test.js to simulate flash sale
k6 run --vus 1000 --duration 2m .\tests\k6-spike-test.js
```

**Metrics to Monitor:**
- Response times under high load
- Rate limiting effectiveness
- Database write throughput
- Error rates during peak

---

### Recipe 2: DDoS Attack Simulation
**Scenario:** Sustained attack from multiple IPs

```powershell
# Generate attack traffic (high packet/byte counts)
# Uses attack pattern in k6-stress-test.js
k6 run .\tests\k6-stress-test.js
```

**What to Verify:**
- ML model detects attacks (check logs)
- IPs get blocked automatically
- Legitimate traffic still processed
- System doesn't crash

---

### Recipe 3: Mixed Traffic (Realistic)
**Scenario:** Normal users + bots + occasional attacks

```powershell
# Uses built-in traffic distribution in k6-load-test.js
# 60% legitimate, 20% bots, 20% attacks
k6 run --duration 30m .\tests\k6-load-test.js
```

**What to Verify:**
- ML correctly classifies traffic types
- False positive rate < 1%
- All traffic types handled smoothly
- Database stores all data

---

## 📈 Monitoring During Tests

### Real-Time Monitoring
```powershell
# Terminal 1: Run test
.\run-comprehensive-tests.ps1 -TestType load

# Terminal 2: Monitor system
.\monitor-system.ps1

# Terminal 3: Watch logs
docker logs -f defenddos-backend
```

### Key Metrics Dashboard
```powershell
# CPU, Memory, Network for all containers
docker stats

# Backend-specific metrics
docker stats defenddos-backend

# InfluxDB write operations
docker exec defenddos-influxdb influx v1 dbrp list
```

---

## 🔍 Interpreting Results

### Good Performance Indicators
```
✅ HTTP success rate: > 99%
✅ Response time p95: < 1000ms
✅ CPU usage: < 80%
✅ Memory usage: Stable (not growing)
✅ Error rate: < 1%
✅ Database queries: < 500ms
```

### Warning Signs
```
⚠️ Response time p95: 1000-2000ms → Slow, investigate
⚠️ CPU usage: 80-95% → Near capacity
⚠️ Error rate: 1-5% → Some failures
⚠️ Memory growing → Possible leak
```

### Critical Issues
```
🔴 Response time p95: > 2000ms → Very slow
🔴 CPU usage: > 95% → Overloaded
🔴 Error rate: > 5% → System failing
🔴 Memory: Constant growth → Memory leak
🔴 Database: Connection pool exhausted
```

---

## 🛠️ Troubleshooting

### Issue: K6 Command Not Found
```powershell
# Install K6
winget install k6.k6

# Add to PATH (if needed)
$env:Path += ";C:\Program Files\k6"
```

### Issue: Services Not Running
```powershell
# Check status
docker ps

# Start services
cd backend-service
docker-compose up -d

# Check logs
docker logs defenddos-backend
```

### Issue: High Error Rates
```powershell
# Check backend errors
docker logs defenddos-backend --tail 100 | Select-String "ERROR"

# Check rate limiting
docker logs defenddos-backend | Select-String "Rate limit"

# Increase rate limits
# Edit application.properties:
# defenddos.rate-limit.requests-per-minute=200
```

### Issue: Slow Database Queries
```powershell
# Check InfluxDB performance
docker exec defenddos-influxdb influx query 'SHOW STATS FOR "write"'

# Optimize retention policy
docker exec defenddos-influxdb influx bucket update \
  --name defenddos --retention 7d
```

---

## 📊 Expected Benchmarks

| Test Type | Duration | VUs | Req/s | Success Rate | p95 RT |
|-----------|----------|-----|-------|--------------|--------|
| Smoke | 2 min | 5 | 10-20 | 100% | <500ms |
| Load | 15 min | 100 | 100-200 | >99% | <1000ms |
| Stress | 30 min | 500 | 500+ | >95% | <2000ms |
| Spike | 5 min | 800 | 1000+ | >98% | <1500ms |

---

## 🎯 Next Steps After Testing

1. **Analyze Reports:** Review HTML reports in `test-reports/`
2. **Optimize:** Address bottlenecks identified
3. **Re-test:** Verify improvements
4. **Document:** Record baseline performance
5. **Monitor:** Set up continuous monitoring (Prometheus/Grafana)
6. **Scale:** Configure auto-scaling based on results

---

## 📚 Additional Resources

- **K6 Documentation:** https://k6.io/docs/
- **InfluxDB Performance:** https://docs.influxdata.com/influxdb/v2.7/write-data/best-practices/
- **Test Reports:** Check `.\test-reports\` for detailed results
- **Comprehensive Guide:** See [COMPREHENSIVE_TESTING_GUIDE.md](COMPREHENSIVE_TESTING_GUIDE.md)

---

**Ready to test?** Start with the smoke test:
```powershell
k6 run .\tests\k6-smoke-test.js
```
