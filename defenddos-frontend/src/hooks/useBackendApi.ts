import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { defenddosAPI } from '@/lib/defenddos-api';

// Query key constants
export const QUERY_KEYS = {
  HEALTH: 'health',
  SECURITY_DASHBOARD: 'security-dashboard',
  SECURITY_STATUS: 'security-status',
  REALTIME_METRICS: 'realtime-metrics',
  DETAILED_STATS: 'detailed-stats',
  BLOCKED_IPS: 'blocked-ips',
  MITIGATION_STATS: 'mitigation-stats',
  TRAFFIC_SUMMARY: 'traffic-summary',
  TRAFFIC_VIZ: 'traffic-visualization',
  ML_HEALTH: 'ml-health',
  ALL_TRAFFIC: 'all-traffic',
  ALL_ML_PREDICTIONS: 'all-ml-predictions',
  ALL_DETECTION_EVENTS: 'all-detection-events',
} as const;

// Polling intervals (ms)
export const POLL_INTERVALS = {
  FAST: 5000,    // 5 seconds - for real-time data
  MEDIUM: 15000, // 15 seconds - for dashboard data
  SLOW: 60000,   // 60 seconds - for less critical data
} as const;

// Health hooks - Backend health returns {status: "UP"}, ML returns {status: "healthy"}
export function useBackendHealth() {
  return useQuery({  
    queryKey: [QUERY_KEYS.HEALTH],
    queryFn: async () => {
      const result = await defenddosAPI.health.getBackendHealth();
      return result;
    },
    enabled: typeof window !== 'undefined', // Only run on client side
    refetchInterval: POLL_INTERVALS.SLOW,
    staleTime: 30000,
    gcTime: 60000,
    retry: 2,
    retryDelay: 2000,
  });
}

export function useMLHealth() {
  return useQuery({
    queryKey: [QUERY_KEYS.ML_HEALTH],
    queryFn: async () => {
      // Try backend proxy first
      try {
        const result = await defenddosAPI.traffic.getMLHealth();
        return result;
      } catch (error) {
        // Fallback to direct ML service health check
        const mlDirect = await defenddosAPI.health.getMLServiceHealth();
        return mlDirect;
      }
    },
    enabled: typeof window !== 'undefined', // Only run on client side
    refetchInterval: POLL_INTERVALS.SLOW,
    staleTime: 30000,
    gcTime: 60000,
    retry: 2,
    retryDelay: 2000,
  });
}

// Security hooks with graceful error handling
export function useSecurityDashboard() {
  return useQuery({
    queryKey: [QUERY_KEYS.SECURITY_DASHBOARD],
    queryFn: defenddosAPI.security.getDashboard,
    refetchInterval: POLL_INTERVALS.MEDIUM,
    staleTime: 10000,
    gcTime: 30000,
    retry: 1, // Reduced retry attempts
    retryDelay: 2000,
  });
}

export function useSecurityStatus() {
  return useQuery({
    queryKey: [QUERY_KEYS.SECURITY_STATUS],
    queryFn: defenddosAPI.security.getStatus,
    refetchInterval: POLL_INTERVALS.MEDIUM,
    staleTime: 10000,
    gcTime: 30000,
    retry: 1,
    retryDelay: 2000,
  });
}

// Statistics hooks with graceful error handling
export function useRealtimeMetrics(window: string = '1m') {
  return useQuery({
    queryKey: [QUERY_KEYS.REALTIME_METRICS, window],
    queryFn: () => defenddosAPI.statistics.getRealtimeMetrics(window),
    refetchInterval: POLL_INTERVALS.FAST,
    staleTime: 2000,
    gcTime: 10000,
    retry: 1,
    retryDelay: 1000,
  });
}

export function useDetailedStatistics(range: string = '-1h') {
  return useQuery({
    queryKey: [QUERY_KEYS.DETAILED_STATS, range],
    queryFn: () => defenddosAPI.statistics.getDetailedStatistics(range),
    refetchInterval: POLL_INTERVALS.MEDIUM,
    staleTime: 10000,
    gcTime: 30000,
    retry: 1,
    retryDelay: 2000,
  });
}

// Traffic hooks with graceful error handling
export function useTrafficSummary(duration: string = '1h') {
  return useQuery({
    queryKey: [QUERY_KEYS.TRAFFIC_SUMMARY, duration],
    queryFn: () => defenddosAPI.traffic.getTrafficSummary(duration),
    refetchInterval: POLL_INTERVALS.MEDIUM,
    staleTime: 10000,
    gcTime: 30000,
    retry: 1,
    retryDelay: 2000,
  });
}

export function useTrafficVisualization(duration: string = '1h', interval: string = '5m', enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.TRAFFIC_VIZ, duration, interval],
    queryFn: () => defenddosAPI.traffic.getTrafficVisualization(duration, interval),
    enabled: enabled && typeof window !== 'undefined',
    refetchInterval: enabled ? POLL_INTERVALS.MEDIUM : false, // Slower refresh - 15s instead of 5s
    staleTime: 12000, // Increased stale time for better caching
    gcTime: 30000,
    retry: 1,
    retryDelay: 1000,
  });
}

