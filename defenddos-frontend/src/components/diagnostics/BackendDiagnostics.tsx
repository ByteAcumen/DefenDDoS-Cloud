'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Wifi,
  WifiOff,
  Database,
  Activity,
  Globe,
  Code,
  Terminal
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useTheme } from '@/contexts/ThemeContext';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: string;
  timestamp?: Date;
}

export function BackendDiagnostics() {
  const { theme } = useTheme();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const initialTests: DiagnosticResult[] = [
    { name: 'Backend Connection', status: 'pending', message: 'Testing connection...' },
    { name: 'Health Endpoint', status: 'pending', message: 'Checking health endpoint...' },
    { name: 'API Endpoints', status: 'pending', message: 'Verifying API availability...' },
    { name: 'Database Connectivity', status: 'pending', message: 'Testing database connection...' },
    { name: 'ML Service Status', status: 'pending', message: 'Checking ML services...' },
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics(initialTests);

    const results: DiagnosticResult[] = [];

    // Test 1: Basic backend connection
    try {
      const backendStatus = await apiClient.getBackendStatus();
      results.push({
        name: 'Backend Connection',
        status: backendStatus.online ? 'success' : 'error',
        message: backendStatus.message,
        details: backendStatus.online ? 'Connection established successfully' : 'Failed to connect to backend service',
        timestamp: new Date()
      });
    } catch (error: any) {
      results.push({
        name: 'Backend Connection',
        status: 'error',
        message: 'Connection failed',
        details: `Error: ${error.message || 'Unknown error'}`,
        timestamp: new Date()
      });
    }

    // Test 2: Health endpoint
    try {
      await apiClient.healthCheck();
      results.push({
        name: 'Health Endpoint',
        status: 'success',
        message: 'Health endpoint responding',
        details: '/actuator/health endpoint is accessible',
        timestamp: new Date()
      });
    } catch (error: any) {
      results.push({
        name: 'Health Endpoint',
        status: 'error',
        message: 'Health endpoint failed',
        details: `Status: ${error.response?.status || 'Unknown'}, Message: ${error.message}`,
        timestamp: new Date()
      });
    }

    // Test 3: API Endpoints
    try {
      await apiClient.getRealtimeMetrics();
      results.push({
        name: 'API Endpoints',
        status: 'success',
        message: 'API endpoints accessible',
        details: 'Core API endpoints are responding',
        timestamp: new Date()
      });
    } catch (error: any) {
      let status: 'warning' | 'error' = 'error';
      let message = 'API endpoints failed';
      
      if (error.response?.status === 404) {
        status = 'warning';
        message = 'Some endpoints not found';
      }
      
      results.push({
        name: 'API Endpoints',
        status,
        message,
        details: `HTTP ${error.response?.status || 'N/A'}: ${error.message}`,
        timestamp: new Date()
      });
    }

    // Test 4: Database connectivity (via statistics endpoint)
    try {
      await apiClient.getDatabaseStatistics();
      results.push({
        name: 'Database Connectivity',
        status: 'success',
        message: 'Database connected',
        details: 'Database is accessible and responding',
        timestamp: new Date()
      });
    } catch (error: any) {
      results.push({
        name: 'Database Connectivity',
        status: 'error',
        message: 'Database connection failed',
        details: `Error: ${error.response?.data?.message || error.message}`,
        timestamp: new Date()
      });
    }

    // Test 5: ML service status
    try {
      await apiClient.getMLHealth();
      results.push({
        name: 'ML Service Status',
        status: 'success',
        message: 'ML services operational',
        details: 'Machine learning services are running',
        timestamp: new Date()
      });
    } catch (error: any) {
      results.push({
        name: 'ML Service Status',
        status: 'warning',
        message: 'ML services unavailable',
        details: `ML endpoints may not be configured: ${error.message}`,
        timestamp: new Date()
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
      warning: theme === 'dark' ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      error: theme === 'dark' ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800',
      pending: theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
    };

    return (
      <Badge className={`${variants[status]} border-0 text-xs font-medium`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const overallStatus = diagnostics.length > 0 ? 
    diagnostics.some(d => d.status === 'error') ? 'error' :
    diagnostics.some(d => d.status === 'warning') ? 'warning' :
    diagnostics.some(d => d.status === 'pending') ? 'pending' : 'success'
    : 'pending';

  return (
    <Card className={`w-full ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Backend Diagnostics</CardTitle>
            {getStatusBadge(overallStatus)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={runDiagnostics}
              disabled={isRunning}
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {diagnostics.map((diagnostic, index) => (
          <div
            key={diagnostic.name}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(diagnostic.status)}
              <div>
                <div className="font-medium text-sm">{diagnostic.name}</div>
                <div className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {diagnostic.message}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {diagnostic.timestamp && (
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {diagnostic.timestamp.toLocaleTimeString()}
                </span>
              )}
              {getStatusBadge(diagnostic.status)}
            </div>
          </div>
        ))}

        {showDetails && diagnostics.some(d => d.details) && (
          <div className={`mt-4 p-3 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h4 className="font-medium text-sm mb-2">Detailed Results:</h4>
            <div className="space-y-2">
              {diagnostics.filter(d => d.details).map((diagnostic) => (
                <div key={diagnostic.name} className="text-xs">
                  <span className="font-medium">{diagnostic.name}:</span>
                  <span className={`ml-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {diagnostic.details}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {overallStatus === 'error' && (
          <Alert 
            variant="destructive"
            className={theme === 'dark' 
              ? 'bg-red-950 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-800'
            }
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Backend Connection Issues Detected</strong>
              <p className="mt-1 text-sm">
                Please ensure the DefenDDoS backend service is running on port 8082. 
                Check the console logs for more detailed error information.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === 'success' && (
          <Alert className={`${
            theme === 'dark'
              ? 'bg-green-950 border-green-800 text-green-300'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>All Systems Operational</strong>
              <p className="mt-1 text-sm">
                Backend connection is healthy and all services are responding normally.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default BackendDiagnostics;