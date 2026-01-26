import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard'];

// Define API routes that need special handling
const apiRoutes = ['/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes to pass through
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Get token from cookie (primary) or authorization header (fallback)
  const cookieToken = request.cookies.get('defenddos_token')?.value;
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = cookieToken || headerToken;

  // Validate token format
  const isValidToken = token && (
    token.split('.').length === 3 || // JWT format
    token.startsWith('demo-token-') || // Demo token
    token.startsWith('github-token-') // GitHub token
  );

  // STRICT: If trying to access a protected route without valid token, redirect to login
  if (isProtectedRoute && !isValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('error', 'authentication_required');

    const response = NextResponse.redirect(loginUrl);
    // Clear any invalid cookies
    response.cookies.delete('defenddos_token');
    response.cookies.delete('defenddos_user');
    return response;
  }

  // If logged in and trying to access login/register, redirect to dashboard
  if (isValidToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
