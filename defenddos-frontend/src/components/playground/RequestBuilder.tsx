'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Send,
    ChevronDown,
    Plus,
    Trash2,
    Copy,
    Clock,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type HttpMethod = typeof HTTP_METHODS[number];

const ENDPOINTS = [
    { path: '/actuator/health', method: 'GET', description: 'Health check' },
    { path: '/api/v1/traffic/query', method: 'GET', description: 'Query traffic data' },
    { path: '/api/v1/traffic/summary', method: 'GET', description: 'Traffic summary' },
    { path: '/api/v1/traffic/visualization', method: 'GET', description: 'Visualization data' },
    { path: '/api/v1/traffic/ingest', method: 'POST', description: 'Ingest traffic' },
    { path: '/api/v1/traffic/predict-attack', method: 'POST', description: 'ML prediction' },
    { path: '/api/v1/mitigation/status', method: 'GET', description: 'Mitigation status' },
    { path: '/api/v1/mitigation/blocked', method: 'GET', description: 'Blocked IPs list' },
    { path: '/api/v1/mitigation/block/{ip}', method: 'POST', description: 'Block IP' },
    { path: '/api/v1/mitigation/unblock/{ip}', method: 'POST', description: 'Unblock IP' },
    { path: '/api/v1/security/dashboard', method: 'GET', description: 'Security dashboard' },
    { path: '/api/v1/security/status', method: 'GET', description: 'Security status' },
    { path: '/api/v1/statistics/detailed', method: 'GET', description: 'Detailed stats' },
];

interface Header {
    key: string;
    value: string;
    enabled: boolean;
}

interface RequestBuilderProps {
    onSendRequest?: (request: RequestConfig) => void;
    className?: string;
}

interface RequestConfig {
    method: HttpMethod;
    endpoint: string;
    headers: Header[];
    body: string;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function RequestBuilder({ onSendRequest, className = '' }: RequestBuilderProps) {
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [endpoint, setEndpoint] = useState('/actuator/health');
    const [headers, setHeaders] = useState<Header[]>([
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'X-API-KEY', value: 'defenddos-api-key', enabled: true },
    ]);
    const [body, setBody] = useState('{\n  \n}');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [responseTime, setResponseTime] = useState<number | null>(null);
    const [showEndpoints, setShowEndpoints] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

