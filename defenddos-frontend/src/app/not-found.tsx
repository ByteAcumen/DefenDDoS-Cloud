import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="max-w-lg w-full text-center">
                {/* 404 Animation */}
                <div className="mb-8">
                    <h1 className="text-9xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        404
                    </h1>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
                <p className="text-slate-400 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </Link>
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Dashboard
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <p className="text-sm text-slate-500 mb-4">Maybe you were looking for:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {[
                            { href: '/dashboard', label: 'Dashboard' },
                            { href: '/api-playground', label: 'API Playground' },
                            { href: '/docs', label: 'Documentation' },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
