import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8082';

// Fallback empty traffic summary data
const FALLBACK_DATA = {
  data: [],
  summary: {
    totalPackets: 0,
    uniqueIPs: 0,
    avgPacketSize: 0,
    timeRange: '1h'
  },
  timestamp: new Date().toISOString(),
  message: 'No traffic data available - waiting for ingestion'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${BACKEND_BASE_URL}/api/v1/traffic/summary${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Return fallback data instead of error
      console.log(`[Traffic Summary] Backend returned ${response.status}, using fallback data`);
      return NextResponse.json(FALLBACK_DATA);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Traffic Summary Proxy] Error:', error instanceof Error ? error.message : error);
    // Return fallback data instead of error
    return NextResponse.json(FALLBACK_DATA);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
