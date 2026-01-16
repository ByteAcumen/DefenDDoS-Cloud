'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  Activity,
  Database,
  Zap,
  Menu,
  X,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface HeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

// Memoized mock notifications to prevent recreation
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'critical',
    title: 'DDoS Attack Detected',
    message: 'High volume traffic from 203.0.113.50',
    timestamp: new Date(Date.now() - 5 * 60000),
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: 'Suspicious Activity',
    message: 'Unusual pattern detected from 198.51.100.99',
    timestamp: new Date(Date.now() - 15 * 60000),
    read: false
  },
  {
    id: '3',
    type: 'success',
    title: 'IP Blocked',
    message: 'Successfully blocked 203.0.113.50',
    timestamp: new Date(Date.now() - 30 * 60000),
    read: true
  },
];

export default function EnhancedHeader({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Memoize notifications to prevent recreation
  const notifications = useMemo(() => mockNotifications, []);

  // Handle scroll effect with useCallback for better performance
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Memoize theme functions
  const getThemeIcon = useCallback(() => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  }, [theme]);

  const getThemeLabel = useCallback(() => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  }, [theme]);

  // Memoize breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      name: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
      href: '/' + paths.slice(0, index + 1).join('/')
    }));
  }, [pathname]);

  // Memoize notification helper functions
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'critical': return '🔴';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  }, []);

  const formatTimestamp = useCallback((date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, []);

  // Memoize unread count calculation
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showNotifications || showUserMenu || showThemeMenu) {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications, showUserMenu, showThemeMenu]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-b transition-all duration-200 ${
        isScrolled 
          ? 'border-border/60 shadow-lg shadow-primary/5' 
          : 'border-border/30 shadow-sm'
      }`}
    >
      <div className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-full">
          {/* Left Section: Menu Toggle & Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (onMenuToggle) {
                  onMenuToggle();
                }
              }}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-secondary transition-all duration-200"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 sm:w-5 sm:h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 sm:w-5 sm:h-5 text-foreground" />
              )}
            </motion.button>

            {/* Logo & Title */}
            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5 group">
              <motion.div 
                className="relative p-2 sm:p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg sm:rounded-xl border border-primary/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <motion.div 
                  className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-2 border-card shadow-sm"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              <div>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-foreground">
                  DefenDDoS
                </h1>
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground font-medium">Protection Active</p>
              </div>
            </Link>
          </div>

          {/* Center Section: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-3 sm:mx-4 lg:mx-6">
            <div className="relative w-full">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search IP addresses, logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 bg-muted/30 border border-border/50 rounded-lg text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-muted/50 transition-all duration-200"
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 rounded-full hover:bg-muted transition-colors duration-200"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground hover:text-foreground" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Right Section: Status & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* System Status Indicators */}
            <motion.div 
              className="hidden xl:flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 rounded-lg border border-border/50"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500" />
                <span className="text-[10px] sm:text-[11px] text-foreground font-semibold">API</span>
              </div>
              <div className="w-px h-3 sm:h-3.5 bg-border" />
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500" />
                <span className="text-[10px] sm:text-[11px] text-foreground font-semibold">ML</span>
              </div>
              <div className="w-px h-3 sm:h-3.5 bg-border" />
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500" />
                <span className="text-[10px] sm:text-[11px] text-foreground font-semibold">DB</span>
              </div>
            </motion.div>

            {/* Theme Switcher */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThemeMenu(!showThemeMenu);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                }}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-muted/70 transition-all duration-150 border border-transparent hover:border-border/50"
                title={`Theme: ${getThemeLabel()}`}
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {getThemeIcon()}
                </div>
              </motion.button>

              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-36 sm:w-44 bg-popover/98 backdrop-blur-xl rounded-xl shadow-xl shadow-primary/5 overflow-hidden border border-border"
                  >
                    <div className="p-1.5 space-y-0.5">
                      {['light', 'dark', 'system'].map((themeOption) => (
                        <motion.button
                          key={themeOption}
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => {
                            setTheme(themeOption as 'light' | 'dark' | 'system');
                            setShowThemeMenu(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 ${
                            theme === themeOption
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          {themeOption === 'light' && <Sun className="w-4 h-4" />}
                          {themeOption === 'dark' && <Moon className="w-4 h-4" />}
                          {themeOption === 'system' && <Monitor className="w-4 h-4" />}
                          <span className="text-sm font-medium capitalize">{themeOption}</span>
                          {theme === themeOption && (
                            <motion.div
                              layoutId="activeTheme"
                              className="ml-auto w-1.5 h-1.5 rounded-full bg-current"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                  setShowThemeMenu(false);
                }}
                className="relative p-1.5 sm:p-2 rounded-lg hover:bg-muted/70 transition-all duration-150 border border-transparent hover:border-border/50"
              >
                <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-foreground" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center ring-1 ring-background"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-popover/98 backdrop-blur-xl rounded-xl shadow-xl shadow-primary/5 overflow-hidden border border-border"
                  >
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        <button className="text-xs text-primary hover:text-primary-600 transition-colors">
                          Mark all read
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            whileHover={{ scale: 1.01 }}
                            className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-secondary/50 ${
                              !notification.read ? 'bg-secondary/30' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          No notifications
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-border bg-secondary/30">
                      <Link
                        href="/notifications"
                        className="block text-center text-sm text-primary hover:text-primary-600 transition-colors"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                  setShowThemeMenu(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-muted/70 transition-all duration-150 border border-transparent hover:border-border/50"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center ring-1 ring-offset-1 ring-offset-background ring-primary/30">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground hidden md:block" />
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-56 sm:w-64 bg-popover/98 backdrop-blur-xl rounded-xl shadow-xl shadow-primary/5 overflow-hidden border border-border"
                  >
                    <div className="p-4 border-b border-border">
                      <p className="font-semibold text-foreground">Admin User</p>
                      <p className="text-sm text-muted-foreground">admin@defenddos.com</p>
                    </div>
                    <div className="p-2">
                      <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all duration-200"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground font-medium">Profile</span>
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                        <Link
                          href="/system"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all duration-200"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground font-medium">Settings</span>
                        </Link>
                      </motion.div>
                      <div className="my-2 h-px bg-border" />
                      <motion.button 
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-900/20 transition-all duration-200 text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}