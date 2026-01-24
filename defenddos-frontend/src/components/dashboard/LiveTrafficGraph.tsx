'use client';

import React, { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useTrafficVisualization } from '@/hooks/useBackendApi';

// Mock data generator for smooth animation
const generateInitialData = () => {
    const data = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
        data.push({
            time: new Date(now - i * 1000).toLocaleTimeString([], { hour12: false }),
            requests: Math.floor(Math.random() * 50) + 20,
            latency: Math.floor(Math.random() * 20) + 10,
        });
    }
    return data;
};

export default function LiveTrafficGraph() {
    const { data: apiData } = useTrafficVisualization('1h', '5m');
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        if (apiData && Array.isArray(apiData)) {
            // Transform API data to chart format
            const formattedData = apiData.map((point: any) => ({
                time: new Date(point.timestamp || point.time).toLocaleTimeString([], { hour12: false }),
                requests: point.packetCount || point.requests || 0,
                latency: point.byteCount ? Math.round(point.byteCount / 100) : 0, // Approx latency proxy
            }));
            setData(formattedData);
        }
    }, [apiData]);

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 0,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis
                        dataKey="time"
                        stroke="#94a3b8"
                        tick={{ fontSize: 10 }}
                        tickMargin={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            color: '#f8fafc'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="requests"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRequests)"
                        animationDuration={500}
                        name="Requests/sec"
                    />
                    <Area
                        type="monotone"
                        dataKey="latency"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLatency)"
                        animationDuration={500}
                        name="Latency (ms)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
