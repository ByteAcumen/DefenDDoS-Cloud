'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  Shield,
  Info,
  CheckCircle,
  X,
  Clock,
  Filter,
  Download,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Ban,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/charts/DataVisualizations';
import {
  useAllDetectionEvents,
  useAllMLPredictions,
  useDashboardData
} from '@/hooks/useBackendApi';
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

type NotificationType = 'critical' | 'warning' | 'info' | 'success';
type FilterType = 'all' | NotificationType;

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source: string;
  details?: string;
  ip?: string;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showRead, setShowRead] = useState(true);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [selectedTimeRange, setSelectedTimeRange] = useState('-1h');

  // Data fetching
  const { securityDashboard, realtimeMetrics } = useDashboardData();
  const { data: detectionEvents, isLoading: eventsLoading } = useAllDetectionEvents(selectedTimeRange, true);
  const { data: mlPredictions, isLoading: mlLoading } = useAllMLPredictions(selectedTimeRange, true);

  // Process notifications from backend data
  const notifications = useMemo(() => {
    const alerts: Notification[] = [];
    
    // Add detection events as notifications
    if (Array.isArray(detectionEvents) && detectionEvents.length > 0) {
      detectionEvents.slice(0, 50).forEach((event: any, index: number) => {
        const severity = event.threatLevel || event.severity || 'MEDIUM';
        alerts.push({
          id: `detection-${event.time || Date.now()}-${index}`,
          type: severity === 'CRITICAL' ? 'critical' : severity === 'HIGH' ? 'warning' : 'info',
          title: `${severity} Threat Detected`,
          message: `Suspicious activity from ${event.sourceIp || event.source_ip || 'Unknown IP'}`,
          timestamp: event.time || event._time || new Date().toISOString(),
          read: readNotifications.has(`detection-${event.time || Date.now()}-${index}`),
          source: 'Threat Detection',
          details: `Threat level: ${severity}, Packets: ${event.value || event.packetCount || 0}`,
          ip: event.sourceIp || event.source_ip
        });
      });
    }

    // Add ML predictions as notifications
    if (Array.isArray(mlPredictions) && mlPredictions.length > 0) {
      mlPredictions.slice(0, 30).forEach((pred: any, index: number) => {
        if (pred.isAttack === 'true' || pred.is_attack === true) {
          alerts.push({
            id: `ml-${pred.time || Date.now()}-${index}`,
            type: pred.severity === 'HIGH' || pred.severity === 'CRITICAL' ? 'critical' : 'warning',
            title: 'ML Attack Detection',
            message: `ML model detected ${pred.attackType || pred.attack_type || 'potential'} attack`,
            timestamp: pred.time || pred._time || new Date().toISOString(),
            read: readNotifications.has(`ml-${pred.time || Date.now()}-${index}`),
            source: 'ML Engine',
            details: `Confidence: ${((parseFloat(pred.confidence || pred.value || 0)) * 100).toFixed(1)}%`,
            ip: pred.sourceIp || pred.source_ip
          });
        }
      });
    }

    // Add system notifications
    if (securityDashboard?.activeThreats && securityDashboard.activeThreats > 10) {
      alerts.push({
        id: 'system-high-threats',
        type: 'warning',
        title: 'High Threat Activity',
        message: `Currently monitoring ${securityDashboard.activeThreats} active threats`,
        timestamp: new Date().toISOString(),
        read: readNotifications.has('system-high-threats'),
        source: 'System Monitor',
        details: 'Multiple concurrent threats detected'
      });
    }

    // Sort by timestamp (newest first)
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [detectionEvents, mlPredictions, securityDashboard, readNotifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }
    
    if (!showRead) {
      filtered = filtered.filter(n => !n.read);
    }
    
    return filtered;
  }, [notifications, filter, showRead]);

  // Stats
  const stats = useMemo(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const criticalCount = notifications.filter(n => n.type === 'critical').length;
    const warningCount = notifications.filter(n => n.type === 'warning').length;
    const infoCount = notifications.filter(n => n.type === 'info' || n.type === 'success').length;

    return { unreadCount, criticalCount, warningCount, infoCount, total: notifications.length };
  }, [notifications]);

  // Mark as read
  const markAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setReadNotifications(new Set(notifications.map(n => n.id)));
    toast.success('All notifications marked as read');
  };

  // Clear all read notifications
  const clearRead = () => {
    setReadNotifications(new Set());
    toast.success('All notifications marked as unread');
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header - Notifications Theme */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Animated notification waves */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="waves" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
                <path d="M0 50 Q 50 30, 100 50 T 200 50" stroke="#f59e0b" strokeWidth="2" fill="none">
                  <animate attributeName="d" 
                    values="M0 50 Q 50 30, 100 50 T 200 50;M0 50 Q 50 70, 100 50 T 200 50;M0 50 Q 50 30, 100 50 T 200 50" 
                    dur="4s" repeatCount="indefinite"/>
                </path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waves)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="p-2 sm:p-3 bg-amber-500/20 rounded-lg sm:rounded-xl border-2 border-amber-500/30 relative"
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                {stats.unreadCount > 0 && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-background"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    {stats.unreadCount > 9 ? '9+' : stats.unreadCount}
                  </motion.div>
                )}
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    Notifications Center
                  </h1>
                  {stats.unreadCount > 0 && (
                    <Badge variant="danger" className="animate-pulse">
                      {stats.unreadCount} NEW
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                  🔔 Real-time alerts, events, and system notifications
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-card rounded-lg sm:rounded-xl p-1 border border-border/50">
              {(['all', 'critical', 'warning', 'info'] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'primary' : 'ghost'}
                  onClick={() => setFilter(f)}
                  className="text-xs capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRead(!showRead)}
                leftIcon={showRead ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm"
              >
                {showRead ? 'Hide' : 'Show'} Read
              </Button>

              {stats.unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  leftIcon={<CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                  className="text-xs sm:text-sm"
                >
                  Mark All Read
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="text-xs sm:text-sm"
              >
                Export
              </Button>
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
            title="Total Alerts"
            value={stats.total}
            icon={<Bell className="w-[18px] h-[18px]" />}
            change={{
              value: stats.unreadCount,
              type: 'increase',
              timeframe: 'unread'
            }}
            color="blue"
            loading={eventsLoading || mlLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Critical"
            value={stats.criticalCount}
            icon={<AlertTriangle className="w-[18px] h-[18px]" />}
            change={{
              value: Math.round((stats.criticalCount / stats.total) * 100) || 0,
              type: 'increase',
              timeframe: '% of total'
            }}
            color="red"
            loading={eventsLoading || mlLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Warnings"
            value={stats.warningCount}
            icon={<AlertCircle className="w-[18px] h-[18px]" />}
            change={{
              value: Math.round((stats.warningCount / stats.total) * 100) || 0,
              type: 'increase',
              timeframe: '% of total'
            }}
            color="yellow"
            loading={eventsLoading || mlLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Info"
            value={stats.infoCount}
            icon={<Info className="w-[18px] h-[18px]" />}
            change={{
              value: Math.round((stats.infoCount / stats.total) * 100) || 0,
              type: 'increase',
              timeframe: '% of total'
            }}
            color="blue"
            loading={eventsLoading || mlLoading}
          />
        </motion.div>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-[18px] h-[18px] text-primary" />
                  Recent Notifications
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  {filteredNotifications.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading || mlLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <Bell className="w-8 h-8 mx-auto mb-3 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">Loading notifications...</p>
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No notifications
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {filter !== 'all' ? `No ${filter} notifications found` : 'All caught up! No new notifications'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  <AnimatePresence>
                    {filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all duration-300 group cursor-pointer",
                          notification.read 
                            ? "border-border/30 bg-muted/20 opacity-70" 
                            : "border-border hover:border-primary/50 bg-card",
                          notification.type === 'critical' && !notification.read && "border-red-500/30 bg-red-500/5",
                          notification.type === 'warning' && !notification.read && "border-yellow-500/30 bg-yellow-500/5"
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            className={cn(
                              "p-2 rounded-lg flex-shrink-0",
                              notification.type === 'critical' && "bg-red-500/20",
                              notification.type === 'warning' && "bg-yellow-500/20",
                              notification.type === 'success' && "bg-green-500/20",
                              notification.type === 'info' && "bg-blue-500/20"
                            )}
                            animate={!notification.read && notification.type === 'critical' ? {
                              scale: [1, 1.1, 1],
                            } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            {getNotificationIcon(notification.type)}
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground text-sm sm:text-base">
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <motion.div
                                      className="w-2 h-2 bg-primary rounded-full"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                    />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                                {notification.details && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notification.details}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  notification.type === 'critical' ? 'danger' :
                                  notification.type === 'warning' ? 'warning' :
                                  notification.type === 'success' ? 'success' :
                                  'default'
                                }
                                className="text-[10px] flex-shrink-0"
                              >
                                {notification.type.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(notification.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                <span>{notification.source}</span>
                              </div>
                              {notification.ip && (
                                <div className="flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  <span className="font-mono">{notification.ip}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
