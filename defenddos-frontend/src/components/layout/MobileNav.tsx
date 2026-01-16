'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Menu,
    X,
    Home,
    LayoutDashboard,
    Beaker,
    BookOpen,
    Brain,
    Shield,
    Settings,
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/api-playground', label: 'API Playground', icon: Beaker },
    { href: '/docs', label: 'Documentation', icon: BookOpen },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-3 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 text-white"
                aria-label="Toggle menu"
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Menu Panel */}
                        <motion.nav
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed right-0 top-0 bottom-0 z-40 w-72 bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-lg font-bold text-white">DefenDDoS</span>
                                </div>
                            </div>

                            {/* Nav Items */}
                            <div className="p-4 space-y-2">
                                {NAV_ITEMS.map((item, index) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                    }`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span className="font-medium">{item.label}</span>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
                                <div className="text-xs text-slate-500 text-center">
                                    v2.0 • Production Ready
                                </div>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// Hook to detect mobile
export function useIsMobile(breakpoint: number = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint]);

    return isMobile;
}

// Responsive container component
export function ResponsiveContainer({
    children,
    className = ''
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
            {children}
        </div>
    );
}

export default MobileNav;
