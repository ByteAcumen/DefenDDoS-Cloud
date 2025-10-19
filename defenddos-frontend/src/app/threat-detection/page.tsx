'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Activity,
  Clock,
  Ban,
  Target,
  RefreshCw,
  ChevronRight,
  Globe,
  Eye,
  Play,
  Pause,
  Download
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { 
  useMitigationStats,
  useBlockIP
} from '@/hooks/useDefenDDoS';
import { formatTimeAgo, cn, formatBytes } from '@/utils';

// Mock data for threat analysis visualization
const threatTimeline = [
  { time: '00:00', suspicious: 23, blocked: 15, critical: 3 },
  { time: '04:00', suspicious: 45, blocked: 28, critical: 7 },
  { time: '08:00', suspicious: 67, blocked: 41, critical: 12 },
  { time: '12:00', suspicious: 89, blocked: 52, critical: 18 },
  { time: '16:00', suspicious: 134, blocked: 78, critical: 25 },
  { time: '20:00', suspicious: 156, blocked: 94, critical: 31 },
  { time: '24:00', suspicious: 98, blocked: 61, critical: 19 }
];

const threatTypes = [
  { name: 'DDoS Attacks', value: 35, color: '#DC2626' },
  { name: 'Port Scans', value: 28, color: '#EA580C' },
  { name: 'Brute Force', value: 18, color: '#D97706' },
  { name: 'SQL Injection', value: 12, color: '#CA8A04' },
  { name: 'XSS Attempts', value: 7, color: '#65A30D' }
];

const geoThreatData = [
  { country: 'China', threats: 1245, severity: 'critical' },
  { country: 'Russia', threats: 987, severity: 'high' },
  { country: 'North Korea', threats: 654, severity: 'critical' },
  { country: 'Iran', threats: 432, severity: 'high' },
  { country: 'Unknown', threats: 321, severity: 'medium' }
];

const anomalyData = [
  { metric: 'Traffic Volume', current: 85, baseline: 45, anomaly: true },
  { metric: 'Request Rate', current: 92, baseline: 35, anomaly: true },
  { metric: 'Error Rate', current: 15, baseline: 12, anomaly: false },
  { metric: 'Response Time', current: 240, baseline: 180, anomaly: true },
  { metric: 'Bandwidth Usage', current: 78, baseline: 55, anomaly: true },
  { metric: 'Connection Count', current: 1200, baseline: 800, anomaly: true }
];

interface Threat {
  id: string;
  ip: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  timestamp: string;
  requestCount: number;
  dataVolume: number;
  country: string;
  city: string;
  asn: string;
  isp: string;
  description?: string;
}

interface ThreatDetailsModalProps {
  threat: Threat | null;
  isOpen: boolean;
  onClose: () => void;
  onBlock: (ip: string) => void;
  isBlocking: boolean;
}

