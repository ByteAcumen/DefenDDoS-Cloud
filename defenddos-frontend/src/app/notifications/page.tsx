'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAllDetectionEvents, useAllMLPredictions } from '@/hooks/useBackendApi';
import { Bell, Shield, AlertTriangle, CheckCircle, Info, Filter, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NotificationType = 'critical' | 'warning' | 'info' | 'success';

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: NotificationType;
    source: string;
}

export default function NotificationsPage() {
    const { data: detectionEvents } = useAllDetectionEvents('-24h');
    const { data: mlPredictions } = useAllMLPredictions('-24h');
    const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

    // Aggregate and normalize notifications
    const notifications = React.useMemo(() => {
        const list: Notification[] = [];

        if (detectionEvents && Array.isArray(detectionEvents)) {
            list.push(...detectionEvents.map((e: any) => ({
                id: `det-${e.time}-${e.sourceIp}`,
                title: `Threat Detected: ${e.threatLevel}`,
                message: `Attack detected from ${e.sourceIp}. Mitigation rules applied.`,
                timestamp: e.time,
                type: 'critical' as NotificationType,
                source: 'Firewall'
            })));
        }

        if (mlPredictions && Array.isArray(mlPredictions)) {
            list.push(...mlPredictions
                .filter((p: any) => p.isAttack)
                .map((p: any) => ({
                    id: `ml-${p.timestamp}`,
                    title: `Anomaly Detected`,
                    message: `ML Model detected suspicious traffic pattern (${(p.confidence * 100).toFixed(1)}% confidence).`,
                    timestamp: p.timestamp,
                    type: 'warning' as NotificationType,
                    source: 'AI Model'
                })));
        }

        // Add some mock system alerts for variety (since real API might be quiet)
        list.push({
            id: 'sys-1',
            title: 'System Backup Completed',
            message: 'Daily log backup completed successfully.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            type: 'success',
            source: 'System'
        });

        return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [detectionEvents, mlPredictions]);

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' ? true : n.type === filter
    );

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'critical': return <Shield className="w-5 h-5 text-red-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Notification Center
                    </h1>
                    <p className="text-slate-400 mt-1">
                        System alerts, threat notifications, and updates
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilter('all')}
                        className={filter === 'all' ? 'bg-slate-800' : ''}
                    >
                        All
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilter('critical')}
                        className={filter === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                    >
                        Critical
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                    </Button>
                </div>
            </div>

            {/* Notification Feed */}
            <div className="space-y-4 max-w-4xl mx-auto">
                <AnimatePresence>
                    {filteredNotifications.length === 0 ? (
                        <Card className="p-12 border-slate-800/60 bg-slate-900/50 backdrop-blur text-center">
                            <Bell className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                            <h3 className="text-lg font-medium text-slate-300">All Caught Up!</h3>
                            <p className="text-slate-500">No new notifications to display.</p>
                        </Card>
                    ) : (
                        filteredNotifications.map((notification, index) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={`p-4 border backdrop-blur ${notification.type === 'critical' ? 'border-red-500/20 bg-red-500/5' :
                                        notification.type === 'warning' ? 'border-orange-500/20 bg-orange-500/5' :
                                            'border-slate-800/60 bg-slate-900/50'
                                    }`}>
                                    <div className="flex gap-4 items-start">
                                        <div className={`mt-1 p-2 rounded-full ${notification.type === 'critical' ? 'bg-red-500/10' :
                                                notification.type === 'warning' ? 'bg-orange-500/10' :
                                                    'bg-slate-800'
                                            }`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-semibold ${notification.type === 'critical' ? 'text-red-400' :
                                                        notification.type === 'warning' ? 'text-orange-400' :
                                                            'text-slate-200'
                                                    }`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(notification.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 mt-1 text-sm">
                                                {notification.message}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
                                                    Source: {notification.source}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
