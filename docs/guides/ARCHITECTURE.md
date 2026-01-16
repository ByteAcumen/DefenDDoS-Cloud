# 🏗️ DefenDDoS Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (User)                           │
│                     http://localhost:3000                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                              │
│                  (defenddos-frontend)                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Enhanced Dashboard (page-enhanced.tsx)                     │ │
│  │  - Smooth Scroll Progress Bar                             │ │
│  │  - Time Range Selector (1h, 6h, 24h, 7d)                 │ │
│  │  - 4 Animated KPI Cards                                   │ │
│  │  - Real-time Traffic Chart                                │ │
│  │  - ML Statistics Panel                                    │ │
│  │  - Top Threats Display                                    │ │
│  │  - System Health Monitor                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│                               ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ React Query Hooks (useDefenDDoS.ts)                       │ │
│  │  - useDetailedStats (30s polling)                         │ │
│  │  - useRealtimeStats (10s polling)                         │ │
│  │  - useAttackAnalysis                                      │ │
│  │  - useAllTrafficData                                      │ │
│  │  - useAllMLPredictions                                    │ │
│  │  - useAllDetectionEvents                                  │ │
│  │  - useDatabaseStats                                       │ │
│  │  - useEnhancedDashboardData                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│                               ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ API Service Layer (api.ts)                                │ │
│  │  - statisticsApi { getDetailedStats, ... }               │ │
│  │  - dataApi { getAllTrafficData, ... }                     │ │
│  │  - trafficApi { getTrafficSummary, ... }                 │ │
│  │  - mitigationApi { getBlockedIps, ... }                  │ │
│  │  - securityApi { getDashboard, ... }                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│                               ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Next.js API Proxy Routes (app/api/)                       │ │
│  │  - /api/statistics/detailed                               │ │
│  │  - /api/statistics/realtime                               │ │
│  │  - /api/statistics/attack-analysis                        │ │
│  │  - /api/data/traffic/all                                  │ │
│  │  - /api/data/ml-predictions/all                           │ │
│  │  - /api/data/detection-events/all                         │ │
│  │  - /api/data/statistics                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SPRING BOOT BACKEND                            │
│                  http://localhost:8082                           │
│                   (backend-service)                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ REST Controllers                                           │ │
│  │  - TrafficController      (/api/v1/traffic/*)             │ │
│  │  - MitigationController   (/api/v1/mitigation/*)          │ │
│  │  - SecurityController     (/api/v1/security/*)            │ │
│  │  - StatisticsController   (/api/v1/statistics/*)          │ │
│  │  - DataController         (/api/v1/data/*)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│                               ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Service Layer                                              │ │
│  │  - TrafficAnalysisService                                 │ │
│  │  - MitigationService                                      │ │
│  │  - SecurityService                                        │ │
│  │  - MachineLearningService                                 │ │
│  │  - DataRetrievalService                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│                    ┌──────────┴──────────┐                       │
│                    ▼                     ▼                        │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│  │  InfluxDB Repository    │  │  ML Service Client           │  │
│  │  - Traffic data         │  │  - HTTP client to ML service │  │
│  │  - Time-series queries  │  │  - Predictions               │  │
│  │  - Aggregations         │  │  - Model health              │  │
│  └─────────────────────────┘  └──────────────────────────────┘  │
└────────────────┬────────────────────────────┬────────────────────┘
                 │                            │
                 ▼                            ▼
┌─────────────────────────────┐  ┌──────────────────────────────┐
│      INFLUXDB DATABASE      │  │      ML SERVICE (Flask)      │
│   http://localhost:8086     │  │   http://localhost:8000      │
│                             │  │                              │
│  Buckets:                   │  │  Models:                     │
│  - traffic_data             │  │  - LSTM Autoencoder          │
│  - ml_predictions           │  │  - Random Forest             │
│  - detection_events         │  │  - Scaler                    │
│  - blocked_ips              │  │  - Feature Selector          │
│                             │  │                              │
│  Measurements:              │  │  Endpoints:                  │
│  - network_traffic          │  │  - POST /predict             │
│  - attack_detection         │  │  - GET  /health              │
│  - ip_blocking              │  │  - GET  /model-info          │
└─────────────────────────────┘  └──────────────────────────────┘
```

---

## Data Flow: Traffic Ingestion & Detection

```
1. TRAFFIC INGESTION
   ┌──────────────┐
   │ Network Data │ (External source or test script)
   └──────┬───────┘
          │ POST /api/v1/traffic/ingest
          ▼
   ┌──────────────────────────┐
   │ TrafficController        │
   │ - Validates data         │
   │ - Extracts features      │
   └──────┬───────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ TrafficAnalysisService   │
   │ - Stores in InfluxDB     │
   │ - Triggers ML prediction │
   └──────┬───────────────────┘
          │
          ├─────────────────────────┐
          ▼                         ▼
   ┌──────────────┐       ┌──────────────────┐
   │  InfluxDB    │       │  ML Service      │
   │  Store data  │       │  POST /predict   │
   └──────────────┘       └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ ML Models        │
                          │ - LSTM detection │
                          │ - RF prediction  │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Prediction Result│
                          │ {                │
                          │   attack: true,  │
                          │   confidence: 0.95│
                          │ }                │
                          └────────┬─────────┘
                                   │
          ┌────────────────────────┘
          ▼
   ┌──────────────────────────┐
   │ SecurityService          │
   │ - Analyzes prediction    │
   │ - Determines severity    │
   │ - Triggers mitigation    │
   └──────┬───────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ MitigationService        │
   │ - Blocks IP if critical  │
   │ - Logs event             │
   │ - Updates statistics     │
   └──────────────────────────┘

2. DASHBOARD DISPLAY
   ┌──────────────────────┐
   │ Enhanced Dashboard   │
   │ - Mounts             │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ useEnhancedDashboard │
   │ Data Hook            │
   │ - Starts polling     │
   └──────┬───────────────┘
          │
          ├─────────────────────┐
          │ Every 30 seconds:   │
          ▼                     ▼
   ┌──────────────┐     ┌──────────────┐
   │ GET /api/    │     │ GET /api/    │
   │ statistics/  │     │ data/traffic/│
   │ detailed     │     │ all          │
   └──────┬───────┘     └──────┬───────┘
          │                    │
          ▼                    ▼
   ┌──────────────────────────────────┐
   │ Spring Boot Backend              │
   │ - Queries InfluxDB               │
   │ - Aggregates data                │
   │ - Returns JSON                   │
   └──────┬───────────────────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ React Query Cache    │
   │ - Updates state      │
   │ - Triggers re-render │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Dashboard UI         │
   │ - Animates cards     │
   │ - Updates charts     │
   │ - Shows alerts       │
   └──────────────────────┘
```

---

## Component Hierarchy

```
App (layout.tsx)
│
├─ Sidebar Navigation
│  ├─ Dashboard Link
│  ├─ Traffic Link
│  ├─ Blocked IPs Link
│  ├─ Threat Detection Link
│  ├─ System Link
│  └─ Analytics Link
│
└─ Dashboard Page (page-enhanced.tsx)
   │
   ├─ ScrollProgress (Animated bar at top)
   │
   ├─ PageHeader
   │  ├─ Title
   │  ├─ Description
   │  └─ TimeRangeSelector
   │     ├─ Button: 1h
   │     ├─ Button: 6h
   │     ├─ Button: 24h
   │     └─ Button: 7d
   │
   ├─ KPI Cards Grid (4 cards)
   │  ├─ Card: Total Traffic
   │  │  ├─ Icon (animated)
   │  │  ├─ Value (real data)
   │  │  ├─ Label
   │  │  └─ Trend indicator
   │  │
   │  ├─ Card: Threats Detected
   │  ├─ Card: Blocked IPs
   │  └─ Card: System Health
   │
   ├─ Traffic Chart Panel
   │  ├─ Chart Title
   │  ├─ Chart Legend
   │  └─ Recharts LineChart
   │     ├─ Area: Total Traffic (gradient)
   │     ├─ Line: Attack Traffic (red)
   │     └─ Tooltip (custom)
   │
   ├─ ML Statistics Panel
   │  ├─ Panel Header
   │  ├─ Stats Grid
   │  │  ├─ Total Predictions
   │  │  ├─ Attack Predictions
   │  │  ├─ Normal Predictions
   │  │  └─ Average Confidence
   │  └─ Confidence Bar (animated)
   │
   ├─ Top Threats Panel
   │  ├─ Panel Header
   │  └─ Threats List
   │     └─ ThreatItem (x5)
   │        ├─ Source IP
   │        ├─ Severity Badge
   │        ├─ Packet Count
   │        └─ Timestamp
   │
   ├─ System Health Panel
   │  ├─ Panel Header
   │  └─ Health Items
   │     ├─ Backend Status (✅/❌)
   │     ├─ ML Service Status
   │     ├─ Database Status
   │     └─ Mitigation Status
   │
   └─ Quick Actions Grid
      ├─ Action: View All Traffic
      ├─ Action: Manage Blocked IPs
      ├─ Action: Threat Analysis
      └─ Action: System Settings
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                    React Query Cache                     │
│                                                           │
│  queries: {                                              │
│    ['detailed-stats', '-1h']: {                         │
│      data: { totalPackets, totalBytes, ... }           │
│      status: 'success',                                 │
│      fetchStatus: 'idle',                               │
│      staleTime: 30000,                                  │
│      cacheTime: 300000                                  │
│    },                                                    │
│    ['realtime-stats']: { ... },                         │
│    ['traffic-data', '-1h']: { ... },                    │
│    ...                                                   │
│  }                                                       │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ Automatic Updates
                    │ - Polling intervals
                    │ - Window focus refetch
                    │ - Manual invalidation
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Component State (useState)                  │
│                                                           │
│  - timeRange: string ('-1h', '-6h', '-24h', '-7d')     │
│  - selectedThreat: ThreatDetails | null                 │
│  - isModalOpen: boolean                                 │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ Triggers re-render
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│                                                           │
│  - Charts update with new data                          │
│  - Counters animate to new values                       │
│  - Badges change colors based on status                 │
│  - Loading states show during fetch                     │
│  - Error boundaries catch failures                      │
└─────────────────────────────────────────────────────────┘
```

---

## Animation Timeline

```
Page Load:
  0ms   │ Component mounts
        │
  50ms  │ Scroll progress bar: opacity 0 → 1
        │
  100ms │ KPI Card 1: slide up + fade in
        │
  200ms │ KPI Card 2: slide up + fade in
        │
  300ms │ KPI Card 3: slide up + fade in
        │
  400ms │ KPI Card 4: slide up + fade in
        │
  500ms │ Traffic chart: fade in + scale
        │
  600ms │ ML stats panel: slide from right
        │
  700ms │ Top threats: stagger each item (100ms delay)
        │
  800ms │ System health: pulse effect
        │
  900ms │ Quick actions: stagger each card
        │
  1000ms│ All animations complete
        │
        ▼

Scroll Events:
  - Progress bar updates on scroll (spring physics)
  - Elements fade in as they enter viewport (IntersectionObserver)
  - Smooth scroll to sections (scrollIntoView with behavior: 'smooth')

Data Updates (Every 30s):
  - Charts: smooth transition to new data points
  - Counters: count up animation to new value
  - Badges: color transition based on new status
  - Loading spinner during fetch
```

---

## API Endpoints Map

```
Frontend Proxy                Backend Endpoint              Data Source
─────────────────────────────────────────────────────────────────────────
/api/statistics/detailed  →   /api/v1/statistics/detailed  →  InfluxDB
/api/statistics/realtime  →   /api/v1/statistics/realtime  →  InfluxDB
/api/statistics/attack-   →   /api/v1/statistics/attack-   →  InfluxDB
  analysis                      analysis

/api/data/traffic/all     →   /api/v1/data/traffic/all     →  InfluxDB
/api/data/ml-predictions  →   /api/v1/data/ml-predictions  →  InfluxDB
  /all                          /all
/api/data/detection-      →   /api/v1/data/detection-      →  InfluxDB
  events/all                    events/all
/api/data/statistics      →   /api/v1/data/statistics      →  InfluxDB

(Direct to backend - no proxy needed)
                              /api/v1/traffic/summary      →  InfluxDB
                              /api/v1/traffic/ingest       →  InfluxDB
                              /api/v1/mitigation/blocked   →  InfluxDB
                              /api/v1/mitigation/stats     →  InfluxDB
                              /api/v1/security/dashboard   →  InfluxDB
                              /api/v1/security/status      →  InfluxDB
```

---

## Error Handling Strategy

```
1. API Level (api.ts)
   ┌─────────────────────────┐
   │ Axios Interceptor       │
   │ - Catches HTTP errors   │
   │ - Logs to console       │
   │ - Transforms error msg  │
   └──────┬──────────────────┘
          │ Throws error
          ▼

2. Hook Level (useDefenDDoS.ts)
   ┌─────────────────────────┐
   │ React Query             │
   │ - Catches errors        │
   │ - Retries 3x            │
   │ - Returns error state   │
   └──────┬──────────────────┘
          │ Sets error state
          ▼

3. Component Level (page-enhanced.tsx)
   ┌─────────────────────────┐
   │ Error Boundary          │
   │ - Shows error message   │
   │ - Offers retry button   │
   │ - Logs error details    │
   └──────┬──────────────────┘
          │ Displays to user
          ▼

4. User Sees:
   ┌─────────────────────────┐
   │ "⚠️ Error loading data" │
   │ [Retry Button]          │
   │ [View Details]          │
   └─────────────────────────┘
```

---

## Performance Optimizations

```
1. React Query
   - Automatic caching (5 min)
   - Background refetching
   - Stale-while-revalidate
   - Request deduplication

2. Next.js
   - Server-side rendering
   - Automatic code splitting
   - Image optimization
   - API route caching

3. React
   - useMemo for expensive calculations
   - useCallback for event handlers
   - React.memo for pure components
   - Lazy loading for modals

4. Animations
   - CSS transforms (GPU accelerated)
   - Framer Motion spring physics
   - RequestAnimationFrame for smooth 60fps
   - Debounced scroll handlers

5. Data Fetching
   - Smart polling intervals
   - Conditional queries
   - Pagination for large lists
   - Aggregated endpoints
```

---

## Security Considerations

```
1. CORS Protection
   - Frontend proxy routes prevent direct backend access
   - Backend only accepts requests from localhost:3000
   - API keys stored in environment variables

2. Input Validation
   - Backend validates all traffic data
   - IP address format checking
   - Rate limiting on ingestion endpoint

3. SQL Injection Prevention
   - InfluxDB uses parameterized queries
   - No string concatenation in queries

4. XSS Prevention
   - React auto-escapes output
   - No dangerouslySetInnerHTML
   - Content Security Policy headers

5. Authentication (Future)
   - JWT tokens
   - Role-based access control
   - Session management
```

---

## Deployment Checklist

```
Backend:
□ Configure InfluxDB connection
□ Set environment variables
□ Package JAR file
□ Configure reverse proxy (nginx)
□ Set up SSL/TLS
□ Enable production logging
□ Configure CORS for production domain

ML Service:
□ Load trained models
□ Set up Python virtual environment
□ Install dependencies
□ Configure model paths
□ Set up monitoring
□ Enable error logging

Frontend:
□ Update API base URL for production
□ Build production bundle (npm run build)
□ Configure environment variables
□ Set up CDN for static assets
□ Enable gzip compression
□ Configure CSP headers
□ Set up analytics

Infrastructure:
□ Set up firewall rules
□ Configure load balancer
□ Set up monitoring (Prometheus/Grafana)
□ Configure backups
□ Set up alerting
□ Document runbooks
```

This architecture supports:
- ✅ Real-time data updates
- ✅ Scalable data ingestion
- ✅ ML-powered threat detection
- ✅ Responsive UI with smooth animations
- ✅ Comprehensive error handling
- ✅ Performance optimization
- ✅ Future extensibility
