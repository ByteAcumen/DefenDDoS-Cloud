import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8082';

export async function GET() {
  try {
    const url = `${BACKEND_BASE_URL}/api/v1/security/dashboard`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Return fallback data on error
      return NextResponse.json({
        activeThreats: 0,
        blockedRequests: 0,
        lastScan: new Date().toISOString(),
        detectionEnabled: true,
        systemHealth: 'unknown',
        overallHealth: {
          status: 'unknown',
          score: 0
        },
        error: `Backend returned ${response.status}`
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Security Dashboard Proxy] Error:', error instanceof Error ? error.message : error);
    
    // Return fallback data on connection error
    return NextResponse.json({
      activeThreats: 0,
      blockedRequests: 0,
      lastScan: new Date().toISOString(),
      detectionEnabled: true,
      systemHealth: 'unknown',
      overallHealth: {
        status: 'unknown',
        score: 0
      },
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
