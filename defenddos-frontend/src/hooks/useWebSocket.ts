'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

/**
 * React hook for WebSocket connections
 * @param url - WebSocket server URL (default from env)
 * @param options - Socket.io connection options
 */
export function useWebSocket(
  url?: string,
  options: WebSocketOptions = {}
): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081';

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: options.reconnection ?? true,
      reconnectionDelay: options.reconnectionDelay ?? 1000,
      reconnectionAttempts: options.reconnectionAttempts ?? 5,
      ...options,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, [wsUrl, options]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit: WebSocket not connected');
    }
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    socketRef.current?.off(event, callback);
  }, []);

  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, options.autoConnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

/**
 * Hook specifically for DefenDDoS traffic updates
 */
export function useTrafficWebSocket() {
  const { isConnected, on, off } = useWebSocket();
  const [trafficData, setTrafficData] = useState<any>(null);
  const [attackAlert, setAttackAlert] = useState<any>(null);

  useEffect(() => {
    // Listen for traffic updates
    const handleTrafficUpdate = (data: any) => {
      setTrafficData(data);
    };

    // Listen for attack alerts
    const handleAttackAlert = (data: any) => {
      setAttackAlert(data);
      // Auto-clear alert after 5 seconds
      setTimeout(() => setAttackAlert(null), 5000);
    };

    on('traffic-update', handleTrafficUpdate);
    on('attack-detected', handleAttackAlert);

    return () => {
      off('traffic-update', handleTrafficUpdate);
      off('attack-detected', handleAttackAlert);
    };
  }, [on, off]);

  return {
    isConnected,
    trafficData,
    attackAlert,
  };
}

/**
 * Hook for system health monitoring
 */
export function useSystemHealthWebSocket() {
  const { isConnected, on, off } = useWebSocket();
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    const handleHealthUpdate = (data: any) => {
      setHealthStatus(data);
    };

    on('health-update', handleHealthUpdate);

    return () => {
      off('health-update', handleHealthUpdate);
    };
  }, [on, off]);

  return {
    isConnected,
    healthStatus,
  };
}
