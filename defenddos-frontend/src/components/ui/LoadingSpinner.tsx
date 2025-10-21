'use client';

import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'cyber' | 'threat';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  text?: string;
}

export function LoadingSpinner({
  className,
  size = 'md',
  variant = 'default',
  color = 'primary',
  text,
  ...props
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colors = {
    primary: 'border-primary-600',
    secondary: 'border-gray-600',
    success: 'border-green-600',
    warning: 'border-yellow-600',
    danger: 'border-red-600',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  if (variant === 'default') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)} {...props}>
        <div
          className={cn(
            'border-2 border-t-transparent rounded-full animate-spin',
            sizes[size],
            colors[color]
          )}
        />
        {text && (
          <p className={cn('text-gray-600 dark:text-gray-400', textSizes[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)} {...props}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                'rounded-full bg-primary-600',
                size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
              )}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        {text && (
          <p className={cn('text-gray-600 dark:text-gray-400', textSizes[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)} {...props}>
        <motion.div
          className={cn(
            'rounded-full bg-primary-600',
            sizes[size]
          )}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.2, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {text && (
          <p className={cn('text-gray-600 dark:text-gray-400', textSizes[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'cyber') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)} {...props}>
        <div className="relative">
          <motion.div
            className={cn(
              'border-2 border-primary-500 rounded-full',
              sizes[size]
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className={cn(
              'absolute inset-2 border-2 border-primary-300 rounded-full',
            )}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
          </motion.div>
        </div>
        {text && (
          <p className={cn('text-primary-600 font-mono', textSizes[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'threat') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)} {...props}>
        <div className="relative">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'absolute border-2 border-red-500 rounded-full',
                sizes[size]
              )}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
          <div className={cn(
            'bg-red-600 rounded-full flex items-center justify-center',
            sizes[size]
          )}>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        {text && (
          <p className={cn('text-red-600 font-semibold', textSizes[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  return null;
}

// Skeleton loader for cards and content
export function SkeletonLoader({ 
  className, 
  lines = 3,
  ...props 
}: { 
  className?: string;
  lines?: number;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('animate-pulse space-y-3', className)} {...props}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 dark:bg-gray-700 rounded',
            i === 0 ? 'h-6' : i === lines - 1 ? 'h-4 w-3/4' : 'h-4'
          )}
        />
      ))}
    </div>
  );
}

// Global loading overlay
export function LoadingOverlay({ 
  isVisible, 
  text = 'Loading...',
  variant = 'cyber' 
}: {
  isVisible: boolean;
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <LoadingSpinner variant={variant} text={text} size="lg" />
      </motion.div>
    </motion.div>
  );
}