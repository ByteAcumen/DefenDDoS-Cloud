'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

// Interfaces
interface ChartData {
  timestamp: string;
  time: string;
  packets?: number;
  bytes?: number;
  attacks?: number;
  blocked?: number;
  confidence?: number;
  anomaly?: number;
  [key: string]: any;
}

interface ChartProps {
  data: ChartData[];
  loading?: boolean;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  animated?: boolean;
  realTime?: boolean;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    timeframe: string;
  };
  icon?: React.ReactNode;
  trend?: ChartData[];
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  loading?: boolean;
}

// Enhanced color themes with light/dark mode support
const getLightColors = () => ({
  primary: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  purple: '#8B5CF6',
  info: '#06B6D4',
  orange: '#F97316',
  pink: '#EC4899',
  gradient: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F97316', '#EC4899'],
  background: '#FFFFFF',
  foreground: '#0F172A',
  muted: '#F8FAFC',
  border: '#E2E8F0'
});

const getDarkColors = () => ({
  primary: '#60A5FA',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  purple: '#A78BFA',
  info: '#22D3EE',
  orange: '#FB923C',
  pink: '#F472B6',
  gradient: ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F87171', '#22D3EE', '#FB923C', '#F472B6'],
  background: '#0F172A',
  foreground: '#F8FAFC',
  muted: '#1E293B',
  border: '#334155'
});

