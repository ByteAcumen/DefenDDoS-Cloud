'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Activity,
    Users,
    ArrowUpRight,
    Globe,
    Zap
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import {
    useBackendHealth,
    useDashboardData,
    useAllDetectionEvents,
    useAllMLPredictions
} from '@/hooks/useBackendApi';
import LiveTrafficGraph from '@/components/dashboard/LiveTrafficGraph';

export default function DashboardPage() {
    const {
        securityDashboard,
        realtimeMetrics,
        blockedIPs,
        backendHealth
    } = useDashboardData();

    const isOnline = backendHealth?.isSuccess ?? false;

    const { data: detectionEvents } = useAllDetectionEvents('-24h');
    const { data: mlPredictions } = useAllMLPredictions('-24h');

    // Combine and sort alerts
    const recentAlerts = React.useMemo(() => {
        const events = [];
        if (detectionEvents && Array.isArray(detectionEvents)) {
            events.push(...detectionEvents.map((e: any) => ({
                id: `det-${e.time}`,
                title: `Threat Detected: ${e.threatLevel}`,
                message: `Source: ${e.sourceIp}`,
                time: e.time,
                type: 'critical'
            })));
        }
        if (mlPredictions && Array.isArray(mlPredictions)) {
            events.push(...mlPredictions.filter((p: any) => p.isAttack).map((p: any) => ({
                id: `ml-${p.timestamp}`,
                title: `ML Detection: ${p.attackType}`,
                message: `Confidence: ${(p.confidence * 100).toFixed(1)}%`,
                time: p.timestamp,
                type: 'warning'
            })));
        }
        return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
    }, [detectionEvents, mlPredictions]);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Security Overview
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Real-time threat monitoring and system status
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isOnline
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-sm font-medium">{isOnline ? 'System Operational' : 'Offline'}</span>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Requests"
                    value={realtimeMetrics?.totalPackets || 0}
                    previousValue={realtimeMetrics?.totalPackets ? realtimeMetrics.totalPackets * 0.9 : 0} // Mock previous
                    icon={<Activity className="w-5 h-5" />}
                    trend="up"
                    trendValue={10.5}
                />
                <KPICard
                    title="Threats Blocked"
                    value={blockedIPs?.count || 0}
                    previousValue={blockedIPs?.count ? blockedIPs.count - 2 : 0}
                    icon={<Shield className="w-5 h-5 text-red-400" />}
                    trend="up"
                    severity="high"
                />
                <KPICard
                    title="Active Users"
                    value={realtimeMetrics?.uniqueSourceIps || 0}
                    icon={<Users className="w-5 h-5 text-blue-400" />}
                    trend="neutral"
                />
                <KPICard
                    title="Current PPS"
                    value={Math.round(realtimeMetrics?.packets_per_second || 0)}
                    format="number"
                    subtitle="packets/sec"
                    icon={<Zap className="w-5 h-5 text-yellow-400" />}
                    trend="neutral"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area (2 Cols) */}
                <Card className="lg:col-span-2 min-h-[400px] p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            Live Traffic Monitor
                        </h3>
                        <select className="bg-slate-800 border-slate-700 rounded-lg text-xs px-2 py-1">
                            <option>Last Hour</option>
                            <option>Last 24h</option>
                            <option>7 Days</option>
                        </select>
                    </div>

                    <div className="h-[300px]">
                        <LiveTrafficGraph />
                    </div>
                </Card>

                {/* Status Side Panel (1 Col) */}
                <div className="space-y-6">
                    {/* Quick Actions / Status */}
                    <Card className="p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-purple-400" />
                            Global Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                                <span className="text-sm text-slate-400">US East (N. Virginia)</span>
                                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded">Operational</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                                <span className="text-sm text-slate-400">EU West (Ireland)</span>
                                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded">Operational</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                                <span className="text-sm text-slate-400">Asia Pacific (Tokyo)</span>
                                <span className="text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">Degraded</span>
                            </div>
                        </div>
                    </Card>

                    {/* Recent Alerts */}
                    <Card className="p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-orange-400" />
                            Recent Alerts
                        </h3>
                        <div className="space-y-4">
                            {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
                                <div key={alert.id} className="flex gap-3 items-start border-l-2 border-slate-700 pl-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-200">{alert.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {alert.message} • {new Date(alert.time).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500 italic">No recent threats detected</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
