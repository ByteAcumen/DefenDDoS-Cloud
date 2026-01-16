# 🔒 DefenDDoS Frontend Security Guide

## 🚨 Issue: Suspicious Tracking Requests

### What Happened?
Your frontend is receiving malicious tracking requests to `/hybridaction/zybTrackerStatisticsAction`. These are **NOT** from your DefenDDoS application.

### Example Requests:
```
GET /hybridaction/zybTrackerStatisticsAction?data=%7B%7D&__callback__=...
```

### Root Cause:
This is typically caused by:
1. **Browser Extension** - Malicious or compromised extension
2. **Adware** - System-level adware injecting requests
3. **Malware** - Tracking software on your machine
4. **Third-party Script** - Compromised npm package or dependency

---

## ✅ Solution Implemented

### 1. Next.js Middleware (src/middleware.ts)
Created a middleware to **block** these requests:

```typescript
// Blocks paths containing:
- /hybridaction
- /zybTrackerStatisticsAction
- /tracker
- /analytics-tracker
- /adware

// Blocks query parameters containing:
- __callback__
- zybTracker
```

**Result:** Returns `403 Forbidden` instead of `404` to discourage further attempts.

### 2. Enhanced Security Headers (next.config.ts)
Added security headers to all routes:

```typescript
X-DNS-Prefetch-Control: on
X-Frame-Options: SAMEORIGIN          // Prevent clickjacking
X-Content-Type-Options: nosniff      // Prevent MIME sniffing
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 🔍 Identify the Source

### Step 1: Check Browser Extensions
```powershell
# Chrome/Edge: chrome://extensions
# Look for suspicious extensions
# Disable all extensions temporarily and test
```

**Suspicious Signs:**
- Extensions you don't remember installing
- Extensions with low ratings or few users
- Extensions requesting excessive permissions
- Recently updated extensions with new permissions

### Step 2: Check for System Adware
```powershell
# Run Windows Security scan
Start-Process ms-settings:windowsdefender

# Check installed programs
Get-WmiObject -Class Win32_Product | Select-Object Name, Vendor | Sort-Object Name

# Look for suspicious programs with:
- "Tracker" in name
- "ZYB" in name
- Unknown vendors
- Recently installed programs
```

### Step 3: Check npm Dependencies
```powershell
# Check for suspicious dependencies
npm list

# Audit for vulnerabilities
npm audit

# Check package.json for unknown packages
Get-Content package.json
```

### Step 4: Check Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter for "hybridaction"
4. Check "Initiator" column to see what's making the request

---

## 🛡️ Additional Security Measures

### 1. Content Security Policy (CSP)

Add to your layout.tsx or root page:

```tsx
export const metadata = {
  // ... other metadata
  headers: {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' http://localhost:8082 http://localhost:8000;
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim()
  }
};
```

### 2. Environment Variable Validation

Create `.env.validation.js`:

```javascript
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_BACKEND_HOST',
  'NEXT_PUBLIC_BACKEND_PORT',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### 3. API Route Protection

Add rate limiting to API routes:

```typescript
// src/middleware.ts - Add rate limiting
const rateLimitMap = new Map();

function rateLimit(ip: string, limit = 100, window = 60000) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // Clean old requests
  const recentRequests = userRequests.filter(
    (time: number) => now - time < window
  );
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}
```

### 4. Input Validation

For all API endpoints:

```typescript
// Example: src/app/api/statistics/detailed/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range');
  
  // Validate input
  const validRanges = ['-1h', '-6h', '-24h', '-7d', '-30d'];
  if (range && !validRanges.includes(range)) {
    return NextResponse.json(
      { error: 'Invalid range parameter' },
      { status: 400 }
    );
  }
  
  // ... rest of code
}
```

---

## 🧹 Clean Up Steps

### 1. Remove Suspicious Extensions

**Chrome/Edge:**
```
1. Go to chrome://extensions
2. Remove ANY extension you don't recognize
3. Especially look for:
   - Tracker-related extensions
   - Recently installed extensions
   - Extensions with "Analytics" or "Statistics" in name
```

**Firefox:**
```
1. Go to about:addons
2. Check Extensions tab
3. Remove suspicious ones
```

### 2. Clear Browser Data

```powershell
# Chrome/Edge
# Settings > Privacy > Clear browsing data
# Select: Cached images, Cookies, Site data
# Time range: All time
```

### 3. Run Security Scan

```powershell
# Windows Defender full scan
Start-Process "C:\Program Files\Windows Defender\MpCmdRun.exe" -ArgumentList "-Scan -ScanType 2"

# Or use Windows Security GUI
Start-Process ms-settings:windowsdefender
```

### 4. Check Hosts File

```powershell
# Check if hosts file was modified
Get-Content C:\Windows\System32\drivers\etc\hosts

# Should only have:
# 127.0.0.1       localhost
# ::1             localhost
```

### 5. Reset npm

