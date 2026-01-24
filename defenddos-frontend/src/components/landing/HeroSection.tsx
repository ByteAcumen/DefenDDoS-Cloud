'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Shield, Zap, Brain, BarChart3 } from 'lucide-react';

// Lazy load 3D component to improve initial page load
const Globe3D = dynamic(() => import('@/components/3d/Globe3D').then(mod => ({ default: mod.Globe3D })), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.3,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

const statsData = [
    { value: '99.2%', label: 'ML Accuracy', icon: Brain },
    { value: '<50ms', label: 'Response Time', icon: Zap },
    { value: '24/7', label: 'Monitoring', icon: Shield },
    { value: '31+', label: 'API Endpoints', icon: BarChart3 },
];

export function HeroSection() {
    return (
        <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Background gradient effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-28">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[80vh]">
                    {/* Left Content */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center lg:text-left"
                    >
                        {/* Badge */}
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <span className="text-sm font-medium text-cyan-400">Production Ready • Grade A+</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight"
                        >
                            <span className="text-white">AI-Powered</span>
                            <br />
                            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                                DDoS Defense
                            </span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            variants={itemVariants}
                            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0"
                        >
                            Enterprise-grade protection with dual ML models, real-time threat detection,
                            and automatic mitigation. Secure your infrastructure in milliseconds.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                        >
                            <Link
                                href="/dashboard"
                                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
                            >
                                <span className="relative z-10">Open Dashboard</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>


                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
                        >
                            {statsData.map((stat, index) => (
                                <div
                                    key={index}
                                    className="relative group p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-800/70"
                                >
                                    <stat.icon className="w-5 h-5 text-cyan-500 mb-2" />
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-sm text-slate-400">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right - 3D Globe */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="relative h-[400px] sm:h-[500px] lg:h-[600px]"
                    >
                        <Globe3D />

                        {/* Floating cards around globe */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="absolute top-10 left-0 sm:left-10 p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 backdrop-blur-md"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm text-white font-medium">System Protected</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.4, duration: 0.6 }}
                            className="absolute bottom-20 right-0 sm:right-10 p-3 rounded-lg bg-slate-800/80 border border-cyan-500/30 backdrop-blur-md"
                        >
                            <div className="text-xs text-slate-400">Threats Blocked</div>
                            <div className="text-xl font-bold text-cyan-400">1,245+</div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <div className="w-6 h-10 border-2 border-slate-600 rounded-full p-1">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-cyan-500 rounded-full mx-auto"
                    />
                </div>
            </motion.div>
        </section>
    );
}

export default HeroSection;
