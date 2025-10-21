'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useTheme } from '@/contexts/ThemeContext';

interface BackendStatusProps {
  showInline?: boolean;
  showDetails?: boolean;
  onStatusChange?: (online: boolean) => void;
}

export function BackendStatus({ 
  showInline = false, 
  showDetails = false,
  onStatusChange 
}: BackendStatusProps) {
  const { theme } = useTheme();
  const [status, setStatus] = useState<{
    online: boolean;
    message: string;
    lastChecked?: Date;
    checking: boolean;
  }>({
    online: true,
    message: 'Checking connection...',
    checking: true
  });

  const checkBackendStatus = async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const result = await apiClient.getBackendStatus();
      const newStatus = {
        online: result.online,
        message: result.message,
        lastChecked: new Date(),
        checking: false
      };
      
      setStatus(newStatus);
      onStatusChange?.(result.online);
      
    } catch (error) {
      // Silently handle error - don't show in console
      const newStatus = {
        online: false,
        message: 'Backend service is not running on port 8082',
        lastChecked: new Date(),
        checking: false
      };
      
      setStatus(newStatus);
      onStatusChange?.(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Check status periodically
    const interval = setInterval(checkBackendStatus, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const StatusIcon = ({ size = 16 }: { size?: number }) => {
    if (status.checking) {
      return <RefreshCw size={size} className="animate-spin text-blue-500" />;
    }
    return status.online ? (
      <CheckCircle size={size} className="text-green-500" />
    ) : (
      <AlertCircle size={size} className="text-red-500" />
    );
  };

  const StatusBadge = () => (
    <Badge 
      variant={status.online ? "success" : "danger"}
      className={`flex items-center gap-1 ${
        theme === 'dark' 
          ? (status.online ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300')
          : (status.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
      }`}
    >
      <StatusIcon size={12} />
      {status.online ? 'Online' : 'Offline'}
    </Badge>
  );

  if (showInline) {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge />
        {!status.online && (
          <Button
            variant="ghost"
            size="sm"
            onClick={checkBackendStatus}
            disabled={status.checking}
            className="h-6 px-2"
          >
            <RefreshCw size={12} className={status.checking ? 'animate-spin' : ''} />
          </Button>
        )}
      </div>
    );
  }

  if (!status.online) {
    return (
      <Alert 
        variant="destructive" 
        className={`mb-4 ${
          theme === 'dark' 
            ? 'bg-red-950 border-red-800 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}
      >
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Backend Connection Lost</strong>
            <p className="text-sm mt-1">{status.message}</p>
            {status.lastChecked && (
              <p className="text-xs mt-1 opacity-70">
                Last checked: {status.lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkBackendStatus}
            disabled={status.checking}
            className="ml-4"
          >
            {status.checking ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              'Retry'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (showDetails && status.online) {
    return (
      <Card className={`mb-4 ${
        theme === 'dark' 
          ? 'bg-green-950 border-green-800' 
          : 'bg-green-50 border-green-200'
      }`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-green-300' : 'text-green-800'
              }`}>
                Backend Connected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {status.lastChecked && (
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`}>
                  {status.lastChecked.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={checkBackendStatus}
                disabled={status.checking}
                className="h-6 px-2"
              >
                <RefreshCw size={12} className={status.checking ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default BackendStatus;