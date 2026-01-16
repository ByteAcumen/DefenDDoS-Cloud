'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

interface SmoothScrollOptions {
  duration?: number;
  easing?: (t: number) => number;
  orientation?: 'vertical' | 'horizontal';
  smoothWheel?: boolean;
  smoothTouch?: boolean;
}

/**
 * Custom hook for Lenis smooth scrolling
 * Automatically cleans up on unmount
 */
export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: options.duration ?? 1.2,
      easing: options.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      orientation: options.orientation ?? 'vertical',
      smoothWheel: options.smoothWheel ?? true,
      smoothTouch: options.smoothTouch ?? false, // Disable on mobile for better performance
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [options]);
}

/**
 * Hook for programmatic scrolling with Lenis
 */
export function useScrollTo() {
  const scrollTo = (target: string | number, options?: { offset?: number; duration?: number }) => {
    if (typeof window === 'undefined') return;

    const lenis = (window as any).lenis;
    if (!lenis) {
      console.warn('Lenis not initialized');
      return;
    }

    lenis.scrollTo(target, {
      offset: options?.offset ?? 0,
      duration: options?.duration ?? 1.2,
    });
  };

  return scrollTo;
}