// Mitigation hooks with graceful error handling
export function useBlockedIPs() {
  return useQuery({
    queryKey: [QUERY_KEYS.BLOCKED_IPS],
    queryFn: defenddosAPI.mitigation.getBlockedIPs,
    refetchInterval: POLL_INTERVALS.FAST,
    staleTime: 5000,
    gcTime: 15000,
    retry: 1,
    retryDelay: 1000,
  });
}

export function useMitigationStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.MITIGATION_STATS],
    queryFn: defenddosAPI.mitigation.getMitigationStats,
    refetchInterval: POLL_INTERVALS.MEDIUM,
    staleTime: 10000,
    gcTime: 30000,
    retry: 1,
    retryDelay: 2000,
  });
}

// Data retrieval hooks with graceful error handling
export function useAllTrafficData(range: string = '-24h') {
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_TRAFFIC, range],
    queryFn: () => defenddosAPI.data.getAllTrafficData(range),
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
    retryDelay: 2000,
  });
}

export function useAllMLPredictions(range: string = '-24h', enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_ML_PREDICTIONS, range],
    queryFn: () => defenddosAPI.data.getAllMLPredictions(range),
    enabled: enabled && typeof window !== 'undefined',
    refetchInterval: enabled ? POLL_INTERVALS.MEDIUM : false,
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
    retryDelay: 2000,
  });
}

export function useAllDetectionEvents(range: string = '-24h', enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALL_DETECTION_EVENTS, range],
    queryFn: () => defenddosAPI.data.getAllDetectionEvents(range),
    enabled: enabled && typeof window !== 'undefined',
    refetchInterval: enabled ? POLL_INTERVALS.MEDIUM : false,
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
    retryDelay: 2000,
  });
}

// Mutation hooks
export function useIngestTraffic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: defenddosAPI.traffic.ingestTraffic,
    onSuccess: () => {
      // Invalidate traffic-related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRAFFIC_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRAFFIC_VIZ] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REALTIME_METRICS] });
      toast.success('Traffic data submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit traffic data: ${error.message}`);
    },
  });
}

export function usePredictAttack() {
  return useMutation({
    mutationFn: defenddosAPI.traffic.predictAttack,
    onSuccess: (data: any) => {
      if (data.is_attack) {
        toast.error(`Threat detected: ${data.severity} level (${data.confidence_percentage}% confidence)`);
      } else {
        toast.success('Traffic appears benign');
      }
    },
    onError: (error: Error) => {
      toast.error(`ML prediction failed: ${error.message}`);
    },
  });
}

export function useBlockIP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason?: string }) =>
      defenddosAPI.mitigation.blockIP(ip, reason),
    onSuccess: (_, { ip }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOCKED_IPS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MITIGATION_STATS] });
      toast.success(`IP ${ip} blocked successfully`);
    },
    onError: (error: Error, { ip }) => {
      toast.error(`Failed to block IP ${ip}: ${error.message}`);
    },
  });
}

export function useUnblockIP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ip: string) => defenddosAPI.mitigation.unblockIP(ip),
    onSuccess: (_, ip) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BLOCKED_IPS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MITIGATION_STATS] });
      toast.success(`IP ${ip} unblocked successfully`);
    },
    onError: (error: Error, ip) => {
      toast.error(`Failed to unblock IP ${ip}: ${error.message}`);
    },
  });
}

export function useTriggerDetection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: defenddosAPI.security.triggerDetection,
    onSuccess: () => {
      // Refresh security and detection data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECURITY_DASHBOARD] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_DETECTION_EVENTS] });
      toast.success('Detection scan triggered successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger detection: ${error.message}`);
    },
  });
}

// Combined dashboard data hook
export function useDashboardData() {
  const securityDashboard = useSecurityDashboard();
  const realtimeMetrics = useRealtimeMetrics();
  const blockedIPs = useBlockedIPs();
  const mitigationStats = useMitigationStats();
  const backendHealth = useBackendHealth();
  const mlHealth = useMLHealth();

  const isLoading = 
    securityDashboard.isLoading ||
    realtimeMetrics.isLoading ||
    blockedIPs.isLoading ||
    mitigationStats.isLoading;

  // Only error if critical data fails
  const hasError = 
    securityDashboard.isError &&
    realtimeMetrics.isError;

  return {
    // Data
    securityDashboard: securityDashboard.data,
    realtimeMetrics: realtimeMetrics.data,
    blockedIPs: blockedIPs.data,
    mitigationStats: mitigationStats.data,
    backendHealth: backendHealth.data,
    mlHealth: mlHealth.data,
    
    // Loading states
    isLoading,
    hasError,
    
    // Individual loading states
    isDashboardLoading: securityDashboard.isLoading,
    isMetricsLoading: realtimeMetrics.isLoading,
    isBlockedIPsLoading: blockedIPs.isLoading,
    
    // Refetch functions
    refetch: () => {
      securityDashboard.refetch();
      realtimeMetrics.refetch();
      blockedIPs.refetch();
      mitigationStats.refetch();
      backendHealth.refetch();
      mlHealth.refetch();
    },
  };
}
