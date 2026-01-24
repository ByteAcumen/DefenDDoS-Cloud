import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal() {
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        gsap.fromTo(
            element,
            {
                opacity: 0,
                y: 100,
                scale: 0.9,
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: element,
                    start: 'top 80%',
                    end: 'top 20%',
                    scrub: 1,
                    markers: false, // Set to true for debugging
                },
            }
        );
    }, []);

    return elementRef;
}

export function useParallax(speed = 0.5) {
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        gsap.to(element, {
            y: () => -window.innerHeight * speed,
            ease: 'none',
            scrollTrigger: {
                trigger: element,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
        });
    }, [speed]);

    return elementRef;
}

export function useStaggerReveal(selector: string) {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const elements = container.querySelectorAll(selector);

        gsap.fromTo(
            elements,
            { opacity: 0, y: 50, rotateX: -20 },
            {
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'back.out(1.2)',
                scrollTrigger: {
                    trigger: container,
                    start: 'top 75%',
                    toggleActions: 'play none none reverse',
                },
            }
        );
    }, [selector]);

    return containerRef;
}
