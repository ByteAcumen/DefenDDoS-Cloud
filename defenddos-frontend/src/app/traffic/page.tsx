'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  TrendingUp,
  Network,
  Download,
  Play,
  Pause,
  MapPin,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { KPICard } from '@/components/dashboard/KPICard';
import { 
  useTrafficVisualization, 
  useRealTimeTraffic, 
  useTrafficStats 
} from '@/hooks/useDefenDDoS';
import { cn } from '@/utils';
import { exportTrafficData, exportWithNotification } from '@/utils/exportUtils';
import { toast } from 'react-hot-toast';

// Utility functions
const formatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
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
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedInterval, setSelectedInterval] = useState('5m');

  // Data fetching hooks
  const { data: trafficVisualization, isLoading: visualizationLoading } = useTrafficVisualization(
    { range: `-${selectedTimeRange}`, interval: selectedInterval },
    isLiveMode
  );
  
  const { data: realTimeData, isLoading: realTimeLoading } = useRealTimeTraffic(isLiveMode);
  const { data: trafficStats, isLoading: statsLoading } = useTrafficStats(selectedTimeRange, true);

  // Time range options
  const timeRanges = [
    { label: '15m', value: '15m', interval: '1m' },
    { label: '1h', value: '1h', interval: '5m' },
    { label: '6h', value: '6h', interval: '30m' },
    { label: '24h', value: '24h', interval: '1h' },
    { label: '7d', value: '7d', interval: '6h' },
  ];

  // Process chart data from real backend
  const chartData = useMemo(() => {
    if (!trafficVisualization?.data) return [];
    
    return trafficVisualization.data.map((point: any, index: number) => ({
      time: new Date(point.time).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      packets: point.totalPackets || 0,
      bytes: point.totalBytes || 0,
      rate: point.averagePacketRate || 0,
      sources: point.uniqueSourceIps || 0,
      index
    }));
  }, [trafficVisualization]);

  // Process real source IP data from backend
  const sourceIPs = useMemo(() => {
    if (!trafficStats?.data) return [];
    
    const totalPackets = trafficStats.data.reduce((sum: number, item: any) => sum + (item.totalPackets || 0), 0);
    
    return trafficStats.data
      .map((item: any) => ({
        ip: item.sourceIp,
        packets: item.totalPackets || 0,
        percentage: totalPackets > 0 ? Math.round((item.totalPackets / totalPackets) * 100) : 0,
        risk: item.totalPackets > 100000 ? 'high' : 
              item.totalPackets > 10000 ? 'medium' : 'low',
        bytes: item.totalBytes || 0
      }))
      .sort((a: any, b: any) => b.packets - a.packets)
      .slice(0, 5); // Top 5 sources
  }, [trafficStats]);

  const handleExportData = () => {
    if (trafficStats?.data && trafficStats.data.length > 0) {
      exportWithNotification(
        () => exportTrafficData(trafficStats.data, selectedTimeRange),
        'Traffic data exported successfully'
      );
    } else {
      toast.error('No traffic data available to export');
    }
  };

  const protocolData = [
    { name: 'HTTP', value: 45, color: '#0ea5e9' },
    { name: 'HTTPS', value: 35, color: '#10b981' },
    { name: 'TCP', value: 12, color: '#f59e0b' },
    { name: 'UDP', value: 8, color: '#ef4444' },
  ];

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

  const currentStats = {
    totalPackets: trafficStats?.data?.totalPackets || 0,
    totalBytes: trafficStats?.data?.totalBytes || 0,
    uniqueSources: trafficStats?.data?.uniqueSourceIps || 0,
    averageRate: trafficStats?.data?.averagePacketRate || 0,
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border border-border/50 shadow-xl"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg sm:rounded-xl">
                <Network className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Traffic Monitor
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  Real-time network traffic analysis and monitoring
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 sm:gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 border border-border/50 w-full sm:w-auto overflow-x-auto">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  size="sm"
                  variant={selectedTimeRange === range.value ? 'primary' : 'ghost'}
                  onClick={() => {
                    setSelectedTimeRange(range.value);
                    setSelectedInterval(range.interval);
                  }}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  {range.label}
                </Button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiveMode(!isLiveMode)}
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

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Packets</p>
                    <p className="text-3xl font-bold text-foreground">
                      {statsLoading ? '...' : formatNumber(currentStats.totalPackets)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-500 font-semibold">+15.2%</span>
                      <span className="text-xs text-muted-foreground">vs last period</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Network className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Data Volume</p>
                    <p className="text-3xl font-bold text-foreground">
                      {statsLoading ? '...' : formatNumber(currentStats.totalBytes)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-500 font-semibold">+8.5%</span>
                      <span className="text-xs text-muted-foreground">throughput</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Activity className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Unique Sources</p>
                    <p className="text-3xl font-bold text-foreground">
                      {statsLoading ? '...' : currentStats.uniqueSources.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">distinct IPs</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <MapPin className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Average Rate</p>
                    <p className="text-3xl font-bold text-foreground">
                      {statsLoading ? '...' : Math.round(currentStats.averageRate).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-500 font-semibold">+12.1%</span>
                      <span className="text-xs text-muted-foreground">packets/sec</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Charts */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Traffic Over Time */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">Traffic Over Time</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Packet flow analysis</p>
                  </div>
                  <Badge variant="outline" size="sm">
                    {isLiveMode && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />}
                    {isLiveMode ? 'LIVE' : 'PAUSED'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {visualizationLoading ? (
                  <div className="h-60 sm:h-80 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-60 sm:h-80 flex items-center justify-center">
                    <div className="text-center">
                      <Network className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                      <p className="text-sm text-muted-foreground">No traffic data</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-60 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border), 0.3)" />
                        <XAxis 
                          dataKey="time" 
                          stroke="rgba(var(--muted-foreground), 0.5)"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="rgba(var(--muted-foreground), 0.5)"
                          fontSize={12}
                          tickFormatter={formatNumber}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(var(--popover), 0.98)',
                            border: '1px solid rgba(var(--border), 0.5)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(12px)'
                          }}
                          labelFormatter={(label) => `Time: ${label}`}
                          formatter={(value: any, name: string) => [
                            formatNumber(value),
                            name === 'packets' ? 'Packets' : 'Bytes'
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="packets"
                          stroke="#0ea5e9"
                          fill="url(#packetsGradient)"
                          strokeWidth={2}
                        />
                        <defs>
                          <linearGradient id="packetsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Protocol Distribution */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <h3 className="text-base sm:text-lg font-semibold">Protocol Distribution</h3>
              </CardHeader>
              <CardContent className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={protocolData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {protocolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f3f4f6'
                      }}
                      formatter={(value: any) => [`${value}%`, 'Traffic']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Top Source IPs and Real-time Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Source IPs */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <h3 className="text-base sm:text-lg font-semibold">Top Source IPs</h3>
                  <Button size="sm" variant="outline" leftIcon={<Filter className="w-3 h-3 sm:w-4 sm:h-4" />}>
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sourceIPs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No traffic data available</p>
                    </div>
                  ) : (
                    sourceIPs.map((source: any, index: number) => (
                    <motion.div
                      key={source.ip}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-medium">
                            {source.ip}
                          </span>
                          <Badge
                            severity={source.risk === 'high' ? 'critical' : 
                                    source.risk === 'medium' ? 'medium' : 'normal'}
                            size="sm"
                          >
                            {source.risk.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatNumber(source.packets)} packets
                          </span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <motion.div
                              className="bg-primary-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${source.percentage}%` }}
                              transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {source.percentage}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Real-time Activity */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <h3 className="text-base sm:text-lg font-semibold">Real-time Activity</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Live Feed
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {realTimeLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <LoadingSpinner variant="dots" text="Loading activity..." />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Activity */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Current Traffic Rate
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {formatNumber(currentStats.averageRate)} packets/sec
                          </p>
                        </div>
                        <Badge variant="secondary" size="sm">
                          LIVE
                        </Badge>
                      </div>
                    </div>

                    {/* Recent Events */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recent Events
                      </h4>
                      {[1, 2, 3, 4, 5].map((_, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-lg text-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatTimeAgo(new Date(Date.now() - index * 30000))}
                          </span>
                          <span className="flex-1 text-gray-800 dark:text-gray-200">
                            Traffic spike from 192.168.1.{100 + index}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
    </div>
  );
}