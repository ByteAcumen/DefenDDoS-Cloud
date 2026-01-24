'use client';

import { motion } from 'framer-motion';

export function Globe3D() {
    return (
        <div className="w-full h-full flex items-center justify-center relative">
            <motion.div
                className="w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                animate={{
                    rotate: 360,
                    boxShadow: [
                        "0 0 50px rgba(6,182,212,0.2)",
                        "0 0 80px rgba(6,182,212,0.4)",
                        "0 0 50px rgba(6,182,212,0.2)"
                    ]
                }}
                transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
            >
                <div className="absolute inset-0 rounded-full border border-cyan-400/20" style={{ transform: "rotateX(60deg)" }} />
                <div className="absolute inset-0 rounded-full border border-cyan-400/20" style={{ transform: "rotateY(60deg)" }} />
                <div className="absolute inset-0 rounded-full border border-cyan-400/20" style={{ transform: "rotateZ(60deg)" }} />
            </motion.div>

            <motion.div
                className="absolute w-80 h-80 rounded-full border border-dashed border-cyan-500/20"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}

export default Globe3D;
