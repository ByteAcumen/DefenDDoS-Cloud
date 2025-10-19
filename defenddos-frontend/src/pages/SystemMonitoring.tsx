'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Database,
  Monitor,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Download,
  Zap,
  Clock,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { cn, formatBytes, formatNumber, formatTimeAgo } from '@/utils';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
    processes: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    available: number;
    percentage: number;
    iops: number;
  };
  network: {
    inbound: number;
    outbound: number;
    connections: number;
    latency: number;
  };
  services: {
    name: string;
    status: 'running' | 'stopped' | 'error';
    uptime: string;
    cpu: number;
    memory: number;
  }[];
}

const generateMockMetrics = (): SystemMetrics => ({
  cpu: {
    usage: Math.random() * 100,
    cores: 8,
    temperature: 45 + Math.random() * 20,
    processes: 150 + Math.floor(Math.random() * 50)
  },
  memory: {
    used: 6.4 + Math.random() * 2,
    total: 16,
    available: 9.6 - Math.random() * 2,
    percentage: (6.4 + Math.random() * 2) / 16 * 100
  },
  disk: {
    used: 120 + Math.random() * 50,
    total: 500,
    available: 330 - Math.random() * 50,
    percentage: (120 + Math.random() * 50) / 500 * 100,
    iops: 1000 + Math.random() * 2000
  },
  network: {
    inbound: Math.random() * 100,
    outbound: Math.random() * 80,
    connections: 45 + Math.floor(Math.random() * 20),
    latency: 10 + Math.random() * 50
  },
  services: [
    { name: 'DefenDDoS Core', status: 'running', uptime: '15d 4h 23m', cpu: Math.random() * 30, memory: Math.random() * 500 },
    { name: 'Security Engine', status: 'running', uptime: '15d 4h 23m', cpu: Math.random() * 20, memory: Math.random() * 300 },
    { name: 'ML Analyzer', status: 'running', uptime: '15d 4h 23m', cpu: Math.random() * 40, memory: Math.random() * 800 },
    { name: 'API Gateway', status: 'running', uptime: '15d 4h 23m', cpu: Math.random() * 15, memory: Math.random() * 200 },
    { name: 'Database', status: 'running', uptime: '15d 4h 23m', cpu: Math.random() * 25, memory: Math.random() * 1000 },
    { name: 'Log Processor', status: 'running', uptime: '15d 4h 23m', cpu: Math.random() * 10, memory: Math.random() * 150 }
  ]
});

const generateHistoricalData = (hours: number) => {
  const data = [];
  const now = Date.now();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100,
    });
  }
  
  return data;
};

