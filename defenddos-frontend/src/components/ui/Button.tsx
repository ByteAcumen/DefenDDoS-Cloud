'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  animated?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    animated = true,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center font-medium rounded-lg
      will-change-transform
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      relative overflow-hidden
    `;

    const variants = {
      primary: `
        bg-primary-600 hover:bg-primary-700 
        text-white border border-primary-600
        focus:ring-primary-500
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-gray-100 hover:bg-gray-200 
        text-gray-900 border border-gray-200
        focus:ring-gray-500
        dark:bg-gray-800 dark:hover:bg-gray-700 
        dark:text-gray-100 dark:border-gray-700
      `,
      danger: `
        bg-red-600 hover:bg-red-700 
        text-white border border-red-600
        focus:ring-red-500
        shadow-sm hover:shadow-md hover:shadow-red-500/25
      `,
      success: `
        bg-green-600 hover:bg-green-700 
        text-white border border-green-600
        focus:ring-green-500
        shadow-sm hover:shadow-md
      `,
      outline: `
        bg-transparent hover:bg-gray-50
        text-gray-700 border border-gray-300
        focus:ring-gray-500
        dark:hover:bg-gray-800 dark:text-gray-200 dark:border-gray-600
      `,
      ghost: `
        bg-transparent hover:bg-gray-100
        text-gray-700 border border-transparent
        focus:ring-gray-500
        dark:hover:bg-gray-800 dark:text-gray-200
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base',
      xl: 'px-8 py-3 text-lg',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    };

    const ButtonComponent = animated ? motion.button : 'button';

    const animationProps = animated ? {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { type: 'spring', stiffness: 500, damping: 25, mass: 0.5 },
    } : {};

    return (
      <ButtonComponent
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...animationProps}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Button content */}
        <div className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon && (
            <span className={cn('flex-shrink-0', iconSizes[size])}>
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span className={cn('flex-shrink-0', iconSizes[size])}>
              {rightIcon}
            </span>
          )}
        </div>
      </ButtonComponent>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps };