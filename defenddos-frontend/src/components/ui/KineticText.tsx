'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function KineticText({ text, className = '' }: { text: string; className?: string }) {
    const [gradientPosition, setGradientPosition] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setGradientPosition((prev) => (prev + 1) % 360);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.h1
            className={`font-bold ${className}`}
            style={{
                backgroundImage: `linear-gradient(${gradientPosition}deg, #22d3ee, #3b82f6, #a855f7, #22d3ee)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {text.split('').map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ display: 'inline-block', whiteSpace: 'pre' }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.h1>
    );
}
