import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Track blocked requests to prevent spam
const blockedRequestCache = new Map<string, { count: number; lastSeen: number }>();
const CACHE_DURATION = 60000; // 1 minute
const LOG_THRESHOLD = 5; // Only log every 5th request from same path

function logBlockedRequest(pathname: string) {
  const now = Date.now();
  const cached = blockedRequestCache.get(pathname);
  
  if (!cached || now - cached.lastSeen > CACHE_DURATION) {
    // First time or cache expired - log it
    blockedRequestCache.set(pathname, { count: 1, lastSeen: now });
    console.log(`🛡️ Security: Blocked suspicious request: ${pathname}`);
  } else {
    // Increment counter
    cached.count++;
    cached.lastSeen = now;
    
    // Only log periodically to avoid spam
    if (cached.count % LOG_THRESHOLD === 0) {
      console.log(`🛡️ Security: Blocked ${cached.count} attempts to: ${pathname}`);
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block known malicious/tracking endpoints
  const blockedPaths = [
    '/hybridaction',
    '/zybTrackerStatisticsAction',
    '/tracker',
    '/analytics-tracker',
    '/adware',
  ];

  // Check if path matches any blocked patterns
  const isBlocked = blockedPaths.some(blocked => 
    pathname.toLowerCase().includes(blocked.toLowerCase())
  );

  if (isBlocked) {
    logBlockedRequest(pathname);
    // Return 403 Forbidden instead of 404 to discourage further attempts
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Block requests with suspicious query parameters
  const suspiciousParams = ['__callback__', 'zybTracker'];
  const searchParams = request.nextUrl.searchParams;
  
  for (const param of suspiciousParams) {
    if (Array.from(searchParams.keys()).some(key => key.includes(param))) {
      logBlockedRequest(`${pathname}?${param}=*`);
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Continue with normal request processing
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
