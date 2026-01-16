'use client';

import { motion } from 'framer-motion';
import { CSSProperties } from 'react';

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
}

// Base skeleton with shimmer animation
export function Skeleton({ className = '', style }: SkeletonProps) {
    return (
        <div className={`relative overflow-hidden bg-slate-700/50 rounded ${className}`} style={style}>
            <motion.div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-600/30 to-transparent"
                animate={{ translateX: ['100%', '-100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
        </div>
    );
}

// Card skeleton
export function CardSkeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

// Chart skeleton
export function ChartSkeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="h-64 flex items-end gap-2">
                {[...Array(12)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t"
                        style={{ height: `${20 + Math.random() * 80}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

// Table skeleton
export function TableSkeleton({ rows = 5, className = '' }: SkeletonProps & { rows?: number }) {
    return (
        <div className={`rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
            </div>
            {/* Rows */}
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="p-4 border-b border-slate-700/30 flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                </div>
            ))}
        </div>
    );
}

// Dashboard skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 p-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>

            {/* Table */}
            <TableSkeleton rows={5} />
        </div>
    );
}

// Page loading skeleton
export function PageSkeleton() {
    return (
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>

                {/* Content */}
                <div className="grid gap-6">
                    <ChartSkeleton />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Skeleton;
