'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  PieChart,
  LineChart,
  AreaChart,
  Target,
  Shield,
  Activity,
  AlertTriangle,
  Clock,
  Globe,
  Users,
  Server,
  Zap,
  Database
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
import { KPICard } from '@/components/ui/KPICard';
import { cn, formatNumber, formatBytes, formatTimeAgo, storage } from '@/utils';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  overview: {
    totalThreats: number;
    threatsBlocked: number;
    successRate: number;
    avgResponseTime: number;
    dataProcessed: number;
    uptime: number;
  };
  timeSeriesData: Array<{
    timestamp: string;
    threats: number;
    blocked: number;
    allowed: number;
    response_time: number;
    bandwidth: number;
  }>;
  threatsByType: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  geographicData: Array<{
    country: string;
    threats: number;
    blocked: number;
    lat: number;
    lng: number;
  }>;
  topAttackers: Array<{
    ip: string;
    country: string;
    attempts: number;
    lastSeen: string;
    status: 'blocked' | 'monitoring' | 'allowed';
  }>;
  performanceMetrics: Array<{
    metric: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }>;
}

const generateMockData = (): AnalyticsData => {
  const now = Date.now();
  const timeSeriesData = Array.from({ length: 24 }, (_, i) => {
    const time = new Date(now - (23 - i) * 60 * 60 * 1000);
    const threats = Math.floor(Math.random() * 1000) + 100;
    const blocked = Math.floor(threats * (0.7 + Math.random() * 0.25));
    return {
      timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      threats,
      blocked,
      allowed: threats - blocked,
      response_time: Math.random() * 50 + 10,
      bandwidth: Math.random() * 100 + 20,
    };
  });

  const threatTypes = [
    { type: 'DDoS Attack', count: 1250, percentage: 45, color: '#ef4444' },
    { type: 'Brute Force', count: 850, percentage: 30, color: '#f97316' },
    { type: 'SQL Injection', count: 420, percentage: 15, color: '#eab308' },
    { type: 'XSS', count: 280, percentage: 10, color: '#3b82f6' },
  ];

  const countries = ['USA', 'China', 'Russia', 'Brazil', 'India', 'UK', 'Germany', 'France'];
  const geographicData = countries.map(country => ({
    country,
    threats: Math.floor(Math.random() * 500) + 50,
    blocked: Math.floor(Math.random() * 400) + 30,
    lat: Math.random() * 180 - 90,
    lng: Math.random() * 360 - 180,
  }));

  const generateIP = () => Array.from({ length: 4 }, () => Math.floor(Math.random() * 255)).join('.');
  const topAttackers = Array.from({ length: 10 }, () => ({
    ip: generateIP(),
    country: countries[Math.floor(Math.random() * countries.length)],
    attempts: Math.floor(Math.random() * 1000) + 100,
    lastSeen: new Date(now - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    status: ['blocked', 'monitoring', 'allowed'][Math.floor(Math.random() * 3)] as any,
  }));

  const performanceMetrics = [
    { metric: 'Avg Response Time', value: 25, unit: 'ms', trend: 'down', change: -5 },
    { metric: 'CPU Usage', value: 45, unit: '%', trend: 'stable', change: 0 },
    { metric: 'Memory Usage', value: 67, unit: '%', trend: 'up', change: 3 },
    { metric: 'Throughput', value: 15000, unit: 'req/s', trend: 'up', change: 12 },
    { metric: 'Error Rate', value: 0.05, unit: '%', trend: 'down', change: -0.02 },
    { metric: 'Blocked Rate', value: 85, unit: '%', trend: 'up', change: 2 },
  ];

  const totalThreats = timeSeriesData.reduce((sum, d) => sum + d.threats, 0);
  const totalBlocked = timeSeriesData.reduce((sum, d) => sum + d.blocked, 0);

  return {
    overview: {
      totalThreats,
      threatsBlocked: totalBlocked,
      successRate: (totalBlocked / totalThreats) * 100,
      avgResponseTime: 25,
      dataProcessed: 1.2 * 1024 * 1024 * 1024, // 1.2 TB
      uptime: 99.97,
    },
    timeSeriesData,
    threatsByType: threatTypes,
    geographicData,
    topAttackers,
    performanceMetrics,
  };
};

export function AnalyticsReports() {
  const [data, setData] = useState<AnalyticsData>(generateMockData());
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('threats');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      setData(generateMockData());
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleExportReport = async (format: 'pdf' | 'csv' | 'json') => {
    setIsLoading(true);
    try {
      const exportData = {
        reportDate: new Date().toISOString(),
        timeRange: selectedTimeRange,
        data: data,
        summary: {
          totalThreats: data.overview.totalThreats,
          successRate: data.overview.successRate.toFixed(2) + '%',
          uptime: data.overview.uptime.toFixed(2) + '%',
          avgResponseTime: data.overview.avgResponseTime + 'ms'
        }
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          filename = `defenddos-analytics-${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          // Convert time series data to CSV
          const headers = ['timestamp', 'threats', 'blocked', 'allowed', 'response_time', 'bandwidth'];
          const csvRows = [headers.join(',')];
          data.timeSeriesData.forEach(row => {
            csvRows.push([
              row.timestamp,
              row.threats,
              row.blocked,
              row.allowed,
              row.response_time.toFixed(2),
              row.bandwidth.toFixed(2)
            ].join(','));
          });
          content = csvRows.join('\n');
          filename = `defenddos-analytics-${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        case 'pdf':
          // For demo purposes, export as JSON (in real app, would generate PDF)
          content = JSON.stringify(exportData, null, 2);
          filename = `defenddos-analytics-${Date.now()}.json`;
          mimeType = 'application/json';
          toast.success('PDF export would be implemented with a PDF generation library');
          break;
        default:
          throw new Error('Invalid format');
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

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    setData(generateMockData());
    setLastUpdated(new Date());
    toast.success('Data refreshed');
  };

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics & Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive security analytics and performance insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated: {formatTimeAgo(lastUpdated)}</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport('csv')}
              isLoading={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport('json')}
              isLoading={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleExportReport('pdf')}
              isLoading={isLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF Report
            </Button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Time Range:
                </span>
              </div>
              <div className="flex gap-2">
                {['1h', '6h', '24h', '7d', '30d'].map((range) => (
                  <Button
                    key={range}
                    size="sm"
                    variant={selectedTimeRange === range ? 'primary' : 'outline'}
                    onClick={() => setSelectedTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="threats">All Threats</option>
                <option value="blocked">Blocked Only</option>
                <option value="allowed">Allowed Only</option>
                <option value="response_time">Response Time</option>
                <option value="bandwidth">Bandwidth</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Threats"
          value={formatNumber(data.overview.totalThreats)}
          change="+"
          changeValue={`${((Math.random() * 20) + 5).toFixed(1)}%`}
          icon={<Shield className="w-6 h-6" />}
          trend="up"
          color="red"
          animate
        />
        
        <KPICard
          title="Success Rate"
          value={`${data.overview.successRate.toFixed(1)}%`}
          change="+"
          changeValue={`${((Math.random() * 5) + 1).toFixed(1)}%`}
          icon={<Target className="w-6 h-6" />}
          trend="up"
          color="green"
          animate
        />
        
        <KPICard
          title="Avg Response Time"
          value={`${data.overview.avgResponseTime}ms`}
          change="-"
          changeValue={`${((Math.random() * 10) + 2).toFixed(1)}ms`}
          icon={<Zap className="w-6 h-6" />}
          trend="down"
          color="blue"
          animate
        />
        
        <KPICard
          title="System Uptime"
          value={`${data.overview.uptime.toFixed(2)}%`}
          change="+"
          changeValue={`${((Math.random() * 0.1) + 0.01).toFixed(2)}%`}
          icon={<Activity className="w-6 h-6" />}
          trend="up"
          color="green"
          animate
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Series Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Threat Activity Timeline</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time threat detection and response metrics
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedMetric === 'threats' ? 'primary' : 'outline'}
                  onClick={() => setSelectedMetric('threats')}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Threats
                </Button>
                <Button
                  size="sm"
                  variant={selectedMetric === 'response_time' ? 'primary' : 'outline'}
                  onClick={() => setSelectedMetric('response_time')}
                >
                  <LineChart className="w-4 h-4 mr-1" />
                  Response
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.timeSeriesData}>
                  <defs>
                    <linearGradient id="threatsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="rgb(156, 163, 175)"
                    fontSize={12}
                  />
                  <YAxis stroke="rgb(156, 163, 175)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="threats"
                    stroke="#ef4444"
                    fill="url(#threatsGradient)"
                    strokeWidth={2}
                    name="Total Threats"
                  />
                  <Area
                    type="monotone"
                    dataKey="blocked"
                    stroke="#10b981"
                    fill="url(#blockedGradient)"
                    strokeWidth={2}
                    name="Blocked Threats"
                  />
                  <Line
                    type="monotone"
                    dataKey="response_time"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    name="Response Time (ms)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Threat Types Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Threat Distribution</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Types of threats detected
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={data.threatsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {data.threatsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [formatNumber(value), 'Count']}
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2 mt-4">
              {data.threatsByType.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(item.count)}</span>
                    <span className="text-gray-500 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Performance Metrics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Key system performance indicators and trends
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.performanceMetrics.map((metric, index) => (
              <motion.div
                key={metric.metric}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.metric}
                  </span>
                  <div className={cn(
                    'flex items-center gap-1 text-xs',
                    metric.trend === 'up' ? 'text-green-500' :
                    metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  )}>
                    {metric.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                    {metric.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                    {metric.change !== 0 && (
                      <span>
                        {metric.change > 0 ? '+' : ''}{metric.change}
                        {metric.unit === '%' ? 'pp' : metric.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(metric.value)}{metric.unit}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Attackers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Top Threat Sources</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Most active attacking IP addresses and their status
              </p>
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">IP Address</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Country</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Attempts</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Last Seen</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.topAttackers.map((attacker, index) => (
                  <motion.tr
                    key={attacker.ip}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-3 px-4 font-mono text-sm">{attacker.ip}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        {attacker.country}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        {formatNumber(attacker.attempts)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatTimeAgo(attacker.lastSeen)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          attacker.status === 'blocked' ? 'danger' :
                          attacker.status === 'monitoring' ? 'warning' : 'success'
                        }
                      >
                        {attacker.status}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Data Processed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatBytes(data.overview.dataProcessed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Threats Blocked</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(data.overview.threatsBlocked)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.overview.uptime.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsReports;
