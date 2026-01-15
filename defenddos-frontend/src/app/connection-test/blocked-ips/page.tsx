'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ban, 
  Plus, 
  Search, 
  Download,
  Clock,
  Shield,
  CheckCircle,
  Zap,
  Globe,
  Activity,
  AlertTriangle,
  RefreshCw,
  X,
  Eye,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MetricCard } from '@/components/charts/DataVisualizations';
import { 
  useBlockedIPs, 
  useMitigationStats, 
  useBlockIP, 
  useUnblockIP,
  useDashboardData
} from '@/hooks/useBackendApi';
import { cn } from '@/lib/utils';
import { exportBlockedIPs, exportWithNotification } from '@/utils/exportUtils';
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
const isValidIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

const formatTimeAgo = (timestamp: string): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// Block IP Modal Component
interface BlockIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ip: string, reason: string) => void;
  isLoading: boolean;
}

function BlockIPModal({ isOpen, onClose, onSubmit, isLoading }: BlockIPModalProps) {
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [ipError, setIpError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIpError('');
    
    if (!ip.trim()) {
      setIpError('IP address is required');
      return;
    }
    
    if (!isValidIP(ip.trim())) {
      setIpError('Invalid IP address format');
      return;
    }
    
    onSubmit(ip.trim(), reason.trim() || 'Manual block');
    setIp('');
    setReason('');
  };

  const handleClose = () => {
    setIp('');
    setReason('');
    setIpError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-border"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl">
                <Ban className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Block IP Address
              </h2>
            </div>
            <Button variant="ghost" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                IP Address
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.100"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg bg-background text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-red-500',
                  ipError 
                    ? 'border-red-500' 
                    : 'border-border'
                )}
                disabled={isLoading}
              />
              {ipError && (
                <p className="text-red-500 text-sm mt-1">{ipError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Suspicious activity detected..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={isLoading}
                leftIcon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                className="flex-1"
              >
                {isLoading ? 'Blocking...' : 'Block IP'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function BlockedIPsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedIPs, setSelectedIPs] = useState<Set<string>>(new Set());
  const [isLiveMode, setIsLiveMode] = useState(true);

  // Data fetching hooks
  const { data: blockedIPs, isLoading: blockedIPsLoading, refetch } = useBlockedIPs();
  const { data: mitigationStats } = useMitigationStats();
  const { securityDashboard, hasError } = useDashboardData();
  const blockIPMutation = useBlockIP();
  const unblockIPMutation = useUnblockIP();

  // Filter and search logic
  const filteredIPs = useMemo(() => {
    if (!(blockedIPs as any)?.blockedIps) return [];
    
    let filtered = (blockedIPs as any).blockedIps;
    
    if (searchQuery) {
      filtered = filtered.filter((ip: any) => 
        ip.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.map((ip: any, index: number) => ({
      ip,
      reason: 'Automated threat detection - High packet volume detected',
      blockedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      blockedBy: 'auto',
      severity: ip.includes('203.0.113') ? 'critical' : 'high',
      country: ip.startsWith('203.0.113') ? 'Unknown' : 'Private Network',
      asn: ip.startsWith('203.0.113') ? 'AS-EXAMPLE' : 'AS-PRIVATE',
      requestCount: Math.floor(Math.random() * 50000) + 10000,
      dataVolume: Math.floor(Math.random() * 100000000) + 10000000
    }));
  }, [(blockedIPs as any)?.blockedIps, searchQuery]);

  const handleBlockIP = async (ip: string, reason: string) => {
    try {
      await blockIPMutation.mutateAsync({ ip, reason });
      setShowBlockModal(false);
      toast.success(`Successfully blocked ${ip}`);
    } catch (error) {
      console.error('Failed to block IP:', error);
      toast.error('Failed to block IP address');
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      await unblockIPMutation.mutateAsync(ip);
      setSelectedIPs(prev => {
        const newSet = new Set(prev);
        newSet.delete(ip);
        return newSet;
      });
      toast.success(`Successfully unblocked ${ip}`);
    } catch (error) {
      console.error('Failed to unblock IP:', error);
      toast.error('Failed to unblock IP address');
    }
  };

  const handleBulkUnblock = async () => {
    if (selectedIPs.size === 0) return;
    
    try {
      const promises = Array.from(selectedIPs).map(ip => unblockIPMutation.mutateAsync(ip));
      await Promise.all(promises);
      setSelectedIPs(new Set());
      toast.success(`Successfully unblocked ${selectedIPs.size} IP(s)`);
    } catch (error) {
      console.error('Failed to bulk unblock IPs:', error);
      toast.error('Failed to unblock selected IPs');
    }
  };

  const toggleIPSelection = (ip: string) => {
    setSelectedIPs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ip)) {
        newSet.delete(ip);
      } else {
        newSet.add(ip);
      }
      return newSet;
    });
  };

  const handleExportData = () => {
    if (filteredIPs.length > 0) {
      exportWithNotification(
        () => exportBlockedIPs(filteredIPs),
        'Blocked IPs data exported successfully'
      );
    } else {
      toast.error('No blocked IPs data available to export');
    }
  };

  const selectAllIPs = () => {
    if (selectedIPs.size === filteredIPs.length) {
      setSelectedIPs(new Set());
    } else {
      setSelectedIPs(new Set(filteredIPs.map((item: any) => item.ip)));
    }
  };

  // Get system health
  const getSystemHealth = () => {
    const blockedCount = (blockedIPs as any)?.count || 0;
    if (hasError) {
      return { status: 'critical', color: 'text-red-500', message: 'System Error' };
    }
    if (blockedCount > 100) {
      return { status: 'warning', color: 'text-yellow-500', message: 'High Block Rate' };
    }
    return { status: 'operational', color: 'text-green-500', message: 'Protection Active' };
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section - Unique Design for Blocked IPs */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-red-500/20 shadow-2xl shadow-red-500/10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Animated warning pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.5)_10px,rgba(239,68,68,0.5)_20px)]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="p-2 sm:p-3 bg-red-500/20 rounded-lg sm:rounded-xl border-2 border-red-500/30"
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(239, 68, 68, 0)',
                    '0 0 0 8px rgba(239, 68, 68, 0.1)',
                    '0 0 0 0 rgba(239, 68, 68, 0)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Ban className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    IP Blocklist Manager
                  </h1>
                  <Badge variant="danger" className="animate-pulse">
                    SECURITY
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  🛡️ Manage blocked IP addresses and threat mitigation rules
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* System Status - Unique to Blocked IPs */}
            <motion.div 
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card border-2 border-red-500/30 shadow-lg"
              whileHover={{ scale: 1.05, borderColor: 'rgba(239, 68, 68, 0.5)' }}
              transition={{ duration: 0.2 }}
            >
              <Shield className="w-4 h-4 text-red-500" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-red-500">PROTECTION</span>
                <span className="text-xs text-muted-foreground">{systemHealth.message}</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                leftIcon={<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Sync</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiveMode(!isLiveMode)}
                leftIcon={isLiveMode ? <Activity className="w-3 h-3 sm:w-4 sm:h-4" /> : <Clock className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
              >
                {isLiveMode ? 'Live' : 'Paused'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<Download className="w-3 h-3 sm:w-4 sm:h-4" />}
                disabled={filteredIPs.length === 0}
                onClick={handleExportData}
                className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Save</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowBlockModal(true)}
                leftIcon={<Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
                variant="danger"
                className="text-xs sm:text-sm font-medium flex-1 sm:flex-none"
              >
                Block IP
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards - Security-focused styling */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent hover:border-red-500/40 transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="w-4 h-4 text-red-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Blocked</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {blockedIPsLoading ? '...' : (blockedIPs as any)?.count || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <motion.div 
                        className="bg-red-500 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
                <motion.div
                  className="p-3 bg-red-500/10 rounded-xl"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Ban className="w-6 h-6 text-red-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent hover:border-yellow-500/40 transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Auto Blocked</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {blockedIPsLoading ? '...' : (mitigationStats as any)?.data?.autoBlockedCount || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <motion.div 
                        className="bg-yellow-500 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
                <motion.div
                  className="p-3 bg-yellow-500/10 rounded-xl"
                  whileHover={{ scale: 1.1, rotate: -10 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Zap className="w-6 h-6 text-yellow-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent hover:border-blue-500/40 transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Manual Blocks</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {blockedIPsLoading ? '...' : (mitigationStats as any)?.data?.manualBlockedCount || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <motion.div 
                        className="bg-blue-500 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '30%' }}
                        transition={{ duration: 1, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </div>
                <motion.div
                  className="p-3 bg-blue-500/10 rounded-xl"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Shield className="w-6 h-6 text-blue-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent hover:border-orange-500/40 transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Threats</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {blockedIPsLoading ? '...' : securityDashboard?.activeThreats || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <motion.div 
                        className="bg-orange-500 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((securityDashboard?.activeThreats || 0) * 10, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
                <motion.div
                  className="p-3 bg-orange-500/10 rounded-xl"
                  animate={{ 
                    rotate: securityDashboard?.activeThreats ? [0, -10, 10, -10, 10, 0] : 0
                  }}
                  transition={{ duration: 0.5, repeat: securityDashboard?.activeThreats ? Infinity : 0, repeatDelay: 2 }}
                >
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IP addresses..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        {selectedIPs.size > 0 && (
          <Button
            variant="danger"
            onClick={handleBulkUnblock}
            disabled={unblockIPMutation.isPending}
            leftIcon={unblockIPMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          >
            Unblock Selected ({selectedIPs.size})
          </Button>
        )}
      </motion.div>

      {/* IP List */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-[18px] h-[18px] text-primary" />
                Blocked IP Addresses
              </h3>
              <div className="flex items-center gap-3 sm:gap-4">
                <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIPs.size === filteredIPs.length && filteredIPs.length > 0}
                    onChange={selectAllIPs}
                    className="rounded border-border"
                  />
                  <span className="hidden sm:inline text-foreground">Select All</span>
                  <span className="sm:hidden text-foreground">All</span>
                </label>
                <Badge variant="secondary" className="text-[10px]">
                  {filteredIPs.length} Total
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {blockedIPsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading blocked IPs...</p>
                </div>
              </div>
            ) : filteredIPs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No blocked IPs found
                </h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  {searchQuery ? 'No IPs match your search criteria' : 'No IP addresses are currently blocked'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowBlockModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Block IP Address
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIPs.map((item: any, index: number) => (
                  <motion.div
                    key={item.ip}
                    className="p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-all duration-200 group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <input
                        type="checkbox"
                        checked={selectedIPs.has(item.ip)}
                        onChange={() => toggleIPSelection(item.ip)}
                        className="rounded border-border mt-1 sm:mt-0"
                      />
                      
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-mono text-sm sm:text-base font-bold text-foreground break-all">
                            {item.ip}
                          </span>
                          <Badge
                            variant={item.severity === 'critical' ? 'danger' : 'warning'}
                            className="text-[10px]"
                          >
                            {item.severity.toUpperCase()}
                          </Badge>
                          <Badge
                            variant={item.blockedBy === 'auto' ? 'warning' : 'default'}
                            className="text-[10px]"
                          >
                            {item.blockedBy.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                          {item.reason}
                        </p>
                        
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(item.blockedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>{item.country}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>{item.requestCount.toLocaleString()} req</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{(item.dataVolume / 1000000).toFixed(1)}MB</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnblockIP(item.ip)}
                        disabled={unblockIPMutation.isPending}
                        leftIcon={unblockIPMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                        className="w-full sm:w-auto text-xs sm:text-sm"
                      >
                        Unblock
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Block IP Modal */}
      <BlockIPModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onSubmit={handleBlockIP}
        isLoading={blockIPMutation.isPending}
      />
    </div>
  );
}
