import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { defendDosApi, trafficApi, mitigationApi, securityApi, statisticsApi, dataApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { debounce } from '@/utils';

// Query Keys
export const QUERY_KEYS = {
  TRAFFIC_STATS: 'traffic-stats',
  TRAFFIC_VISUALIZATION: 'traffic-visualization',
  TRAFFIC_REAL_TIME: 'traffic-real-time',
  BLOCKED_IPS: 'blocked-ips',
  MITIGATION_STATS: 'mitigation-stats',
  SECURITY_DASHBOARD: 'security-dashboard',
  SECURITY_OVERVIEW: 'security-overview',
  SYSTEM_STATUS: 'system-status',
  ML_HEALTH: 'ml-health',
  ALERTS: 'alerts',
  ALERTS_COUNT: 'alerts-count',
  // NEW: Detailed statistics and data
  DETAILED_STATS: 'detailed-stats',
  REALTIME_STATS: 'realtime-stats',
  ATTACK_ANALYSIS: 'attack-analysis',
  ALL_TRAFFIC_DATA: 'all-traffic-data',
  ALL_ML_PREDICTIONS: 'all-ml-predictions',
  ALL_DETECTION_EVENTS: 'all-detection-events',
  ALL_BLOCKED_IPS_DATA: 'all-blocked-ips-data',
  DATABASE_STATS: 'database-stats',
} as const;

// Real-time polling intervals (in milliseconds)
export const POLL_INTERVALS = {
  FAST: 10000, // 10 seconds - for critical data
  MEDIUM: 30000, // 30 seconds - for dashboard data
  SLOW: 60000, // 60 seconds - for less critical data
} as const;

// Type aliases for backward compatibility
export const useNetworkStats = useTrafficStats;
export const useNetworkTraffic = useTrafficVisualization;
export const useSecurityInsights = useSecurityOverview;
export const useRealtimeMonitoring = (enabled: boolean = true) => {
  return {
    isConnected: true, // Mock connection status since we're using polling
  };
};

/**
 * Hook for fetching traffic statistics
 */
export function useTrafficStats(duration: string = '1h', enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.TRAFFIC_STATS, duration],
    queryFn: () => trafficApi.getTrafficSummary(duration),
    refetchInterval: POLL_INTERVALS.MEDIUM,
    enabled,
    staleTime: 20000,
    gcTime: 60000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook for fetching traffic visualization data
 */
export function useTrafficVisualization(
  params: { range?: string; interval?: string } = {},
  enabled: boolean = true
) {
  const { range = '1h', interval = '5m' } = params;

  return useQuery({
    queryKey: [QUERY_KEYS.TRAFFIC_VISUALIZATION, range, interval],
    queryFn: () => trafficApi.getTrafficVisualization(range, interval),
    refetchInterval: POLL_INTERVALS.FAST,
    enabled,
    staleTime: 15000,
    gcTime: 45000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook for real-time traffic metrics
 */
export function useRealTimeTraffic(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.TRAFFIC_REAL_TIME],
    queryFn: () => trafficApi.queryTraffic('-5m'), // Get last 5 minutes for real-time
    refetchInterval: POLL_INTERVALS.FAST,
    enabled,
    staleTime: 5000, // Very fresh data required
    gcTime: 15000,
  });
}

/**
 * Hook for fetching blocked IPs
 */
export function useBlockedIPs(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.BLOCKED_IPS],
    queryFn: () => mitigationApi.getBlockedIps(),
    refetchInterval: POLL_INTERVALS.FAST,
    enabled,
    staleTime: 10000,
    gcTime: 30000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook for mitigation statistics
 */
export function useMitigationStats(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.MITIGATION_STATS],
    queryFn: () => mitigationApi.getMitigationStats(),
    refetchInterval: POLL_INTERVALS.MEDIUM,
    enabled,
    staleTime: 20000,
    gcTime: 60000,
  });
}

/**
 * Hook for security dashboard data
 */
export function useSecurityDashboard(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.SECURITY_DASHBOARD],
    queryFn: () => securityApi.getDashboard(),
    refetchInterval: POLL_INTERVALS.MEDIUM,
    enabled,
    staleTime: 20000,
    gcTime: 60000,
  });
}

/**
 * Hook for comprehensive security overview
 */
export function useSecurityOverview(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.SECURITY_OVERVIEW],
    queryFn: () => securityApi.getDashboard(), // Use same endpoint for now
    refetchInterval: POLL_INTERVALS.MEDIUM,
    enabled,
    staleTime: 20000,
    gcTime: 60000,
  });
}

/**
 * Hook for system status
 */
export function useSystemStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.SYSTEM_STATUS],
    queryFn: () => securityApi.getStatus(),
    refetchInterval: POLL_INTERVALS.SLOW,
    enabled,
    staleTime: 45000,
    gcTime: 120000,
  });
}

/**
 * Hook for security dashboard (using correct backend endpoint)
 */
