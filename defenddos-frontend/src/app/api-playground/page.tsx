'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Beaker, Sparkles } from 'lucide-react';
import RequestBuilder from '@/components/playground/RequestBuilder';
import ResponseViewer from '@/components/playground/ResponseViewer';
import CodeGenerator from '@/components/playground/CodeGenerator';

export default function APIPlaygroundPage() {
    const [request, setRequest] = useState({
        method: 'GET',
        endpoint: '/actuator/health',
        headers: [
            { key: 'Content-Type', value: 'application/json', enabled: true },
            { key: 'X-API-KEY', value: 'defenddos-api-key', enabled: true },
        ],
        body: '',
    });

    const [response, setResponse] = useState<any>(null);

    const handleRequestSent = (config: any) => {
        setRequest({
            method: config.method,
            endpoint: config.endpoint,
            headers: config.headers,
            body: config.body,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto mb-8"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                        <Beaker className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">API Playground</h1>
                        <p className="text-slate-400">Test all 31 DefenDDoS API endpoints interactively</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-slate-500">Pro tip: Select an endpoint from the dropdown or type your own</span>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Request Builder */}
                <div className="space-y-6">
                    <RequestBuilder
                        onSendRequest={handleRequestSent}
                    />

                    {/* Code Generator */}
                    <CodeGenerator request={request} />
                </div>

                {/* Right Column - Response Viewer */}
                <div>
                    <ResponseViewer response={response} />
                </div>
            </div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="max-w-7xl mx-auto mt-8 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50"
            >
                <h3 className="text-sm font-medium text-slate-400 mb-4">Quick Endpoints</h3>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Health Check', endpoint: '/actuator/health' },
                        { label: 'Traffic Query', endpoint: '/api/v1/traffic/query' },
                        { label: 'Blocked IPs', endpoint: '/api/v1/mitigation/blocked' },
                        { label: 'Security Status', endpoint: '/api/v1/security/status' },
                        { label: 'Statistics', endpoint: '/api/v1/statistics/detailed' },
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => setRequest(r => ({ ...r, endpoint: item.endpoint, method: 'GET' }))}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