    const addHeader = () => {
        setHeaders([...headers, { key: '', value: '', enabled: true }]);
    };

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
        const updated = [...headers];
        updated[index] = { ...updated[index], [field]: value };
        setHeaders(updated);
    };

    const handleSendRequest = useCallback(async () => {
        setIsLoading(true);
        setResponse(null);
        const startTime = Date.now();

        const requestConfig: RequestConfig = {
            method,
            endpoint,
            headers,
            body,
        };

        try {
            const headerObj: Record<string, string> = {};
            headers.filter(h => h.enabled && h.key).forEach(h => {
                headerObj[h.key] = h.value;
            });

            const fetchOptions: RequestInit = {
                method,
                headers: headerObj,
            };

            if (['POST', 'PUT'].includes(method) && body.trim()) {
                fetchOptions.body = body;
            }

            const res = await fetch(`${baseUrl}${endpoint}`, fetchOptions);
            const contentType = res.headers.get('content-type');
            let data;

            if (contentType?.includes('application/json')) {
                data = await res.json();
            } else {
                data = await res.text();
            }

            setResponse({
                status: res.status,
                statusText: res.statusText,
                data,
                headers: Object.fromEntries(res.headers.entries()),
            });
            setResponseTime(Date.now() - startTime);

            onSendRequest?.(requestConfig);
        } catch (error: any) {
            setResponse({
                status: 0,
                statusText: 'Error',
                data: { error: error.message },
                headers: {},
            });
            setResponseTime(Date.now() - startTime);
        } finally {
            setIsLoading(false);
        }
    }, [method, endpoint, headers, body, baseUrl, onSendRequest]);

    const copyAsCurl = () => {
        const headerStr = headers
            .filter(h => h.enabled && h.key)
            .map(h => `-H '${h.key}: ${h.value}'`)
            .join(' \\\n  ');

        let curl = `curl -X ${method} '${baseUrl}${endpoint}'`;
        if (headerStr) curl += ` \\\n  ${headerStr}`;
        if (['POST', 'PUT'].includes(method) && body.trim()) {
            curl += ` \\\n  -d '${body.replace(/\n/g, '')}'`;
        }

        navigator.clipboard.writeText(curl);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm overflow-hidden ${className}`}
        >
            {/* Request Bar */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    {/* Method Selector */}
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                        className={`px-3 py-2.5 rounded-lg border font-semibold text-sm cursor-pointer ${METHOD_COLORS[method]} bg-transparent focus:outline-none`}
                    >
                        {HTTP_METHODS.map((m) => (
                            <option key={m} value={m} className="bg-slate-800 text-white">{m}</option>
                        ))}
                    </select>

                    {/* Endpoint Input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            onFocus={() => setShowEndpoints(true)}
                            onBlur={() => setTimeout(() => setShowEndpoints(false), 200)}
                            placeholder="/api/v1/..."
                            className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                        />

                        {/* Endpoint Dropdown */}
                        {showEndpoints && (
                            <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-50">
                                {ENDPOINTS.map((ep, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setEndpoint(ep.path);
                                            setMethod(ep.method as HttpMethod);
                                            setShowEndpoints(false);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-3"
                                    >
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[ep.method as HttpMethod]}`}>
                                            {ep.method}
                                        </span>
                                        <span className="text-sm text-white">{ep.path}</span>
                                        <span className="text-xs text-slate-500 ml-auto">{ep.description}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSendRequest}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Send
                    </button>
                </div>
            </div>

            {/* Headers Section */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300">Headers</h4>
                    <button onClick={addHeader} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Header
                    </button>
                </div>
                <div className="space-y-2">
                    {headers.map((header, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={header.enabled}
                                onChange={(e) => updateHeader(i, 'enabled', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                            />
                            <input
                                type="text"
                                value={header.key}
                                onChange={(e) => updateHeader(i, 'key', e.target.value)}
                                placeholder="Key"
                                className="flex-1 px-3 py-1.5 rounded bg-slate-700/50 border border-slate-600/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                            />
                            <input
                                type="text"
                                value={header.value}
                                onChange={(e) => updateHeader(i, 'value', e.target.value)}
                                placeholder="Value"
                                className="flex-1 px-3 py-1.5 rounded bg-slate-700/50 border border-slate-600/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                            />
                            <button onClick={() => removeHeader(i)} className="text-slate-500 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Body Section (for POST/PUT) */}
            {['POST', 'PUT'].includes(method) && (
                <div className="p-4 border-b border-slate-700/50">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Body</h4>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600/50 text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                        placeholder='{"key": "value"}'
                    />
                </div>
            )}

            {/* Response Section */}
            {response && (
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <h4 className="text-sm font-medium text-slate-300">Response</h4>
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${response.status >= 200 && response.status < 300
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}>
                                {response.status >= 200 && response.status < 300 ? (
                                    <CheckCircle className="w-3 h-3" />
                                ) : (
                                    <XCircle className="w-3 h-3" />
                                )}
                                {response.status} {response.statusText}
                            </span>
                            {responseTime !== null && (
                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" /> {responseTime}ms
                                </span>
                            )}
                        </div>
                        <button onClick={copyAsCurl} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy as cURL
                        </button>
                    </div>
                    <pre className="p-4 rounded-lg bg-slate-900/50 border border-slate-600/30 text-sm text-slate-300 overflow-auto max-h-64 font-mono">
                        {typeof response.data === 'object'
                            ? JSON.stringify(response.data, null, 2)
                            : response.data}
                    </pre>
                </div>
            )}
        </motion.div>
    );
}

export default RequestBuilder;
