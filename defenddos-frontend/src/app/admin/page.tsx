'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  Key,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UserPlus,
  Database,
  Server,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/charts/DataVisualizations';
import { useDashboardData, useBackendHealth, useMLHealth } from '@/hooks/useBackendApi';
import { cn } from '@/lib/utils';
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

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string;
  editable: boolean;
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'config' | 'security'>('users');
  const [showInactive, setShowInactive] = useState(false);

  // Data fetching
  const { securityDashboard, realtimeMetrics, isLoading } = useDashboardData();
  const { data: backendHealth } = useBackendHealth();
  const { data: mlHealth } = useMLHealth();

  // Mock users data (in real app, fetch from backend)
  const users: User[] = useMemo(() => [
    {
      id: '1',
      username: 'admin',
      email: 'admin@defenddos.local',
      role: 'admin',
      status: 'active',
      lastLogin: new Date(Date.now() - 300000).toISOString(),
      createdAt: '2025-01-01T00:00:00Z',
      permissions: ['full_access']
    },
    {
      id: '2',
      username: 'security_analyst',
      email: 'analyst@defenddos.local',
      role: 'operator',
      status: 'active',
      lastLogin: new Date(Date.now() - 3600000).toISOString(),
      createdAt: '2025-01-15T00:00:00Z',
      permissions: ['view_threats', 'block_ips', 'view_logs']
    },
    {
      id: '3',
      username: 'monitor',
      email: 'monitor@defenddos.local',
      role: 'viewer',
      status: 'active',
      lastLogin: new Date(Date.now() - 7200000).toISOString(),
      createdAt: '2025-02-01T00:00:00Z',
      permissions: ['view_dashboard', 'view_logs']
    }
  ], []);

  // System configuration
  const systemConfig: SystemConfig[] = useMemo(() => [
    {
      id: '1',
      key: 'threat_threshold',
      value: '1000',
      category: 'Detection',
      description: 'Packets per second threshold for threat detection',
      editable: true
    },
    {
      id: '2',
      key: 'auto_block_enabled',
      value: 'true',
      category: 'Mitigation',
      description: 'Automatically block IPs exceeding threat threshold',
      editable: true
    },
    {
      id: '3',
      key: 'ml_confidence_threshold',
      value: '0.85',
      category: 'ML Detection',
      description: 'Minimum ML confidence score for attack classification',
      editable: true
    },
    {
      id: '4',
      key: 'data_retention_days',
      value: '30',
      category: 'Storage',
      description: 'Number of days to retain traffic data in InfluxDB',
      editable: true
    },
    {
      id: '5',
      key: 'backend_version',
      value: '1.0.0',
      category: 'System',
      description: 'DefenDDoS backend service version',
      editable: false
    }
  ], []);

  const filteredUsers = useMemo(() => {
    return showInactive ? users : users.filter(u => u.status === 'active');
  }, [users, showInactive]);

  // Stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    recentLogins: users.filter(u => {
      const loginTime = new Date(u.lastLogin).getTime();
      const oneHourAgo = Date.now() - 3600000;
      return loginTime > oneHourAgo;
    }).length
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'operator': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header - Admin Theme */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-violet-500/20 shadow-2xl shadow-violet-500/10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Animated admin pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_35px,rgba(139,92,246,0.5)_35px,rgba(139,92,246,0.5)_70px)]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="p-2 sm:p-3 bg-violet-500/20 rounded-lg sm:rounded-xl border-2 border-violet-500/30"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-violet-500" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    Admin Control Panel
                  </h1>
                  <Badge variant="danger" className="font-mono text-[10px]">
                    RESTRICTED
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  👤 User management, system configuration, and security settings
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Admin Status */}
            <motion.div 
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-card border-2 border-violet-500/30 shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Lock className="w-4 h-4 text-violet-500" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-violet-500">ADMIN ACCESS</span>
                <span className="text-xs text-muted-foreground">Full Privileges</span>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-card rounded-lg sm:rounded-xl p-1 border border-border/50">
              {(['users', 'config', 'security'] as const).map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? 'primary' : 'ghost'}
                  onClick={() => setActiveTab(tab)}
                  leftIcon={
                    tab === 'users' ? <Users className="w-3 h-3" /> :
                    tab === 'config' ? <Settings className="w-3 h-3" /> :
                    <Shield className="w-3 h-3" />
                  }
                  className="text-xs capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-[18px] h-[18px]" />}
            change={{
              value: stats.activeUsers,
              type: 'increase',
              timeframe: 'active'
            }}
            color="purple"
            loading={isLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Admins"
            value={stats.adminUsers}
            icon={<Shield className="w-[18px] h-[18px]" />}
            change={{
              value: Math.round((stats.adminUsers / stats.totalUsers) * 100),
              type: 'increase',
              timeframe: '% of total'
            }}
            color="red"
            loading={isLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Recent Logins"
            value={stats.recentLogins}
            icon={<Activity className="w-[18px] h-[18px]" />}
            change={{
              value: stats.recentLogins,
              type: 'increase',
              timeframe: 'last hour'
            }}
            color="green"
            loading={isLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="System Health"
            value={backendHealth && mlHealth ? '100%' : '75%'}
            icon={<Server className="w-[18px] h-[18px]" />}
            change={{
              value: 0,
              type: 'increase',
              timeframe: 'all services'
            }}
            color={backendHealth && mlHealth ? 'green' : 'yellow'}
            loading={isLoading}
          />
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div
            key="users"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-[18px] h-[18px] text-primary" />
                      User Management
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowInactive(!showInactive)}
                        leftIcon={showInactive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        className="text-xs"
                      >
                        {showInactive ? 'Hide' : 'Show'} Inactive
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<UserPlus className="w-3 h-3" />}
                        onClick={() => toast.success('Add user feature coming soon')}
                        className="text-xs"
                      >
                        Add User
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-300 group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-3 bg-violet-500/10 rounded-lg">
                              <Users className="w-5 h-5 text-violet-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground">{user.username}</h4>
                                <Badge variant={getRoleBadgeVariant(user.role)} className="text-[10px]">
                                  {user.role.toUpperCase()}
                                </Badge>
                                {user.status === 'active' && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Last login: {formatTimeAgo(user.lastLogin)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Key className="w-3 h-3" />
                                  <span>{user.permissions.length} permissions</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="outline" onClick={() => toast('Edit user feature coming soon', { icon: 'ℹ️' })}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-500/10">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            key="config"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                    <Settings className="w-[18px] h-[18px] text-primary" />
                    System Configuration
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemConfig.map((config, index) => (
                      <motion.div
                        key={config.id}
                        className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-sm font-mono font-semibold text-foreground px-2 py-0.5 bg-muted rounded">
                                {config.key}
                              </code>
                              <Badge variant="default" className="text-[10px]">
                                {config.category}
                              </Badge>
                              {!config.editable && (
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Value:</span>
                              <code className="text-sm font-mono text-primary px-2 py-1 bg-primary/10 rounded">
                                {config.value}
                              </code>
                            </div>
                          </div>
                          {config.editable && (
                            <Button size="sm" variant="outline" onClick={() => toast('Edit config feature coming soon', { icon: 'ℹ️' })}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                    <Shield className="w-[18px] h-[18px] text-primary" />
                    Security Settings
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* API Keys */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Keys
                      </h4>
                      <div className="p-4 rounded-lg border-2 border-border bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Backend API Key</span>
                          <Badge variant="success" className="text-[10px]">ACTIVE</Badge>
                        </div>
                        <code className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                          ••••••••••••••••••••••••••••••••
                        </code>
                      </div>
                    </div>

                    {/* Access Control */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Access Control
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                            <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
                          </div>
                          <Badge variant="warning" className="text-[10px]">RECOMMENDED</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">Session Timeout</p>
                            <p className="text-xs text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
                          </div>
                          <Badge variant="success" className="text-[10px]">ENABLED</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Audit Logs */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Recent Admin Actions
                      </h4>
                      <div className="space-y-2">
                        {[
                          { action: 'User login', user: 'admin', time: '2m ago' },
                          { action: 'Configuration updated', user: 'admin', time: '15m ago' },
                          { action: 'IP blocked manually', user: 'security_analyst', time: '1h ago' }
                        ].map((log, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                            <div className="flex items-center gap-2">
                              <Activity className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground">{log.action}</span>
                              <span className="text-muted-foreground">by {log.user}</span>
                            </div>
                            <span className="text-muted-foreground">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