export function useSecurityDashboardData(enabled: boolean = true) {
  return useQuery({
    queryKey: ['security-dashboard'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8082/api/v1/security/dashboard');
      if (!response.ok) throw new Error('Failed to fetch security dashboard');
      return response.json();
    },
    refetchInterval: POLL_INTERVALS.MEDIUM,
    enabled,
    staleTime: 20000,
    gcTime: 60000,
  });
}

/**
 * Hook for ML service health
 */
export function useMLHealth(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ML_HEALTH],
    queryFn: () => trafficApi.checkMLHealth(),
    refetchInterval: POLL_INTERVALS.SLOW,
    enabled,
    staleTime: 45000,
    gcTime: 120000,
  });
}

/**
 * Hook for blocking IP addresses
 */
export function useBlockIP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason?: string }) =>
      mitigationApi.blockIp(ip, reason),
    onSuccess: (data, { ip }) => {
      toast.success(`IP ${ip} has been blocked successfully`);
      // Invalidate blocked IPs query to refresh the list
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOCKED_IPS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MITIGATION_STATS] });
    },
    onError: (error: Error, { ip }) => {
      toast.error(`Failed to block IP ${ip}: ${error?.message || 'Unknown error'}`);
    },
  });
}

/**
 * Hook for unblocking IP addresses
 */
export function useUnblockIP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ip: string) => mitigationApi.unblockIp(ip),
    onSuccess: (data, ip) => {
      toast.success(`IP ${ip} has been unblocked successfully`);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOCKED_IPS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MITIGATION_STATS] });
    },
    onError: (error: Error, ip) => {
      toast.error(`Failed to unblock IP ${ip}: ${error?.message || 'Unknown error'}`);
    },
  });
}

/**
 * Hook for ingesting traffic data
 */
export function useIngestTraffic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trafficApi.ingestTraffic,
    onSuccess: () => {
      // Invalidate traffic-related queries to show new data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRAFFIC_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRAFFIC_VISUALIZATION] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRAFFIC_REAL_TIME] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to ingest traffic: ${error?.message || 'Unknown error'}`);
    },
  });
}

/**
 * Hook for ML attack prediction
 */
export function usePredictAttack() {
  return useMutation({
    mutationFn: trafficApi.predictAttack,
    onSuccess: (data) => {
      const prediction = data.data;
      const severity = prediction?.severity || 'UNKNOWN';
      const isAttack = prediction?.isAttack || prediction?.is_attack;
      const action = prediction?.recommendedAction;
      
      if (isAttack) {
        toast.error(`Threat detected: ${severity} level attack predicted`, {
          duration: 5000,
        });
        if (action === 'BLOCK_IP') {
          toast(`⚠️ System recommends blocking this IP address`, {
            duration: 7000,
            icon: '⚠️',
            style: {
              background: '#f59e0b',
              color: '#fff',
            },
          });
        }
      } else {
        toast.success('Traffic appears benign');
      }
    },
    onError: (error: Error) => {
      toast.error(`Prediction failed: ${error?.message || 'Unknown error'}`);
    },
  });
}

/**
 * Hook for triggering manual detection
 */
export function useTriggerDetection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: securityApi.triggerDetection,
    onSuccess: () => {
      toast.success('Detection scan triggered successfully');
      // Refresh security data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECURITY_DASHBOARD] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECURITY_OVERVIEW] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger detection: ${error?.message || 'Unknown error'}`);
    },
  });
}

/**
 * Hook for debounced search
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  const debouncedFn = useCallback(
    debounce((...args: unknown[]) => searchFn(args[0] as string), delay),
    [searchFn, delay]
  );
  return debouncedFn;
}

/**
 * Hook for fetching alerts and notifications (placeholder)
 */
export function useAlerts(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALERTS],
    queryFn: () => Promise.resolve([]), // Mock empty alerts for now
    refetchInterval: POLL_INTERVALS.FAST,
    enabled,
    staleTime: 5000,
    gcTime: 15000,
  });
}

/**
 * Hook for getting unread alerts count (placeholder)
 */
export function useUnreadAlertsCount(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALERTS_COUNT],
    queryFn: () => Promise.resolve(0), // Mock 0 alerts for now
    refetchInterval: POLL_INTERVALS.FAST,
    enabled,
    staleTime: 5000,
    gcTime: 15000,
  });
}

/**
 * Hook for acknowledging alerts (placeholder)
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => Promise.resolve({ success: true }),
    onSuccess: () => {
      toast.success('Alert acknowledged');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS_COUNT] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to acknowledge alert: ${error?.message || 'Unknown error'}`);
    },
  });
}

/**
 * Hook for managing real-time updates with auto-pause on window blur
 */
export function useRealTimeUpdates(enabled: boolean = true) {
  const isActiveRef = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
    };

    const handleFocus = () => {
      isActiveRef.current = true;
    };

    const handleBlur = () => {
      isActiveRef.current = false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return {
    isActive: isActiveRef.current && enabled,
    isEnabled: enabled,
  };
}

