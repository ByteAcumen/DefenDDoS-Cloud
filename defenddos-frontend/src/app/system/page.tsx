'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import ServiceStatus from '@/components/system/ServiceStatus';
import { useBackendHealth, useMLHealth } from '@/hooks/useBackendApi';
import { Server, Database, BrainCircuit, Activity, HardDrive } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';

export default function SystemHealthPage() {
    const { data: backendHealth, isLoading: backendLoading } = useBackendHealth();
    const { data: mlHealth, isLoading: mlLoading } = useMLHealth();

    const isBackendUp = backendHealth?.status === 'UP';
    const isMLUp = mlHealth?.status === 'healthy' || mlHealth?.status === 'UP'; // Handles both formats

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    System Health
                </h1>
                <p className="text-slate-400 mt-1">
                    Infrastructure status and resource monitoring
                </p>
            </div>

            {/* Overall Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="System Status"
                    value={isBackendUp && isMLUp ? "Healthy" : "Degraded"}

                    icon={<Activity className="w-5 h-5 text-green-400" />}
                    trend="neutral"
                    severity={isBackendUp && isMLUp ? "low" : "high"}
                />
                <KPICard
                    title="Active Microservices"
                    value={4}
                    icon={<Server className="w-5 h-5 text-blue-400" />}
                    trend="neutral"
                />
                <KPICard
                    title="Database Connections"
                    value={12}
                    icon={<Database className="w-5 h-5 text-purple-400" />}
                    trend="neutral"
                />
                <KPICard
                    title="Memory Usage"
                    value={45}
                    subtitle="%"
                    format="number"
                    icon={<HardDrive className="w-5 h-5 text-yellow-400" />}
                    trend="neutral"
                />
            </div>

            {/* Service Grid */}
            <h2 className="text-xl font-semibold text-slate-200 mt-8 mb-4">Core Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ServiceStatus
                    name="Backend API Gateway"
                    status={backendLoading ? 'loading' : isBackendUp ? 'operational' : 'down'}
                    uptime="99.99%"
                    version="v2.1.0"
                    latency={45}
                    description="Main Spring Boot API handling traffic ingestion and authentication."
                />

                <ServiceStatus
                    name="ML Inference Engine"
                    status={mlLoading ? 'loading' : isMLUp ? 'operational' : 'down'}
                    uptime="99.95%"
                    version="v1.4.2"
                    latency={120}
                    description="Python-based anomaly detection service (Random Forest)."
                />

                <ServiceStatus
                    name="PostgreSQL Database"
                    status="operational" // Mocked until explicit DB health check hook
                    uptime="99.99%"
                    latency={12}
                    description="Primary data store for logs and user configurations."
                />

                <ServiceStatus
                    name="Redis Cache"
                    status="operational"
                    uptime="100%"
                    latency={2}
                    description="High-speed caching layer for rate limiting."
                />

                <ServiceStatus
                    name="Apache Kafka"
                    status="operational"
                    uptime="99.98%"
                    description="Message broker for traffic event streaming."
                />
            </div>

            {/* Resource Usage (Placeholder Visuals) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                    <h3 className="font-semibold mb-4 text-slate-200 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-400" />
                        CPU Utilization
                    </h3>
                    <div className="space-y-4">
                        {['Core 1', 'Core 2', 'Core 3', 'Core 4'].map((core, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>{core}</span>
                                    <span>{30 + i * 5}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${30 + i * 5}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                    <h3 className="font-semibold mb-4 text-slate-200 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-purple-400" />
                        Storage Metrics
                    </h3>
                    <div className="flex gap-8 items-center justify-center p-4">
                        <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-slate-800 border-t-purple-500 transform rotate-45">
                            <div className="transform -rotate-45 text-center">
                                <span className="block text-2xl font-bold text-slate-200">45%</span>
                                <span className="text-xs text-slate-500">Used</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-purple-500" />
                                <span className="text-slate-300">Logs: 45 GB</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-slate-700" />
                                <span className="text-slate-300">Free: 55 GB</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
