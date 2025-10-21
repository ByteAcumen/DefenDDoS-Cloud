'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  duration?: number;
}

export default function ConnectionTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (name: string, testFn: () => Promise<{ success: boolean; message: string }>) => {
    const startTime = Date.now();
    setTestResults(prev => [...prev.filter(t => t.name !== name), { name, status: 'pending', message: 'Running...' }]);
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      setTestResults(prev => prev.map(t => 
        t.name === name 
          ? { ...t, status: result.success ? 'success' : 'error', message: result.message, duration }
          : t
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => prev.map(t => 
        t.name === name 
          ? { ...t, status: 'error', message: error instanceof Error ? error.message : 'Unknown error', duration }
          : t
      ));
    }
  };

  const testBackendHealth = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, message: `Health check passed: ${data.status}` };
      } else {
        return { success: false, message: `Health check failed: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, message: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  };

  const testSecurityDashboard = async () => {
    try {
      const response = await fetch('/api/security/dashboard', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, message: `Security dashboard accessible. Status: ${data.status || 'Unknown'}` };
      } else {
        return { success: false, message: `Security dashboard failed: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, message: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  };

  const testBlockedIPs = async () => {
    try {
      const response = await fetch('/api/mitigation/blocked', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, message: `Blocked IPs accessible. Count: ${data.count || 0}` };
      } else {
        return { success: false, message: `Blocked IPs failed: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, message: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  };

  const testTrafficData = async () => {
    try {
      const response = await fetch('/api/traffic/query?range=-1h', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, message: `Traffic query accessible. Type: ${data?.constructor?.name || typeof data}` };
      } else {
        return { success: false, message: `Traffic query failed: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, message: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  };

  const testCORS = async () => {
    try {
      // Test proxy approach - no CORS needed since it's same-origin
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        return { 
          success: true, 
          message: `CORS bypassed via Next.js API routes (same-origin requests)` 
        };
      } else {
        return { success: false, message: `Proxy test failed: ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Proxy test failed: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  };

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      { name: 'Backend Health (Proxy)', fn: testBackendHealth },
      { name: 'API Proxy Configuration', fn: testCORS },
      { name: 'Security Dashboard (Proxy)', fn: testSecurityDashboard },
      { name: 'Blocked IPs API (Proxy)', fn: testBlockedIPs },
      { name: 'Traffic Data API (Proxy)', fn: testTrafficData }
    ];

    for (const test of tests) {
      await runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Pass</Badge>;
      case 'error':
        return <Badge variant="danger">Fail</Badge>;
      case 'pending':
        return <Badge variant="warning">Running</Badge>;
      default:
        return <Badge variant="secondary">Waiting</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            DefenDDoS Backend Connection Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Diagnose connectivity issues between frontend and backend services
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Connection Tests</h2>
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                leftIcon={isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.length === 0 && !isRunning && (
                <div className="text-center py-8 text-gray-500">
                  Click &quot;Run All Tests&quot; to start diagnosing connection issues
                </div>
              )}
              
              {testResults.map((result) => (
                <div 
                  key={result.name} 
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {result.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {result.message}
                      </p>
                      {result.duration && (
                        <p className="text-xs text-gray-500">
                          Duration: {result.duration}ms
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Configuration Information</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Frontend</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>URL: http://localhost:3000</li>
                  <li>Framework: Next.js</li>
                  <li>API Client: Axios</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Backend (via Proxy)</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Direct URL: http://localhost:8082</li>
                  <li>Proxy URL: /api/*</li>
                  <li>Framework: Spring Boot</li>
                  <li>Status: Using Next.js proxy routes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ CORS Issue Resolved</h3>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• Using Next.js API routes as proxy to avoid CORS issues</li>
            <li>• Frontend makes same-origin requests to /api/* endpoints</li>
            <li>• Backend (port 8082) is accessed server-side through proxy</li>
            <li>• All API calls now work seamlessly without browser restrictions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}