/**
 * Hook for comprehensive dashboard data
 */
export function useDashboardData() {
  const { isActive } = useRealTimeUpdates();

  const trafficStats = useTrafficStats('1h', isActive);
  const blockedIPs = useBlockedIPs(isActive);
  const mitigationStats = useMitigationStats(isActive);
  const securityOverview = useSecurityOverview(isActive);
  const realTimeTraffic = useRealTimeTraffic(isActive);

  const isLoading = trafficStats.isLoading || 
                   blockedIPs.isLoading || 
                   mitigationStats.isLoading || 
                   securityOverview.isLoading;

  // Only show error if ALL requests fail - individual failures are handled gracefully
  const hasError = trafficStats.error && 
                  blockedIPs.error && 
                  mitigationStats.error && 
                  securityOverview.error;

  // Log individual errors for debugging but don't fail the entire dashboard
  if (trafficStats.error) console.warn('Traffic stats error:', trafficStats.error);
  if (blockedIPs.error) console.warn('Blocked IPs error:', blockedIPs.error);
  if (mitigationStats.error) console.warn('Mitigation stats error:', mitigationStats.error);
  if (securityOverview.error) console.warn('Security overview error:', securityOverview.error);

  return {
    trafficStats: trafficStats.data,
    blockedIPs: blockedIPs.data,
    mitigationStats: mitigationStats.data,
    securityOverview: securityOverview.data,
    realTimeTraffic: realTimeTraffic.data,
    isLoading,
    hasError,
    refetch: () => {
      trafficStats.refetch();
      blockedIPs.refetch();
      mitigationStats.refetch();
      securityOverview.refetch();
      realTimeTraffic.refetch();
    },
  };
}

/**
 * NEW: Hook for detailed statistics from backend
 */
export function useDetailedStats(range: string = '-1h', enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.DETAILED_STATS, range],
    queryFn: () => statisticsApi.getDetailedStats(range),
    refetchInterval: POLL_INTERVALS.MEDIUM,
    enabled,
    staleTime: 20000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * NEW: Hook for realtime statistics
 */
export function useRealtimeStats(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.REALTIME_STATS],
    queryFn: () => statisticsApi.getRealtimeStats(),
    refetchInterval: POLL_INTERVALS.FAST,
    enabled,
    staleTime: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * NEW: Hook for attack analysis
 */
export function useAttackAnalysis(range: string = '-1h', sourceIp?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTACK_ANALYSIS, range, sourceIp],
    queryFn: () => statisticsApi.getAttackAnalysis(range, sourceIp),
    refetchInterval: POLL_INTERVALS.MEDIUM,
    enabled,
    staleTime: 20000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * NEW: Hook for all traffic data from database
 */
export function useAllTrafficData(range: string = '-24h', enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_TRAFFIC_DATA, range],
    queryFn: () => dataApi.getAllTrafficData(range),
    enabled,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * NEW: Hook for all ML predictions from database
 */
export function useAllMLPredictions(range: string = '-24h', enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_ML_PREDICTIONS, range],
    queryFn: () => dataApi.getAllMLPredictions(range),
    enabled,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * NEW: Hook for all detection events from database
 */
export function useAllDetectionEvents(range: string = '-24h', enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_DETECTION_EVENTS, range],
    queryFn: () => dataApi.getAllDetectionEvents(range),
    enabled,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * NEW: Hook for database statistics
 */
export function useDatabaseStats(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.DATABASE_STATS],
    queryFn: () => dataApi.getDatabaseStats(),
    refetchInterval: POLL_INTERVALS.SLOW,
    enabled,
    staleTime: 60000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * ENHANCED: Hook for comprehensive dashboard with new statistics
 */
export function useEnhancedDashboardData(range: string = '-1h') {
  const { isActive } = useRealTimeUpdates();

  const detailedStats = useDetailedStats(range, isActive);
  const realtimeStats = useRealtimeStats(isActive);
  const blockedIPs = useBlockedIPs(isActive);
  const mitigationStats = useMitigationStats(isActive);
  const securityOverview = useSecurityOverview(isActive);
  const mlHealth = useMLHealth(isActive);

  const isLoading = detailedStats.isLoading || 
                   realtimeStats.isLoading ||
                   blockedIPs.isLoading || 
                   mitigationStats.isLoading || 
                   securityOverview.isLoading;

  // Only show error if critical requests fail
  const hasError = detailedStats.error && 
                  securityOverview.error;

  return {
    detailedStats: detailedStats.data,
    realtimeStats: realtimeStats.data,
    blockedIPs: blockedIPs.data,
    mitigationStats: mitigationStats.data,
    securityOverview: securityOverview.data,
    mlHealth: mlHealth.data,
    isLoading,
    hasError,
    refetch: () => {
      detailedStats.refetch();
      realtimeStats.refetch();
      blockedIPs.refetch();
      mitigationStats.refetch();
      securityOverview.refetch();
      mlHealth.refetch();
    },
  };
}
