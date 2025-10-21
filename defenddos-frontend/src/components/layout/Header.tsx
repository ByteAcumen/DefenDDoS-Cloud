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
        'bg-[#0a1628]/95 dark:bg-[#0a1628]/95 backdrop-blur-xl',
        'border-gray-800/50 shadow-2xl shadow-black/10'
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section - Logo and Search */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden text-gray-300 hover:text-white hover:bg-gray-800/50"
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative p-2 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-lg shadow-lg">
                <Shield className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
            </div>
            <div className="hidden sm:block">
              <motion.h1 
                className="text-lg font-bold text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                DefenDDoS
              </motion.h1>
              <motion.p 
                className="text-[10px] text-emerald-400 font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                Protection Active
              </motion.p>
            </div>
          </motion.div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search IP addresses, logs..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Right Section - Status Indicators & Actions */}
        <div className="flex items-center gap-2">
          {/* Service Status Indicators */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-300">API</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-300">ML</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-300">DB</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="relative overflow-hidden text-gray-300 hover:text-white hover:bg-gray-800/50"
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

          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsNotificationsModalOpen(true)}
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <Bell className="w-4 h-4" />
            </Button>
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[10px] text-white font-bold">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              </div>
            )}
          </div>

          {/* User Profile */}
          <button
            className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-gray-800/50 transition-colors"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-sm font-semibold text-gray-200">
                {userProfile.name.split(' ')[0]}
              </p>
            </div>
          </button>
        </div>
      </div>
      
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
