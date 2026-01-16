'use client';

import { motion } from 'framer-motion';

const techCategories = [
    {
        title: 'Frontend',
        color: 'from-cyan-500 to-blue-500',
        technologies: [
            { name: 'Next.js 15', icon: '▲', description: 'React Framework' },
            { name: 'React 19', icon: '⚛️', description: 'UI Library' },
            { name: 'TypeScript', icon: 'TS', description: 'Type Safety' },
            { name: 'Tailwind CSS', icon: '🎨', description: 'Styling' },
        ],
    },
    {
        title: 'Backend',
        color: 'from-green-500 to-emerald-500',
        technologies: [
            { name: 'Spring Boot 3', icon: '🍃', description: 'Java Framework' },
            { name: 'Java 21', icon: '☕', description: 'Language' },
            { name: 'Redis', icon: '🔴', description: 'Caching' },
            { name: 'Kafka', icon: '📨', description: 'Messaging' },
        ],
    },
    {
        title: 'Machine Learning',
        color: 'from-purple-500 to-pink-500',
        technologies: [
            { name: 'Python 3.11', icon: '🐍', description: 'ML Language' },
            { name: 'FastAPI', icon: '⚡', description: 'ML API' },
            { name: 'scikit-learn', icon: '🔬', description: 'Random Forest' },
            { name: 'TensorFlow', icon: '🧠', description: 'LSTM Model' },
        ],
    },
    {
        title: 'Infrastructure',
        color: 'from-orange-500 to-red-500',
        technologies: [
            { name: 'Docker', icon: '🐳', description: 'Containers' },
            { name: 'Kubernetes', icon: '☸️', description: 'Orchestration' },
            { name: 'InfluxDB', icon: '📊', description: 'Time-Series DB' },
            { name: 'GitHub Actions', icon: '🔄', description: 'CI/CD' },
        ],
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export function TechStack() {
    return (
        <section className="py-20 lg:py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
                        Modern Stack
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Built with{' '}
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            Best-in-Class
                        </span>{' '}
                        Technologies
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        A carefully selected tech stack for maximum performance, scalability, and developer experience.
                    </p>
                </motion.div>

                {/* Tech Categories Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {techCategories.map((category, categoryIndex) => (
                        <motion.div
                            key={categoryIndex}
                            variants={itemVariants}
                            className="relative group"
                        >
                            <div className="relative h-full p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm">
                                {/* Category Header */}
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${category.color} bg-opacity-10 mb-4`}>
                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.color}`} />
                                    <span className="text-sm font-semibold text-white">{category.title}</span>
                                </div>

                                {/* Technologies */}
                                <div className="space-y-3">
                                    {category.technologies.map((tech, techIndex) => (
                                        <motion.div
                                            key={techIndex}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: categoryIndex * 0.1 + techIndex * 0.05 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 transition-all duration-300 hover:bg-slate-700/50 hover:border-slate-600/50 group/tech"
                                        >
                                            <span className="text-2xl">{tech.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white truncate">
                                                    {tech.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {tech.description}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Architecture Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center"
                >
                    <h3 className="text-xl font-semibold text-white mb-4">Architecture Overview</h3>
                    <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
                        <span className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Frontend (Next.js)
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                            Backend (Spring Boot)
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            ML Service (FastAPI)
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Database (InfluxDB + Redis)
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default TechStack;
