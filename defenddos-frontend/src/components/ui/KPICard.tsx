'use client';

import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { HTMLMotionProps } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn, formatNumber, calculatePercentageChange } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CountUp from 'react-countup';

interface KPICardProps extends HTMLMotionProps<'div'> {
  title: string;
  value: number | string;
  previousValue?: number;
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'bytes' | 'currency';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  subtitle?: string;
  severity?: 'normal' | 'low' | 'medium' | 'high' | 'critical';
  isLoading?: boolean;
  animated?: boolean;
  sparklineData?: number[];
  actionButton?: React.ReactNode;
}

export function KPICard({
  className,
  title,
  value,
  previousValue,
  icon,
  format = 'number',
  trend,
  trendValue,
  subtitle,
  severity,
  isLoading = false,
  animated = true,
  sparklineData,
  actionButton,
  ...props
}: KPICardProps) {
  // Calculate trend if not provided
  const calculatedTrend = trend || (
    previousValue !== undefined && typeof value === 'number'
      ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
      : 'neutral'
  );

  const calculatedTrendValue = trendValue || (
    previousValue !== undefined && typeof value === 'number'
      ? Math.abs(calculatePercentageChange(value, previousValue))
      : 0
  );

  const getTrendIcon = () => {
    switch (calculatedTrend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (calculatedTrend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'bytes':
        return formatNumber(val) + 'B';
      case 'currency':
        return `$${formatNumber(val)}`;
      default:
        return formatNumber(val);
    }
  };

  const severityColors = severity ? {
    normal: 'border-l-green-500',
    low: 'border-l-blue-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-orange-500',
    critical: 'border-l-red-500',
  } : {};

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    hover: {
      y: -4,
      transition: { duration: 0.2 }
    }
  } as any;

  if (isLoading) {
    return (
      <Card className={cn('border-l-4 border-l-gray-300', className)} {...props}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={animated ? cardVariants : {}}
      initial={animated ? 'hidden' : false}
      animate={animated ? 'visible' : false}
      whileHover={animated ? 'hover' : undefined}
      className={className}
      {...props}
    >
      <Card
        className={cn(
          'border-l-4 relative overflow-hidden',
          severity ? severityColors[severity] : 'border-l-primary-500',
          severity === 'critical' && 'animate-pulse-glow'
        )}
        hover={animated}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </h3>
            {icon && (
              <motion.div
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                whileHover={animated ? { rotate: 5 } : undefined}
                transition={{ duration: 0.2 }}
              >
                <div className="w-6 h-6 text-gray-600 dark:text-gray-400">
                  {icon}
                </div>
              </motion.div>
            )}
          </div>

          {/* Main Value */}
          <div className="mb-4">
            <motion.div
              className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              initial={animated ? { scale: 1.2, opacity: 0 } : false}
              animate={animated ? { scale: 1, opacity: 1 } : false}
              transition={animated ? { delay: 0.2, duration: 0.3 } : undefined}
            >
              {typeof value === 'number' && animated ? (
                <CountUp
                  end={value}
                  duration={1}
                  separator=","
                  preserveValue
                  formattingFn={formatValue}
                />
              ) : (
                formatValue(value)
              )}
            </motion.div>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Trend and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Trend Indicator */}
              {(calculatedTrend !== 'neutral' || calculatedTrendValue > 0) && (
                <motion.div
                  className={cn('flex items-center gap-1', getTrendColor())}
                  initial={animated ? { x: -10, opacity: 0 } : false}
                  animate={animated ? { x: 0, opacity: 1 } : false}
                  transition={animated ? { delay: 0.4, duration: 0.3 } : undefined}
                >
                  {getTrendIcon()}
                  <span className="text-sm font-medium">
                    {calculatedTrendValue > 0 && `${calculatedTrendValue.toFixed(1)}%`}
                  </span>
                </motion.div>
              )}

              {/* Severity Badge */}
              {severity && severity !== 'normal' && (
                <Badge
                  severity={severity}
                  size="sm"
                  {...(severity === 'critical' && { pulse: true })}
                >
                  {severity.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Action Button */}
            {actionButton && (
              <motion.div
                whileHover={animated ? { scale: 1.05 } : undefined}
                whileTap={animated ? { scale: 0.95 } : undefined}
              >
                {actionButton}
              </motion.div>
            )}
          </div>

          {/* Sparkline Chart */}
          {sparklineData && sparklineData.length > 0 && (
            <motion.div
              className="mt-4 h-12"
              initial={animated ? { opacity: 0 } : false}
              animate={animated ? { opacity: 1 } : false}
              transition={animated ? { delay: 0.6, duration: 0.4 } : undefined}
            >
              <svg className="w-full h-full" viewBox={`0 0 ${sparklineData.length * 10} 100`}>
                <motion.path
                  d={`M ${sparklineData.map((point, index) =>
                    `${index * 10},${100 - (point / Math.max(...sparklineData)) * 80}`
                  ).join(' L ')}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={cn(
                    'opacity-60',
                    calculatedTrend === 'up' ? 'text-green-500' :
                      calculatedTrend === 'down' ? 'text-red-500' :
                        'text-gray-500'
                  )}
                  initial={animated ? { pathLength: 0, opacity: 0 } : false}
                  animate={animated ? { pathLength: 1, opacity: 0.6 } : false}
                  transition={animated ? { delay: 0.8, duration: 1, ease: 'easeInOut' } : undefined}
                />
              </svg>
            </motion.div>
          )}
        </CardContent>

        {/* Background Pattern for Critical Items */}
        {severity === 'critical' && (
          <div className="absolute inset-0 bg-cyber-grid bg-cyber-grid opacity-5 pointer-events-none" />
        )}
      </Card>
    </motion.div>
  );
}