'use client';

import { motion } from 'framer-motion';

export function AuroraBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Aurora layer 1 */}
            <motion.div
                className="absolute top-0 left-1/4 w-1/2 h-1/2 rounded-full blur-[150px] opacity-20"
                style={{
                    background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)',
                }}
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Aurora layer 2 */}
            <motion.div
                className="absolute top-1/3 right-1/4 w-1/2 h-1/2 rounded-full blur-[150px] opacity-20"
                style={{
                    background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
                }}
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Aurora layer 3 */}
            <motion.div
                className="absolute bottom-1/4 left-1/3 w-1/2 h-1/2 rounded-full blur-[150px] opacity-15"
                style={{
                    background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
                }}
                animate={{
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Light rays */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute top-0 left-0 w-1 h-full origin-top"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.1), transparent)',
                        transform: `translateX(${i * 20}vw) rotate(${i * 15}deg)`,
                    }}
                    animate={{
                        opacity: [0, 0.5, 0],
                        scaleY: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        delay: i * 0.5,
                    }}
                />
            ))}
        </div>
    );
}
