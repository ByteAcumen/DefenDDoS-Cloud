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
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface HeaderProps { }

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

export default function EnhancedHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
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

  // Hide header completely on landing page as per user request
  if (pathname === '/') {
    return null;
  }

  // Helper for dashboard logic (though we won't render on home anymore)
  const isHome = pathname === '/';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome && !isScrolled
        ? 'bg-transparent border-transparent py-4'
        : 'bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm py-3'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 sm:h-12">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className={`p-2 rounded-xl ${isHome && !isScrolled ? 'bg-white/10' : 'bg-primary/10'}`}
            >
              <Shield className={`w-5 h-5 ${isHome && !isScrolled ? 'text-white' : 'text-primary'}`} />
            </motion.div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight ${isHome && !isScrolled ? 'text-white' : 'text-foreground'}`}>
                DefenDDoS
              </span>
              {!isHome && (
                <span className="text-[10px] text-muted-foreground font-medium -mt-1">
                  Security Console
                </span>
              )}
            </div>
          </Link>

          {/* Center Section - Search (Dashboard Only) */}
          {!isHome && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full group">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center bg-secondary/50 border border-border/50 rounded-lg px-3 py-1.5 focus-within:bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                  <Search className="w-4 h-4 text-muted-foreground mr-2" />
                  <input
                    type="text"
                    placeholder="Search IPs, logs, or events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/70"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2 rounded-full transition-colors ${isHome && !isScrolled
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'hover:bg-accent text-foreground'
                  }`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Dashboard Specific Items */}
            {!isHome ? (
              <>
                <div className="h-4 w-px bg-border/50 hidden sm:block" />

                {/* System Status - Compact */}
                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-secondary/50 rounded-full border border-border/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium">Online</span>
                  </div>
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
                    className="relative p-2 rounded-full hover:bg-accent transition-colors"
                  >
                    <Bell className="w-5 h-5 text-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
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
                                className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-secondary/50 ${!notification.read ? 'bg-secondary/30' : ''
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

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Profile */}
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
                          <p className="font-semibold text-foreground">{user?.name || 'User'}</p>
                          <p className="text-sm text-muted-foreground">{user?.email || 'user@example.com'}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/profile"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-all duration-200 text-foreground"
                          >
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-all duration-200 text-foreground"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">Settings</span>
                          </Link>
                          <div className="h-px bg-border my-2" />
                          <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                              router.push('/login');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-all duration-200 text-red-400"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Sign out</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Landing Page Specific Items */
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${isHome && !isScrolled
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25'
                    }`}
                >
                  <span>Dashboard</span>
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Notification/Menu Drawers would go here if needed */}
    </motion.header>
  );
}