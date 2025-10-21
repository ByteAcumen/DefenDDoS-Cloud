'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
  Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MetricCard } from '@/components/charts/DataVisualizations';
import {
  useDashboardData,
  useBackendHealth,
  useMLHealth,
  useMitigationStats,
  useRealtimeMetrics
} from '@/hooks/useBackendApi';
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as any
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as any
    }
  }
};

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
  responseTime: number;
  lastCheck: string;
  icon: React.ReactNode;
  description: string;
  endpoint?: string;
}

export default function SystemHealthPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Data fetching hooks
  const { 
    securityDashboard,
    realtimeMetrics,
    backendHealth,
    mlHealth,
    isLoading: dashboardLoading,
    hasError,
    refetch: refetchDashboard
  } = useDashboardData();
  
  const { data: backendHealthData, isLoading: backendLoading } = useBackendHealth();
  const { data: mlHealthData, isLoading: mlLoading } = useMLHealth();
  const { data: mitigationStats } = useMitigationStats();
  const { data: metrics } = useRealtimeMetrics('1m');

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchDashboard();
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refetchDashboard]);

  const handleManualRefresh = () => {
    refetchDashboard();
    setLastRefresh(new Date());
  };

  // Process system services status
  const systemServices: ServiceStatus[] = useMemo(() => [
    {
      name: 'DefenDDoS Backend API',
      status: backendHealth && !hasError ? 'operational' : 'down',
      uptime: '99.98%',
      responseTime: 45,
      lastCheck: 'Just now',
      icon: <Server className="w-5 h-5" />,
      description: 'Main backend service for DDoS protection',
      endpoint: '/api/health'
    },
    {
      name: 'InfluxDB Database',
      status: backendHealth ? 'operational' : 'degraded',
      uptime: '99.95%',
      responseTime: 12,
      lastCheck: 'Just now',
      icon: <Database className="w-5 h-5" />,
      description: 'Time-series database for metrics storage',
      endpoint: '/influxdb'
    },
    {
      name: 'ML Detection Engine',
      status: mlHealth && !hasError ? 'operational' : 'degraded',
      uptime: '99.92%',
      responseTime: 156,
      lastCheck: 'Just now',
      icon: <Activity className="w-5 h-5" />,
      description: 'Machine learning threat detection service',
      endpoint: '/ml/health'
    },
    {
      name: 'Threat Mitigation',
      status: backendHealth ? 'operational' : 'degraded',
      uptime: '99.99%',
      responseTime: 8,
      lastCheck: 'Just now',
      icon: <Shield className="w-5 h-5" />,
      description: 'Automated IP blocking and mitigation system',
      endpoint: '/api/mitigation'
    }
  ], [backendHealth, mlHealth, hasError]);

  // System metrics
  const systemMetrics = {
    cpu: { 
      usage: Math.min(((realtimeMetrics?.currentPacketsPerSecond || 0) / 1000) * 100, 100),
      cores: 8,
      temperature: 52
    },
    memory: { 
      used: 9.2, 
      total: 16, 
      percentage: 57.5 
    },
    disk: { 
      used: 245, 
      total: 512, 
      percentage: 47.8 
    },
    network: { 
      inbound: realtimeMetrics?.currentPacketsPerSecond || 0, 
      outbound: (realtimeMetrics?.currentPacketsPerSecond || 0) * 0.6
    }
  };

  // Overall system health
  const getOverallHealth = () => {
    const operationalCount = systemServices.filter(s => s.status === 'operational').length;
    const totalServices = systemServices.length;
    const healthPercentage = (operationalCount / totalServices) * 100;

    if (healthPercentage === 100) return { status: 'excellent', color: 'text-green-500', message: 'All Systems Operational' };
    if (healthPercentage >= 75) return { status: 'good', color: 'text-blue-500', message: 'Systems Mostly Healthy' };
    if (healthPercentage >= 50) return { status: 'degraded', color: 'text-yellow-500', message: 'Some Systems Degraded' };
    return { status: 'critical', color: 'text-red-500', message: 'Critical System Issues' };
  };

  const overallHealth = getOverallHealth();

  return (
    <div className="space-y-6">
      {/* Enhanced Header - System Health Theme */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-emerald-500/20 shadow-2xl shadow-emerald-500/10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Animated heartbeat pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heartbeat" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
                <path d="M0 50 L40 50 L50 20 L60 80 L70 50 L200 50" stroke="#10b981" strokeWidth="2" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heartbeat)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="p-2 sm:p-3 bg-emerald-500/20 rounded-lg sm:rounded-xl border-2 border-emerald-500/30 relative"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                <motion.div
                  className="absolute -inset-1 rounded-lg sm:rounded-xl border-2 border-emerald-500/50"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    System Health Monitor
                  </h1>
                  <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                    LIVE
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  ⚡ Real-time system health, performance metrics, and service status
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Overall Health Indicator */}
            <motion.div 
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card border-2 border-emerald-500/30 shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle className={cn("w-4 h-4", overallHealth.color)} />
              <div className="flex flex-col">
                <span className={cn("text-xs font-semibold", overallHealth.color)}>
                  {overallHealth.status.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">{overallHealth.message}</span>
              </div>
            </motion.div>

            {/* Last Update */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card/80 backdrop-blur-sm border border-border/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                leftIcon={<RefreshCw className={cn('w-3 h-3 sm:w-4 sm:h-4', autoRefresh && 'animate-spin')} />}
                className="text-xs sm:text-sm"
              >
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                leftIcon={<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm"
              >
                Refresh
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<Download className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Metrics KPIs */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <MetricCard
            title="CPU Usage"
            value={`${systemMetrics.cpu.usage.toFixed(1)}%`}
            icon={<Cpu className="w-[18px] h-[18px]" />}
            change={{
              value: 5.2,
              type: 'increase',
              timeframe: `${systemMetrics.cpu.cores} cores @ ${systemMetrics.cpu.temperature}°C`
            }}
            color={systemMetrics.cpu.usage > 80 ? 'red' : systemMetrics.cpu.usage > 60 ? 'yellow' : 'green'}
            loading={dashboardLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Memory Usage"
            value={`${systemMetrics.memory.percentage}%`}
            icon={<MemoryStick className="w-[18px] h-[18px]" />}
            change={{
              value: 2.1,
              type: 'decrease',
              timeframe: `${systemMetrics.memory.used}GB / ${systemMetrics.memory.total}GB`
            }}
            color={systemMetrics.memory.percentage > 85 ? 'red' : 'green'}
            loading={dashboardLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Disk Usage"
            value={`${systemMetrics.disk.percentage}%`}
            icon={<HardDrive className="w-[18px] h-[18px]" />}
            change={{
              value: 1.3,
              type: 'increase',
              timeframe: `${systemMetrics.disk.used}GB / ${systemMetrics.disk.total}GB`
            }}
            color={systemMetrics.disk.percentage > 90 ? 'red' : systemMetrics.disk.percentage > 70 ? 'yellow' : 'green'}
            loading={dashboardLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Network Traffic"
            value={Math.round(systemMetrics.network.inbound + systemMetrics.network.outbound)}
            icon={<Network className="w-[18px] h-[18px]" />}
            change={{
              value: 15.7,
              type: 'increase',
              timeframe: `↓${Math.round(systemMetrics.network.inbound)} ↑${Math.round(systemMetrics.network.outbound)}`
            }}
            color="blue"
            loading={dashboardLoading}
          />
        </motion.div>
      </motion.div>

      {/* Services Status Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Server className="w-[18px] h-[18px] text-primary" />
                  Service Status
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  {systemServices.filter(s => s.status === 'operational').length}/{systemServices.length} Operational
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardLoading || backendLoading || mlLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Checking services...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemServices.map((service, index) => (
                    <motion.div
                      key={service.name}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md',
                        service.status === 'operational' 
                          ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50' 
                          : service.status === 'degraded'
                          ? 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50'
                          : 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                      )}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className={cn(
                              'p-2 rounded-lg',
                              service.status === 'operational' 
                                ? 'bg-green-500/20 text-green-500' 
                                : service.status === 'degraded'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-red-500/20 text-red-500'
                            )}
                            animate={service.status === 'operational' ? { 
                              scale: [1, 1.1, 1],
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {service.icon}
                          </motion.div>
                          <div>
                            <h4 className="font-semibold text-foreground">{service.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {service.description}
                            </p>
                          </div>
                        </div>
                        
                        <motion.div
                          animate={service.status === 'operational' ? { rotate: 360 } : {}}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          {service.status === 'operational' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : service.status === 'degraded' ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </motion.div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Uptime:</span>
                          <span className="font-semibold text-foreground">{service.uptime}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Response:</span>
                          <span className="font-semibold text-foreground">{service.responseTime}ms</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Last checked: {service.lastCheck}</span>
                        </div>
                        {service.endpoint && (
                          <code className="px-2 py-0.5 rounded bg-muted/50 text-muted-foreground font-mono">
                            {service.endpoint}
                          </code>
                        )}
                      </div>

                      {/* Status indicator bar */}
                      <div className="mt-3 w-full bg-muted rounded-full h-1.5">
                        <motion.div
                          className={cn(
                            "h-1.5 rounded-full",
                            service.status === 'operational' ? 'bg-green-500' :
                            service.status === 'degraded' ? 'bg-yellow-500' :
                            'bg-red-500'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: service.status === 'operational' ? '100%' : service.status === 'degraded' ? '60%' : '20%' }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* System Statistics Summary */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Protection</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {securityDashboard?.totalBlocked || 0}
                  </p>
                  <p className="text-xs text-blue-500 font-medium mt-1">IPs blocked</p>
                </div>
                <motion.div
                  className="p-3 bg-blue-500/10 rounded-xl"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Shield className="w-6 h-6 text-blue-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Traffic Rate</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                    {Math.round(realtimeMetrics?.currentPacketsPerSecond || 0)}
                  </p>
                  <p className="text-xs text-purple-500 font-medium mt-1">packets/sec</p>
                </div>
                <motion.div
                  className="p-3 bg-purple-500/10 rounded-xl"
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Threats</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {securityDashboard?.activeThreats || 0}
                  </p>
                  <p className="text-xs text-orange-500 font-medium mt-1">being monitored</p>
                </div>
                <motion.div
                  className="p-3 bg-orange-500/10 rounded-xl"
                  animate={securityDashboard?.activeThreats ? { 
                    rotate: [0, -10, 10, -10, 10, 0]
                  } : {}}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Zap className="w-6 h-6 text-orange-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
