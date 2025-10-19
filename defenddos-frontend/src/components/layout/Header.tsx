'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Menu, 
  X, 
  Bell, 
  Settings, 
  Moon, 
  Sun,
  Activity,
  AlertTriangle,
  CheckCircle,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserProfileModal } from '@/components/modals/UserProfileModal';
import { NotificationsModal } from '@/components/modals/NotificationsModal';
import { cn, storage } from '@/utils';
import { useSystemStatus, useDashboardData } from '@/hooks/useDefenDDoS';
import { BackendStatus } from '@/components/ui/backend-status';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [userProfile, setUserProfile] = useState({
    name: 'Security Administrator',
    email: 'admin@defenddos.com',
    role: 'System Administrator'
  });
  const { data: systemStatus } = useSystemStatus();
  const { securityOverview, hasError } = useDashboardData();

  // Load notification count from localStorage (client-side only)
  useEffect(() => {
    const notifications = storage.get('notifications') || [];
    const unreadCount = notifications.filter((n: any) => !n.read).length;
    setNotificationCount(unreadCount);
  }, []);

  // Load user profile and theme preferences
  useEffect(() => {
    const savedProfile = storage.get('userProfile');
    if (savedProfile) {
      setUserProfile({
        name: savedProfile.name || 'Security Administrator',
        email: savedProfile.email || 'admin@defenddos.com',
        role: savedProfile.role || 'System Administrator'
      });
      
      // Apply saved theme
      const theme = savedProfile.preferences?.theme || 'dark';
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        setIsDarkMode(true);
      } else if (theme === 'light') {
        root.classList.remove('dark');
        setIsDarkMode(false);
      } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
        setIsDarkMode(prefersDark);
      }
    }
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark');
    
    // Save theme preference
    const savedProfile = storage.get('userProfile') || {};
    const updatedProfile = {
      ...savedProfile,
      preferences: {
        ...savedProfile.preferences,
        theme: newTheme ? 'dark' : 'light'
      }
    };
    storage.set('userProfile', updatedProfile);
  };

  // Get system status indicator
  const getSystemStatusInfo = () => {
    if (hasError) {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        status: 'error',
        text: 'Connection Error',
        color: 'text-red-500'
      };
    }

    if (!systemStatus || !securityOverview) {
      return {
        icon: <Activity className="w-4 h-4 animate-pulse" />,
        status: 'loading',
        text: 'Connecting...',
        color: 'text-yellow-500'
      };
    }

    const overallHealth = securityOverview.overallHealth?.status || 'unknown';
    
    switch (overallHealth) {
      case 'excellent':
      case 'good':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          status: 'operational',
          text: 'All Systems Operational',
          color: 'text-green-500'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          status: 'warning',
          text: 'System Degraded',
          color: 'text-yellow-500'
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          status: 'critical',
          text: 'Critical Issues',
          color: 'text-red-500'
        };
    }
  };

  const statusInfo = getSystemStatusInfo();

  return (
    <motion.header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-all duration-300',
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl shadow-primary-500/5'
          : 'bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-gray-200/20 dark:border-gray-700/20 shadow-lg shadow-primary-500/3'
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section - Logo and Navigation */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <motion.div
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.div>
          </Button>

          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative p-2.5 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-xl border border-primary-400/20">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Shield className="w-6 h-6 text-white drop-shadow-sm" />
                </motion.div>
              </div>
            </div>
            <div className="hidden sm:block">
              <motion.h1 
                className="text-xl font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-primary-300 dark:via-primary-400 dark:to-primary-500 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                DefenDDoS
              </motion.h1>
              <motion.p 
                className="text-xs text-gray-500 dark:text-gray-400 font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Security Command Center
              </motion.p>
            </div>
          </motion.div>
        </div>

        {/* Center Section - Status */}
        <div className="hidden md:flex items-center gap-4">
          {/* System Status */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
            <motion.div
              className={statusInfo.color}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {statusInfo.icon}
            </motion.div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statusInfo.text}
            </span>
            <Badge 
              status={statusInfo.status} 
              size="sm"
            >
              {statusInfo.status.toUpperCase()}
            </Badge>
          </div>
          
          {/* Backend Connection Status */}
          <BackendStatus showInline={true} />
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Search className="w-4 h-4" />
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsNotificationsModalOpen(true)}
            >
              <Bell className="w-4 h-4" />
            </Button>
            {/* Notification badge */}
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-xs text-white font-bold">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="relative overflow-hidden"
          >
            <motion.div
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </motion.div>
          </Button>

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Settings className="w-4 h-4" />
            </motion.div>
          </Button>

          {/* User Profile */}
          <button
            className="flex items-center gap-3 p-2 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {userProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {userProfile.name.split(' ')[0]}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userProfile.role}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Status Bar */}
      <motion.div
        className="md:hidden px-6 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={statusInfo.color}>
              {statusInfo.icon}
            </div>
            <span className="text-sm font-medium">
              {statusInfo.text}
            </span>
          </div>
          <Badge status={statusInfo.status} size="sm">
            {statusInfo.status.toUpperCase()}
          </Badge>
        </div>
      </motion.div>
      
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      
      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notificationCount={notificationCount}
        onNotificationCountChange={setNotificationCount}
      />
    </motion.header>
  );
}
