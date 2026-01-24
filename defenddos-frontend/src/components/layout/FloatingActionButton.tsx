'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Settings, LogOut, Bell, Moon, Plus, X } from 'lucide-react';
import { hapticFeedback } from '@/lib/utils/haptics';

const quickActions = [
    { icon: Bell, label: 'Notifications', action: 'notifications' },
    { icon: Moon, label: 'Dark Mode', action: 'theme' },
    { icon: Settings, label: 'Settings', action: 'settings' },
    { icon: LogOut, label: 'Logout', action: 'logout' },
];

export function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        hapticFeedback.medium();
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {/* Quick action items */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute bottom-20 right-0 flex flex-col gap-3 items-end"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={{
                            open: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
                            closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
                        }}
                    >
                        {quickActions.map((action) => (
                            <motion.div
                                key={action.action}
                                className="flex items-center gap-3"
                                variants={{
                                    open: { opacity: 1, y: 0, scale: 1 },
                                    closed: { opacity: 0, y: 20, scale: 0 }
                                }}
                            >
                                <span className="glass-layer-2 px-3 py-1 rounded-lg text-sm font-medium text-white shadow-lg">
                                    {action.label}
                                </span>
                                <motion.button
                                    className="glass-layer-2 rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform shadow-lg border border-white/10 bg-slate-900/80"
                                    whileHover={{ scale: 1.1, rotate: 360 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        hapticFeedback.light();
                                        console.log(`Action: ${action.action}`);
                                    }}
                                >
                                    <action.icon className="w-5 h-5 text-cyan-400" />
                                </motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB button */}
            <motion.button
                className="relative w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full shadow-2xl shadow-cyan-500/50 flex items-center justify-center"
                whileHover={{ scale: 1.1, boxShadow: '0 0 40px rgba(34, 211, 238, 0.8)' }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                {/* Rotating particles on open */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                                    initial={{ scale: 0, x: 0, y: 0 }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        x: Math.cos((i / 8) * Math.PI * 2) * 40,
                                        y: Math.sin((i / 8) * Math.PI * 2) * 40,
                                    }}
                                    exit={{ scale: 0 }}
                                    transition={{ duration: 0.6 }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Icon morph */}
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Plus className="w-8 h-8 text-white" />
                </motion.div>

                {/* Pulse ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-cyan-400"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.button>
        </div>
    );
}