function ThreatDetailsModal({ threat, isOpen, onClose, onBlock, isBlocking }: ThreatDetailsModalProps) {
  if (!isOpen || !threat) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              threat.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' :
              threat.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
              'bg-yellow-100 dark:bg-yellow-900'
            )}>
              <AlertTriangle className={cn(
                'w-5 h-5',
                threat.severity === 'critical' ? 'text-red-600' :
                threat.severity === 'high' ? 'text-orange-600' :
                'text-yellow-600'
              )} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Threat Analysis
              </h2>
              <Badge severity={threat.severity} size="sm" className="mt-1">
                {threat.severity.toUpperCase()} THREAT
              </Badge>
            </div>
          </div>
          
          <Button variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Threat Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Source IP:</span>
                <span className="font-mono">{threat.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Attack Type:</span>
                <span>{threat.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">First Seen:</span>
                <span>{formatTimeAgo(threat.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Requests:</span>
                <span>{threat.requestCount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Data Volume:</span>
                <span>{formatBytes(threat.dataVolume)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Location & ASN</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Country:</span>
                <span>{threat.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">City:</span>
                <span>{threat.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ASN:</span>
                <span>{threat.asn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ISP:</span>
                <span>{threat.isp}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Attack Pattern</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {threat.description}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button 
            variant="danger" 
            onClick={() => onBlock(threat.ip)}
            isLoading={isBlocking}
            leftIcon={<Ban className="w-4 h-4" />}
            className="flex-1"
          >
            Block IP Address
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ThreatDetectionPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [showThreatModal, setShowThreatModal] = useState(false);

  // Data fetching hooks
  const { data: mitigationStats } = useMitigationStats();
  const blockIPMutation = useBlockIP();

  // Mock connection status
  const isConnected = true;
  
  // Mock real-time threat data
  const [realtimeThreats] = useState([
    {
      id: 1,
      ip: '203.0.113.45',
      type: 'DDoS Attack',
      severity: 'critical',
      requestCount: 15420,
      dataVolume: 125000000,
      country: 'China',
      city: 'Beijing',
      asn: 'AS4134',
      isp: 'China Telecom',
      timestamp: new Date().toISOString(),
      description: 'High-volume HTTP flood attack targeting multiple endpoints. Requests show coordinated pattern with rotating User-Agent headers and distributed source patterns.'
    },
    {
      id: 2,
      ip: '198.51.100.123',
      type: 'Port Scan',
      severity: 'high',
      requestCount: 2340,
      dataVolume: 45000000,
      country: 'Russia',
      city: 'Moscow',
      asn: 'AS8342',
      isp: 'VimpelCom',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      description: 'Systematic port scanning activity detected across multiple services. Pattern suggests reconnaissance for vulnerable services.'
    }
  ]);

  const handleBlockThreat = async (ip: string) => {
    try {
      await blockIPMutation.mutateAsync({ 
        ip, 
        reason: `Threat detected: ${selectedThreat?.type || 'Security threat'}` 
      });
      setShowThreatModal(false);
      setSelectedThreat(null);
    } catch (error) {
      console.error('Failed to block threat IP:', error);
    }
  };

  const openThreatDetails = (threat: Threat) => {
    setSelectedThreat(threat);
    setShowThreatModal(true);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Threat Detection & Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time threat monitoring and advanced security analytics
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected && isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                )} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected && isLiveMode ? 'Live Monitoring' : 'Offline'}
                </span>
              </div>
              
              <Button
                variant={isLiveMode ? 'danger' : 'primary'}
                onClick={() => setIsLiveMode(!isLiveMode)}
                leftIcon={isLiveMode ? <Pause /> : <Play />}
                size="sm"
              >
                {isLiveMode ? 'Pause' : 'Start'} Live Mode
              </Button>
              
              <Button variant="outline" leftIcon={<Download />}>
                Export Report
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Real-time KPI Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <KPICard
              title="Active Threats"
              value={realtimeThreats.length}
              change={15}
              trend="up"
              severity="critical"
              icon={<AlertTriangle className="w-6 h-6" />}
              sparklineData={[12, 18, 25, 32, 28, 35, realtimeThreats.length]}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <KPICard
              title="Blocked This Hour"
              value={mitigationStats?.data?.blockedCount || 247}
              change={23}
              trend="up"
              severity="high"
              icon={<Ban className="w-6 h-6" />}
              sparklineData={[180, 200, 220, 235, 240, 245, 247]}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <KPICard
              title="Suspicious IPs"
              value={1847}
              change={-8}
              trend="down"
              severity="medium"
              icon={<Eye className="w-6 h-6" />}
              sparklineData={[2100, 2050, 1980, 1920, 1880, 1850, 1847]}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <KPICard
              title="Attack Intensity"
              value={8.7}
              unit="/10"
              change={12}
              trend="up"
              severity="critical"
              icon={<Activity className="w-6 h-6" />}
              sparklineData={[6.2, 7.1, 7.8, 8.2, 8.5, 8.6, 8.7]}
            />
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Threat Timeline Chart */}
          <motion.div variants={itemVariants}>
            <Card className="h-[400px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">24-Hour Threat Activity</h3>
                  <Badge variant="secondary" size="sm">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={threatTimeline}>
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
                      dataKey="critical" 
                      stackId="1"
                      stroke="#DC2626" 
                      fill="#DC2626"
                      fillOpacity={0.8}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="blocked" 
                      stackId="1"
                      stroke="#EA580C" 
                      fill="#EA580C"
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="suspicious" 
                      stackId="1"
                      stroke="#D97706" 
                      fill="#D97706"
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Threat Types Distribution */}
          <motion.div variants={itemVariants}>
            <Card className="h-[400px]">
              <CardHeader>
                <h3 className="text-lg font-semibold">Attack Types Distribution</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={threatTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {threatTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Real-time Threats List */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Active Threats</h3>
                  <div className="flex items-center gap-2">
                    <RefreshCw 
                      className={cn('w-4 h-4', isLiveMode && 'animate-spin')} 
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {isLiveMode ? 'Auto-refresh' : 'Paused'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AnimatePresence>
                    {realtimeThreats.map((threat) => (
                      <motion.div
                        key={threat.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        onClick={() => openThreatDetails(threat)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-3 h-3 rounded-full animate-pulse',
                              threat.severity === 'critical' ? 'bg-red-500' : 
                              threat.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                            )} />
                            <span className="font-mono text-lg font-bold">
                              {threat.ip}
                            </span>
                            <Badge severity={threat.severity} size="sm">
                              {threat.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{threat.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>{threat.requestCount.toLocaleString()} requests</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>{threat.country}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(threat.timestamp)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Geographic Threat Origins */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader>
                <h3 className="text-lg font-semibold">Top Threat Origins</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geoThreatData.map((geo, index) => (
                    <motion.div
                      key={geo.country}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div>
                        <div className="font-medium">{geo.country}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {geo.threats.toLocaleString()} threats
                        </div>
                      </div>
                      <Badge severity={geo.severity as any} size="sm">
                        {geo.severity.toUpperCase()}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Anomaly Detection */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Anomaly Detection</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {anomalyData.map((anomaly, index) => (
                  <motion.div
                    key={anomaly.metric}
                    className={cn(
                      'p-4 rounded-lg border',
                      anomaly.anomaly 
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    )}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{anomaly.metric}</span>
                      {anomaly.anomaly && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {typeof anomaly.current === 'number' && anomaly.current > 100 
                        ? anomaly.current.toLocaleString() 
                        : `${anomaly.current}%`}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Baseline: {typeof anomaly.baseline === 'number' && anomaly.baseline > 100 
                        ? anomaly.baseline.toLocaleString() 
                        : `${anomaly.baseline}%`}
                    </div>
                    {anomaly.anomaly && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                        ⚠ Anomaly detected
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Threat Details Modal */}
      <ThreatDetailsModal
        threat={selectedThreat}
        isOpen={showThreatModal}
        onClose={() => setShowThreatModal(false)}
        onBlock={handleBlockThreat}
        isBlocking={blockIPMutation.isPending}
      />
    </div>
  );
}