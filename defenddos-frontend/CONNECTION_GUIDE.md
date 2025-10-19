# ⚡ Frontend Connection Setup Guide

## 🎯 Quick Connection Check

Run this command to verify everything is connected:
```powershell
.\START_HERE.ps1
# Choose [3] Test All API Endpoints
```

---

## 🔧 Configuration Files

### 1. Environment Variables (`.env.local`)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8082/api/v1

# Environment
NEXT_PUBLIC_ENV=development

# Backend Configuration
NEXT_PUBLIC_BACKEND_HOST=localhost
NEXT_PUBLIC_BACKEND_PORT=8082

# ML Service
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000
```

### 2. Next.js Config (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  // Improved settings for API proxying
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8082/api/v1/:path*',
      },
    ];
  },
  // CORS headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};
```

---

## 🌐 Connection Architecture

```
Browser
   │
   │ HTTP Request
   ▼
Next.js Frontend (:3000)
   │
   ├─► Next.js API Routes (/api/*)
   │   │
   │   │ Proxy Request
   │   ▼
   │   Spring Boot Backend (:8082)
   │   │
   │   ├─► InfluxDB (:8086)
   │   │
   │   └─► ML Service (:8000)
   │
   └─► Direct Fetch (Alternative)
       │
       ▼
       Spring Boot Backend (:8082)
```

---

## ✅ Connection Checklist

### Backend Services
- [ ] **Spring Boot Backend** running on port 8082
  ```powershell
  cd backend-service
  .\mvnw.cmd spring-boot:run
  ```
  - Check: http://localhost:8082/api/v1/../actuator/health

- [ ] **ML Service** running on port 8000
  ```powershell
  cd backend-service\ml-service
  python main.py
  ```
  - Check: http://localhost:8000/health

- [ ] **InfluxDB** running on port 8086
  - Usually auto-starts with backend
  - Check backend logs for connection

### Frontend Service
- [ ] **Next.js Frontend** running on port 3000
  ```powershell
  cd defenddos-frontend
  npm run dev
  ```
  - Check: http://localhost:3000

### API Proxy Routes
- [ ] All 7 proxy routes created and working
  ```powershell
  .\test-api-endpoints.ps1
  ```

---

## 🔍 Testing Connection

### Method 1: Automated Testing (Recommended)
```powershell
# Test all endpoints
.\test-api-endpoints.ps1

# Expected output:
# ✅ Testing Detailed Statistics... Success
# ✅ Testing Realtime Statistics... Success
# ✅ Testing All Traffic Data... Success
# etc.
```

### Method 2: Manual Testing
```powershell
# Test backend health
curl http://localhost:8082/api/v1/../actuator/health

# Test specific endpoint
curl http://localhost:8082/api/v1/traffic/summary?range=-1h

# Test frontend proxy
curl http://localhost:3000/api/statistics/detailed?range=-1h
```

### Method 3: Browser DevTools
1. Open http://localhost:3000/dashboard
2. Press F12 to open DevTools
3. Go to Network tab
4. Refresh page
5. Check for:
   - ✅ Status 200 for API calls
   - ❌ Status 404, 500, or CORS errors

---

## 🐛 Troubleshooting Connection Issues

### Issue 1: CORS Errors
**Symptoms:**
- Browser console shows CORS errors
- API calls fail with status 0

**Solution:**
```powershell
# Our Next.js API proxy routes solve this!
# Make sure you're using the enhanced dashboard
.\switch-to-enhanced-dashboard.ps1
```

**Why it works:**
- Frontend makes requests to `/api/*` (same origin)
- Next.js API routes proxy to backend
- No CORS issues because browser doesn't see cross-origin request

### Issue 2: Backend Not Responding
**Symptoms:**
- API calls timeout
- 504 Gateway Timeout errors
- Network errors in console

**Solution:**
```powershell
# 1. Check if backend is running
curl http://localhost:8082/api/v1/../actuator/health

# 2. If not, start it
cd backend-service
.\mvnw.cmd spring-boot:run

# 3. Wait 15-20 seconds for full startup
```

### Issue 3: No Data Showing
**Symptoms:**
- Dashboard loads but shows zero/empty data
- API returns empty arrays

**Solution:**
```powershell
# Generate test data
.\generate-test-traffic.ps1

# Verify data was created
curl http://localhost:8082/api/v1/traffic/summary?range=-1h
```

### Issue 4: Port Already in Use
**Symptoms:**
- Error: "Port 3000/8082/8000 already in use"

**Solution:**
```powershell
# Find and kill process on port 3000
netstat -ano | findstr "3000"
taskkill /PID <PID> /F

# Or use our cleanup script
cd backend-service
.\cleanup-project.ps1
```

### Issue 5: API Routes Not Found (404)
**Symptoms:**
- 404 errors for `/api/statistics/*` or `/api/data/*`

**Solution:**
```powershell
# Verify API routes exist
dir src\app\api\statistics\
dir src\app\api\data\

# Restart frontend (hot reload might have failed)
# In frontend terminal, press Ctrl+C
npm run dev
```

---

## 🔗 API Route Mapping

### Frontend → Backend Mapping

| Frontend URL | Backend URL | Purpose |
|--------------|-------------|---------|
| `/api/statistics/detailed` | `/api/v1/statistics/detailed` | Comprehensive stats |
| `/api/statistics/realtime` | `/api/v1/statistics/realtime` | Real-time metrics |
| `/api/statistics/attack-analysis` | `/api/v1/statistics/attack-analysis` | Attack analysis |
| `/api/data/traffic/all` | `/api/v1/data/traffic/all` | All traffic data |
| `/api/data/ml-predictions/all` | `/api/v1/data/ml-predictions/all` | ML predictions |
| `/api/data/detection-events/all` | `/api/v1/data/detection-events/all` | Detection events |
| `/api/data/statistics` | `/api/v1/data/statistics` | DB statistics |

