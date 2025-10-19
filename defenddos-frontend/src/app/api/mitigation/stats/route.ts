import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = 'http://localhost:8082';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/mitigation/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch mitigation stats', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Mitigation stats proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}