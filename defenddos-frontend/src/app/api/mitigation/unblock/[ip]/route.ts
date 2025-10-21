import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ip: string }> }
) {
  const { ip } = await params;
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/mitigation/unblock/${ip}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('IP unblock proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Proxy Error', 
        message: 'Failed to connect to backend service' 
      },
      { status: 500 }
    );
  }
}