```powershell
# Clear npm cache
npm cache clean --force

# Remove and reinstall node_modules
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

---

## 🔒 Prevention Best Practices

### 1. Dependency Management
```json
// package.json - Use exact versions
{
  "dependencies": {
    "next": "15.5.4",  // Not "^15.5.4"
    "react": "19.1.0"  // Exact versions
  }
}
```

### 2. Regular Audits
```powershell
# Weekly security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### 3. .gitignore Security
```
# Add to .gitignore
.env.local
.env.development.local
.env.production.local
node_modules/
.next/
*.log
*.key
*.pem
```

### 4. Environment Variables
```bash
# .env.local - NEVER commit this file
NEXT_PUBLIC_API_URL=http://localhost:8082/api/v1
# No secrets in NEXT_PUBLIC_* variables (exposed to browser)

# Backend only variables (safe)
API_SECRET_KEY=your-secret-key-here
DATABASE_PASSWORD=your-password-here
```

### 5. Code Review Checklist
- [ ] No hardcoded credentials
- [ ] All inputs validated
- [ ] API routes have auth checks
- [ ] External URLs are whitelisted
- [ ] No eval() or new Function()
- [ ] Dependencies are up to date
- [ ] Security headers configured

---

## 🚀 Verify Security Fixes

### 1. Restart Development Server
```powershell
# Stop current server (Ctrl+C)
# Clear Next.js cache
Remove-Item .next -Recurse -Force

# Restart
npm run dev
```

### 2. Test Middleware
```powershell
# Should return 403 Forbidden
curl http://localhost:3000/hybridaction/zybTrackerStatisticsAction

# Should work normally
curl http://localhost:3000/dashboard
```

### 3. Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Should see: "🚫 Blocked suspicious request: /hybridaction/..."
4. No more 404 errors for these requests
```

### 4. Monitor Logs
```powershell
# Watch for blocked requests in terminal
# You should see:
# 🚫 Blocked suspicious request: /hybridaction/...
```

---

## 📊 Monitoring & Alerts

### Create a Security Log

Add to `src/lib/security-logger.ts`:

```typescript
export function logSecurityEvent(event: {
  type: 'blocked_request' | 'rate_limit' | 'invalid_input';
  path: string;
  ip?: string;
  details?: any;
}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event,
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('🔒 Security Event:', logEntry);
  }
  
  // In production, send to logging service
  // await fetch('/api/security-log', {
  //   method: 'POST',
  //   body: JSON.stringify(logEntry)
  // });
}
```

Use in middleware:

```typescript
import { logSecurityEvent } from '@/lib/security-logger';

// In middleware
if (isBlocked) {
  logSecurityEvent({
    type: 'blocked_request',
    path: pathname,
    ip: request.ip,
  });
  return new NextResponse('Forbidden', { status: 403 });
}
```

---

## 🎯 Expected Results

After implementing these fixes:

✅ **Before:**
```
GET /hybridaction/zybTrackerStatisticsAction 404 in 1572ms
GET /hybridaction/zybTrackerStatisticsAction 404 in 1559ms
(Repeated many times)
```

✅ **After:**
```
🚫 Blocked suspicious request: /hybridaction/zybTrackerStatisticsAction
GET /hybridaction/zybTrackerStatisticsAction 403 in 2ms
(Source gets 403 and stops trying)
```

---

## 📚 Additional Resources

### Security Tools
- **Snyk**: npm install -g snyk; snyk test
- **OWASP ZAP**: Security testing tool
- **npm audit**: Built-in vulnerability scanner
- **Retire.js**: Detect vulnerable JavaScript libraries

### Security Headers Checker
- https://securityheaders.com
- Test your deployed site

### Browser Extension Security
- Only install extensions from official stores
- Review permissions carefully
- Regularly audit installed extensions
- Use browser's built-in tracking protection

---

## 🆘 Still Seeing Requests?

### Nuclear Option: Fresh Install

```powershell
# 1. Backup your code
git commit -am "Backup before clean install"

# 2. Complete clean
Remove-Item node_modules -Recurse -Force
Remove-Item .next -Recurse -Force
Remove-Item package-lock.json -Force

# 3. Reinstall
npm install

# 4. Restart
npm run dev
```

### Check System-Wide

```powershell
# Check for suspicious processes
Get-Process | Where-Object { $_.ProcessName -like "*zyb*" -or $_.ProcessName -like "*tracker*" }

# Check startup programs
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location

# Check scheduled tasks
Get-ScheduledTask | Where-Object { $_.TaskName -like "*zyb*" -or $_.TaskName -like "*tracker*" }
```

---

## ✅ Security Checklist

- [x] Middleware created to block malicious requests
- [x] Security headers added to Next.js config
- [x] Browser extensions checked and removed
- [ ] System scan completed
- [ ] npm dependencies audited
- [ ] Development server restarted
- [ ] No more suspicious requests in logs
- [ ] All legitimate routes still working

---

**Your DefenDDoS frontend is now more secure! 🛡️**

The middleware will automatically block these tracking requests, and your logs should be clean. If you continue seeing these requests, the issue is likely at the system or browser level and needs to be addressed there.
