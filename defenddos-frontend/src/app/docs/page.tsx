'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Code,
    Terminal,
    Zap,
    Shield,
    Database,
    Search,
    ChevronRight,
    ExternalLink,
    Copy,
    Check
} from 'lucide-react';

const API_CATEGORIES = [
    {
        name: 'Health & Status',
        icon: Zap,
        color: 'text-green-400',
        endpoints: [
            { method: 'GET', path: '/actuator/health', description: 'Check system health' },
            { method: 'GET', path: '/actuator/info', description: 'Application info' },
            { method: 'GET', path: '/actuator/metrics', description: 'Available metrics' },
        ],
    },
    {
        name: 'Traffic Analysis',
        icon: Database,
        color: 'text-cyan-400',
        endpoints: [
            { method: 'GET', path: '/api/v1/traffic/query', description: 'Query traffic records' },
            { method: 'GET', path: '/api/v1/traffic/summary', description: 'Traffic summary by IP' },
            { method: 'GET', path: '/api/v1/traffic/visualization', description: 'Time-series data' },
            { method: 'POST', path: '/api/v1/traffic/ingest', description: 'Ingest traffic data' },
            { method: 'POST', path: '/api/v1/traffic/predict-attack', description: 'ML attack prediction' },
        ],
    },
    {
        name: 'Mitigation',
        icon: Shield,
        color: 'text-purple-400',
        endpoints: [
            { method: 'GET', path: '/api/v1/mitigation/status', description: 'Mitigation status' },
            { method: 'GET', path: '/api/v1/mitigation/blocked', description: 'List blocked IPs' },
            { method: 'POST', path: '/api/v1/mitigation/block/{ip}', description: 'Block an IP' },
            { method: 'POST', path: '/api/v1/mitigation/unblock/{ip}', description: 'Unblock an IP' },
            { method: 'GET', path: '/api/v1/mitigation/stats', description: 'Mitigation statistics' },
        ],
    },
    {
        name: 'Statistics',
        icon: Terminal,
        color: 'text-yellow-400',
        endpoints: [
            { method: 'GET', path: '/api/v1/statistics/detailed', description: 'Detailed statistics' },
            { method: 'GET', path: '/api/v1/statistics/realtime', description: 'Real-time metrics' },
            { method: 'GET', path: '/api/v1/statistics/attack-analysis', description: 'Attack analysis' },
            { method: 'GET', path: '/api/v1/statistics/ml-stats', description: 'ML model statistics' },
        ],
    },
];

const QUICK_START_STEPS = [
    { title: 'Check Health', code: 'curl http://localhost:8081/actuator/health' },
    { title: 'Query Traffic', code: 'curl -H "X-API-KEY: defenddos-api-key" http://localhost:8081/api/v1/traffic/query?range=-1h' },
    { title: 'Block IP', code: 'curl -X POST -H "X-API-KEY: defenddos-api-key" http://localhost:8081/api/v1/mitigation/block/192.168.1.100' },
];

const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400',
    POST: 'bg-blue-500/20 text-blue-400',
    PUT: 'bg-yellow-500/20 text-yellow-400',
    DELETE: 'bg-red-500/20 text-red-400',
};

export default function DocsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const filteredCategories = API_CATEGORIES.map(cat => ({
        ...cat,
        endpoints: cat.endpoints.filter(ep =>
            ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ep.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter(cat => cat.endpoints.length > 0 || !searchQuery);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto mb-8"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Documentation</h1>
                        <p className="text-slate-400">Complete API reference and guides</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search endpoints..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                </div>
            </motion.div>

            <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
                {/* Sidebar - Quick Start */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 space-y-6"
                >
                    {/* Quick Start Card */}
                    <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Quick Start
                        </h3>
                        <div className="space-y-4">
                            {QUICK_START_STEPS.map((step, i) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-sm font-medium text-slate-300">{i + 1}. {step.title}</p>
                                    <div className="relative">
                                        <pre className="p-3 rounded-lg bg-slate-900/50 text-xs text-slate-400 overflow-x-auto">
                                            {step.code}
                                        </pre>
                                        <button
                                            onClick={() => copyToClipboard(step.code, i)}
                                            className="absolute top-2 right-2 p-1.5 rounded bg-slate-700/50 text-slate-400 hover:text-white"
                                        >
                                            {copiedIndex === i ? (
                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                        <h3 className="text-sm font-semibold text-slate-400 mb-4">Resources</h3>
                        <div className="space-y-2">
                            {[
                                { label: 'API Playground', href: '/api-playground' },
                                { label: 'Dashboard', href: '/dashboard' },
                                { label: 'GitHub Repository', href: '#', external: true },
                            ].map((link, i) => (
                                <a
                                    key={i}
                                    href={link.href}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                                >
                                    <span className="text-sm">{link.label}</span>
                                    {link.external ? (
                                        <ExternalLink className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Main Content - API Reference */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Code className="w-5 h-5 text-cyan-400" />
                        API Reference
                    </h2>

                    {filteredCategories.map((category, catIndex) => (
                        <motion.div
                            key={catIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIndex * 0.1 }}
                            className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden"
                        >
                            {/* Category Header */}
                            <button
                                onClick={() => setSelectedCategory(
                                    selectedCategory === category.name ? null : category.name
                                )}
                                className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <category.icon className={`w-5 h-5 ${category.color}`} />
                                    <span className="font-medium text-white">{category.name}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-xs text-slate-400">
                                        {category.endpoints.length} endpoints
                                    </span>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${selectedCategory === category.name ? 'rotate-90' : ''
                                    }`} />
                            </button>

                            {/* Endpoints */}
                            {(selectedCategory === category.name || !selectedCategory) && (
                                <div className="border-t border-slate-700/50">
                                    {category.endpoints.map((endpoint, epIndex) => (
                                        <div
                                            key={epIndex}
                                            className="p-4 flex items-center gap-4 hover:bg-slate-700/20 border-b border-slate-700/30 last:border-0"
                                        >
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${METHOD_COLORS[endpoint.method]}`}>
                                                {endpoint.method}
                                            </span>
                                            <code className="text-sm text-cyan-400 font-mono flex-1">{endpoint.path}</code>
                                            <span className="text-sm text-slate-500 hidden sm:block">{endpoint.description}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
