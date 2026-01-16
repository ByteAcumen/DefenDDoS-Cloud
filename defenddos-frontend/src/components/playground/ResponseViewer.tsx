'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy,
    Download,
    Check,
    Clock,
    FileJson,
    FileText,
    AlignLeft,
    ChevronDown,
    ChevronRight,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';

interface ResponseData {
    status: number;
    statusText: string;
    data: any;
    headers: Record<string, string>;
    time?: number;
}

interface ResponseViewerProps {
    response: ResponseData | null;
    loading?: boolean;
    className?: string;
}

type ViewMode = 'pretty' | 'raw' | 'headers';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    '2xx': { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle },
    '3xx': { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: AlertCircle },
    '4xx': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: AlertCircle },
    '5xx': { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
    '0xx': { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: XCircle },
};

function getStatusCategory(status: number): string {
    if (status >= 200 && status < 300) return '2xx';
    if (status >= 300 && status < 400) return '3xx';
    if (status >= 400 && status < 500) return '4xx';
    if (status >= 500) return '5xx';
    return '0xx';
}

// JSON syntax highlighter
function highlightJson(json: string): React.ReactElement[] {
    const lines = json.split('\n');

    return lines.map((line, i) => {
        let highlighted = line
            // Keys
            .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
            // String values
            .replace(/: "([^"]*)"(,?)/g, ': <span class="text-green-400">"$1"</span>$2')
            // Numbers
            .replace(/: (\d+\.?\d*)(,?)/g, ': <span class="text-cyan-400">$1</span>$2')
            // Booleans
            .replace(/: (true|false)(,?)/g, ': <span class="text-yellow-400">$1</span>$2')
            // Null
            .replace(/: (null)(,?)/g, ': <span class="text-slate-500">$1</span>$2');

        return (
            <div key={i} className="flex">
                <span className="text-slate-600 select-none w-8 text-right pr-4">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: highlighted }} />
            </div>
        );
    });
}

export function ResponseViewer({ response, loading = false, className = '' }: ResponseViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('pretty');
    const [copied, setCopied] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

    const formattedData = useMemo(() => {
        if (!response?.data) return '';
        if (typeof response.data === 'string') return response.data;
        try {
            return JSON.stringify(response.data, null, 2);
        } catch {
            return String(response.data);
        }
    }, [response?.data]);

    const dataSize = useMemo(() => {
        const bytes = new TextEncoder().encode(formattedData).length;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }, [formattedData]);

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(formattedData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadJson = () => {
        const blob = new Blob([formattedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `response-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className={`rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!response) {
        return (
            <div className={`rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <FileJson className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm">Send a request to see the response</p>
                </div>
            </div>
        );
    }

    const statusCategory = getStatusCategory(response.status);
    const statusStyle = STATUS_COLORS[statusCategory];
    const StatusIcon = statusStyle.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-medium text-white">Response</h3>

                    {/* Status Badge */}
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {response.status} {response.statusText}
                    </span>

                    {/* Response Time */}
                    {response.time !== undefined && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {response.time}ms
                        </span>
                    )}

                    {/* Size */}
                    <span className="text-xs text-slate-500">{dataSize}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyToClipboard}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={downloadJson}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                        title="Download JSON"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex border-b border-slate-700/50">
                {[
                    { id: 'pretty' as ViewMode, label: 'Pretty', icon: FileJson },
                    { id: 'raw' as ViewMode, label: 'Raw', icon: FileText },
                    { id: 'headers' as ViewMode, label: 'Headers', icon: AlignLeft },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setViewMode(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === id
                                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 overflow-auto max-h-96">
                <AnimatePresence mode="wait">
                    {viewMode === 'pretty' && (
                        <motion.pre
                            key="pretty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-mono text-sm leading-relaxed"
                        >
                            {highlightJson(formattedData)}
                        </motion.pre>
                    )}

                    {viewMode === 'raw' && (
                        <motion.pre
                            key="raw"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-mono text-sm text-slate-300 whitespace-pre-wrap break-all"
                        >
                            {formattedData}
                        </motion.pre>
                    )}

                    {viewMode === 'headers' && (
                        <motion.div
                            key="headers"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            {Object.entries(response.headers).map(([key, value]) => (
                                <div key={key} className="flex gap-4 text-sm">
                                    <span className="text-purple-400 font-medium min-w-40">{key}:</span>
                                    <span className="text-slate-300">{value}</span>
                                </div>
                            ))}
                            {Object.keys(response.headers).length === 0 && (
                                <p className="text-slate-500 text-sm">No headers to display</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default ResponseViewer;
