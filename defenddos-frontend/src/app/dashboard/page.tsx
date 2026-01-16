'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Network, 
  Ban,
  RefreshCw,
  TrendingUp,
  Clock,
  Cpu,
  Database,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  TrafficTimelineChart, 
  AttackDetectionChart, 
  MLConfidenceChart, 
  ThreatDistributionChart,
  MetricCard,
  ActivityFeed
} from '@/components/charts/DataVisualizations';
import { 
  useDashboardData,
  useTrafficVisualization,
  useTriggerDetection,
  useAllDetectionEvents,
  useAllMLPredictions
} from '@/hooks/useBackendApi';
import { cn } from '@/lib/utils';

// Optimized animation variants - Smoother and faster
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] as any
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] as any
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.01, 
    y: -1,
    transition: { 
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1] as any
    }
  }
};

// Loading skeleton component
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-32 rounded-2xl bg-muted animate-pulse"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-muted animate-pulse"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-80 rounded-xl bg-muted animate-pulse"></div>
      <div className="h-80 rounded-xl bg-muted animate-pulse"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-64 rounded-xl bg-muted animate-pulse"></div>
      ))}
    </div>
  </div>
);

export default function DashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('-1h');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // API hooks with controlled refetching - pass isPaused to disable polling
  const { 
    securityDashboard,
    realtimeMetrics,
    blockedIPs, 
    mitigationStats, 
    backendHealth,
    mlHealth,
    isLoading,
    hasError,
    refetch
  } = useDashboardData();
  
  // Pass !isPaused to enable/disable polling dynamically
  const { data: trafficViz, isLoading: trafficLoading, refetch: refetchTraffic } = useTrafficVisualization(selectedTimeRange, '5m', !isPaused);
  const { data: detectionEvents, isLoading: detectionLoading, refetch: refetchDetection } = useAllDetectionEvents(selectedTimeRange, !isPaused);
  const { data: mlPredictions, isLoading: mlLoading, refetch: refetchML } = useAllMLPredictions(selectedTimeRange, !isPaused);
  const triggerDetection = useTriggerDetection();
  
  const overviewLoading = isLoading || trafficLoading || detectionLoading || mlLoading;
  const liveLoading = isLoading;
  
  // Extract data from proper backend structure
  const metrics = useMemo(() => ({
    currentPacketsPerSecond: realtimeMetrics?.currentPacketsPerSecond || 0,
    activeThreatsCount: securityDashboard?.activeThreats || 0,
    blockedIPsCount: blockedIPs?.count || 0,
    totalBytes: realtimeMetrics?.totalBytes || 0
  }), [realtimeMetrics, securityDashboard, blockedIPs]);

  // Memoize processed data to prevent unnecessary recalculations
  const trafficData = useMemo(() => {
    if (!trafficViz || !Array.isArray(trafficViz) || trafficViz.length === 0) {
      return [];
    }
    return trafficViz.map(item => ({
      time: new Date(item.time || item._time || item.timestamp).toLocaleTimeString(),
      timestamp: item.time || item._time || item.timestamp,
      packets: Math.floor(parseFloat(item.totalPackets || item.packets || item.value || 0)),
      bytes: Math.floor(parseFloat(item.totalBytes || item.bytes || 0))
    })).filter(item => item.packets > 0 || item.bytes > 0);
  }, [trafficViz]);

  const mlData = useMemo(() => {
    if (!mlPredictions || !Array.isArray(mlPredictions) || mlPredictions.length === 0) return [];
    return mlPredictions.map(item => ({
      time: new Date(item.time || item._time || item.timestamp).toLocaleTimeString(),
      timestamp: item.time || item._time || item.timestamp,
      confidence: parseFloat(item.confidence || item.value || 0),
      anomaly: parseFloat(item.lstm_anomaly_score || item.anomaly || 0)
    })).filter(item => !isNaN(item.confidence));
  }, [mlPredictions]);

  const activityEvents = useMemo(() => {
    const events: any[] = [];
    const detectionData = detectionEvents || [];
    const mlData = mlPredictions || [];
    
    // Add detection events
    if (Array.isArray(detectionData) && detectionData.length > 0) {
      detectionData.slice(0, 10).forEach(event => {
        events.push({
          id: `detection-${event.time || event._time || Date.now()}-${Math.random()}`,
          type: event.mlDetected === 'true' || event.severity === 'CRITICAL' ? 'error' : 'warning',
          message: `Threat detected from ${event.sourceIp || event.source_ip || 'Unknown IP'}`,
          timestamp: event.time || event._time || new Date().toISOString(),
          details: `Threat level: ${event.threatLevel || event.severity || 'UNKNOWN'}, Packets: ${event.value || event.packetCount || 0}`
        });
      });
    }

    // Add ML prediction events
    if (Array.isArray(mlData) && mlData.length > 0) {
      mlData.slice(0, 5).forEach(pred => {
        if (pred.isAttack === 'true' || pred.is_attack === true || pred.is_attack === 'true') {
          events.push({
            id: `ml-${pred.time || pred._time || Date.now()}-${Math.random()}`,
            type: pred.severity === 'HIGH' || pred.severity === 'CRITICAL' ? 'error' : 'warning',
            message: `ML detected ${pred.attackType || pred.attack_type || 'potential'} attack`,
            timestamp: pred.time || pred._time || new Date().toISOString(),
            details: `Confidence: ${((parseFloat(pred.confidence || pred.value || 0)) * 100).toFixed(1)}%`
          });
        }
      });
    }

    // If no events, add a default message with a stable timestamp
    if (events.length === 0) {
      events.push({
        id: 'default-1',
        type: 'success',
        message: 'System monitoring active',
        timestamp: '2025-01-01T00:00:00.000Z',
        details: 'No threats detected. All systems operational.'
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
  }, [detectionEvents, mlPredictions]);

  const threatDistribution = useMemo(() => {
    if (!Array.isArray(mlPredictions) || mlPredictions.length === 0) {
      return [{ name: 'Benign', value: 100 }];
    }

    const attackTypes: { [key: string]: number } = {};
    let benignCount = 0;
    
    mlPredictions.forEach((pred: any) => {
      const isAttack = pred.isAttack === 'true' || pred.is_attack === true || pred.is_attack === 'true';
      if (isAttack && (pred.attackType || pred.attack_type)) {
        const attackType = pred.attackType || pred.attack_type;
        attackTypes[attackType] = (attackTypes[attackType] || 0) + 1;
      } else {
        benignCount++;
      }
    });
    
    const result = Object.entries(attackTypes).map(([name, value]) => ({ name, value }));
    
    if (benignCount > 0) {
      result.push({ name: 'Benign', value: benignCount });
    }
    
    // If no data, show default
    if (result.length === 0) {
      return [{ name: 'No Data', value: 1 }];
    }
    
    return result;
  }, [mlPredictions]);

  // Get system health status based on backend documentation
  const getSystemHealth = useCallback(() => {
    // SIMPLIFIED: Just check if the query succeeded
    const backendOnline = backendHealth && !hasError;
    const mlOnline = mlHealth && !hasError;
    
    if (!backendOnline) {
      return { status: 'critical', color: 'text-red-500', message: 'Backend Offline' };
    }
    
    const threatCount = metrics?.activeThreatsCount || 0;
    if (threatCount > 10) {
      return { status: 'warning', color: 'text-yellow-500', message: 'High Threat Level' };
    } else if (threatCount > 0) {
      return { status: 'warning', color: 'text-yellow-500', message: 'Threats Detected' };
    } else if (!mlOnline) {
      return { status: 'warning', color: 'text-yellow-500', message: 'ML Service Offline' };
    } else {
      return { status: 'operational', color: 'text-green-500', message: 'System Healthy' };
    }
  }, [backendHealth, hasError, mlHealth, metrics]);

  const systemHealth = useMemo(() => getSystemHealth(), [getSystemHealth]);

  // Optimized handler functions
  const handleTimeRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value;
    setSelectedTimeRange(newRange);
    // Delay refetch to prevent excessive API calls
    setTimeout(() => {
      refetchTraffic();
      refetchDetection();
      refetchML();
    }, 100);
  }, [refetchDetection, refetchML, refetchTraffic]);

  const handlePauseToggle = useCallback(() => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    setIsLiveMode(!newPaused);
  }, [isPaused]);

  const handleRefresh = useCallback(() => {
    refetchTraffic();
    refetchDetection();
    refetchML();
  }, [refetchDetection, refetchML, refetchTraffic]);

  // Show skeleton while initial data is loading
  if (isLoading && !securityDashboard && !realtimeMetrics) {
    return <DashboardSkeleton />;
  }

  // Error state - Only show if truly unable to connect AND no data is available
  if (hasError && isLoading && !securityDashboard && !realtimeMetrics && !backendHealth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-bold mb-2 text-foreground">Connecting to Backend...</h2>
            <p className="text-muted-foreground mb-4">
              Please ensure the DefenDDoS backend is running on port 8082.
            </p>
            <Button 
              onClick={() => refetch()} 
              leftIcon={<RefreshCw className="w-4 h-4" />}
              variant="outline"
            >
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section with Animated Gradient */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-2xl p-4 sm:p-6 md:p-8 border border-border/50 shadow-2xl"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:30px_30px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <motion.div 
          className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg sm:rounded-xl">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Security Command Center
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  Real-time DDoS protection powered by AI
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* System Health Badge with Pulse Animation */}
            <motion.div 
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-card/90 backdrop-blur-md border border-border/50 shadow-lg"
              whileHover={{ scale: 1.03, y: -1 }}
              transition={{ duration: 0.15 }}
            >
              <motion.div 
                className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded-full relative", {
                  "bg-green-500": systemHealth.status === 'operational',
                  "bg-yellow-500": systemHealth.status === 'warning',
                  "bg-red-500": systemHealth.status === 'critical'
                })}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(var(--color), 0.7)',
                    '0 0 0 6px rgba(var(--color), 0)',
                    '0 0 0 0 rgba(var(--color), 0)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs sm:text-sm font-semibold text-foreground">{systemHealth.message}</span>
            </motion.div>

            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={handleTimeRangeChange}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-xs sm:text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 cursor-pointer hover:bg-card"
            >
              <option value="-5m">Last 5 minutes</option>
              <option value="-15m">Last 15 minutes</option>
              <option value="-1h">Last hour</option>
              <option value="-6h">Last 6 hours</option>
              <option value="-24h">Last 24 hours</option>
              <option value="-7d">Last 7 days</option>
              <option value="-30d">Last 30 days</option>
              <option value="-90d">Last 3 months</option>
            </select>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              {isPaused && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  leftIcon={<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />}
                  className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Sync</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseToggle}
                leftIcon={isLiveMode ? <Activity className="w-3 h-3 sm:w-4 sm:h-4" /> : <Clock className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
              >
                {isLiveMode ? 'Live' : 'Paused'}
              </Button>
              <Button
                size="sm"
                onClick={() => triggerDetection.mutate()}
                disabled={triggerDetection.isPending}
                leftIcon={triggerDetection.isPending ? <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Zap className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">{triggerDetection.isPending ? 'Scanning...' : 'Scan Now'}</span>
                <span className="sm:hidden">Scan</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced KPI Grid with Hover Effects */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} whileHover="hover" initial="rest">
          <motion.div variants={cardHoverVariants}>
            <MetricCard
              title="Traffic Volume"
              value={metrics?.currentPacketsPerSecond || 0}
              icon={<Network className="w-[18px] h-[18px]" />}
              change={{
                value: 12.3,
                type: 'increase',
                timeframe: 'last hour'
              }}
              color="blue"
              loading={liveLoading}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover="hover" initial="rest">
          <motion.div variants={cardHoverVariants}>
            <MetricCard
              title="Active Threats"
              value={metrics?.activeThreatsCount || 0}
              icon={<AlertTriangle className="w-[18px] h-[18px]" />}
              color={(metrics?.activeThreatsCount || 0) > 0 ? 'red' : 'green'}
              loading={liveLoading}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover="hover" initial="rest">
          <motion.div variants={cardHoverVariants}>
            <MetricCard
              title="Blocked IPs"
              value={metrics?.blockedIPsCount || 0}
              icon={<Ban className="w-[18px] h-[18px]" />}
              color="red"
              loading={liveLoading}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover="hover" initial="rest">
          <motion.div variants={cardHoverVariants}>
            <MetricCard
              title="System Performance"
              value="99.9%"
              icon={<Cpu className="w-[18px] h-[18px]" />}
              change={{
                value: 0.1,
                type: 'increase',
                timeframe: 'uptime'
              }}
              color="green"
              loading={liveLoading}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Enhanced Charts Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Traffic Timeline - Takes up 2 columns */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <TrafficTimelineChart
            data={trafficData}
            title="Real-time Traffic Analysis"
            height={350}
            loading={overviewLoading}
            animated={true}
            realTime={isLiveMode}
          />
        </motion.div>

        {/* Threat Distribution */}
        <motion.div variants={itemVariants}>
          <ThreatDistributionChart
            data={threatDistribution}
            loading={overviewLoading}
          />
        </motion.div>
      </motion.div>

      {/* Secondary Charts */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <AttackDetectionChart
            data={detectionEvents?.map((event: any) => {
              const time = new Date(event.time || event._time || event.timestamp).toLocaleTimeString();
              const severity = event.threatLevel || event.severity || 'LOW';
              return {
                time,
                timestamp: event.time || event._time || event.timestamp,
                attacks: 1,
                severity: severity,
                critical: severity === 'CRITICAL' ? 1 : 0,
                high: severity === 'HIGH' ? 1 : 0,
                medium: severity === 'MEDIUM' ? 1 : 0,
                low: severity === 'LOW' ? 1 : 0,
              };
            }) || []}
            title="Attack Detection Timeline"
            loading={overviewLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MLConfidenceChart
            data={mlData}
            title="ML Model Performance"
            loading={overviewLoading}
          />
        </motion.div>
      </motion.div>

      {/* System Status and Activity Feed */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* System Status */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Shield className="w-[18px] h-[18px] text-primary" />
                System Status
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Overall Health */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    System Health
                  </span>
                  <div className="flex items-center gap-2">
                    {systemHealth.status === 'operational' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : systemHealth.status === 'warning' ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <Badge 
                      variant={systemHealth.status === 'operational' ? 'success' : systemHealth.status === 'warning' ? 'warning' : 'danger'}
                      className="text-[10px]"
                    >
                      {systemHealth.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Services Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Backend API</span>
                    <Badge 
                      variant={backendHealth && !hasError ? 'success' : 'danger'} 
                      className="text-[10px]"
                    >
                      {backendHealth && !hasError ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">ML Service</span>
                    <Badge 
                      variant={mlHealth && !hasError ? 'success' : 'danger'} 
                      className="text-[10px]"
                    >
                      {mlHealth && !hasError ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Database</span>
                    <Badge variant="success" className="text-[10px]">ONLINE</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Auto-Detection</span>
                    <Badge variant="success" className="text-[10px]">ACTIVE</Badge>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">CPU Usage</span>
                    <span className="font-semibold text-foreground">23%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="font-semibold text-foreground">68%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Disk Space</span>
                    <span className="font-semibold text-foreground">45%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed - Takes up 2 columns */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <ActivityFeed
            events={activityEvents}
          />
        </motion.div>
      </motion.div>

      {/* Quick Actions with Enhanced Interactions */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Card className="hover:shadow-xl hover:border-primary/60 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 mx-auto mb-3 p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-200">
                <Network className="w-full h-full text-primary" />
              </div>
              <h4 className="font-semibold text-sm text-foreground mb-1">
                Traffic Monitor
              </h4>
              <p className="text-xs text-muted-foreground">
                Real-time network analysis
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Card className="hover:shadow-xl hover:border-red-500/60 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-red-500/5 to-transparent">
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 mx-auto mb-3 p-2 bg-red-100 dark:bg-red-900/40 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors duration-200">
                <Ban className="w-full h-full text-red-600 dark:text-red-400" />
              </div>
              <h4 className="font-semibold text-sm text-foreground mb-1">
                IP Management
              </h4>
              <p className="text-xs text-muted-foreground">
                Block & unblock IPs
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Card className="hover:shadow-xl hover:border-yellow-500/60 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-yellow-500/5 to-transparent">
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 mx-auto mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/50 transition-colors duration-200">
                <AlertTriangle className="w-full h-full text-yellow-600 dark:text-yellow-400" />
              </div>
              <h4 className="font-semibold text-sm text-foreground mb-1">
                Threat Analysis
              </h4>
              <p className="text-xs text-muted-foreground">
                ML-powered detection
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Card className="hover:shadow-xl hover:border-green-500/60 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 mx-auto mb-3 p-2 bg-green-100 dark:bg-green-900/40 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors duration-200">
                <Database className="w-full h-full text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-sm text-foreground mb-1">
                Analytics
              </h4>
              <p className="text-xs text-muted-foreground">
                Advanced reporting
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}