export function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics>(generateMockMetrics());
  const [historicalData, setHistoricalData] = useState(generateHistoricalData(24));
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoRefresh) {
      interval = setInterval(() => {
        setMetrics(generateMockMetrics());
        setLastUpdated(new Date());
        
        // Update historical data
        setHistoricalData(prev => {
          const newData = [...prev.slice(1)];
          const now = new Date();
          newData.push({
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            disk: Math.random() * 100,
            network: Math.random() * 100,
          });
          return newData;
        });
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh, refreshInterval]);

  const systemHealthScore = () => {
    const cpuScore = Math.max(0, 100 - metrics.cpu.usage);
    const memoryScore = Math.max(0, 100 - metrics.memory.percentage);
    const diskScore = Math.max(0, 100 - metrics.disk.percentage);
    const networkScore = Math.max(0, 100 - (metrics.network.latency / 100 * 100));
    
    return Math.round((cpuScore + memoryScore + diskScore + networkScore) / 4);
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'excellent', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' };
    if (score >= 60) return { status: 'good', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' };
    if (score >= 40) return { status: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' };
    return { status: 'critical', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' };
  };

  const healthScore = systemHealthScore();
  const healthStatus = getHealthStatus(healthScore);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  const resourceData = [
    { name: 'CPU', value: metrics.cpu.usage, color: COLORS[0] },
    { name: 'Memory', value: metrics.memory.percentage, color: COLORS[1] },
    { name: 'Disk', value: metrics.disk.percentage, color: COLORS[2] },
    { name: 'Network', value: (metrics.network.latency / 100) * 100, color: COLORS[3] }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            System Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time system performance and health metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated: {formatTimeAgo(lastUpdated)}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMetrics(generateMockMetrics());
              setLastUpdated(new Date());
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            variant={isAutoRefresh ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            {isAutoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-6 rounded-xl border transition-all duration-300',
          healthStatus.bg,
          'border-gray-200 dark:border-gray-700'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'p-3 rounded-full',
              healthStatus.color.replace('text-', 'bg-').replace('-500', '-100'),
              'dark:' + healthStatus.color.replace('text-', 'bg-').replace('-500', '-900')
            )}>
              {healthScore >= 80 ? (
                <CheckCircle className={cn('w-8 h-8', healthStatus.color)} />
              ) : (
                <AlertTriangle className={cn('w-8 h-8', healthStatus.color)} />
              )}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                System Health: {healthScore}/100
              </h3>
              <p className={cn('font-medium capitalize', healthStatus.color)}>
                {healthStatus.status}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Services Running
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metrics.services.filter(s => s.status === 'running').length}/{metrics.services.length}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="CPU Usage"
          value={`${metrics.cpu.usage.toFixed(1)}%`}
          change={Math.random() > 0.5 ? '+' : '-'}
          changeValue={`${(Math.random() * 5).toFixed(1)}%`}
          icon={<Cpu className="w-6 h-6" />}
          trend={Math.random() > 0.5 ? 'up' : 'down'}
          color={metrics.cpu.usage > 80 ? 'red' : metrics.cpu.usage > 60 ? 'yellow' : 'green'}
          animate
        />
        
        <KPICard
          title="Memory Usage"
          value={`${formatBytes(metrics.memory.used * 1024 * 1024 * 1024)}`}
          subtitle={`${metrics.memory.percentage.toFixed(1)}% of ${formatBytes(metrics.memory.total * 1024 * 1024 * 1024)}`}
          icon={<HardDrive className="w-6 h-6" />}
          trend={Math.random() > 0.5 ? 'up' : 'down'}
          color={metrics.memory.percentage > 80 ? 'red' : metrics.memory.percentage > 60 ? 'yellow' : 'green'}
          animate
        />
        
        <KPICard
          title="Disk Usage"
          value={`${formatBytes(metrics.disk.used * 1024 * 1024 * 1024)}`}
          subtitle={`${metrics.disk.percentage.toFixed(1)}% of ${formatBytes(metrics.disk.total * 1024 * 1024 * 1024)}`}
          icon={<Database className="w-6 h-6" />}
          trend={Math.random() > 0.5 ? 'up' : 'down'}
          color={metrics.disk.percentage > 80 ? 'red' : metrics.disk.percentage > 60 ? 'yellow' : 'green'}
          animate
        />
        
        <KPICard
          title="Network Latency"
          value={`${metrics.network.latency.toFixed(0)}ms`}
          subtitle={`${metrics.network.connections} connections`}
          icon={<Wifi className="w-6 h-6" />}
          trend={Math.random() > 0.5 ? 'up' : 'down'}
          color={metrics.network.latency > 50 ? 'red' : metrics.network.latency > 25 ? 'yellow' : 'green'}
          animate
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historical Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Performance History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Resource usage over time
                </p>
              </div>
              
              <div className="flex gap-2">
                {['1h', '6h', '24h', '7d'].map((range) => (
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
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="memory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgb(156, 163, 175)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgb(156, 163, 175)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#0ea5e9"
                    fillOpacity={1}
                    fill="url(#cpu)"
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#memory)"
                    strokeWidth={2}
                    name="Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resource Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Resource Distribution</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current usage breakdown
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={resourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Usage']}
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
              {resourceData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Services Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor running services and their resource usage
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Service</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Uptime</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">CPU</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Memory</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.services.map((service, index) => (
                  <motion.tr
                    key={service.name}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{service.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          service.status === 'running' ? 'success' :
                          service.status === 'error' ? 'danger' : 'warning'
                        }
                      >
                        {service.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {service.uptime}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all duration-300',
                              service.cpu > 70 ? 'bg-red-500' :
                              service.cpu > 40 ? 'bg-yellow-500' : 'bg-green-500'
                            )}
                            style={{ width: `${service.cpu}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {service.cpu.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatBytes(service.memory * 1024 * 1024)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Activity className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SystemMonitoring;
