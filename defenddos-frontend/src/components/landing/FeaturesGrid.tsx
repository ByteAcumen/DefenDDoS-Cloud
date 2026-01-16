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
        description: 'Random Forest (99.2% accuracy) + LSTM Autoencoder for comprehensive threat detection and anomaly recognition.',
        icon: Brain,
        gradient: 'from-cyan-500 to-blue-500',
        highlights: ['99.2% Accuracy', 'Real-time Inference', '30+ Features'],
    },
    {
        title: 'Enterprise Security',
        description: 'API key authentication, rate limiting (60 req/min), automatic IP blocking, and comprehensive audit logging.',
        icon: Shield,
        gradient: 'from-green-500 to-emerald-500',
        highlights: ['Rate Limiting', 'IP Blocking', 'JWT Auth'],
    },
    {
        title: 'Real-Time Monitoring',
        description: 'Live traffic analysis with WebSocket updates, attack geo-visualization, and instant threat notifications.',
        icon: Activity,
        gradient: 'from-purple-500 to-pink-500',
        highlights: ['Live Updates', 'Geo-Location', 'Alerts'],
    },
    {
        title: 'Production Ready',
        description: 'Docker containerization, Kubernetes support, CI/CD pipelines, and 99.9% uptime SLA guaranteed.',
        icon: Rocket,
        gradient: 'from-orange-500 to-red-500',
        highlights: ['Docker', 'Kubernetes', 'CI/CD'],
    },
    {
        title: 'Time-Series Database',
        description: 'InfluxDB integration for efficient storage and querying of network traffic data with high performance.',
        icon: Database,
        gradient: 'from-indigo-500 to-violet-500',
        highlights: ['InfluxDB', 'Fast Queries', 'High Volume'],
    },
    {
        title: 'Redis Caching',
        description: 'Distributed IP blocklist with Redis for sub-millisecond lookups and persistent threat data across instances.',
        icon: Lock,
        gradient: 'from-rose-500 to-pink-500',
        highlights: ['Distributed', 'Persistent', 'Fast Lookups'],
    },
    {
        title: 'Performance Metrics',
        description: 'Comprehensive system metrics, response time tracking, and performance benchmarks with visual dashboards.',
        icon: Gauge,
        gradient: 'from-teal-500 to-cyan-500',
        highlights: ['Metrics', 'Benchmarks', 'Dashboards'],
    },
    {
        title: 'Global Protection',
        description: 'Attack origin visualization, threat intelligence integration, and worldwide traffic analysis capabilities.',
        icon: Globe,
        gradient: 'from-blue-500 to-indigo-500',
        highlights: ['Threat Intel', 'Geo-Viz', 'Global Scale'],
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export function FeaturesGrid() {
    return (
        <section className="py-20 lg:py-32 bg-slate-900 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)`,
                    backgroundSize: '40px 40px',
                }} />
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
                    <span className="inline-block px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
                        Powerful Features
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Everything You Need for{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            DDoS Protection
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
                    viewport={{ once: true, margin: '-100px' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            className="group relative"
                        >
                            <div className="relative h-full p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1">
                                {/* Gradient border on hover */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                {/* Icon */}
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Highlights */}
                                <div className="flex flex-wrap gap-2">
                                    {feature.highlights.map((highlight, hIndex) => (
                                        <span
                                            key={hIndex}
                                            className="px-2 py-1 text-xs font-medium rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50"
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
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-16"
                >
                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
                    >
                        Explore All Features
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}

export default FeaturesGrid;
