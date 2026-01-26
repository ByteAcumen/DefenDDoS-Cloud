'use client';

import { motion } from 'framer-motion';

const techCategories = [
    {
        title: 'Frontend',
        gradient: 'from-blue-500 to-cyan-500',
        technologies: [
            { name: 'Next.js 15', icon: '▲', description: 'React Framework' },
            { name: 'React 19', icon: '⚛️', description: 'UI Library' },
            { name: 'TypeScript', icon: 'TS', description: 'Type Safety' },
            { name: 'Tailwind CSS', icon: '🎨', description: 'Styling' },
        ],
    },
    {
        title: 'Backend',
        gradient: 'from-emerald-500 to-teal-500',
        technologies: [
            { name: 'Spring Boot 3', icon: '🍃', description: 'Java Framework' },
            { name: 'Java 21', icon: '☕', description: 'Language' },
            { name: 'Redis', icon: '🔴', description: 'Caching' },
            { name: 'Kafka', icon: '📨', description: 'Messaging' },
        ],
    },
    {
        title: 'Machine Learning',
        gradient: 'from-violet-500 to-purple-500',
        technologies: [
            { name: 'Python 3.11', icon: '🐍', description: 'ML Language' },
            { name: 'FastAPI', icon: '⚡', description: 'ML API' },
            { name: 'scikit-learn', icon: '🔬', description: 'Random Forest' },
            { name: 'TensorFlow', icon: '🧠', description: 'LSTM Model' },
        ],
    },
    {
        title: 'Infrastructure',
        gradient: 'from-amber-500 to-orange-500',
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
        transition: { staggerChildren: 0.12 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export function TechStack() {
    return (
        <section id="tech" className="py-24 lg:py-32 bg-[#0a0a1a] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(120,119,198,0.08),transparent_60%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/5 to-violet-600/5 rounded-full blur-[120px]" />
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
                    <span className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                        Modern Stack
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Built with{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
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
                            className="group"
                        >
                            <div className="relative h-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                                {/* Category Header */}
                                <div className="flex items-center gap-2 mb-5">
                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.gradient}`} />
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
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.06]"
                                        >
                                            <span className="text-xl w-8 text-center">{tech.icon}</span>
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
                    transition={{ delay: 0.4 }}
                    className="mt-16 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center"
                >
                    <h3 className="text-xl font-semibold text-white mb-6">Architecture Overview</h3>
                    <div className="flex flex-wrap justify-center items-center gap-3 text-sm">
                        <span className="px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            Frontend (Next.js)
                        </span>
                        <span className="text-slate-600">→</span>
                        <span className="px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            Backend (Spring Boot)
                        </span>
                        <span className="text-slate-600">→</span>
                        <span className="px-5 py-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                            ML Service (FastAPI)
                        </span>
                        <span className="text-slate-600">→</span>
                        <span className="px-5 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            Database (InfluxDB + Redis)
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default TechStack;
