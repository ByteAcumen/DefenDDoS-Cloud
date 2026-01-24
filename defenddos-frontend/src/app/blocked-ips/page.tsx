'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from '@/components/ui/Table';
import { Shield, Search, Filter, Ban, Unlock, AlertTriangle } from 'lucide-react';
import { useBlockedIPs, useUnblockIP } from '@/hooks/useBackendApi';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function BlockedIPsPage() {
    const { data: blockedList, isLoading } = useBlockedIPs();
    const unblockMutation = useUnblockIP();
    const [searchTerm, setSearchTerm] = useState('');

    const handleUnblock = (ip: string) => {
        if (confirm(`Are you sure you want to unblock ${ip}? This may expose the system to threats.`)) {
            unblockMutation.mutate(ip, {
                onSuccess: () => {
                    toast.success(`IP ${ip} has been unblocked`);
                }
            });
        }
    };

    const filteredList = React.useMemo(() => {
        if (!blockedList || !Array.isArray(blockedList)) return [];
        return blockedList.filter((item: any) =>
            item.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [blockedList, searchTerm]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                        IP Blacklist Management
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Active firewall rules and blocked threats
                    </p>
                </div>
            </div>

            {/* Controls */}
            <Card className="p-4 border-slate-800/60 bg-slate-900/50 backdrop-blur">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search IP addresses..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter Rules
                        </Button>
                        <Button variant="danger" size="sm">
                            <Ban className="w-4 h-4 mr-2" />
                            Block New IP
                        </Button>
                    </div>
                </div>
            </Card>

            {/* List */}
            <Card className="border-slate-800/60 bg-slate-900/50 backdrop-blur overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-slate-800/50 border-slate-800">
                            <TableHead className="w-[200px]">IP Address</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Date Blocked</TableHead>
                            <TableHead>Threat Level</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                    Loading blocked IPs...
                                </TableCell>
                            </TableRow>
                        ) : filteredList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    No blocked IPs found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredList.map((item: any) => (
                                <TableRow key={item.ip} className="hover:bg-slate-800/30 border-slate-800">
                                    <TableCell className="font-mono text-slate-200">{item.ip}</TableCell>
                                    <TableCell className="text-slate-400">{item.reason || 'Manual Block'}</TableCell>
                                    <TableCell className="text-slate-500">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.severity === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            item.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>
                                            {item.severity || 'Medium'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUnblock(item.ip)}
                                            className="text-slate-400 hover:text-green-400 hover:bg-green-500/10"
                                        >
                                            <Unlock className="w-4 h-4 mr-2" />
                                            Unblock
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
