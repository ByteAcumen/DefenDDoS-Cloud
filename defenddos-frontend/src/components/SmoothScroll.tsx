'use client';

import { useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProps {
    children: React.ReactNode;
}

// Global Lenis instance storage
let lenisInstance: Lenis | null = null;

export function SmoothScroll({ children }: SmoothScrollProps) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // Initialize Lenis smooth scroll with optimized settings
        const lenis = new Lenis({
            duration: 1.0,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        });

        lenisRef.current = lenis;
        lenisInstance = lenis;

        // Store globally for access from other components
        (window as any).__lenis = lenis;

        // Animation frame loop for smooth scrolling
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Handle anchor link clicks for smooth scrolling
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.hash && anchor.hash.startsWith('#')) {
                const targetElement = document.querySelector(anchor.hash);
                if (targetElement) {
                    e.preventDefault();
                    lenis.scrollTo(targetElement as HTMLElement, {
                        offset: -80, // Account for fixed navbar
                        duration: 1.2,
                    });
                }
            }
        };

        document.addEventListener('click', handleAnchorClick);

        // Cleanup on unmount
        return () => {
            document.removeEventListener('click', handleAnchorClick);
            lenis.destroy();
            lenisInstance = null;
            (window as any).__lenis = null;
        };
    }, []);

    return <>{children}</>;
}

/**
 * Hook to access smooth scroll functionality
 * @returns Object with scrollTo function and current Lenis instance
 */
export function useSmoothScroll() {
    const scrollTo = useCallback((
        target: string | number | HTMLElement,
        options?: {
            offset?: number;
            duration?: number;
            easing?: (t: number) => number;
            immediate?: boolean;
        }
    ) => {
        const lenis = lenisInstance || (window as any).__lenis;
        if (lenis) {
            lenis.scrollTo(target, {
                offset: options?.offset ?? 0,
                duration: options?.duration ?? 1.2,
                easing: options?.easing,
                immediate: options?.immediate,
            });
        } else {
            // Fallback to native scroll
            if (typeof target === 'string') {
                const element = document.querySelector(target);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (typeof target === 'number') {
                window.scrollTo({ top: target, behavior: 'smooth' });
            }
        }
    }, []);

    const scrollToTop = useCallback((duration?: number) => {
        scrollTo(0, { duration: duration ?? 1.0 });
    }, [scrollTo]);

    const scrollToElement = useCallback((selector: string, offset?: number) => {
        scrollTo(selector, { offset: offset ?? -80 });
    }, [scrollTo]);

    return {
        scrollTo,
        scrollToTop,
        scrollToElement,
        lenis: lenisInstance
    };
}

export default SmoothScroll;
