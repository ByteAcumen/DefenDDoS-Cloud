'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlockedIPs } from '@/hooks/useDefenDDoS';
import { 
  LayoutDashboard, 
  Network, 
  Ban, 
  AlertTriangle, 
  Activity,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Zap,
  Eye,
  BarChart3
} from 'lucide-react';
import { cn } from '@/utils';
import { Badge } from '@/components/ui/Badge';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'danger' | 'warning' | 'success' | 'default';
  description?: string;
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'Overview and system status'
  },
  {
    title: 'Traffic Monitor',
    href: '/traffic',
    icon: <Network className="w-5 h-5" />,
    description: 'Real-time traffic analysis'
  },
  {
    title: 'Blocked IPs',
    href: '/blocked-ips',
    icon: <Ban className="w-5 h-5" />,
    description: 'Manage blocked addresses'
    // Badge added dynamically in component based on real backend data
  },
  {
    title: 'Threat Detection',
    href: '/threats',
    icon: <AlertTriangle className="w-5 h-5" />,
    description: 'ML-powered threat analysis'
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Performance and trends'
  },
  {
    title: 'System Monitor',
    href: '/system',
    icon: <Activity className="w-5 h-5" />,
    description: 'System health and performance'
  },
  {
    title: 'Admin',
    href: '/admin',
    icon: <Settings className="w-5 h-5" />,
    description: 'System administration'
  }
];

const quickActions: NavItem[] = [
  {
    title: 'Trigger Scan',
    href: '/dashboard?action=scan',
    icon: <Zap className="w-5 h-5" />,
    description: 'Manual threat detection'
  },
  {
    title: 'Live Monitoring',
    href: '/traffic?live=true',
    icon: <Eye className="w-5 h-5" />,
    description: 'Real-time traffic view'
  },
  {
    title: 'Connection Test',
    href: '/connection-test',
    icon: <Activity className="w-5 h-5" />,
    description: 'Test backend connectivity'
  }
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { data: blockedIPsData } = useBlockedIPs();
  
  // Update blocked IPs badge dynamically
  const blockedCount = blockedIPsData?.count || 0;

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' },
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 },
  };

  const NavItem = ({ item, isQuickAction = false }: { item: NavItem; isQuickAction?: boolean }) => {
    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
    const isHovered = hoveredItem === item.href;

    return (
      <Link href={item.href}>
        <div
          className={cn(
            'relative group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            isActive && 'bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800',
            isQuickAction && 'text-sm'
          )}
          onMouseEnter={() => setHoveredItem(item.href)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Active indicator */}
          {isActive && (
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full"
              layoutId="activeIndicator"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}

          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 transition-colors duration-200',
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400',
              'group-hover:text-primary-600 dark:group-hover:text-primary-400'
            )}
          >
            {item.icon}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                className="flex-1 min-w-0"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className={cn(
                      'font-semibold text-sm transition-colors duration-200',
                      isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
                    )}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || 'default'}
                      size="sm"
                      {...(item.badgeVariant === 'danger' && { pulse: true })}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tooltip for collapsed state */}
          {!isOpen && (
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="fixed left-[88px] px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-xl z-[100] whitespace-nowrap pointer-events-none"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{ top: 'auto' }}
                >
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-gray-300 mt-0.5">{item.description}</div>
                  )}
                  {/* Arrow */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </Link>
    );
  };

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
        'border-r border-gray-200/50 dark:border-gray-700/50 z-30 overflow-hidden'
      )}
      variants={sidebarVariants}
      animate={isOpen ? 'expanded' : 'collapsed'}
      transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex items-center justify-end p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <motion.button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </motion.div>
          </motion.button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <nav className="space-y-2">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigationItems.map((item) => {
                // Add dynamic badge for Blocked IPs
                const itemWithBadge = item.href === '/blocked-ips' ? {
                  ...item,
                  badge: blockedCount > 0 ? blockedCount.toString() : undefined,
                  badgeVariant: 'danger' as const
                } : item;
                return <NavItem key={item.href} item={itemWithBadge} />;
              })}
            </div>

            {/* Separator */}
            <div className="py-4">
              <div className="border-t border-gray-200/50 dark:border-gray-700/50" />
            </div>

            {/* Quick Actions */}
            <div className="space-y-1">
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Quick Actions
                  </motion.div>
                )}
              </AnimatePresence>
              {quickActions.map((item) => (
                <NavItem key={item.href} item={item} isQuickAction />
              ))}
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <motion.div
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Shield className="w-5 h-5 text-primary-500" />
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="flex-1"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">DefenDDoS</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">v2.0.0</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}