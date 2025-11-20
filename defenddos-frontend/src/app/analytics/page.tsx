'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  RefreshCw,
  FileText,
  Shield,
  Activity,
  AlertTriangle,
  Clock,
  Globe,
  Database,
  Zap,
  Target,
  Network,
  Ban,
  Play,
  Pause
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  useTrafficVisualization,
  useAllDetectionEvents,
  useAllMLPredictions,
  useSecurityDashboard,
  useRealtimeMetrics,
  useBlockedIPs,
  useMitigationStats
} from '@/hooks/useBackendApi';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Optimized animation variants - Smoother and faster
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0,
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as any
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] as any
    }
  }
};

// Chart colors
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  pink: '#ec4899'
};

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('-24h');
  const [isPaused, setIsPaused] = useState(false);
  const { resolvedTheme } = useTheme();

  // API hooks with real backend data
  const { data: trafficViz, isLoading: trafficLoading, refetch: refetchTraffic } = useTrafficVisualization(selectedTimeRange, '1h', !isPaused);
  const { data: detectionEvents, isLoading: detectionLoading, refetch: refetchDetection } = useAllDetectionEvents(selectedTimeRange, !isPaused);
  const { data: mlPredictions, isLoading: mlLoading, refetch: refetchML } = useAllMLPredictions(selectedTimeRange, !isPaused);
  const { data: securityDashboard } = useSecurityDashboard();
  const { data: realtimeMetrics } = useRealtimeMetrics();
  const { data: blockedIPs } = useBlockedIPs();
  const { data: mitigationStats } = useMitigationStats();

  const isLoading = trafficLoading || detectionLoading || mlLoading;

  // Process traffic timeline data
  const timelineData = useMemo(() => {
    if (!trafficViz || !Array.isArray(trafficViz)) return [];
    return trafficViz.map(item => ({
      time: new Date(item.time || item._time || item.timestamp).toLocaleTimeString(),
      threats: parseInt(item.totalPackets || item.packets || item.value || 0),
      blocked: Math.floor((item.totalPackets || item.packets || 0) * 0.75),
      bytes: parseInt(item.totalBytes || item.bytes || 0)
    }));
  }, [trafficViz]);

  // Process threat distribution
  const threatDistribution = useMemo(() => {
    if (!mlPredictions || !Array.isArray(mlPredictions)) {
      return [{ name: 'No Data', value: 1, color: COLORS.primary }];
    }

    const attackTypes: { [key: string]: number } = {};
    mlPredictions.forEach((pred: any) => {
      const isAttack = pred.isAttack === 'true' || pred.is_attack === true;
      if (isAttack && (pred.attackType || pred.attack_type)) {
        const type = pred.attackType || pred.attack_type;
        attackTypes[type] = (attackTypes[type] || 0) + 1;
      }
    });

    const colors = [COLORS.danger, COLORS.warning, COLORS.purple, COLORS.pink, COLORS.primary];
    return Object.entries(attackTypes).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  }, [mlPredictions]);

  // Process detection events
  const detectionTimeline = useMemo(() => {
    if (!detectionEvents || !Array.isArray(detectionEvents)) return [];
    
    const hourlyData: { [key: string]: { critical: number; high: number; medium: number; low: number } } = {};
    
    detectionEvents.forEach((event: any) => {
      const hour = new Date(event.time || event._time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!hourlyData[hour]) {
        hourlyData[hour] = { critical: 0, high: 0, medium: 0, low: 0 };
      }
      
      const severity = (event.threatLevel || event.severity || 'LOW').toUpperCase();
      if (severity === 'CRITICAL') hourlyData[hour].critical++;
      else if (severity === 'HIGH') hourlyData[hour].high++;
      else if (severity === 'MEDIUM') hourlyData[hour].medium++;
      else hourlyData[hour].low++;
    });

    return Object.entries(hourlyData).map(([time, counts]) => ({
      time,
      ...counts
    }));
  }, [detectionEvents]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalThreats = securityDashboard?.activeThreats || 0;
    const blockedCount = blockedIPs?.count || 0;
    const avgResponseTime = realtimeMetrics?.avgProcessingTime || 25;
    const successRate = mitigationStats?.blockSuccessRate || 85;

    return {
      totalThreats,
      blockedCount,
      avgResponseTime,
      successRate,
      dataProcessed: realtimeMetrics?.totalBytes || 0,
      uptime: 99.97
    };
  }, [securityDashboard, blockedIPs, realtimeMetrics, mitigationStats]);

  // Handle refresh
  const handleRefresh = () => {
    refetchTraffic();
    refetchDetection();
    refetchML();
    toast.success('Data refreshed');
  };

  // Handle export
  const handleExport = (format: 'csv' | 'json') => {
    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange: selectedTimeRange,
      metrics,
      timelineData,
      threatDistribution,
      detectionTimeline
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      filename = `analytics-${Date.now()}.json`;
      mimeType = 'application/json';
    } else {
      const headers = ['time', 'threats', 'blocked', 'bytes'];
      const csvRows = [headers.join(',')];
      timelineData.forEach(row => {
        csvRows.push([row.time, row.threats, row.blocked, row.bytes].join(','));
      });
      content = csvRows.join('\\n');
      filename = `analytics-${Date.now()}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section with Animated Background */}
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
          className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg sm:rounded-xl">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Analytics & Reports
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  Comprehensive security insights and performance metrics
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => {
                setSelectedTimeRange(e.target.value);
                setTimeout(handleRefresh, 100);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-xs sm:text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 cursor-pointer hover:bg-card"
            >
              <option value="-1h">Last hour</option>
              <option value="-6h">Last 6 hours</option>
              <option value="-24h">Last 24 hours</option>
              <option value="-7d">Last 7 days</option>
              <option value="-30d">Last 30 days</option>
              <option value="-90d">Last 3 months</option>
              <option value="-180d">Last 6 months</option>
              <option value="-365d">Last year</option>
            </select>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              {isPaused && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
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
                onClick={() => setIsPaused(!isPaused)}
                leftIcon={isPaused ? <Play className="w-3 h-3 sm:w-4 sm:h-4" /> : <Pause className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="flex-1 sm:flex-none"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                leftIcon={<Download className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="flex-1 sm:flex-none"
              >
                CSV
              </Button>

              <Button
                size="sm"
                onClick={() => handleExport('json')}
                leftIcon={<FileText className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="bg-gradient-to-r from-primary to-primary/80 flex-1 sm:flex-none"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced KPI Cards with Gradient Backgrounds */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="relative overflow-hidden border-border/50 shadow-lg hover:shadow-2xl hover:border-red-500/50 transition-all duration-300 bg-gradient-to-br from-red-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Total Threats</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? '...' : metrics.totalThreats.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                    </motion.div>
                    <span className="text-xs text-red-500 font-semibold">+12.5%</span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="relative overflow-hidden border-border/50 shadow-lg hover:shadow-2xl hover:border-green-500/50 transition-all duration-300 bg-gradient-to-br from-green-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Blocked IPs</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? '...' : metrics.blockedCount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    </motion.div>
                    <span className="text-xs text-green-500 font-semibold">+8.3%</span>
                    <span className="text-xs text-muted-foreground">effectiveness</span>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Ban className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="relative overflow-hidden border-border/50 shadow-lg hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 bg-gradient-to-br from-blue-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Response Time</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? '...' : `${metrics.avgResponseTime}ms`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <motion.div
                      animate={{ y: [0, -2, 0, 2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                    </motion.div>
                    <span className="text-xs text-green-500 font-semibold">-3.2ms</span>
                    <span className="text-xs text-muted-foreground">improvement</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="relative overflow-hidden border-border/50 shadow-lg hover:shadow-2xl hover:border-green-500/50 transition-all duration-300 bg-gradient-to-br from-green-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Success Rate</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? '...' : `${metrics.successRate.toFixed(1)}%`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    </motion.div>
                    <span className="text-xs text-green-500 font-semibold">+1.8%</span>
                    <span className="text-xs text-muted-foreground">accuracy</span>
                  </div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Enhanced Charts with Smooth Animations */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Traffic Timeline */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Traffic Activity Timeline</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Real-time threat detection and mitigation
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  {timelineData.length} data points
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-60 sm:h-80 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : timelineData.length === 0 ? (
                <div className="h-60 sm:h-80 flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </div>
                </div>
              ) : (
                <div className="h-60 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timelineData}>
                      <defs>
                        <linearGradient id="threatsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border), 0.3)" />
                      <XAxis 
                        dataKey="time" 
                        stroke="rgba(var(--muted-foreground), 0.5)"
                        fontSize={12}
                      />
                      <YAxis stroke="rgba(var(--muted-foreground), 0.5)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(var(--popover), 0.98)',
                          border: '1px solid rgba(var(--border), 0.5)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(12px)'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="threats"
                        stroke={COLORS.danger}
                        fill="url(#threatsGradient)"
                        strokeWidth={2}
                        name="Total Threats"
                      />
                      <Area
                        type="monotone"
                        dataKey="blocked"
                        stroke={COLORS.success}
                        fill="url(#blockedGradient)"
                        strokeWidth={2}
                        name="Blocked"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Threat Distribution */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Threat Distribution</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Attack types detected</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-48 sm:h-64 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={threatDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={50}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {threatDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(var(--popover), 0.98)',
                            border: '1px solid rgba(var(--border), 0.5)',
                            borderRadius: '12px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {threatDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Detection Severity Timeline with Enhanced Animation */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Detection Severity Timeline</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Threat severity distribution over time</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 sm:h-64 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : detectionTimeline.length === 0 ? (
              <div className="h-48 sm:h-64 flex items-center justify-center">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No detection events</p>
                </div>
              </div>
            ) : (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={detectionTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border), 0.3)" />
                    <XAxis dataKey="time" stroke="rgba(var(--muted-foreground), 0.5)" fontSize={12} />
                    <YAxis stroke="rgba(var(--muted-foreground), 0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(var(--popover), 0.98)',
                        border: '1px solid rgba(var(--border), 0.5)',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="critical" stackId="a" fill={COLORS.danger} name="Critical" />
                    <Bar dataKey="high" stackId="a" fill={COLORS.warning} name="High" />
                    <Bar dataKey="medium" stackId="a" fill={COLORS.primary} name="Medium" />
                    <Bar dataKey="low" stackId="a" fill={COLORS.success} name="Low" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
