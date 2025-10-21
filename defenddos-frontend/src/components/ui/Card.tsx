'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  animated?: boolean;
  hover?: boolean;
  glow?: boolean;
}

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;
type CardContentProps = HTMLAttributes<HTMLDivElement>;
type CardFooterProps = HTMLAttributes<HTMLDivElement>;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant = 'default',
    animated = true,
    hover = true,
    glow = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = `
      rounded-xl backdrop-blur-sm will-change-transform
    `;

    const variants = {
      default: `
        bg-white/80 dark:bg-gray-900/80
        border border-gray-200/50 dark:border-gray-700/50
        shadow-card
      `,
      elevated: `
        bg-white dark:bg-gray-900
        border border-gray-200/20 dark:border-gray-700/20
        shadow-xl shadow-gray-900/10
      `,
      outlined: `
        bg-white/50 dark:bg-gray-900/50
        border-2 border-gray-200 dark:border-gray-700
      `,
      ghost: `
        bg-transparent
        border border-transparent
        hover:bg-white/50 dark:hover:bg-gray-900/50
      `,
    };

    const hoverClasses = '';
    // Hover effects now handled by framer-motion for smoother animations

    const glowClasses = glow ? `
      shadow-glow animate-pulse-glow
    ` : '';

    const CardComponent = animated ? motion.div : 'div';

    const animationProps = animated ? {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, ease: 'easeOut' },
      whileHover: hover ? { 
        y: -4, 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
        borderColor: 'rgba(156, 163, 175, 0.5)',
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      } : undefined,
    } : {};

    return (
      <CardComponent
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          hoverClasses,
          glowClasses,
          className
        )}
        {...animationProps}
        {...props}
      >
        {children}
      </CardComponent>
    );
  }
);

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50', className)}
      {...props}
    >
      {children}
    </div>
  )
);

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50',
        'bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';
CardTitle.displayName = 'CardTitle';

export { Card, CardHeader, CardContent, CardFooter, CardTitle, type CardProps };
