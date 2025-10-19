'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useSystemStatus,
  useMLHealth,
  useMitigationStats
} from '@/hooks/useDefenDDoS';
import { cn, getStatusColor } from '@/utils';

// Mock system metrics data
const cpuUsageData = [
  { time: '00:00', usage: 45 },
  { time: '04:00', usage: 52 },
  { time: '08:00', usage: 68 },
  { time: '12:00', usage: 75 },
  { time: '16:00', usage: 82 },
  { time: '20:00', usage: 65 },
  { time: '24:00', usage: 58 }
];

const networkTrafficData = [
  { time: '00:00', inbound: 120, outbound: 85 },
  { time: '04:00', inbound: 145, outbound: 92 },
  { time: '08:00', inbound: 180, outbound: 110 },
  { time: '12:00', inbound: 220, outbound: 135 },
  { time: '16:00', inbound: 280, outbound: 165 },
  { time: '20:00', inbound: 195, outbound: 125 },
  { time: '24:00', inbound: 160, outbound: 98 }
];

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
  responseTime: number;
  lastCheck: string;
  icon: React.ReactNode;
  description: string;
}

const systemServices: ServiceStatus[] = [
  {
    name: 'DefenDDoS API',
    status: 'operational',
    uptime: '99.98%',
    responseTime: 45,
    lastCheck: '2 minutes ago',
    icon: <Server className="w-5 h-5" />,
    description: 'Main API service for DDoS protection'
  },
  {
    name: 'InfluxDB Database',
    status: 'operational',
    uptime: '99.95%',
    responseTime: 12,
    lastCheck: '1 minute ago',
    icon: <Database className="w-5 h-5" />,
    description: 'Time-series database for metrics storage'
  },
  {
    name: 'ML Detection Engine',
    status: 'operational',
    uptime: '99.92%',
    responseTime: 156,
    lastCheck: '30 seconds ago',
    icon: <Activity className="w-5 h-5" />,
    description: 'Machine learning threat detection service'
  },
  {
    name: 'Threat Mitigation',
    status: 'operational',
    uptime: '99.99%',
    responseTime: 8,
    lastCheck: '1 minute ago',
    icon: <Shield className="w-5 h-5" />,
    description: 'Automated IP blocking and mitigation system'
  }
];

export default function SystemPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Data fetching hooks
  const { data: systemStatus, isLoading: statusLoading, refetch: refetchStatus } = useSystemStatus();
  const { data: mlHealth, isLoading: mlLoading } = useMLHealth();
  const { data: mitigationStats } = useMitigationStats();

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchStatus();
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refetchStatus]);

  const handleManualRefresh = () => {
    refetchStatus();
    setLastRefresh(new Date());
  };

  // Mock system metrics
  const systemMetrics = {
    cpu: { usage: 68, cores: 8, temperature: 52 },
    memory: { used: 9.2, total: 16, percentage: 57.5 },
    disk: { used: 245, total: 512, percentage: 47.8 },
    network: { inbound: 280, outbound: 165 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} isMenuOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={cn(
        'transition-all duration-500',
        sidebarOpen ? 'ml-[280px]' : 'ml-[80px]',
        'px-6 py-8'
      )}>
        {/* Page Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                System Monitoring
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time system health, performance metrics, and service status
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                )} />
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                leftIcon={<RefreshCw className={cn('w-4 h-4', autoRefresh && 'animate-spin')} />}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh Now
              </Button>

              <Button variant="outline" leftIcon={<Download />}>
                Export Report
              </Button>
            </div>
          </div>
        </motion.div>

        {/* System Overview KPIs */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <KPICard
              title="CPU Usage"
              value={systemMetrics.cpu.usage}
              unit="%"
              change={5.2}
              trend="up"
              severity={systemMetrics.cpu.usage > 80 ? 'critical' : systemMetrics.cpu.usage > 60 ? 'medium' : 'normal'}
              icon={<Cpu className="w-6 h-6" />}
              subtitle={`${systemMetrics.cpu.cores} cores @ ${systemMetrics.cpu.temperature}°C`}
              sparklineData={cpuUsageData.map(d => d.usage)}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <KPICard
              title="Memory Usage"
              value={systemMetrics.memory.percentage}
              unit="%"
              change={-2.1}
              trend="down"
              severity={systemMetrics.memory.percentage > 85 ? 'critical' : 'normal'}
              icon={<MemoryStick className="w-6 h-6" />}
              subtitle={`${systemMetrics.memory.used}GB / ${systemMetrics.memory.total}GB`}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <KPICard
              title="Disk Usage"
              value={systemMetrics.disk.percentage}
              unit="%"
              change={1.3}
              trend="up"
              severity={systemMetrics.disk.percentage > 90 ? 'critical' : systemMetrics.disk.percentage > 70 ? 'medium' : 'normal'}
              icon={<HardDrive className="w-6 h-6" />}
              subtitle={`${systemMetrics.disk.used}GB / ${systemMetrics.disk.total}GB`}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <KPICard
              title="Network Traffic"
              value={systemMetrics.network.inbound + systemMetrics.network.outbound}
              unit="MB/s"
              change={15.7}
              trend="up"
              severity="normal"
              icon={<Network className="w-6 h-6" />}
              subtitle={`↓${systemMetrics.network.inbound} ↑${systemMetrics.network.outbound} MB/s`}
            />
          </motion.div>
        </motion.div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* CPU Usage Chart */}
          <motion.div variants={itemVariants}>
            <Card className="h-[400px]">
              <CardHeader>
                <h3 className="text-lg font-semibold">CPU Usage (24h)</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cpuUsageData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(17 24 39)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="usage"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      name="CPU Usage"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Network Traffic Chart */}
          <motion.div variants={itemVariants}>
            <Card className="h-[400px]">
              <CardHeader>
                <h3 className="text-lg font-semibold">Network Traffic (24h)</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={networkTrafficData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(17 24 39)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="inbound"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Inbound"
                    />
                    <Area
                      type="monotone"
                      dataKey="outbound"
                      stackId="1"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.6}
                      name="Outbound"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Services Status */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Service Status</h3>
                <div className="flex items-center gap-2">
                  {statusLoading || mlLoading ? (
                    <LoadingSpinner variant="dots" size="sm" />
                  ) : (
                    <Badge variant="secondary" size="sm">
                      All services monitored
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemServices.map((service, index) => {
                  const statusColors = getStatusColor(service.status);
                  
                  return (
                    <motion.div
                      key={service.name}
                      className={cn(
                        'p-4 rounded-lg border transition-colors hover:shadow-md',
                        statusColors.bg,
                        service.status === 'operational' ? 'border-green-200 dark:border-green-800' :
                        service.status === 'degraded' ? 'border-yellow-200 dark:border-yellow-800' :
                        'border-red-200 dark:border-red-800'
                      )}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg',
                            service.status === 'operational' ? 'bg-green-100 dark:bg-green-900 text-green-600' :
                            service.status === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600' :
                            'bg-red-100 dark:bg-red-900 text-red-600'
                          )}>
                            {service.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold">{service.name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {service.description}
                            </p>
                          </div>
                        </div>
                        
                        {service.status === 'operational' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : service.status === 'degraded' ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                          <div className="font-semibold">{service.uptime}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Response:</span>
                          <div className="font-semibold">{service.responseTime}ms</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                        Last checked: {service.lastCheck}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
