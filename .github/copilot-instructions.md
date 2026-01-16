# DefenDDoS-Cloud: AI Agent Instructions

## Project Overview
DefenDDoS-Cloud is a production-ready, ML-powered DDoS detection system with dual ML models (Random Forest 99.2% + LSTM), automatic mitigation, and real-time monitoring dashboard. **Three-tier architecture**: Spring Boot backend (8081), FastAPI ML service (8000), Next.js frontend (3000).

## Critical Architecture Patterns

### Multi-Service Communication Flow
```
Traffic → Backend (Java) → ML Service (Python) → InfluxDB (Time-Series)
             ↓                    ↓
      API Response        Attack Detection → Auto-Block (iptables)
```

**Key insight**: Backend uses **reactive WebClient** (not RestTemplate) for async ML calls. All ML predictions are non-blocking:
```java
// backend-service/src/main/java/com/defenddos/backend_service/service/MLDetectionService.java
mlServiceWebClient.post()
    .uri("/predict")
    .bodyValue(request)
    .retrieve()
    .bodyToMono(MLPredictionResponse.class)
    .timeout(Duration.ofSeconds(10))
    .retryWhen(Retry.backoff(3, Duration.ofSeconds(2)))
```

### Feature Engineering Contract
ML service expects **exactly 30 traffic features** (LSTM 77-dim, scaled down). Backend enriches raw traffic in `TrafficService.enrichTrafficData()`:
- Core features: `urg_flag_count`, `bwd_packet_length_mean`, `fwd_iat_total`
- Selected features loaded from `ml-service/models/selected_features.json`
- Missing features default to 0.0 (never null)

**DO NOT** change feature names without updating both backend DTOs and ML service models.

## Essential Commands

### Start Everything (Windows)
```powershell
# Automated startup
.\START_EVERYTHING.ps1

# Manual backend (Docker Compose - backend, ML, InfluxDB)
cd backend-service
docker-compose up -d
# Wait 30s for InfluxDB init

# Manual frontend
cd defenddos-frontend
npm run dev
```

### Testing Workflow
```powershell
# Comprehensive test suite (23 tests)
.\test-all-features.ps1 -All

# Backend only (Maven 55 Java files)
cd backend-service
.\mvnw test

# Frontend (Jest + Cypress)
cd defenddos-frontend
npm run test:ci
npm run test:e2e
```

### Attack Simulation
```powershell
.\SIMULATE_DDOS_ATTACK.ps1  # Generates 6 attack patterns to test ML models
```

## Project-Specific Conventions

### API Response Pattern
**ALL** backend endpoints return wrapped responses:
```java
// Standard: ApiResponse<T> wrapper
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String errorCode;  // For failures
}
```
Frontend expects this structure - **never** return raw objects from controllers.

### Rate Limiting (Bucket4j)
Configured at **60 requests/minute per IP** via `RateLimitInterceptor` (applies to `/api/v1/**`):
```java
// backend-service/src/main/java/com/defenddos/backend_service/config/RateLimitInterceptor.java
Bandwidth.builder()
    .capacity(60)
    .refillGreedy(60, Duration.ofMinutes(1))
```
**DO NOT** bypass this in controllers - it's enforced at WebConfig level.

### Frontend Data Fetching
Uses **React Query v5** (TanStack Query), not SWR or raw axios:
```typescript
// defenddos-frontend/src/hooks/useBackendApi.ts
const POLL_INTERVALS = {
  FAST: 30000,   // 30s for real-time metrics
  MEDIUM: 90000, // 90s for dashboard
  SLOW: 300000   // 5m for health checks
};
```
All hooks are centralized in `useBackendApi.ts` - **avoid** creating duplicate API calls in components.

## Critical Configuration

### InfluxDB Time-Series Queries
Backend uses **Flux language** (not InfluxQL) for queries:
```java
// Time range format: "-5m" (last 5 minutes)
String flux = String.format("""
    from(bucket: "%s")
    |> range(start: %s)
    |> filter(fn: (r) => r["_measurement"] == "traffic")
    """, bucket, timeRange);
```

### ML Service Thresholds
```python
# ml-service/main.py
CONFIDENCE_THRESHOLD = 0.70  # 70% for attack classification
LSTM_THRESHOLD = 0.80        # Reconstruction error threshold
```
These are **tuned** values from 500K+ training samples. Changes require model retraining.

### Auto-Mitigation Scripts
IP blocking uses **bash scripts** (even on Windows via WSL/Git Bash):
```properties
# backend-service/src/main/resources/application.properties
mitigation.auto-block.enabled=true
mitigation.block-script-path=scripts/block_ip.sh
mitigation.unblock-script-path=scripts/unblock_ip.sh
```
Scripts execute `iptables` commands - **requires** root/admin privileges.

## AWS WAF Integration (Optional)
When enabled, DefenDDoS syncs blocked IPs to AWS WAF IP sets every 60s:
```properties
aws.waf.enabled=false  # Set to true for production
aws.waf.ipset-id=arn:aws:wafv2:...
```
Requires AWS credentials in `.env` file (see `docs/guides/AWS_WAF_INTEGRATION_GUIDE.md`).

## File Organization Patterns

### Backend Structure
```
backend-service/src/main/java/com/defenddos/backend_service/
├── controller/     # 11 REST controllers (@RestController)
├── service/        # Business logic (@Service)
├── dto/            # Data Transfer Objects (API contracts)
├── model/          # Domain models (TrafficPoint, EnrichedTrafficPoint)
└── config/         # Spring configurations, interceptors, WebClient setup
```

### Frontend Structure
```
defenddos-frontend/src/
├── app/            # Next.js 15 App Router pages
├── components/     # Reusable React components
├── hooks/          # useBackendApi.ts (React Query hooks)
├── lib/            # defenddos-api.ts (axios client)
└── contexts/       # ThemeContext (dark/light mode)
```

## Common Pitfalls

1. **Port conflicts**: Backend uses 8081 (not 8080), ML uses 8000, frontend uses 3000
2. **Docker networking**: Services use `influxdb:8086`, `ml-service:8000` in docker-compose (not localhost)
3. **Feature extraction**: Backend calculates IAT (Inter-Arrival Time) from timestamps - ensure `Instant` fields are present
4. **CORS**: Configured for `localhost:3000` and `localhost:3001` - add new origins in `application.properties`
5. **InfluxDB token**: Default is `my-super-secret-token` in docker-compose - must match `application.properties`

## Testing Strategy

- **Unit tests**: Mock external services (InfluxDB, ML service) with Mockito
- **Integration tests**: Use TestContainers for InfluxDB, WireMock for ML service
- **E2E tests**: Cypress tests in `defenddos-frontend/cypress/e2e/`
- **Load tests**: k6 scripts in `backend-service/k6-tests/` (10K+ requests/s)

## Quick Reference

| Component | Port | Health Check | Logs |
|-----------|------|--------------|------|
| Backend | 8081 | `/actuator/health` | `backend-service/logs/` |
| ML Service | 8000 | `/health` | Docker logs |
| Frontend | 3000 | `http://localhost:3000` | Browser console |
| InfluxDB | 8086 | `http://localhost:8086` | Docker logs |

**Documentation Hub**: `docs/` folder contains 30+ guides. Start with `README.md` and `QUICK_REFERENCE.md`.
