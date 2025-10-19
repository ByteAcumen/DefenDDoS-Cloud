import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8082';

export async function GET() {
  try {
    const url = `${BACKEND_BASE_URL}/api/v1/security/status`;
    console.log('[Security Status Proxy] Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Security Status Proxy] Backend error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch security status', 
          status: response.status,
          message: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Security Status Proxy] Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Security Status Proxy] Error:', errorMessage);
    
    // Return fallback data instead of error
    return NextResponse.json({
      services: {
        alerts: 'unknown',
        detection: 'unknown',
        database: 'unknown'
      },
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: 'Unknown',
      error: errorMessage
    });
  }
}

// Allow runtime caching configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
