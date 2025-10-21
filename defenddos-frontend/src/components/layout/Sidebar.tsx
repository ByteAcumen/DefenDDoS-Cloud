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
  Zap,
  BarChart3,
  Bell,
  Users
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
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'Overview'
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Reports'
  },
  {
    title: 'Threat Detection',
    href: '/threats',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'ML Detection'
  },
  {
    title: 'Traffic Monitor',
    href: '/traffic',
    icon: <Network className="w-4 h-4" />,
    description: 'Network Traffic'
  },
  {
    title: 'Blocked IPs',
    href: '/blocked-ips',
    icon: <Ban className="w-4 h-4" />,
    description: 'IP Management'
  },
  {
    title: 'System Health',
    href: '/system',
    icon: <Activity className="w-4 h-4" />,
    description: 'Service Status'
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: <Bell className="w-4 h-4" />,
    badge: 'new',
    badgeVariant: 'warning',
    description: 'Alerts & Events'
  },
  {
    title: 'Admin Panel',
    href: '/admin',
    icon: <Users className="w-4 h-4" />,
    description: 'User Management'
  }
];

const quickActions: NavItem[] = [
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="w-4 h-4" />,
    description: 'Configuration'
  }
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { data: blockedIPsData } = useBlockedIPs();
  
  // Update blocked IPs badge dynamically
  const blockedCount = blockedIPsData?.count || 0;

  const sidebarVariants = {
    expanded: { width: '240px' },
    collapsed: { width: '60px' },
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 },
  };

  const NavItem = ({ item, isQuickAction = false }: { item: NavItem; isQuickAction?: boolean }) => {
    const isActive = !pathname ? false : (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/'));
    const isHovered = hoveredItem === item.href;

    return (
      <Link href={item.href}>
        <div
          className={cn(
            'relative group flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200',
            'hover:bg-gray-800/50',
            isActive && 'bg-blue-500/10 text-blue-400',
            !isActive && 'text-gray-400 hover:text-gray-200'
          )}
          onMouseEnter={() => setHoveredItem(item.href)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Active indicator */}
          {isActive && (
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r-full"
              layoutId="activeIndicator"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}

          {/* Icon */}
          <div className="flex-shrink-0">
            {item.icon}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                className="flex-1 min-w-0 flex items-center justify-between"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.15 }}
              >
                <span className="font-medium text-[13px] truncate">
                  {item.title}
                </span>
                {item.badge && (
                  <Badge
                    variant={item.badgeVariant || 'default'}
                    size="sm"
                  >
                    {item.badge}
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tooltip for collapsed state */}
          {!isOpen && (
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="fixed left-[68px] px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-xl z-[100] whitespace-nowrap pointer-events-none border border-gray-700"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{ top: 'auto' }}
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 border-l border-t border-gray-700 rotate-45" />
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
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#0f1f35]/95 backdrop-blur-xl',
        'border-r border-gray-800/50 z-30 overflow-hidden shadow-2xl'
      )}
      variants={sidebarVariants}
      animate={isOpen ? 'expanded' : 'collapsed'}
      transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex items-center justify-end p-3 border-b border-gray-800/50">
          <motion.button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-gray-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              // Add dynamic badge for Blocked IPs
              const itemWithBadge = item.href === '/blocked-ips' ? {
                ...item,
                badge: blockedCount > 0 ? blockedCount.toString() : undefined,
                badgeVariant: 'danger' as const
              } : item;
              return <NavItem key={item.href} item={itemWithBadge} />;
            })}

            {/* Separator */}
            <div className="py-3">
              <div className="border-t border-gray-800/50" />
            </div>

            {/* Quick Actions */}
            {quickActions.map((item) => (
              <NavItem key={item.href} item={item} isQuickAction />
            ))}
          </nav>
        </div>

        {/* Footer - Compact Version */}
        <div className="p-3 border-t border-gray-800/50">
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                className="flex items-center gap-2 text-gray-500 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span>v2.0.0</span>
              </motion.div>
            ) : (
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Shield className="w-4 h-4 text-blue-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}