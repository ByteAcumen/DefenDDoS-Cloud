'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Rate limiter hook for client-side request throttling
 * Prevents abuse and reduces server load
 */
export function useRateLimit(maxCalls: number, windowMs: number) {
  const calls = useRef<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    
    // Remove old calls outside the window
    calls.current = calls.current.filter((time) => now - time < windowMs);

    if (calls.current.length >= maxCalls) {
      const oldestCall = calls.current[0];
      const timeUntilReset = windowMs - (now - oldestCall);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)}s`);
    }

    calls.current.push(now);
  }, [maxCalls, windowMs]);

  return checkLimit;
}

/**
 * Debounce hook for expensive operations
 * Reduces unnecessary re-renders and API calls
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for scroll/resize events
 * Ensures 60fps performance
 */
export function useThrottle<T extends (this: any, ...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Request ID generator for tracking API calls
 * Useful for debugging and monitoring
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize user input to prevent XSS
 * Use before displaying user-generated content
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Validate API key format
 */
export function isValidApiKey(key: string): boolean {
  return /^[a-zA-Z0-9-_]{10,}$/.test(key);
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Performance monitoring wrapper
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}
