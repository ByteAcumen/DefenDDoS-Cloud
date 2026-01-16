'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Zap, Brain, Server, Activity, Lock } from 'lucide-react';

interface StatItem {
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
}

const stats: StatItem[] = [
    {
        value: 99.2,
        suffix: '%',
        label: 'ML Accuracy',
        description: 'Random Forest model detection rate',
        icon: Brain,
        color: 'from-cyan-500 to-blue-500',
    },
    {
        value: 50,
        prefix: '<',
        suffix: 'ms',
        label: 'Response Time',
        description: 'Average threat detection latency',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
    },
    {
        value: 1245,
        suffix: '+',
        label: 'Threats Blocked',
        description: 'Total attacks mitigated this month',
        icon: Shield,
        color: 'from-green-500 to-emerald-500',
    },
    {
        value: 31,
        suffix: '+',
        label: 'API Endpoints',
        description: 'Fully documented REST APIs',
        icon: Server,
        color: 'from-purple-500 to-pink-500',
    },
    {
        value: 99.9,
        suffix: '%',
        label: 'Uptime',
        description: 'System availability guarantee',
        icon: Activity,
        color: 'from-blue-500 to-indigo-500',
    },
    {
        value: 24,
        suffix: '/7',
        label: 'Monitoring',
        description: 'Round-the-clock protection',
        icon: Lock,
        color: 'from-red-500 to-rose-500',
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
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    useEffect(() => {
        if (!isInView) return;

        const startTime = Date.now();
        const endValue = value;

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setCount(easeOutQuart * endValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isInView, value, duration]);

    // Format the number
    const displayValue = value % 1 === 0
        ? Math.floor(count).toLocaleString()
        : count.toFixed(1);

    return (
        <span ref={ref}>
            {prefix}{displayValue}{suffix}
        </span>
    );
}

export function StatsCounter() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-50px' });

    return (
        <section className="py-20 lg:py-32 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
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
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Trusted by{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
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
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                                ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                            className="group relative"
                        >
                            <div className="relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/70 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/5">
                                {/* Gradient line at top */}
                                <div className={`absolute top-0 left-4 right-4 h-1 rounded-full bg-gradient-to-r ${stat.color} opacity-60 group-hover:opacity-100 transition-opacity`} />

                                {/* Icon */}
                                <stat.icon className={`w-8 h-8 mb-4 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: 'transparent', WebkitBackgroundClip: 'text' } as React.CSSProperties} />

                                {/* Counter */}
                                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
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

                                {/* Description - shown on hover */}
                                <div className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        Real-time metrics updated every 30 seconds •
                        <span className="text-cyan-500 ml-1">View Live Dashboard →</span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}

export default StatsCounter;
