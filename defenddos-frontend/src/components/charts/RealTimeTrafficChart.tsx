'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';

interface TrafficDataPoint {
    time: string;
    inbound: number;
    outbound: number;
    blocked: number;
    attacks?: number;
}

interface RealTimeTrafficChartProps {
    data?: TrafficDataPoint[];
    loading?: boolean;
    className?: string;
    showAttacks?: boolean;
}

// Generate mock data if none provided
const generateMockData = (): TrafficDataPoint[] => {
    const data: TrafficDataPoint[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        data.push({
            time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            inbound: Math.floor(Math.random() * 500) + 200,
            outbound: Math.floor(Math.random() * 400) + 150,
            blocked: Math.floor(Math.random() * 50) + 5,
            attacks: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 1 : 0,
        });
    }

    return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-xl">
            <p className="text-slate-300 text-sm font-medium mb-2">{label}</p>
            <div className="space-y-1.5">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-400 text-sm">{entry.name}:</span>
                        <span className="text-white text-sm font-semibold">
                            {entry.value.toLocaleString()} req/min
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function RealTimeTrafficChart({
    data,
    loading = false,
    className = '',
    showAttacks = true,
}: RealTimeTrafficChartProps) {
    const chartData = useMemo(() => data || generateMockData(), [data]);

    const totals = useMemo(() => {
        const latest = chartData[chartData.length - 1];
        const previous = chartData[chartData.length - 2];

        return {
            inbound: latest?.inbound || 0,
            outbound: latest?.outbound || 0,
            blocked: latest?.blocked || 0,
            trend: latest && previous
                ? ((latest.inbound - previous.inbound) / previous.inbound * 100).toFixed(1)
                : '0',
        };
    }, [chartData]);

    if (loading) {
        return (
            <div className={`p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 ${className}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-1/3" />
                    <div className="h-64 bg-slate-700/50 rounded-xl" />
                </div>
            </div>
        );
    }

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
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Real-Time Traffic</h3>
                        <p className="text-sm text-slate-400">Network activity over last 30 minutes</p>
                    </div>
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-green-400">LIVE</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-slate-400">Inbound</span>
                    </div>
                    <p className="text-xl font-bold text-white">{totals.inbound.toLocaleString()}</p>
                    <p className="text-xs text-cyan-400">+{totals.trend}%</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-400">Outbound</span>
                    </div>
                    <p className="text-xl font-bold text-white">{totals.outbound.toLocaleString()}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-slate-400">Blocked</span>
                    </div>
                    <p className="text-xl font-bold text-white">{totals.blocked.toLocaleString()}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis
                            dataKey="time"
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: 20 }}
                            formatter={(value) => <span className="text-slate-400 text-sm">{value}</span>}
                        />
                        <Area
                            type="monotone"
                            dataKey="inbound"
                            name="Inbound"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            fill="url(#inboundGradient)"
                        />
                        <Area
                            type="monotone"
                            dataKey="outbound"
                            name="Outbound"
                            stroke="#a855f7"
                            strokeWidth={2}
                            fill="url(#outboundGradient)"
                        />
                        <Area
                            type="monotone"
                            dataKey="blocked"
                            name="Blocked"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#blockedGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export default RealTimeTrafficChart;
