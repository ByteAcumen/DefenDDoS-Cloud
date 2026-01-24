'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Button } from '@/components/ui/Button'; // Assuming Button component exists
import {
    Activity,
    Shield,
    AlertTriangle,
    CheckCircle,
    Server,
    Zap,
    BrainCircuit
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { useAllDetectionEvents, useAllMLPredictions } from '@/hooks/useBackendApi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThreatDetectionPage() {
    const { data: detectionEvents } = useAllDetectionEvents('-24h');
    const { data: mlPredictions } = useAllMLPredictions('-24h');

    // Process data for charts
    const threatTimeline = React.useMemo(() => {
        if (!mlPredictions) return [];
        // Group by hour
        const grouped = mlPredictions.reduce((acc: any, curr: any) => {
            const hour = new Date(curr.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + (curr.isAttack ? 1 : 0);
            return acc;
        }, {});

        return Object.entries(grouped).map(([hour, count]) => ({
            time: `${hour}:00`,
            threats: count
        }));
    }, [mlPredictions]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    Threat Detection Center
                </h1>
                <p className="text-slate-400 mt-1">
                    AI-powered real-time threat analysis and mitigation
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Active Threats"
                    value={mlPredictions?.filter((p: any) => p.isAttack).length || 0}
                    icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                    trend="up"
                    severity="critical"
                />
                <KPICard
                    title="ML Confidence"
                    value={98.5}
                    subtitle="%"
                    format="number"
                    icon={<BrainCircuit className="w-5 h-5 text-purple-500" />}
                    trend="neutral"
                />
                <KPICard
                    title="Auto-Mitigated"
                    value={detectionEvents?.length || 0}
                    icon={<Shield className="w-5 h-5 text-green-500" />}
                    trend="up"
                />
                <KPICard
                    title="System Load"
                    value={42}
                    subtitle="%"
                    format="number"
                    icon={<Server className="w-5 h-5 text-blue-500" />}
                    trend="neutral"
                />
            </div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visualizer (Left 2 cols) */}
                <Card className="lg:col-span-2 p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur min-h-[400px]">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-400" />
                        Threat Timeline (24h)
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={threatTimeline}>
                                <defs>
                                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="threats"
                                    stroke="#ef4444"
                                    fillOpacity={1}
                                    fill="url(#colorThreats)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Live Feed (Right 1 col) */}
                <Card className="p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur h-[460px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Live Detection Feed
                    </h3>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {mlPredictions?.slice(0, 10).map((pred: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-3 rounded-lg border ${pred.isAttack
                                        ? 'bg-red-500/10 border-red-500/20'
                                        : 'bg-slate-800/50 border-slate-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className={`text-sm font-medium ${pred.isAttack ? 'text-red-400' : 'text-slate-300'
                                            }`}>
                                            {pred.isAttack ? 'Attack Detected' : 'Normal Traffic'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(pred.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">
                                        {(pred.confidence * 100).toFixed(1)}% Conf.
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
