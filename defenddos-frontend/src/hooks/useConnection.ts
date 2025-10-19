import { useEffect, useState } from 'react';

export interface ConnectionStatus {
  backend: 'connected' | 'disconnected' | 'checking';
  mlService: 'connected' | 'disconnected' | 'checking';
  database: 'connected' | 'disconnected' | 'checking';
  lastChecked: Date | null;
  errors: string[];
}

export interface ServiceHealth {
  backend: {
    status: string;
    uptime?: number;
    version?: string;
  } | null;
  mlService: {
    status: string;
    modelsLoaded?: boolean;
  } | null;
  database: {
    status: string;
    measurements?: number;
  } | null;
}

/**
 * Custom hook to monitor connection status to backend services
 * Automatically checks health every 30 seconds
 */
export function useConnectionStatus(autoCheck: boolean = true) {
  const [status, setStatus] = useState<ConnectionStatus>({
    backend: 'checking',
    mlService: 'checking',
    database: 'checking',
    lastChecked: null,
    errors: [],
  });

  const [health, setHealth] = useState<ServiceHealth>({
    backend: null,
    mlService: null,
    database: null,
  });

  const checkConnections = async () => {
    const errors: string[] = [];
    
    try {
      // Check Backend
      try {
        const backendResponse = await fetch(
          'http://localhost:8082/api/v1/../actuator/health',
          { method: 'GET', cache: 'no-store' }
        );
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          setHealth(prev => ({ ...prev, backend: backendData }));
          setStatus(prev => ({ ...prev, backend: 'connected' }));
        } else {
          errors.push(`Backend returned status ${backendResponse.status}`);
          setStatus(prev => ({ ...prev, backend: 'disconnected' }));
        }
      } catch (err) {
        errors.push('Backend unreachable');
        setStatus(prev => ({ ...prev, backend: 'disconnected' }));
      }

      // Check ML Service
      try {
        const mlResponse = await fetch(
          'http://localhost:8000/health',
          { method: 'GET', cache: 'no-store' }
        );
        
        if (mlResponse.ok) {
          const mlData = await mlResponse.json();
          setHealth(prev => ({ ...prev, mlService: mlData }));
          setStatus(prev => ({ ...prev, mlService: 'connected' }));
        } else {
          errors.push(`ML Service returned status ${mlResponse.status}`);
          setStatus(prev => ({ ...prev, mlService: 'disconnected' }));
        }
      } catch (err) {
        errors.push('ML Service unreachable');
        setStatus(prev => ({ ...prev, mlService: 'disconnected' }));
      }

      // Check Database (through backend)
      try {
        const dbResponse = await fetch(
          '/api/data/statistics',
          { method: 'GET', cache: 'no-store' }
        );
        
        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          setHealth(prev => ({ ...prev, database: dbData.data }));
          setStatus(prev => ({ ...prev, database: 'connected' }));
        } else {
          errors.push(`Database check returned status ${dbResponse.status}`);
          setStatus(prev => ({ ...prev, database: 'disconnected' }));
        }
      } catch (err) {
        errors.push('Database unreachable');
        setStatus(prev => ({ ...prev, database: 'disconnected' }));
      }

      setStatus(prev => ({
        ...prev,
        lastChecked: new Date(),
        errors,
      }));

    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  useEffect(() => {
    if (autoCheck) {
      // Check immediately
      checkConnections();

      // Check every 30 seconds
      const interval = setInterval(checkConnections, 30000);

      return () => clearInterval(interval);
    }
  }, [autoCheck]);

  return {
    status,
    health,
    checkConnections,
    isFullyConnected: status.backend === 'connected' && 
                      status.mlService === 'connected' && 
                      status.database === 'connected',
    hasErrors: status.errors.length > 0,
  };
}

/**
 * Test all API endpoints to verify they're working
 */
export async function testAllEndpoints() {
  const results: Record<string, boolean> = {};

  const endpoints = [
    { name: 'Statistics Detailed', url: '/api/statistics/detailed?range=-1h' },
    { name: 'Statistics Realtime', url: '/api/statistics/realtime' },
    { name: 'Attack Analysis', url: '/api/statistics/attack-analysis?range=-1h' },
    { name: 'Traffic Data', url: '/api/data/traffic/all?range=-1h' },
    { name: 'ML Predictions', url: '/api/data/ml-predictions/all?range=-1h' },
    { name: 'Detection Events', url: '/api/data/detection-events/all?range=-1h' },
    { name: 'Database Stats', url: '/api/data/statistics' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { cache: 'no-store' });
      results[endpoint.name] = response.ok;
    } catch {
      results[endpoint.name] = false;
    }
  }

  return results;
}

/**
 * Check if backend is ready (health check)
 */
export async function isBackendReady(): Promise<boolean> {
  try {
    const response = await fetch(
      'http://localhost:8082/api/v1/../actuator/health',
      { method: 'GET', cache: 'no-store' }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for backend to be ready (useful for startup)
 */
export async function waitForBackend(
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isBackendReady()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}
