'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Shield,
  Ban,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
  Database,
  Zap,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Globe,
  Sparkles
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  description?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Memoized navigation data to prevent recreation on every render
const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'System overview'
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: TrendingUp,
        description: 'Traffic analytics'
      },
    ]
  },
  {
    title: 'Security',
    items: [
      {
        name: 'Threat Detection',
        href: '/threat-detection',
        icon: AlertTriangle,
        badge: '3',
        description: 'Active threats'
      },
      {
        name: 'Blocked IPs',
        href: '/blocked-ips',
        icon: Ban,
        badge: '12',
        description: 'IP blacklist'
      },
      {
        name: 'Traffic Monitor',
        href: '/traffic',
        icon: Activity,
        description: 'Network traffic'
      },
    ]
  },
  {
    title: 'System',
    items: [
      {
        name: 'System Health',
        href: '/system',
        icon: Settings,
        description: 'Service status'
      },
      {
        name: 'Notifications',
        href: '/notifications',
        icon: Bell,
        badge: 'new',
        description: 'Alerts & events'
      },
      {
        name: 'Admin Panel',
        href: '/admin',
        icon: Users,
        description: 'User management'
      },
    ]
  },
];

export default function EnhancedSidebar({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);

  // Memoize desktop detection to prevent unnecessary re-renders
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    // Check on mount
    checkDesktop();
    
    // Add resize listener
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Memoize active state calculation
  const isActive = useMemo(() => (href: string) => pathname === href, [pathname]);

  // Auto-collapse on mobile when navigating
  useEffect(() => {
    if (onClose && isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  }, [pathname, onClose, isOpen]); // Only close when pathname changes

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isDesktop && isCollapsed ? '80px' : '280px',
          x: (isDesktop || isOpen) ? 0 : -300
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 35
        }}
        className="fixed top-14 sm:top-16 left-0 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-card/98 backdrop-blur-xl border-r border-border/60 shadow-lg shadow-primary/5 z-50 lg:z-30 flex flex-col overflow-hidden"
      >
        {/* Navigation Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Collapse Toggle Section */}
          <motion.div 
            className="hidden lg:flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border/60 bg-muted/50 sticky top-0 z-10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.15 }}
          >
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm font-bold text-foreground">Menu</span>
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`
                p-1.5 rounded-lg transition-all duration-150
                ${isCollapsed ? 'mx-auto' : ''}
                hover:bg-muted/70
              `}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </motion.button>
          </motion.div>

          {/* Navigation Links */}
          <div className="p-2 sm:p-3 space-y-4 sm:space-y-5">
            <nav className="space-y-4 sm:space-y-5">
              {navGroups.map((group, groupIndex) => (
                <motion.div 
                  key={group.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: groupIndex * 0.03,
                    duration: 0.15,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.h3 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="px-2 sm:px-3 mb-2 sm:mb-2.5 text-[10px] sm:text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider"
                      >
                        {group.title}
                      </motion.h3>
                    )}
                  </AnimatePresence>
                  <div className="space-y-0.5 sm:space-y-1">
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: (groupIndex * 0.03) + (itemIndex * 0.015),
                            duration: 0.15,
                            ease: [0.4, 0, 0.2, 1]
                          }}
                          onHoverStart={() => setHoveredItem(item.href)}
                          onHoverEnd={() => setHoveredItem(null)}
                        >
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`
                              group relative flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
                              transition-all duration-150 ease-out
                              ${active
                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                : 'text-foreground/75 hover:bg-muted/80 hover:text-foreground'
                              }
                              ${isCollapsed ? 'justify-center' : ''}
                            `}
                          >
                            {/* Icon */}
                            <div className="relative flex-shrink-0">
                              <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                            </div>

                            {/* Label & Description */}
                            <AnimatePresence>
                              {!isCollapsed && (
                                <motion.div 
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -5 }}
                                  transition={{ duration: 0.15 }}
                                  className="flex-1 min-w-0"
                                >
                                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                    <span className="text-xs sm:text-sm font-semibold truncate">
                                      {item.name}
                                    </span>
                                    {item.badge && (
                                      <motion.span
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className={`
                                          px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full flex-shrink-0
                                          ${active
                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                            : 'bg-primary text-primary-foreground'
                                          }
                                        `}
                                      >
                                        {item.badge}
                                      </motion.span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-[10px] sm:text-xs opacity-60 truncate mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Tooltip for Collapsed State */}
                            <AnimatePresence>
                              {isCollapsed && hoveredItem === item.href && (
                                <motion.div
                                  initial={{ opacity: 0, x: -6, scale: 0.97 }}
                                  animate={{ opacity: 1, x: 0, scale: 1 }}
                                  exit={{ opacity: 0, x: -6, scale: 0.97 }}
                                  transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
                                  className="absolute left-full ml-2 px-3 py-2 bg-popover/98 backdrop-blur-xl text-popover-foreground text-sm rounded-lg whitespace-nowrap shadow-xl shadow-primary/5 border border-border z-50 pointer-events-none"
                                >
                                  <div className="font-semibold">{item.name}</div>
                                  {item.badge && (
                                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                      {item.badge}
                                    </span>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </nav>
          </div>
        </div>
      </motion.aside>
    </>
  );
}