// Enhanced Custom Tooltip with better formatting and theming
const CustomTooltip = ({ active, payload, label, labelFormatter }: any) => {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === 'light' ? getLightColors() : getDarkColors();
  
  if (active && payload && payload.length) {
    return (
      <div 
        className="p-4 rounded-xl shadow-2xl border backdrop-blur-sm"
        style={{
          backgroundColor: `${colors.background}f0`,
          borderColor: colors.border,
          color: colors.foreground
        }}
      >
        <div className="mb-2 pb-2 border-b" style={{ borderColor: colors.border }}>
          <p className="text-sm font-semibold">
            {labelFormatter ? labelFormatter(label) : new Date(label).toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium">{entry.name}:</span>
              </div>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Enhanced Traffic Timeline Chart with better theming and data details
export const TrafficTimelineChart: React.FC<ChartProps> = ({
  data,
  loading = false,
  title = 'Traffic Timeline',
  height = 300,
  showLegend = true,
  showGrid = true,
  animated = true,
  className
}) => {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === 'light' ? getLightColors() : getDarkColors();
  
  // Memoize processed data to prevent recalculation on every render
  const chartData = useMemo(() => data || [], [data]);
  const hasData = chartData.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              {title}
            </h3>
            <Badge variant="outline" size="sm">
              {chartData.length} {hasData ? 'points' : 'No data'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 text-primary-500 animate-pulse" />
                <p className="text-sm text-muted-foreground">Loading traffic data...</p>
              </div>
            </div>
          ) : !hasData ? (
            <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No traffic data available</p>
                <p className="text-xs text-muted-foreground mt-1">Data will appear once traffic is ingested</p>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={colors.border}
                  opacity={0.3}
                />
              )}
              <XAxis 
                dataKey="time"
                tick={{ fontSize: 12, fill: colors.foreground }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: colors.foreground }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: colors.foreground }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
                tickFormatter={(value) => {
                  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}GB`;
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}MB`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}KB`;
                  return `${value}B`;
                }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                labelFormatter={(label) => `Time: ${label}`}
              />
              {showLegend && <Legend wrapperStyle={{ color: colors.foreground }} />}
              
              <defs>
                <linearGradient id="packetsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="bytesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.success} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={colors.success} stopOpacity={0.1}/>
                </linearGradient>
              </defs>

              <Area
                type="monotone"
                dataKey="packets"
                stroke={colors.primary}
                fillOpacity={1}
                fill="url(#packetsGradient)"
                name="Packets/sec"
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  fill: colors.primary,
                  stroke: colors.background,
                  strokeWidth: 2
                }}
              />
              <Area
                type="monotone"
                dataKey="bytes"
                stroke={colors.success}
                fillOpacity={1}
                fill="url(#bytesGradient)"
                name="Bytes/sec"
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  fill: colors.success,
                  stroke: colors.background,
                  strokeWidth: 2
                }}
                yAxisId="right"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Enhanced Attack Detection Chart with severity levels and better data details
export const AttackDetectionChart: React.FC<ChartProps> = ({
  data,
  loading = false,
  title = 'Attack Detection Timeline',
  height = 250,
  className
}) => {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === 'light' ? getLightColors() : getDarkColors();
  
  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div 
              className="rounded" 
              style={{ height: `${height}px`, backgroundColor: colors.muted }}
            ></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process data to include severity levels
  const processedData = data && data.length > 0 ? data.map(item => ({
    ...item,
    critical: (item.severity === 'CRITICAL' || item.critical > 0) ? (item.critical || item.attacks || 1) : 0,
    high: (item.severity === 'HIGH' || item.high > 0) ? (item.high || item.attacks || 1) : 0,
    medium: (item.severity === 'MEDIUM' || item.medium > 0) ? (item.medium || item.attacks || 1) : 0,
    low: (item.severity === 'LOW' || item.low > 0) ? (item.low || item.attacks || 1) : 0,
  })) : [];

  const hasData = processedData.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.1 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" style={{ color: colors.danger }} />
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.danger }}></div>
                <span className="text-xs">Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.warning }}></div>
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.info }}></div>
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.success }}></div>
                <span className="text-xs">Low</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No attack detection events</p>
                <p className="text-xs text-muted-foreground mt-1">System is actively monitoring</p>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={colors.border} 
                opacity={0.3} 
              />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: colors.foreground }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: colors.foreground }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Bar 
                dataKey="critical" 
                stackId="severity"
                fill={colors.danger}
                radius={[0, 0, 0, 0]}
                name="Critical Attacks"
              />
              <Bar 
                dataKey="high" 
                stackId="severity"
                fill={colors.warning}
                radius={[0, 0, 0, 0]}
                name="High Severity"
              />
              <Bar 
                dataKey="medium" 
                stackId="severity"
                fill={colors.info}
                radius={[0, 0, 0, 0]}
                name="Medium Severity"
              />
              <Bar 
                dataKey="low" 
                stackId="severity"
                fill={colors.success}
                radius={[4, 4, 0, 0]}
                name="Low Severity"
              />
            </BarChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ML Confidence Chart
export const MLConfidenceChart: React.FC<ChartProps> = ({
  data,
  loading = false,
  title = 'ML Model Performance',
  height = 200,
  className
}) => {
  const { theme } = useTheme();
  const resolvedTheme = theme || 'dark';
  const colors = resolvedTheme === 'light' ? getLightColors() : getDarkColors();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[200px] bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {title}
          </h3>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No ML predictions yet</p>
                <p className="text-xs text-muted-foreground mt-1">ML models ready to analyze traffic</p>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis 
                domain={[0, 1]} 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip 
                formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Confidence']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke={colors.primary}
                strokeWidth={3}
                dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              {data.some(d => d.anomaly) && (
                <Line 
                  type="monotone" 
                  dataKey="anomaly" 
                  stroke={colors.warning}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Threat Distribution Pie Chart
export const ThreatDistributionChart: React.FC<{
  data: Array<{ name: string; value: number; }>;
  loading?: boolean;
  className?: string;
}> = ({ data, loading = false, className }) => {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === 'light' ? getLightColors() : getDarkColors();
  
  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.length > 0 && data.some(d => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, rotate: -10 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" />
            Threat Distribution
          </h3>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No threat data available</p>
                <p className="text-xs text-muted-foreground mt-1">System is monitoring for threats</p>
              </div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors.gradient[index % colors.gradient.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Metric Card with Mini Chart
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  color = 'blue',
  loading = false
}) => {
  const { resolvedTheme } = useTheme();
  const themeColors = resolvedTheme === 'light' ? getLightColors() : getDarkColors();
  
  const colorClasses = {
    blue: resolvedTheme === 'light' 
      ? 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800'
      : 'text-blue-400 bg-blue-950 border-blue-800',
    green: resolvedTheme === 'light'
      ? 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800'
      : 'text-green-400 bg-green-950 border-green-800',
    red: resolvedTheme === 'light'
      ? 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800'
      : 'text-red-400 bg-red-950 border-red-800',
    yellow: resolvedTheme === 'light'
      ? 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800'
      : 'text-yellow-400 bg-yellow-950 border-yellow-800',
    purple: resolvedTheme === 'light'
      ? 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800'
      : 'text-purple-400 bg-purple-950 border-purple-800',
  };

  const getStrokeColor = (colorKey: typeof color) => {
    const colorMap: Record<string, string> = {
      blue: themeColors.primary,
      green: themeColors.success,
      red: themeColors.danger,
      yellow: themeColors.warning,
      purple: themeColors.purple,
    };
    return colorMap[colorKey] || themeColors.primary;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {icon && (
                  <div className={cn(
                    'p-2 rounded-lg',
                    colorClasses[color]
                  )}>
                    {icon}
                  </div>
                )}
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {title}
                </h3>
              </div>
              
              <div className="mb-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
              </div>

              {change && (
                <div className="flex items-center gap-1">
                  {change.type === 'increase' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    change.type === 'increase' ? 'text-green-500' : 'text-red-500'
                  )}>
                    {Math.abs(change.value)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    {change.timeframe}
                  </span>
                </div>
              )}
            </div>

            {trend && trend.length > 0 && (
              <div className="w-20 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={getStrokeColor(color)} 
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray={change?.type === 'decrease' ? '3 3' : '0'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Real-time Activity Feed
export const ActivityFeed: React.FC<{
  events: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
    details?: string;
  }>;
  className?: string;
}> = ({ events, className }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <Shield className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const hasEvents = events && events.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {!hasEvents ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">Events will appear here as they occur</p>
            </div>
          </div>
        ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              {getEventIcon(event.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {event.message}
                </p>
                {event.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {event.details}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(event.timestamp).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
};