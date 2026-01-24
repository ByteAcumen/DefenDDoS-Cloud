'use client';

import React, { useMemo } from 'react';
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
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { useDetailedStatistics, useTrafficSummary } from '@/hooks/useBackendApi';
import { Loader2 } from 'lucide-react';

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

export default function TrafficCharts() {
    const { data: detailedStats, isLoading: statsLoading } = useDetailedStatistics();
    const { data: trafficSummary, isLoading: summaryLoading } = useTrafficSummary();

    const isLoading = statsLoading || summaryLoading;

    // Process protocol distribution data
    const protocolData = useMemo(() => {
        if (!trafficSummary?.protocolDistribution) return [];
        return Object.entries(trafficSummary.protocolDistribution).map(([name, value]) => ({
            name,
            value
        }));
    }, [trafficSummary]);

    // Process bandwidth data
    const bandwidthData = useMemo(() => {
        if (!detailedStats?.bandwidthHistory) return [];
        return detailedStats.bandwidthHistory.map((point: any) => ({
            time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            inbound: point.inbound / 1024 / 1024, // Convert to MB
            outbound: point.outbound / 1024 / 1024 // Convert to MB
        }));
    }, [detailedStats]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bandwidth Usage */}
            <Card className="p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                <h3 className="text-lg font-semibold mb-6 text-slate-200">Network Bandwidth (MB/s)</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={bandwidthData}>
                            <defs>
                                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="inbound"
                                stroke="#0ea5e9"
                                fillOpacity={1}
                                fill="url(#colorInbound)"
                                name="Inbound"
                            />
                            <Area
                                type="monotone"
                                dataKey="outbound"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorOutbound)"
                                name="Outbound"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Protocol Distribution */}
            <Card className="p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                <h3 className="text-lg font-semibold mb-6 text-slate-200">Protocol Distribution</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={protocolData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {protocolData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {protocolData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm text-slate-400">
                                {entry.name} ({String(entry.value)}%)
                            </span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
