'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  AlertTriangle,
  Shield,
  Activity,
  Check,
  Clock,
  Search,
  Trash2,
  Archive,
  Star,
  CheckCircle,
  Info,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatTimeAgo, storage } from '@/utils';
import { toast } from 'react-hot-toast';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount?: number;
  onNotificationCountChange?: (count: number) => void;
}

interface Notification {
  id: string;
  type: 'security' | 'system' | 'alert' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  source: string;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'security',
    severity: 'critical',
    title: 'DDoS Attack Detected',
    message: 'High volume of traffic from suspicious IPs detected. Automatic mitigation has been triggered.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    read: false,
    starred: true,
    archived: false,
    source: 'Security Engine',
    actions: [
      { label: 'View Details', action: () => {}, variant: 'primary' },
      { label: 'Block IPs', action: () => {}, variant: 'danger' }
    ]
  },
  {
    id: '2',
    type: 'system',
    severity: 'high',
    title: 'System Resources Warning',
    message: 'CPU usage has exceeded 85% for the past 10 minutes. Consider scaling resources.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
    starred: false,
    archived: false,
    source: 'System Monitor',
    actions: [
      { label: 'Scale Up', action: () => {}, variant: 'primary' }
    ]
  },
  {
    id: '3',
    type: 'alert',
    severity: 'medium',
    title: 'Suspicious Login Attempt',
    message: 'Failed login attempts from IP 192.168.1.100. User: admin@defenddos.com',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: true,
    starred: false,
    archived: false,
    source: 'Authentication',
    actions: [
      { label: 'Block IP', action: () => {}, variant: 'danger' }
    ]
  },
  {
    id: '4',
    type: 'info',
    severity: 'info',
    title: 'Backup Completed',
    message: 'Daily system backup completed successfully. 2.4 GB backed up.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: true,
    starred: false,
    archived: false,
    source: 'Backup Service'
  },
  {
    id: '5',
    type: 'security',
    severity: 'low',
    title: 'Security Scan Complete',
    message: 'Weekly security scan completed. No vulnerabilities found.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true,
    starred: false,
    archived: false,
    source: 'Security Scanner'
  }
];

export function NotificationsModal({ 
  isOpen, 
  onClose, 
  onNotificationCountChange 
}: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load notifications from storage (start with empty array)
    const savedNotifications = storage.get('notifications', []);
    setNotifications(savedNotifications);
  }, []);

  useEffect(() => {
    // Update notification count
    const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
    onNotificationCountChange?.(unreadCount);
  }, [notifications, onNotificationCountChange]);

  // Filter notifications based on current filter and search
  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'unread' && notification.read) return false;
      if (filter === 'starred' && !notification.starred) return false;
      if (filter === 'archived' && !notification.archived) return false;
      if (filter === 'all' && notification.archived) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          notification.source.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const updateNotifications = (updatedNotifications: Notification[]) => {
    setNotifications(updatedNotifications);
    storage.set('notifications', updatedNotifications);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    updateNotifications(updated);
  };

  const toggleStar = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, starred: !n.starred } : n
    );
    updateNotifications(updated);
  };

  const archiveNotification = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, archived: true } : n
    );
    updateNotifications(updated);
    toast.success('Notification archived');
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    updateNotifications(updated);
    toast.success('Notification deleted');
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    updateNotifications(updated);
    toast.success('All notifications marked as read');
  };

  const clearAll = () => {
    const updated = notifications.map(n => ({ ...n, archived: true }));
    updateNotifications(updated);
    toast.success('All notifications cleared');
  };

  const getNotificationIcon = (type: string, severity: string) => {
    switch (type) {
      case 'security':
        return <Shield className={cn('w-5 h-5', getSeverityColor(severity))} />;
      case 'system':
        return <Activity className={cn('w-5 h-5', getSeverityColor(severity))} />;
      case 'alert':
        return <AlertTriangle className={cn('w-5 h-5', getSeverityColor(severity))} />;
      default:
        return <Info className={cn('w-5 h-5', getSeverityColor(severity))} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.1 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <Bell className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Notifications
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark All Read
              </Button>
              <Button variant="ghost" onClick={onClose} size="sm">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'starred', label: 'Starred' },
                  { id: 'archived', label: 'Archived' }
                ].map(({ id, label }) => (
                  <Button
                    key={id}
                    variant={filter === id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(id as 'all' | 'unread' | 'starred' | 'archived')}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  className="flex items-center justify-center h-64 text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm text-gray-400">You&apos;re all caught up!</p>
                  </div>
                </motion.div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    className={cn(
                      'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      !notification.read && 'bg-primary-50/30 dark:bg-primary-950/30'
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon and Read Indicator */}
                        <div className="flex items-center gap-2 mt-1">
                          {getNotificationIcon(notification.type, notification.severity)}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={cn(
                                  'font-medium text-sm',
                                  !notification.read 
                                    ? 'text-gray-900 dark:text-gray-100' 
                                    : 'text-gray-700 dark:text-gray-300'
                                )}>
                                  {notification.title}
                                </h4>
                                <Badge 
                                  variant={
                                    notification.severity === 'critical' ? 'danger' : 
                                    notification.severity === 'high' ? 'warning' : 
                                    'secondary'
                                  } 
                                  size="sm"
                                >
                                  {notification.severity}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{notification.source}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(notification.timestamp)}</span>
                              </div>
                              
                              {/* Actions */}
                              {notification.actions && notification.actions.length > 0 && (
                                <div className="flex gap-2 mt-3">
                                  {notification.actions.map((action, idx) => (
                                    <Button
                                      key={idx}
                                      size="sm"
                                      variant={action.variant || 'outline'}
                                      onClick={action.action}
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions Menu */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStar(notification.id)}
                                className={cn(
                                  notification.starred && 'text-yellow-500 hover:text-yellow-600'
                                )}
                              >
                                <Star className={cn(
                                  'w-4 h-4',
                                  notification.starred && 'fill-current'
                                )} />
                              </Button>
                              
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => archiveNotification(notification.id)}
                                title="Archive"
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                title="Delete"
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Auto-refresh every 30 seconds</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}