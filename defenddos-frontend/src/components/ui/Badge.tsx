'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn, getSeverityColor, getStatusColor } from '@/lib/utils';

interface BadgeProps extends HTMLMotionProps<'span'> {
  children?: ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  severity?: 'normal' | 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  animated?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    severity,
    status,
    animated = true,
    pulse = false,
    icon,
    children,
    ...props
  }, ref) => {
    const baseClasses = `
      inline-flex items-center gap-1.5 font-medium rounded-full
      transition-all duration-200 ease-in-out
    `;

    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      secondary: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    // Use severity-based styling if provided
    let finalClasses = '';
    if (severity) {
      const severityColors = getSeverityColor(severity);
      finalClasses = `${severityColors.bg} ${severityColors.text} ${severityColors.border}`;
    } else if (status) {
      const statusColors = getStatusColor(status);
      finalClasses = `${statusColors.bg} ${statusColors.text}`;
    } else {
      finalClasses = variants[variant];
    }

    const pulseClasses = pulse ? 'animate-pulse' : '';

    // Filter out custom props before passing to DOM
    const glowClasses = severity === 'critical' ? 'shadow-threat-glow' : '';

    const animationProps = animated ? {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.2 } as any,
      whileHover: { scale: 1.05 },
    } : {};

    return (
      <motion.span
        ref={ref}
        className={cn(
          baseClasses,
          finalClasses,
          sizes[size],
          pulseClasses,
          glowClasses,
          className
        )}
        {...animationProps}
        {...props}
      >
        {/* Severity/Status indicator dot */}
        {(severity || status) && (
          <motion.div
            className={cn(
              'w-2 h-2 rounded-full',
              severity ? getSeverityColor(severity).indicator : getStatusColor(status || '').indicator
            )}
            animate={pulse ? { scale: [1, 1.2, 1] } : {}}
            transition={pulse ? { duration: 2, repeat: Infinity } : {}}
          />
        )}

        {/* Custom icon */}
        {icon && (
          <span className={iconSizes[size]}>
            {icon}
          </span>
        )}

        <span>{children}</span>
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, type BadgeProps };