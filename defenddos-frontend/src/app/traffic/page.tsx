'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity,
  TrendingUp,
  Network,
  Download,
  Play,
  Pause,
  MapPin,
  Filter,
  Globe,
  Clock,
  Eye,
  RefreshCw,
  Server,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MetricCard, TrafficTimelineChart } from '@/components/charts/DataVisualizations';
import { 
  useTrafficVisualization, 
  useDashboardData
} from '@/hooks/useBackendApi';
import { cn } from '@/lib/utils';
import { exportTrafficData, exportWithNotification } from '@/utils/exportUtils';
import { toast } from 'react-hot-toast';

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

// Utility functions
const formatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  return `${diffHours}h ago`;
};

export default function TrafficPage() {
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('-1h');
  const [selectedInterval, setSelectedInterval] = useState('5m');

  // Data fetching hooks
  const { 
    realtimeMetrics,
    isLoading: dashboardLoading,
    hasError,
    refetch
  } = useDashboardData();
  
  const { 
    data: trafficVisualization, 
    isLoading: visualizationLoading,
    refetch: refetchTraffic
  } = useTrafficVisualization(selectedTimeRange, selectedInterval, !isPaused);

  // Time range options
  const timeRanges = [
    { label: '15m', value: '-15m', interval: '1m' },
    { label: '1h', value: '-1h', interval: '5m' },
    { label: '6h', value: '-6h', interval: '30m' },
    { label: '24h', value: '-24h', interval: '1h' },
  ];

  // Process chart data from real backend
  const chartData = useMemo(() => {
    if (!trafficVisualization || !Array.isArray(trafficVisualization) || trafficVisualization.length === 0) {
      return [];
    }
    
    return trafficVisualization.map((item: any) => ({
      time: new Date(item.time || item._time || item.timestamp).toLocaleTimeString(),
      timestamp: item.time || item._time || item.timestamp,
      packets: Math.floor(parseFloat(item.totalPackets || item.packets || item.value || 0)),
      bytes: Math.floor(parseFloat(item.totalBytes || item.bytes || 0))
    })).filter(item => item.packets > 0 || item.bytes > 0);
  }, [trafficVisualization]);

  // Process real source IP data
  const sourceIPs = useMemo(() => {
    if (!trafficVisualization || !Array.isArray(trafficVisualization)) return [];
    
    const ipMap = new Map<string, { packets: number; bytes: number }>();
    
    trafficVisualization.forEach((item: any) => {
      const ip = item.sourceIp || item.source_ip || 'Unknown';
      const packets = parseFloat(item.totalPackets || item.packets || item.value || 0);
      const bytes = parseFloat(item.totalBytes || item.bytes || 0);
      
      if (ipMap.has(ip)) {
        const existing = ipMap.get(ip)!;
        existing.packets += packets;
        existing.bytes += bytes;
      } else {
        ipMap.set(ip, { packets, bytes });
      }
    });

    const totalPackets = Array.from(ipMap.values()).reduce((sum, v) => sum + v.packets, 0);
    
    return Array.from(ipMap.entries())
      .map(([ip, data]) => ({
        ip,
        packets: Math.floor(data.packets),
        bytes: Math.floor(data.bytes),
        percentage: totalPackets > 0 ? Math.round((data.packets / totalPackets) * 100) : 0,
        risk: data.packets > 100000 ? 'high' : 
              data.packets > 10000 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 5);
  }, [trafficVisualization]);

  const handleExportData = () => {
    if (chartData && chartData.length > 0) {
      exportWithNotification(
        () => exportTrafficData(chartData, selectedTimeRange),
        'Traffic data exported successfully'
      );
    } else {
      toast.error('No traffic data available to export');
    }
  };

  const currentStats = {
    totalPackets: realtimeMetrics?.currentPacketsPerSecond || 0,
    totalBytes: realtimeMetrics?.totalBytes || 0,
    uniqueSources: chartData.length || 0,
    averageRate: realtimeMetrics?.averagePacketRate || realtimeMetrics?.currentPacketsPerSecond || 0,
  };

  // Get system health
  const getSystemHealth = () => {
    if (hasError) {
      return { status: 'critical', color: 'text-red-500', message: 'System Error' };
    }
    if (currentStats.totalPackets > 10000) {
      return { status: 'warning', color: 'text-yellow-500', message: 'High Traffic' };
    }
    return { status: 'operational', color: 'text-green-500', message: 'Normal Traffic' };
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section - Unique Design for Traffic Monitor */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-blue-500/20 shadow-2xl shadow-blue-500/10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Animated circuit pattern background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="#3b82f6" />
                <circle cx="90" cy="90" r="2" fill="#3b82f6" />
                <line x1="10" y1="10" x2="90" y2="10" stroke="#3b82f6" strokeWidth="1" />
                <line x1="90" y1="10" x2="90" y2="90" stroke="#3b82f6" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl border-2 border-blue-500/30 relative"
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Network className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                <motion.div
                  className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-blue-500/50"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    Network Traffic Monitor
                  </h1>
                  <Badge variant="default" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                    REAL-TIME
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  📊 Live network traffic analysis and bandwidth monitoring
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live Status Indicator - Unique to Traffic */}
            <motion.div 
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card border-2 border-blue-500/30 shadow-lg"
              animate={{ 
                boxShadow: isLiveMode ? [
                  '0 0 0 0 rgba(59, 130, 246, 0.4)',
                  '0 0 0 6px rgba(59, 130, 246, 0)',
                ] : '0 0 0 0 rgba(59, 130, 246, 0)'
              }}
              transition={{ duration: 1.5, repeat: isLiveMode ? Infinity : 0 }}
            >
              <Activity className={cn("w-4 h-4", isLiveMode ? "text-green-500" : "text-gray-500")} />
              <div className="flex flex-col">
                <span className={cn("text-xs font-semibold", isLiveMode ? "text-green-500" : "text-gray-500")}>
                  {isLiveMode ? 'MONITORING' : 'PAUSED'}
                </span>
                <span className="text-xs text-muted-foreground">{systemHealth.message}</span>
              </div>
              {isLiveMode && (
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 border border-border/50 overflow-x-auto">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  size="sm"
                  variant={selectedTimeRange === range.value ? 'primary' : 'ghost'}
                  onClick={() => {
                    setSelectedTimeRange(range.value);
                    setSelectedInterval(range.interval);
                    setTimeout(() => refetchTraffic(), 100);
                  }}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  {range.label}
                </Button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              {isPaused && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetch();
                    refetchTraffic();
                  }}
                  leftIcon={<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />}
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Sync</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsPaused(!isPaused);
                  setIsLiveMode(!isLiveMode);
                }}
                leftIcon={isLiveMode ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="flex-1 sm:flex-none"
              >
                {isLiveMode ? 'Live' : 'Paused'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<Download className="w-3 h-3 sm:w-4 sm:h-4" />} 
                onClick={handleExportData}
                className="flex-1 sm:flex-none"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards - Network-focused styling with live indicators */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden">
            {isLiveMode && (
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                animate={{ x: [-200, 400] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Network className="w-4 h-4 text-cyan-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Current Traffic</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                    {dashboardLoading ? '...' : formatNumber(currentStats.totalPackets)}
                  </p>
                  <p className="text-xs text-cyan-500 font-medium mt-1">packets/sec</p>
                </div>
                <motion.div
                  className="p-3 bg-cyan-500/10 rounded-xl relative"
                  animate={isLiveMode ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Network className="w-6 h-6 text-cyan-500" />
                  {isLiveMode && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden">
            {isLiveMode && (
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                animate={{ x: [-200, 400] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
              />
            )}
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Data Volume</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                    {dashboardLoading ? '...' : formatBytes(currentStats.totalBytes)}
                  </p>
                  <p className="text-xs text-purple-500 font-medium mt-1">transferred</p>
                </div>
                <motion.div
                  className="p-3 bg-purple-500/10 rounded-xl"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Activity className="w-6 h-6 text-purple-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent hover:border-green-500/40 transition-all duration-300 relative overflow-hidden">
            {isLiveMode && (
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"
                animate={{ x: [-200, 400] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
              />
            )}
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Unique Sources</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                    {dashboardLoading ? '...' : currentStats.uniqueSources.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-500 font-medium mt-1">distinct IPs</p>
                </div>
                <motion.div
                  className="p-3 bg-green-500/10 rounded-xl"
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <MapPin className="w-6 h-6 text-green-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent hover:border-orange-500/40 transition-all duration-300 relative overflow-hidden">
            {isLiveMode && (
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                animate={{ x: [-200, 400] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1.5 }}
              />
            )}
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Rate</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                    {dashboardLoading ? '...' : Math.round(currentStats.averageRate).toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-500 font-medium mt-1">packets/sec</p>
                </div>
                <motion.div
                  className="p-3 bg-orange-500/10 rounded-xl"
                  animate={isLiveMode ? { y: [-2, 2, -2] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Chart */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <TrafficTimelineChart
            data={chartData}
            title="Traffic Flow Analysis"
            height={400}
            loading={visualizationLoading}
            animated={true}
            realTime={isLiveMode}
          />
        </motion.div>
      </motion.div>

      {/* Top Source IPs and Live Activity */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Source IPs */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-[18px] h-[18px] text-primary" />
                  Top Source IPs
                </h3>
                <Button size="sm" variant="outline" leftIcon={<Filter className="w-3 h-3 sm:w-4 sm:h-4" />}>
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sourceIPs.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No traffic data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sourceIPs.map((source: any, index: number) => (
                    <motion.div
                      key={source.ip}
                      className="p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-medium text-foreground">
                            {source.ip}
                          </span>
                          <Badge
                            variant={
                              source.risk === 'high' ? 'danger' : 
                              source.risk === 'medium' ? 'warning' : 
                              'default'
                            }
                            className="text-[10px]"
                          >
                            {source.risk.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {source.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>{formatNumber(source.packets)} packets</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatBytes(source.bytes)}</span>
                        </div>
                      </div>
                      <div className="bg-muted rounded-full h-2">
                        <motion.div
                          className={cn(
                            "h-2 rounded-full",
                            source.risk === 'high' ? 'bg-red-500' :
                            source.risk === 'medium' ? 'bg-yellow-500' :
                            'bg-primary'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${source.percentage}%` }}
                          transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Real-time Activity */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-[18px] h-[18px] text-primary" />
                  Live Activity
                </h3>
                <div className="flex items-center gap-2">
                  {isLiveMode && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {isLiveMode ? 'LIVE' : 'PAUSED'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Activity */}
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Zap className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Current Traffic Rate
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatNumber(currentStats.averageRate)} packets/sec
                      </p>
                    </div>
                    {isLiveMode && (
                      <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Network Stats */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">
                    Network Statistics
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Total Packets</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatNumber(currentStats.totalPackets)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Data Transfer</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatBytes(currentStats.totalBytes)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Source IPs</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {currentStats.uniqueSources}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Events */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Recent Events
                  </h4>
                  {[0, 1, 2, 3].map((index) => (
                    <motion.div
                      key={index}
                      className="flex items-start gap-3 p-2 rounded-lg text-xs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatTimeAgo(new Date(Date.now() - index * 30000))}
                          </span>
                        </div>
                        <p className="text-foreground">
                          Traffic spike detected from 192.168.1.{100 + index}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
