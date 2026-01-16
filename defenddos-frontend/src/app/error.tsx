'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, RefreshCw, Home, Bug } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg w-full p-8 rounded-2xl bg-slate-800/50 border border-red-500/20 text-center"
            >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertOctagon className="w-10 h-10 text-red-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h1>
                <p className="text-slate-400 mb-6">
                    We encountered an unexpected error. Don't worry, our team has been notified.
                </p>

                {error.digest && (
                    <p className="text-xs text-slate-500 mb-6">
                        Error ID: <code className="text-slate-400">{error.digest}</code>
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </a>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700/50">
                    <a
                        href="https://github.com/DefenDDoS/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400"
                    >
                        <Bug className="w-4 h-4" />
                        Report this issue
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