### How It Works

1. **Browser makes request:**
   ```javascript
   fetch('/api/statistics/detailed?range=-1h')
   ```

2. **Next.js receives request** at `/api/statistics/detailed/route.ts`

3. **Route proxies to backend:**
   ```javascript
   const response = await fetch(
     `http://localhost:8082/api/v1/statistics/detailed?range=-1h`
   );
   ```

4. **Backend processes** and returns data

5. **Next.js route forwards** response to browser

6. **React Query caches** and provides to components

---

## 🔐 Security Considerations

### Current Setup (Development)
- ✅ CORS handled by Next.js proxy
- ✅ Backend only accepts localhost
- ✅ No authentication required
- ✅ API keys not exposed to browser

### Production Recommendations
- 🔒 Add JWT authentication
- 🔒 Enable HTTPS/TLS
- 🔒 Configure proper CORS origins
- 🔒 Add rate limiting
- 🔒 Use environment-specific API URLs
- 🔒 Enable API key authentication

---

## 📊 Connection Performance

### Expected Response Times
- **Statistics API**: < 200ms
- **Traffic Data**: < 500ms
- **ML Predictions**: < 300ms
- **Detection Events**: < 400ms
- **Database Stats**: < 150ms

### Optimization Tips
1. **Use React Query caching** (already implemented)
   - Detailed stats: 30s stale time
   - Realtime stats: 10s stale time
   - Traffic data: 30s stale time

2. **Implement pagination** for large datasets
   ```javascript
   const { data } = useQuery({
     queryKey: ['traffic', page],
     queryFn: () => fetchTraffic({ page, limit: 50 })
   });
   ```

3. **Use time range filters**
   ```javascript
   // Fetch only needed data
   const range = '-1h'; // Instead of all data
   ```

4. **Enable HTTP compression** (backend)
   ```yaml
   server:
     compression:
       enabled: true
   ```

---

## 🧪 Verify Connection Step-by-Step

### Step 1: Backend Health
```powershell
curl http://localhost:8082/api/v1/../actuator/health
```
**Expected:**
```json
{
  "status": "UP",
  "components": {
    "influxDb": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

### Step 2: ML Service Health
```powershell
curl http://localhost:8000/health
```
**Expected:**
```json
{
  "status": "healthy",
  "models_loaded": true
}
```

### Step 3: Frontend API Route
```powershell
curl http://localhost:3000/api/statistics/realtime
```
**Expected:**
```json
{
  "success": true,
  "data": {
    "packetsPerSecond": 1234,
    "bytesPerSecond": 567890,
    ...
  }
}
```

### Step 4: Dashboard Display
1. Open: http://localhost:3000/dashboard
2. Check Network tab (F12)
3. Verify API calls returning 200
4. Verify data displaying in UI

---

## 🚀 Quick Fix Commands

### Restart Everything
```powershell
# Stop all services (Ctrl+C in terminals)

# Start backend
cd backend-service
.\mvnw.cmd spring-boot:run

# New terminal - Start ML service
cd backend-service\ml-service
python main.py

# New terminal - Start frontend
cd defenddos-frontend
npm run dev
```

### Clear Caches
```powershell
# Clear Next.js cache
Remove-Item .next -Recurse -Force

# Clear npm cache (if needed)
npm cache clean --force

# Restart frontend
npm run dev
```

### Reset to Working State
```powershell
# Restore original dashboard
.\restore-original-dashboard.ps1

# Switch to enhanced dashboard
.\switch-to-enhanced-dashboard.ps1

# Test connection
.\test-api-endpoints.ps1
```

---

## ✨ Verification Checklist

Before considering connection complete:

### Services Running
- [ ] Backend on port 8082 ✅
- [ ] ML Service on port 8000 ✅
- [ ] Frontend on port 3000 ✅

### API Endpoints Working
- [ ] `/api/statistics/detailed` ✅
- [ ] `/api/statistics/realtime` ✅
- [ ] `/api/statistics/attack-analysis` ✅
- [ ] `/api/data/traffic/all` ✅
- [ ] `/api/data/ml-predictions/all` ✅
- [ ] `/api/data/detection-events/all` ✅
- [ ] `/api/data/statistics` ✅

### Dashboard Features
- [ ] KPI cards show real data ✅
- [ ] Traffic chart displays data ✅
- [ ] ML statistics visible ✅
- [ ] Top threats list populated ✅
- [ ] Auto-refresh working ✅
- [ ] Time range selector working ✅
- [ ] No console errors ✅

### Data Flow
- [ ] Test data generated ✅
- [ ] Backend stores in InfluxDB ✅
- [ ] ML service predicts threats ✅
- [ ] Frontend fetches via proxy ✅
- [ ] React Query caches data ✅
- [ ] UI displays correctly ✅

---

## 🎉 Success!

If all checks pass, your frontend is **properly connected** to the backend! 🎊

**Next steps:**
1. Generate more test data: `.\generate-test-traffic.ps1`
2. Monitor real-time updates on dashboard
3. Test time range selector
4. Verify auto-refresh (every 30s)
5. Apply same improvements to other pages

---

**Need help?** Check:
- QUICK_REFERENCE.md - Quick fixes
- TESTING_COMPLETE_GUIDE.md - Detailed testing
- ARCHITECTURE.md - System design
