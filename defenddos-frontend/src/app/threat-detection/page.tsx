'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Activity,
  Clock,
  Ban,
  Target,
  RefreshCw,
  Shield,
  Eye,
  Download,
  Zap,
  Globe,
  MapPin,
  Network,
  TrendingUp,
  Server,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Database,
  Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  MetricCard,
  ThreatDistributionChart,
  AttackDetectionChart,
  ActivityFeed
} from '@/components/charts/DataVisualizations';
import { 
  useAllDetectionEvents,
  useAllMLPredictions,
  useBlockIP,
  useDashboardData
} from '@/hooks/useBackendApi';
import { cn } from '@/lib/utils';

// Animation variants matching dashboard
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

// Threat interface
interface ThreatDetail {
  id: string;
  ip: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  timestamp: string;
  requestCount: number;
  dataVolume: number;
  country?: string;
  city?: string;
  asn?: string;
  isp?: string;
  description?: string;
  confidence?: number;
}

// Threat Details Modal Component
interface ThreatDetailsModalProps {
  threat: ThreatDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onBlock: (ip: string) => void;
  isBlocking: boolean;
}

function ThreatDetailsModal({ threat, isOpen, onClose, onBlock, isBlocking }: ThreatDetailsModalProps) {
  if (!isOpen || !threat) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 sm:p-3 rounded-lg sm:rounded-xl',
                threat.severity === 'critical' ? 'bg-red-500/10' :
                threat.severity === 'high' ? 'bg-orange-500/10' :
                threat.severity === 'medium' ? 'bg-yellow-500/10' :
                'bg-blue-500/10'
              )}>
                <AlertTriangle className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6',
                  threat.severity === 'critical' ? 'text-red-500' :
                  threat.severity === 'high' ? 'text-orange-500' :
                  threat.severity === 'medium' ? 'text-yellow-500' :
                  'text-blue-500'
                )} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Threat Analysis
                </h2>
                <Badge 
                  variant={
                    threat.severity === 'critical' ? 'danger' :
                    threat.severity === 'high' ? 'warning' :
                    'default'
                  }
                  className="mt-1"
                >
                  {threat.severity.toUpperCase()} THREAT
                </Badge>
              </div>
            </div>
            
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Threat Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Threat Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Source IP:</span>
                  <span className="font-mono font-semibold text-foreground">{threat.ip}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Attack Type:</span>
                  <span className="font-medium text-foreground">{threat.type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">First Seen:</span>
                  <span className="text-foreground">{formatTimeAgo(threat.timestamp)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Requests:</span>
                  <span className="font-semibold text-foreground">{threat.requestCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Data Volume:</span>
                  <span className="font-semibold text-foreground">{formatBytes(threat.dataVolume)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Location & Network
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="text-foreground">{threat.country || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">City:</span>
                  <span className="text-foreground">{threat.city || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">ASN:</span>
                  <span className="font-mono text-foreground">{threat.asn || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">ISP:</span>
                  <span className="text-foreground">{threat.isp || 'Unknown'}</span>
                </div>
                {threat.confidence && (
                  <div className="flex justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-semibold text-primary">{(threat.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attack Pattern */}
          {threat.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Attack Pattern
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  {threat.description}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button 
              variant="danger" 
              onClick={() => onBlock(threat.ip)}
              disabled={isBlocking}
              leftIcon={isBlocking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              className="flex-1"
            >
              {isBlocking ? 'Blocking...' : 'Block IP Address'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ThreatDetectionPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('-1h');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<ThreatDetail | null>(null);
  const [showThreatModal, setShowThreatModal] = useState(false);

  // API hooks
  const { 
    securityDashboard,
    realtimeMetrics,
    isLoading: dashboardLoading,
    hasError,
    refetch
  } = useDashboardData();
  
  const { data: detectionEvents, isLoading: detectionLoading, refetch: refetchDetection } = useAllDetectionEvents(selectedTimeRange, !isPaused);
  const { data: mlPredictions, isLoading: mlLoading, refetch: refetchML } = useAllMLPredictions(selectedTimeRange, !isPaused);
  const blockIPMutation = useBlockIP();

  const overviewLoading = dashboardLoading || detectionLoading || mlLoading;

  // Process threat data
  const realtimeThreats = useMemo(() => {
    const threats: ThreatDetail[] = [];
    const detectionData = detectionEvents || [];
    
    if (Array.isArray(detectionData) && detectionData.length > 0) {
      detectionData.slice(0, 20).forEach((event: any, index: number) => {
        const severity = event.threatLevel || event.severity || 'medium';
        threats.push({
          id: `threat-${event.time || event._time || Date.now()}-${index}`,
          ip: event.sourceIp || event.source_ip || '0.0.0.0',
          type: event.attackType || event.attack_type || 'Unknown Attack',
          severity: severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low',
          requestCount: parseInt(event.packetCount || event.value || '0'),
          dataVolume: parseInt(event.bytes || event.totalBytes || '0'),
          timestamp: event.time || event._time || new Date().toISOString(),
          country: event.country || 'Unknown',
          city: event.city || 'Unknown',
          asn: event.asn || 'Unknown',
          isp: event.isp || 'Unknown',
          description: `Detected ${event.attackType || 'suspicious activity'} from ${event.sourceIp || 'unknown source'}. Threat level: ${severity}.`,
          confidence: parseFloat(event.confidence || '0.85')
        });
      });
    }

    return threats;
  }, [detectionEvents]);

  // Metrics
  const metrics = {
    activeThreats: realtimeThreats.filter(t => t.severity === 'critical' || t.severity === 'high').length,
    blockedCount: securityDashboard?.totalBlocked || 0,
    suspiciousIPs: realtimeThreats.length,
    attackIntensity: Math.min(10, (realtimeThreats.length / 10) * 10)
  };

  // Threat distribution
  const threatDistribution = useMemo(() => {
    if (!Array.isArray(mlPredictions) || mlPredictions.length === 0) {
      return [{ name: 'No Data', value: 1 }];
    }

    const attackTypes: { [key: string]: number } = {};
    let benignCount = 0;
    
    mlPredictions.forEach((pred: any) => {
      const isAttack = pred.isAttack === 'true' || pred.is_attack === true;
      if (isAttack && (pred.attackType || pred.attack_type)) {
        const attackType = pred.attackType || pred.attack_type;
        attackTypes[attackType] = (attackTypes[attackType] || 0) + 1;
      } else {
        benignCount++;
      }
    });
    
    const result = Object.entries(attackTypes).map(([name, value]) => ({ name, value }));
    if (benignCount > 0) result.push({ name: 'Benign', value: benignCount });
    return result.length > 0 ? result : [{ name: 'No Data', value: 1 }];
  }, [mlPredictions]);

  // Activity events from threats
  const activityEvents = useMemo(() => {
    return realtimeThreats.slice(0, 15).map(threat => ({
      id: threat.id,
      type: (threat.severity === 'critical' ? 'error' : threat.severity === 'high' ? 'warning' : 'info') as 'info' | 'warning' | 'error' | 'success',
      message: `${threat.type} detected from ${threat.ip}`,
      timestamp: threat.timestamp,
      details: `${threat.requestCount} requests, ${threat.country}`
    }));
  }, [realtimeThreats]);

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

  const openThreatDetails = (threat: ThreatDetail) => {
    setSelectedThreat(threat);
    setShowThreatModal(true);
  };

  // Get system health status
  const getSystemHealth = () => {
    const criticalThreats = metrics.activeThreats;
    if (hasError) {
      return { status: 'critical', color: 'text-red-500', message: 'System Error' };
    }
    if (criticalThreats > 10) {
      return { status: 'critical', color: 'text-red-500', message: 'High Threat Level' };
    } else if (criticalThreats > 5) {
      return { status: 'warning', color: 'text-yellow-500', message: 'Elevated Threats' };
    } else if (criticalThreats > 0) {
      return { status: 'warning', color: 'text-yellow-500', message: 'Threats Detected' };
    }
    return { status: 'operational', color: 'text-green-500', message: 'System Protected' };
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border border-border/50 shadow-xl"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Threat Detection & Analysis
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  Real-time threat monitoring powered by ML
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* System Health Badge */}
            <motion.div 
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse", {
                "bg-green-500 shadow-lg shadow-green-500/50": systemHealth.status === 'operational',
                "bg-yellow-500 shadow-lg shadow-yellow-500/50": systemHealth.status === 'warning',
                "bg-red-500 shadow-lg shadow-red-500/50": systemHealth.status === 'critical'
              })} />
              <span className="text-xs sm:text-sm font-semibold text-foreground">{systemHealth.message}</span>
            </motion.div>

            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => {
                setSelectedTimeRange(e.target.value);
                setTimeout(() => {
                  refetchDetection();
                  refetchML();
                }, 100);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-xs sm:text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 cursor-pointer hover:bg-card"
            >
              <option value="-5m">Last 5 minutes</option>
              <option value="-15m">Last 15 minutes</option>
              <option value="-1h">Last hour</option>
              <option value="-6h">Last 6 hours</option>
              <option value="-24h">Last 24 hours</option>
            </select>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              {isPaused && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchDetection();
                    refetchML();
                  }}
                  leftIcon={<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />}
                  className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
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
                leftIcon={isLiveMode ? <Activity className="w-3 h-3 sm:w-4 sm:h-4" /> : <Clock className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
              >
                {isLiveMode ? 'Live' : 'Paused'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Download className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Save</span>
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
          <MetricCard
            title="Active Threats"
            value={metrics.activeThreats}
            icon={<AlertTriangle className="w-[18px] h-[18px]" />}
            change={{
              value: 15,
              type: 'increase',
              timeframe: 'vs last hour'
            }}
            color={metrics.activeThreats > 5 ? 'red' : metrics.activeThreats > 0 ? 'yellow' : 'green'}
            loading={overviewLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Blocked This Hour"
            value={metrics.blockedCount}
            icon={<Ban className="w-[18px] h-[18px]" />}
            change={{
              value: 23,
              type: 'increase',
              timeframe: 'vs last hour'
            }}
            color="red"
            loading={overviewLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Suspicious IPs"
            value={metrics.suspiciousIPs}
            icon={<Eye className="w-[18px] h-[18px]" />}
            change={{
              value: 8,
              type: 'decrease',
              timeframe: 'vs last hour'
            }}
            color="yellow"
            loading={overviewLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Attack Intensity"
            value={`${metrics.attackIntensity.toFixed(1)}/10`}
            icon={<Activity className="w-[18px] h-[18px]" />}
            change={{
              value: 12,
              type: 'increase',
              timeframe: 'severity'
            }}
            color={metrics.attackIntensity > 7 ? 'red' : metrics.attackIntensity > 4 ? 'yellow' : 'green'}
            loading={overviewLoading}
          />
        </motion.div>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <AttackDetectionChart
            data={detectionEvents?.map((event: any) => {
              const time = new Date(event.time || event._time || event.timestamp).toLocaleTimeString();
              const severity = event.threatLevel || event.severity || 'LOW';
              return {
                time,
                timestamp: event.time || event._time || event.timestamp,
                attacks: 1,
                severity: severity,
                critical: severity === 'CRITICAL' ? 1 : 0,
                high: severity === 'HIGH' ? 1 : 0,
                medium: severity === 'MEDIUM' ? 1 : 0,
                low: severity === 'LOW' ? 1 : 0,
              };
            }) || []}
            title="Threat Detection Timeline"
            loading={overviewLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ThreatDistributionChart
            data={threatDistribution}
            loading={overviewLoading}
          />
        </motion.div>
      </motion.div>

      {/* Active Threats and Activity Feed */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Active Threats List */}
        <motion.div className="lg:col-span-2" variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Shield className="w-[18px] h-[18px] text-primary" />
                  Active Threats
                </h3>
                <div className="flex items-center gap-2">
                  {isLiveMode && (
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {realtimeThreats.length} Total
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {realtimeThreats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No active threats detected</p>
                  <p className="text-xs text-muted-foreground mt-1">System is secure</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  <AnimatePresence>
                    {realtimeThreats.map((threat, index) => (
                      <motion.div
                        key={threat.id}
                        className="p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-all duration-200 group"
                        onClick={() => openThreatDetails(threat)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={cn(
                              'w-2 h-2 sm:w-3 sm:h-3 rounded-full',
                              threat.severity === 'critical' ? 'bg-red-500 animate-pulse' : 
                              threat.severity === 'high' ? 'bg-orange-500 animate-pulse' :
                              threat.severity === 'medium' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            )} />
                            <span className="font-mono text-sm sm:text-base font-bold text-foreground">
                              {threat.ip}
                            </span>
                            <Badge 
                              variant={
                                threat.severity === 'critical' ? 'danger' :
                                threat.severity === 'high' ? 'warning' :
                                'default'
                              }
                              className="text-[10px]"
                            >
                              {threat.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{threat.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>{threat.requestCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>{threat.country}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(threat.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <ActivityFeed events={activityEvents} />
        </motion.div>
      </motion.div>

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
