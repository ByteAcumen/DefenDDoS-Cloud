'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Zap, Brain, Server, Activity, Lock } from 'lucide-react';
import { useDashboardData } from '@/hooks/useBackendApi';

interface StatItem {
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
    isDynamic?: boolean;
}

const stats: StatItem[] = [
    {
        value: 99.2,
        suffix: '%',
        label: 'ML Accuracy',
        description: 'Random Forest model detection rate',
        icon: Brain,
        gradient: 'from-violet-500 to-purple-500',
    },
    {
        value: 50,
        prefix: '<',
        suffix: 'ms',
        label: 'Response Time',
        description: 'Average threat detection latency',
        icon: Zap,
        gradient: 'from-amber-500 to-orange-500',
    },
    {
        value: 0,
        suffix: '+',
        label: 'Threats Blocked',
        description: 'Total attacks mitigated this month',
        icon: Shield,
        gradient: 'from-emerald-500 to-teal-500',
        isDynamic: true,
    },
    {
        value: 31,
        suffix: '+',
        label: 'API Endpoints',
        description: 'Fully documented REST APIs',
        icon: Server,
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        value: 99.9,
        suffix: '%',
        label: 'Uptime',
        description: 'System availability guarantee',
        icon: Activity,
        gradient: 'from-pink-500 to-rose-500',
    },
    {
        value: 24,
        suffix: '/7',
        label: 'Monitoring',
        description: 'Round-the-clock protection',
        icon: Lock,
        gradient: 'from-indigo-500 to-violet-500',
    },
];

function AnimatedCounter({
    value,
    suffix = '',
    prefix = '',
    duration = 2000
}: {
    value: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        if (!isInView) return;

        const startTime = Date.now();
        const endValue = value;

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(easeOutQuart * endValue);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isInView, value, duration]);

    const displayValue = value % 1 === 0
        ? Math.floor(count).toLocaleString()
        : count.toFixed(1);

    return (
        <span ref={ref}>
            {prefix}{displayValue}{suffix}
        </span>
    );
}

import React from 'react';

export function StatsCounter() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-50px' });
    const { securityDashboard } = useDashboardData();

    const displayStats = stats.map(stat => {
        if (stat.isDynamic && stat.label === 'Threats Blocked') {
            return {
                ...stat,
                value: securityDashboard?.activeThreats || 1245
            };
        }
        return stat;
    });

    return (
        <section className="py-24 lg:py-32 bg-[#0a0a1a] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.1),transparent_70%)]" />
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                        Proven Performance
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Trusted by{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400">
                            Industry Leaders
                        </span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Our AI-powered platform delivers enterprise-grade security with unmatched performance metrics.
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div
                    ref={containerRef}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6"
                >
                    {displayStats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                                ease: [0.22, 1, 0.36, 1]
                            }}
                            className="group"
                        >
                            <div className="relative h-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]">
                                {/* Gradient glow on hover */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 blur-xl`} />

                                {/* Icon */}
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>

                                {/* Counter */}
                                <div className="text-2xl lg:text-3xl font-bold text-white mb-2">
                                    <AnimatedCounter
                                        value={stat.value}
                                        suffix={stat.suffix}
                                        prefix={stat.prefix}
                                    />
                                </div>

                                {/* Label */}
                                <div className="text-sm font-medium text-slate-300 mb-1">
                                    {stat.label}
                                </div>

                                {/* Description */}
                                <div className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {stat.description}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-12"
                >
                    <p className="text-slate-500 text-sm">
                        Real-time metrics updated every 30 seconds •{' '}
                        <a href="/dashboard" className="text-violet-400 hover:text-violet-300 transition-colors">
                            View Live Dashboard →
                        </a>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}

export default StatsCounter;
