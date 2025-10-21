'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  Cell
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  Network, 
  Eye, 
  TrendingUp,
  Database,
  Cpu,
  Globe,
  Zap,
  Target,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

// Enhanced interfaces for comprehensive data
interface NetworkTrafficData {
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  packetCount: number;
  byteCount: number;
  protocol: string;
  port: number;
  isBlocked: boolean;
  threatLevel: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mlConfidence?: number;
  anomalyScore?: number;
  geoLocation?: {
    country: string;
    city: string;
    lat: number;
    lng: number;
  };
}

interface MLAnalyticsData {
  timestamp: string;
  modelType: 'RandomForest' | 'LSTM' | 'Combined';
  confidence: number;
  prediction: 'BENIGN' | 'DOS' | 'DDOS' | 'PROBE' | 'U2R' | 'R2L';
  processingTime: number;
  accuracy: number;
  falsePositives: number;
  truePositives: number;
}

interface SystemMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUtilization: number;
  activeConnections: number;
  blockedRequests: number;
  processedPackets: number;
  systemLoad: number;
}

// Enhanced color palette with theme support
const getAdvancedColors = (theme: 'light' | 'dark') => ({
  primary: theme === 'light' ? '#3B82F6' : '#60A5FA',
  secondary: theme === 'light' ? '#6366F1' : '#818CF8',
  success: theme === 'light' ? '#10B981' : '#34D399',
  warning: theme === 'light' ? '#F59E0B' : '#FBBF24',
  danger: theme === 'light' ? '#EF4444' : '#F87171',
  info: theme === 'light' ? '#06B6D4' : '#22D3EE',
  purple: theme === 'light' ? '#8B5CF6' : '#A78BFA',
  pink: theme === 'light' ? '#EC4899' : '#F472B6',
  gradient: [
    theme === 'light' ? '#3B82F6' : '#60A5FA',
    theme === 'light' ? '#8B5CF6' : '#A78BFA',
    theme === 'light' ? '#10B981' : '#34D399',
    theme === 'light' ? '#F59E0B' : '#FBBF24',
    theme === 'light' ? '#EF4444' : '#F87171',
    theme === 'light' ? '#06B6D4' : '#22D3EE',
  ],
});

