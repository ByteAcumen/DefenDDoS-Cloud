'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import TrafficCharts from '@/components/analytics/TrafficCharts';
import { KPICard } from '@/components/ui/KPICard';
import { useDetailedStatistics } from '@/hooks/useBackendApi';
import { Button } from '@/components/ui/Button';

export default function AnalyticsPage() {
    const { data: stats, refetch } = useDetailedStatistics();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Traffic Analytics
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Detailed breakdown of network traffic and protocol distribution
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Select className="w-[180px] bg-slate-900/50 border-slate-700">
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </Select>

                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>

                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Peak Bandwidth"
                    value={stats?.peakBandwidth ? (stats.peakBandwidth / 1024 / 1024).toFixed(2) : '0'}
                    subtitle="MB/s"
                    icon={<BarChart3 className="w-4 h-4 text-blue-400" />}
                    trend="neutral"
                />
                <KPICard
                    title="Avg Packet Size"
                    value={stats?.avgPacketSize || 0}
                    subtitle="bytes"
                    icon={<BarChart3 className="w-4 h-4 text-purple-400" />}
                    trend="up"
                />
                <KPICard
                    title="Total Data Transfer"
                    value={stats?.totalTransfer ? (stats.totalTransfer / 1024 / 1024 / 1024).toFixed(2) : '0'}
                    subtitle="GB"
                    icon={<BarChart3 className="w-4 h-4 text-green-400" />}
                    trend="up"
                />
            </div>

            {/* Main Charts */}
            <TrafficCharts />

            {/* Detailed Stats Table */}
            <Card className="p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-slate-200">Traffic by Source (Top 5)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Source IP</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Requests</th>
                                <th className="px-4 py-3">Bandwidth</th>
                                <th className="px-4 py-3 rounded-r-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {/* Use real data if available, otherwise show empty state or loading */}
                            {stats?.trafficBySource && stats.trafficBySource.length > 0 ? (
                                stats.trafficBySource.slice(0, 5).map((source: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-200">{source.ip}</td>
                                        <td className="px-4 py-3 text-slate-400">{source.location || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-slate-300">{source.requestCount}</td>
                                        <td className="px-4 py-3 text-slate-300">{(source.bandwidth / 1024 / 1024).toFixed(2)} MB</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${source.reputation > 80 ? 'bg-green-500/10 text-green-400' :
                                                    source.reputation > 50 ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-red-500/10 text-red-400'
                                                }`}>
                                                {source.reputation > 80 ? 'Trusted' : source.reputation > 50 ? 'Suspicious' : 'Malicious'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No traffic data available for this period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
