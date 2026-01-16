'use client';

import { motion } from 'framer-motion';
import {
    Server,
    Database,
    Brain,
    Globe,
    Shield,
    Zap,
    CheckCircle,
    AlertCircle,
    XCircle
} from 'lucide-react';

interface ServiceNode {
    id: string;
    name: string;
    type: 'frontend' | 'backend' | 'ml' | 'database' | 'cache' | 'messaging';
    status: 'healthy' | 'warning' | 'error' | 'offline';
    port?: number;
    metrics?: {
        cpu?: number;
        memory?: number;
        requests?: number;
    };
}

interface NetworkTopologyProps {
    services?: ServiceNode[];
    className?: string;
}

const defaultServices: ServiceNode[] = [
    {
        id: 'frontend',
        name: 'Next.js Frontend',
        type: 'frontend',
        status: 'healthy',
        port: 3000,
        metrics: { cpu: 15, memory: 256, requests: 1200 }
    },
    {
        id: 'backend',
        name: 'Spring Boot',
        type: 'backend',
        status: 'healthy',
        port: 8081,
        metrics: { cpu: 35, memory: 512, requests: 5400 }
    },
    {
        id: 'ml',
        name: 'ML Service',
        type: 'ml',
        status: 'healthy',
        port: 8000,
        metrics: { cpu: 45, memory: 1024, requests: 890 }
    },
    {
        id: 'influxdb',
        name: 'InfluxDB',
        type: 'database',
        status: 'healthy',
        port: 8086,
        metrics: { cpu: 20, memory: 768 }
    },
    {
        id: 'redis',
        name: 'Redis Cache',
        type: 'cache',
        status: 'healthy',
        port: 6379,
        metrics: { cpu: 5, memory: 128 }
    },
    {
        id: 'kafka',
        name: 'Kafka',
        type: 'messaging',
        status: 'warning',
        port: 9092,
        metrics: { cpu: 25, memory: 384 }
    },
];

const getServiceIcon = (type: ServiceNode['type']) => {
    const icons = {
        frontend: Globe,
        backend: Server,
        ml: Brain,
        database: Database,
        cache: Zap,
        messaging: Shield,
    };
    return icons[type];
};

const getStatusColor = (status: ServiceNode['status']) => {
    switch (status) {
        case 'healthy': return { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400' };
        case 'warning': return { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-400' };
        case 'error': return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400' };
        case 'offline': return { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-400' };
    }
};

const getStatusIcon = (status: ServiceNode['status']) => {
    switch (status) {
        case 'healthy': return CheckCircle;
        case 'warning': return AlertCircle;
        case 'error': return XCircle;
        case 'offline': return XCircle;
    }
};

export function NetworkTopology({ services = defaultServices, className = '' }: NetworkTopologyProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <Server className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">System Architecture</h3>
                        <p className="text-sm text-slate-400">Service health and connections</p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-slate-400">Healthy</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-slate-400">Warning</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-slate-400">Error</span>
                    </div>
                </div>
            </div>

            {/* Network Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {services.map((service, index) => {
                    const Icon = getServiceIcon(service.type);
                    const StatusIcon = getStatusIcon(service.status);
                    const colors = getStatusColor(service.status);

                    return (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative"
                        >
                            <div className={`p-4 rounded-xl bg-slate-700/30 border transition-all duration-300 hover:bg-slate-700/50 ${colors.border}/30 hover:${colors.border}/50`}>
                                {/* Status indicator */}
                                <div className="absolute top-3 right-3">
                                    <StatusIcon className={`w-4 h-4 ${colors.text}`} />
                                </div>

                                {/* Icon and Name */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2.5 rounded-lg bg-gradient-to-br from-slate-600/50 to-slate-700/50 border ${colors.border}/20`}>
                                        <Icon className={`w-5 h-5 ${colors.text}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-white">{service.name}</h4>
                                        {service.port && (
                                            <p className="text-xs text-slate-500">:{service.port}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Metrics */}
                                {service.metrics && (
                                    <div className="space-y-2">
                                        {service.metrics.cpu !== undefined && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">CPU</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${service.metrics.cpu}%` }}
                                                            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                                                            className={`h-full ${colors.bg}`}
                                                        />
                                                    </div>
                                                    <span className="text-slate-400 w-8">{service.metrics.cpu}%</span>
                                                </div>
                                            </div>
                                        )}
                                        {service.metrics.memory !== undefined && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">MEM</span>
                                                <span className="text-slate-400">{service.metrics.memory} MB</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pulse animation for healthy services */}
                                {service.status === 'healthy' && (
                                    <div className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className={`absolute inset-0 rounded-xl ${colors.border}/10 animate-pulse`} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Connection Lines (Visual representation) */}
            <div className="mt-6 p-4 rounded-xl bg-slate-700/20 border border-slate-600/30">
                <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                    <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Frontend</span>
                    <span className="text-slate-500">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">Backend</span>
                    <span className="text-slate-500">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">ML Service</span>
                    <span className="text-slate-500">↔</span>
                    <span className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">Databases</span>
                </div>
            </div>
        </motion.div>
    );
}

export default NetworkTopology;
