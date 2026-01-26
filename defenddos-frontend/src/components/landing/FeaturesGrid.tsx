'use client';

import { motion } from 'framer-motion';
import {
    Brain,
    Shield,
    Activity,
    Rocket,
    Database,
    Lock,
    Gauge,
    Globe
} from 'lucide-react';

const features = [
    {
        title: 'Dual ML Models',
        description: 'Random Forest + LSTM Autoencoder for comprehensive threat detection with 99.2% accuracy.',
        icon: Brain,
        gradient: 'from-violet-500 to-purple-500',
        highlights: ['99.2% Accuracy', 'Real-time', '30+ Features'],
    },
    {
        title: 'Enterprise Security',
        description: 'API key auth, rate limiting at 60 req/min, automatic IP blocking, and audit logging.',
        icon: Shield,
        gradient: 'from-emerald-500 to-teal-500',
        highlights: ['Rate Limiting', 'IP Blocking', 'JWT Auth'],
    },
    {
        title: 'Real-Time Monitoring',
        description: 'Live traffic analysis with WebSocket updates, geo-visualization, and instant alerts.',
        icon: Activity,
        gradient: 'from-pink-500 to-rose-500',
        highlights: ['Live Updates', 'Geo-Location', 'Alerts'],
    },
    {
        title: 'Production Ready',
        description: 'Docker, Kubernetes, CI/CD pipelines, and 99.9% uptime SLA guaranteed.',
        icon: Rocket,
        gradient: 'from-amber-500 to-orange-500',
        highlights: ['Docker', 'Kubernetes', 'CI/CD'],
    },
    {
        title: 'Time-Series Database',
        description: 'InfluxDB integration for efficient storage and high-performance queries.',
        icon: Database,
        gradient: 'from-blue-500 to-cyan-500',
        highlights: ['InfluxDB', 'Fast Queries', 'High Volume'],
    },
    {
        title: 'Redis Caching',
        description: 'Distributed IP blocklist with sub-millisecond lookups and persistent data.',
        icon: Lock,
        gradient: 'from-indigo-500 to-violet-500',
        highlights: ['Distributed', 'Persistent', 'Fast'],
    },
    {
        title: 'Performance Metrics',
        description: 'Comprehensive system metrics, response tracking, and visual dashboards.',
        icon: Gauge,
        gradient: 'from-cyan-500 to-blue-500',
        highlights: ['Metrics', 'Benchmarks', 'Dashboards'],
    },
    {
        title: 'Global Protection',
        description: 'Attack origin visualization, threat intelligence, and worldwide traffic analysis.',
        icon: Globe,
        gradient: 'from-purple-500 to-pink-500',
        highlights: ['Threat Intel', 'Geo-Viz', 'Global'],
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export function FeaturesGrid() {
    return (
        <section id="features" className="py-24 lg:py-32 bg-[#0d0d1a] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.08),transparent_50%)]" />
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                        backgroundSize: '40px 40px',
                    }}
                />
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
                    <span className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                        Powerful Features
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Everything You Need for{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400">
                            Complete Protection
                        </span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        A comprehensive security platform with cutting-edge ML models, real-time monitoring, and enterprise-grade infrastructure.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            className="group"
                        >
                            <div className="relative h-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.04] hover:border-white/[0.1] hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]">
                                {/* Hover glow */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 blur-xl`} />

                                {/* Icon */}
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5 shadow-lg`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Highlights */}
                                <div className="flex flex-wrap gap-2">
                                    {feature.highlights.map((highlight, hIndex) => (
                                        <span
                                            key={hIndex}
                                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/[0.03] text-slate-400 border border-white/[0.05]"
                                        >
                                            {highlight}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-16"
                >
                    <a
                        href="/dashboard"
                        className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 text-white font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Explore All Features
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}

export default FeaturesGrid;
