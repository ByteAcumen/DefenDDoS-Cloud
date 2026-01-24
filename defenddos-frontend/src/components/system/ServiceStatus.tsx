'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceStatusProps {
    name: string;
    status: 'operational' | 'degraded' | 'down' | 'loading';
    uptime?: string;
    version?: string;
    latency?: number;
    description?: string;
}

export default function ServiceStatus({
    name,
    status,
    uptime,
    version,
    latency,
    description
}: ServiceStatusProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'operational': return 'bg-green-500/10 border-green-500/20 text-green-400';
            case 'degraded': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
            case 'down': return 'bg-red-500/10 border-red-500/20 text-red-400';
            default: return 'bg-slate-800 border-slate-700 text-slate-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'operational': return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
            case 'down': return <XCircle className="w-5 h-5 text-red-400" />;
            default: return <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />;
        }
    };

    return (
        <Card className={`p-4 border backdrop-blur transition-all duration-300 ${status === 'operational' ? 'border-green-500/20 bg-green-500/5' :
                status === 'degraded' ? 'border-yellow-500/20 bg-yellow-500/5' :
                    status === 'down' ? 'border-red-500/20 bg-red-500/5' :
                        'border-slate-800 bg-slate-900/50'
            }`}>
            <div className="flex justify-between items-start">
                <div className="flex gap-3">
                    <div className="mt-1">{getStatusIcon(status)}</div>
                    <div>
                        <h3 className="font-semibold text-slate-200">{name}</h3>
                        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}

                        <div className="flex gap-3 mt-3">
                            {uptime && (
                                <div className="text-xs">
                                    <span className="text-slate-500 block">Uptime</span>
                                    <span className="font-mono text-slate-300">{uptime}</span>
                                </div>
                            )}
                            {version && (
                                <div className="text-xs">
                                    <span className="text-slate-500 block">Version</span>
                                    <span className="font-mono text-slate-300">{version}</span>
                                </div>
                            )}
                            {latency !== undefined && (
                                <div className="text-xs">
                                    <span className="text-slate-500 block">Latency</span>
                                    <span className={`font-mono ${latency < 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {latency}ms
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`px-2 py-1 rounded text-xs font-medium border uppercase tracking-wider ${getStatusColor(status)}`}>
                    {status}
                </div>
            </div>
        </Card>
    );
}