// Network Flow Visualization Chart
export const NetworkFlowChart: React.FC<{
  data: NetworkTrafficData[];
  loading?: boolean;
  className?: string;
}> = ({ data, loading = false, className }) => {
  const { resolvedTheme } = useTheme();
  const colors = getAdvancedColors(resolvedTheme);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  // Process data for network flow visualization
  const processedData = useMemo(() => {
    const filtered = selectedProtocol === 'all' 
      ? data 
      : data.filter(d => d.protocol === selectedProtocol);

    return filtered.reduce((acc: any[], item) => {
      const timeKey = new Date(item.timestamp).toLocaleTimeString();
      const existing = acc.find(a => a.time === timeKey);
      
      if (existing) {
        existing.totalPackets += item.packetCount;
        existing.totalBytes += item.byteCount;
        existing.threatCount += item.threatLevel !== 'NORMAL' ? 1 : 0;
        existing.blockedCount += item.isBlocked ? 1 : 0;
      } else {
        acc.push({
          time: timeKey,
          timestamp: item.timestamp,
          totalPackets: item.packetCount,
          totalBytes: item.byteCount,
          threatCount: item.threatLevel !== 'NORMAL' ? 1 : 0,
          blockedCount: item.isBlocked ? 1 : 0,
          avgThreatLevel: item.threatLevel === 'CRITICAL' ? 5 : 
                         item.threatLevel === 'HIGH' ? 4 :
                         item.threatLevel === 'MEDIUM' ? 3 :
                         item.threatLevel === 'LOW' ? 2 : 1
        });
      }
      
      return acc;
    }, []);
  }, [data, selectedProtocol]);

  const protocols = useMemo(() => {
    const prots = ['all', ...new Set(data.map(d => d.protocol))];
    return prots;
  }, [data]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[400px] bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5" style={{ color: colors.primary }} />
              <h3 className="text-lg font-semibold">Network Flow Analysis</h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedProtocol}
                onChange={(e) => setSelectedProtocol(e.target.value)}
                className="px-3 py-1 text-sm rounded-md border border-border bg-background"
              >
                {protocols.map(protocol => (
                  <option key={protocol} value={protocol}>
                    {protocol.toUpperCase()}
                  </option>
                ))}
              </select>
              <Badge variant="secondary" size="sm">
                {processedData.length} intervals
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gradient[0]} opacity={0.1} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                stroke={resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                stroke={resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke={resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: resolvedTheme === 'light' ? '#FFFFFF' : '#1F2937',
                  border: `1px solid ${resolvedTheme === 'light' ? '#E5E7EB' : '#374151'}`,
                  borderRadius: '8px',
                  color: resolvedTheme === 'light' ? '#111827' : '#F9FAFB'
                }}
              />
              <Legend />
              
              <Bar 
                yAxisId="left"
                dataKey="totalPackets" 
                fill={colors.primary} 
                name="Packets"
                opacity={0.7}
              />
              <Bar 
                yAxisId="right"
                dataKey="threatCount" 
                fill={colors.danger} 
                name="Threats"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgThreatLevel" 
                stroke={colors.warning} 
                strokeWidth={3}
                name="Threat Level"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ML Model Performance Analytics
export const MLPerformanceChart: React.FC<{
  data: MLAnalyticsData[];
  loading?: boolean;
  className?: string;
}> = ({ data, loading = false, className }) => {
  const { resolvedTheme } = useTheme();
  const colors = getAdvancedColors(resolvedTheme);

  const performanceData = useMemo(() => {
    return data.map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString(),
      accuracyPercent: item.accuracy * 100,
      f1Score: (2 * item.truePositives) / (2 * item.truePositives + item.falsePositives),
      precision: item.truePositives / (item.truePositives + item.falsePositives) || 0,
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[350px] bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: colors.purple }} />
              <h3 className="text-lg font-semibold">ML Model Performance</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                Avg Accuracy: {(data.reduce((acc, d) => acc + d.accuracy, 0) / data.length * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gradient[0]} opacity={0.1} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                stroke={resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                stroke={resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name.includes('Percent') || name.includes('Score') || name.includes('precision')) {
                    return [`${value.toFixed(2)}%`, name];
                  }
                  return [`${value.toFixed(3)}ms`, name];
                }}
                contentStyle={{
                  backgroundColor: resolvedTheme === 'light' ? '#FFFFFF' : '#1F2937',
                  border: `1px solid ${resolvedTheme === 'light' ? '#E5E7EB' : '#374151'}`,
                  borderRadius: '8px',
                  color: resolvedTheme === 'light' ? '#111827' : '#F9FAFB'
                }}
              />
              <Legend />
              
              <Line 
                type="monotone" 
                dataKey="accuracyPercent" 
                stroke={colors.success} 
                strokeWidth={3}
                name="Accuracy %"
                dot={{ r: 4, fill: colors.success }}
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke={colors.primary} 
                strokeWidth={2}
                name="Confidence"
                dot={{ r: 3, fill: colors.primary }}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="precision" 
                stroke={colors.purple} 
                strokeWidth={2}
                name="Precision"
                dot={{ r: 3, fill: colors.purple }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// System Resource Monitoring
export const SystemResourceChart: React.FC<{
  data: SystemMetrics[];
  loading?: boolean;
  className?: string;
}> = ({ data, loading = false, className }) => {
  const { resolvedTheme } = useTheme();
  const colors = getAdvancedColors(resolvedTheme);

  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString(),
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[300px] bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5" style={{ color: colors.info }} />
              <h3 className="text-lg font-semibold">System Resources</h3>
            </div>
            <div className="flex gap-1">
              <Badge 
                variant={data[data.length - 1]?.cpuUsage > 80 ? "destructive" : "secondary"} 
                size="sm"
              >
                CPU: {data[data.length - 1]?.cpuUsage?.toFixed(1)}%
              </Badge>
              <Badge 
                variant={data[data.length - 1]?.memoryUsage > 85 ? "destructive" : "secondary"} 
                size="sm"
              >
                RAM: {data[data.length - 1]?.memoryUsage?.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gradient[0]} opacity={0.1} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                stroke={resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                stroke={resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: any) => [`${value.toFixed(1)}%`, '']}
                contentStyle={{
                  backgroundColor: resolvedTheme === 'light' ? '#FFFFFF' : '#1F2937',
                  border: `1px solid ${resolvedTheme === 'light' ? '#E5E7EB' : '#374151'}`,
                  borderRadius: '8px',
                  color: resolvedTheme === 'light' ? '#111827' : '#F9FAFB'
                }}
              />
              <Legend />
              
              <Line 
                type="monotone" 
                dataKey="cpuUsage" 
                stroke={colors.danger} 
                strokeWidth={3}
                name="CPU Usage"
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="memoryUsage" 
                stroke={colors.warning} 
                strokeWidth={3}
                name="Memory Usage"
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="diskUsage" 
                stroke={colors.info} 
                strokeWidth={2}
                name="Disk Usage"
                dot={{ r: 2 }}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="networkUtilization" 
                stroke={colors.purple} 
                strokeWidth={2}
                name="Network Usage"
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Geographic Threat Map (Heatmap style)
export const GeographicThreatChart: React.FC<{
  data: Array<{
    country: string;
    threatCount: number;
    blockedCount: number;
    severity: number;
  }>;
  loading?: boolean;
  className?: string;
}> = ({ data, loading = false, className }) => {
  const { resolvedTheme } = useTheme();
  const colors = getAdvancedColors(resolvedTheme);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[350px] bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for treemap
  const treemapData = data.map(item => ({
    name: item.country,
    size: item.threatCount,
    blocked: item.blockedCount,
    severity: item.severity
  }));

  const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name, size } = props;
    const intensity = (size / Math.max(...data.map(d => d.threatCount))) * 100;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: intensity > 80 ? colors.danger : 
                  intensity > 50 ? colors.warning : 
                  intensity > 20 ? colors.info : colors.success,
            stroke: resolvedTheme === 'light' ? '#FFFFFF' : '#1F2937',
            strokeWidth: 2,
            fillOpacity: 0.8
          }}
        />
        {width > 60 && height > 40 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill={resolvedTheme === 'light' ? '#FFFFFF' : '#FFFFFF'}
            fontSize={12}
            fontWeight="bold"
          >
            {name}
          </text>
        )}
        {width > 80 && height > 60 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 15}
            textAnchor="middle"
            fill={resolvedTheme === 'light' ? '#FFFFFF' : '#FFFFFF'}
            fontSize={10}
          >
            {size} threats
          </text>
        )}
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: colors.info }} />
              <h3 className="text-lg font-semibold">Geographic Threat Distribution</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.danger }}></div>
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.warning }}></div>
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
          <ResponsiveContainer width="100%" height={350}>
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4/3}
              stroke={resolvedTheme === 'light' ? '#FFFFFF' : '#1F2937'}
              content={<CustomizedContent />}
            />
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Real-time Threat Radar
export const ThreatRadarChart: React.FC<{
  data: Array<{
    category: string;
    current: number;
    average: number;
    max: number;
  }>;
  loading?: boolean;
  className?: string;
}> = ({ data, loading = false, className }) => {
  const { resolvedTheme } = useTheme();
  const colors = getAdvancedColors(resolvedTheme);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[300px] bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, rotate: -5 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" style={{ color: colors.purple }} />
              <h3 className="text-lg font-semibold">Threat Assessment Radar</h3>
            </div>
            <Badge variant="outline" size="sm">
              Real-time
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke={colors.gradient[0]} opacity={0.3} />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ 
                  fontSize: 12,
                  fill: resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'
                }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]}
                tick={{ 
                  fontSize: 10,
                  fill: resolvedTheme === 'light' ? '#6B7280' : '#9CA3AF'
                }}
              />
              <Radar 
                name="Current" 
                dataKey="current" 
                stroke={colors.danger} 
                fill={colors.danger} 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar 
                name="Average" 
                dataKey="average" 
                stroke={colors.info} 
                fill={colors.info} 
                fillOpacity={0.1}
                strokeDasharray="5 5"
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};