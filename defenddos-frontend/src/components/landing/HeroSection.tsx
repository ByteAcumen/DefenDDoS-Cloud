'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Shield, Zap, Brain, ArrowRight, Play, CheckCircle, Globe, Lock, Activity } from 'lucide-react';

// Lazy load 3D component
const Globe3D = dynamic(() => import('@/components/3d/Globe3D').then(mod => ({ default: mod.Globe3D })), {
    ssr: false,
    loading: () => <div className="w-full h-full" />
});

const statsData = [
    { value: '99.2%', label: 'Detection Rate', icon: Brain, color: 'from-violet-500 to-purple-500' },
    { value: '<50ms', label: 'Response Time', icon: Zap, color: 'from-amber-500 to-orange-500' },
    { value: '24/7', label: 'Monitoring', icon: Shield, color: 'from-emerald-500 to-teal-500' },
];

const trustedBy = [
    'Enterprise Ready',
    'SOC 2 Compliant',
    'GDPR Ready',
    '99.9% Uptime SLA',
];

// Animated background orbs
const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
    <motion.div
        className={`absolute rounded-full blur-3xl ${className}`}
        style={{ willChange: 'transform' }}
        animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
        }}
        transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
        }}
    />
);

export function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const yText = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const opacityText = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
    const scaleGlobe = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

    return (
        <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden">
            {/* Premium Dark Background with Gradient Mesh */}
            <div className="absolute inset-0 bg-[#0a0a1a]">
                {/* Animated gradient mesh */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(59,130,246,0.15),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(139,92,246,0.15),transparent)]" />

                {/* Floating orbs for depth */}
                <FloatingOrb className="w-[500px] h-[500px] bg-blue-600/10 top-[-10%] left-[-10%]" delay={0} />
                <FloatingOrb className="w-[400px] h-[400px] bg-violet-600/10 bottom-[-5%] right-[-5%]" delay={2} />
                <FloatingOrb className="w-[300px] h-[300px] bg-cyan-600/10 top-[40%] right-[20%]" delay={4} />

                {/* Subtle noise texture */}
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto pt-28 pb-20">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-20 items-center">
                    {/* Left Content */}
                    <motion.div
                        style={{ y: yText, opacity: opacityText, willChange: 'transform, opacity' }}
                        className="flex-1 max-w-2xl text-center lg:text-left z-20"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 backdrop-blur-sm"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                            </span>
                            <span className="text-xs font-semibold tracking-wider text-violet-300 uppercase">
                                AI-Powered Security Platform
                            </span>
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8"
                        >
                            <span className="text-white">Protect Your</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400">
                                Digital Infrastructure
                            </span>
                        </motion.h1>

                        {/* Subheading */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0"
                        >
                            Enterprise-grade DDoS protection powered by dual-layer AI.
                            Detect and mitigate threats in real-time with 99.2% accuracy
                            and sub-50ms response times.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
                        >
                            <Link
                                href="/dashboard"
                                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 text-white rounded-xl font-semibold text-base overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span className="relative z-10">Start Free Trial</span>
                                <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </Link>

                            <button className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-base text-white/90 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                    <Play className="w-4 h-4 ml-0.5" />
                                </div>
                                <span>Watch Demo</span>
                            </button>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-wrap items-center gap-4 justify-center lg:justify-start"
                        >
                            {trustedBy.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right Content - Visual Element */}
                    <motion.div
                        style={{ scale: scaleGlobe, willChange: 'transform' }}
                        className="relative flex-1 w-full max-w-xl lg:max-w-none"
                    >
                        {/* Glow behind globe */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[400px] h-[400px] bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-purple-600/20 rounded-full blur-3xl" />
                        </div>

                        {/* 3D Globe */}
                        <div className="relative h-[400px] sm:h-[450px] lg:h-[550px] w-full">
                            <Globe3D />
                        </div>

                        {/* Floating Cards */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="absolute top-8 right-0 lg:right-[-20px]"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="p-4 bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">Threat Blocked</div>
                                        <div className="text-sm font-bold text-white">SYN Flood Attack</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Mitigated in 23ms</span>
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="absolute bottom-16 left-0 lg:left-[-20px]"
                        >
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="p-4 bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">All Systems Secure</div>
                                        <div className="text-xs text-emerald-400">0 active threats</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="absolute bottom-0 right-[20%]"
                        >
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                className="p-3 bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
                            >
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs text-slate-300 font-medium">192 Countries Protected</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-20 lg:mt-28"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {statsData.map((stat, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="relative group"
                            >
                                <div className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300">
                                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {stat.label}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center gap-2"
                >
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Scroll</span>
                    <div className="w-6 h-10 rounded-full border-2 border-slate-700 p-1">
                        <motion.div
                            animate={{ y: [0, 16, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 bg-violet-500 rounded-full mx-auto"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}

export default HeroSection;
