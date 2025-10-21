'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';

export default function APITestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`Testing ${method} ${endpoint}`);
      
      let response;
      if (method === 'GET') {
        response = await apiClient.get(endpoint);
      } else {
        response = await apiClient.post(endpoint, {});
      }
      
      console.log('API Response:', response);
      setResult(response.data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err?.message || 'Unknown error');
      
      // More detailed error logging
      if (err.response) {
        console.log('Response status:', err.response.status);
        console.log('Response data:', err.response.data);
        console.log('Response headers:', err.response.headers);
      } else if (err.request) {
        console.log('Request made but no response:', err.request);
      }
    } finally {
      setLoading(false);
    }
  };

  const testProxyFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing proxy fetch...');
      
      const response = await fetch('/api/security/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Proxy response:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Proxy data:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Proxy Fetch Error:', err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          API Connection Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => testAPI('/security/dashboard')}
            disabled={loading}
          >
            Test Security Dashboard
          </Button>
          
          <Button 
            onClick={() => testAPI('/traffic/summary?duration=1h')}
            disabled={loading}
          >
            Test Traffic Summary
          </Button>
          
          <Button 
            onClick={() => testAPI('/mitigation/blocked')}
            disabled={loading}
          >
            Test Blocked IPs
          </Button>
          
          <Button 
            onClick={() => testProxyFetch()}
            disabled={loading}
            variant="secondary"
          >
            Test Proxy Fetch
          </Button>
        </div>

        {loading && (
          <Card>
            <CardContent className="p-6">
              <p className="text-center">Loading...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <h3 className="text-lg font-semibold text-green-800">Success</h3>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-green-700 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}