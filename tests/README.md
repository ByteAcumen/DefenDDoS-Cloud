# K6 Load Testing Suite

This directory contains K6 load testing scripts for DefenDDoS-Cloud backend.

## Prerequisites

### Install K6

**Windows:**
```powershell
# Option 1: Chocolatey
choco install k6

# Option 2: Download binary
# Visit https://github.com/grafana/k6/releases
# Download k6-v0.49.0-windows-amd64.zip
# Extract k6.exe to project root or add to PATH
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**macOS:**
```bash
brew install k6
```

## Test Scripts

| Script | Duration | VUs | Purpose |
|--------|----------|-----|---------|
| `k6-smoke-test.js` | 2 min | 5 | Basic validation, sanity check |
| `k6-load-test.js` | 15 min | 10→100 | Realistic traffic patterns |
| `k6-stress-test.js` | 30 min | 10→500 | Find breaking point |
| `k6-spike-test.js` | 5 min | 50→800 | Sudden traffic surges |

## Running Tests

### Individual Tests
```powershell
# From project root
cd tests

# Smoke test (quick validation)
k6 run --duration 30s --vus 5 k6-smoke-test.js

# Load test (realistic scenario)
k6 run k6-load-test.js

# Stress test (find limits)
k6 run k6-stress-test.js

# Spike test (sudden surges)
k6 run k6-spike-test.js
```

### Using Test Runner
```powershell
# From project root
.\run-comprehensive-tests.ps1 -All
```

## Configuration

Tests target `http://localhost:8082` by default. To change:

```bash
k6 run -e BASE_URL=http://your-server:port k6-smoke-test.js
```

## Thresholds

All tests enforce these performance criteria:
- P95 response time < 1000ms
- P99 response time < 2000ms
- Error rate < 1%

## Verification Scripts

- `verify-database.ps1` - Check InfluxDB data ingestion
- `verify-database-clean.ps1` - Clean up test data

## Output

Test results are saved to `../test-reports/` (git-ignored):
- `smoke-test-summary.json`
- `load-test-summary.json`
- `stress-test-summary.json`
- `spike-test-summary.json`

## Troubleshooting

**k6 not found:**
- Install k6 using instructions above
- Or download k6.exe to project root (git-ignored)

**Connection refused:**
- Ensure backend is running: `docker ps | grep defenddos-backend`
- Check backend health: `curl http://localhost:8082/actuator/health`

**High failure rate:**
- Check rate limits in `RateLimitInterceptor.java`
- Verify ML service is healthy: `docker logs defenddos-ml-service`
- Check Redis cache: `docker exec -it defenddos-redis redis-cli ping`

## Documentation

- [COMPREHENSIVE_TESTING_GUIDE.md](../COMPREHENSIVE_TESTING_GUIDE.md) - Complete testing strategy
- [TESTING_QUICK_START.md](../TESTING_QUICK_START.md) - Quick start guide
