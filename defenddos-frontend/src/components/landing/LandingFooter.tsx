'use client';

import Link from 'next/link';
import { Shield, Github, Twitter, Linkedin, Mail, ExternalLink, ArrowRight } from 'lucide-react';

const footerLinks = {
    product: [
        { label: 'Features', href: '#features' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'API Docs', href: '/docs' },
        { label: 'GitHub', href: 'https://github.com/ByteAcumen/DefenDDoS-Cloud', external: true },
    ],
    resources: [
        { label: 'Documentation', href: '/docs' },
        { label: 'Source Code', href: 'https://github.com/ByteAcumen/DefenDDoS-Cloud', external: true },
        { label: 'API Reference', href: '/api' },
        { label: 'Changelog', href: '/changelog' },
    ],
    company: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
    ],
};

const socialLinks = [
    { icon: Github, href: 'https://github.com/ByteAcumen/DefenDDoS-Cloud', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:contact@defenddos.com', label: 'Email' },
];

export default function LandingFooter() {
    return (
        <footer className="bg-[#060612] border-t border-white/5">
            {/* CTA Section */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="relative rounded-3xl bg-gradient-to-r from-blue-600/10 via-violet-600/10 to-purple-600/10 border border-white/5 p-8 lg:p-12 overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                                Open Source DDoS Protection
                            </h3>
                            <p className="text-slate-400 max-w-lg">
                                Start protecting your infrastructure today. Free and open source forever.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/register"
                                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 text-white font-semibold hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all duration-300"
                            >
                                <span>Get Started</span>
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <a
                                href="https://github.com/ByteAcumen/DefenDDoS-Cloud"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all duration-300"
                            >
                                <Github className="w-5 h-5" />
                                View on GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex items-baseline">
                                <span className="text-xl font-bold text-white">Defen</span>
                                <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">DDoS</span>
                            </div>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                            Enterprise-grade DDoS protection powered by dual-layer Machine Learning.
                            Secure your infrastructure with real-time threat detection and sub-50ms response.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-2">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-lg bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.03] hover:border-white/[0.06] transition-all duration-200"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-5">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-400 hover:text-white text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-5">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    {link.external ? (
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
                                        >
                                            {link.label}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            className="text-slate-400 hover:text-white text-sm transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-5">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-400 hover:text-white text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} DefenDDoS. All rights reserved.
                    </p>
                    <p className="text-slate-500 text-sm">
                        Built with ❤️ for a safer internet
                    </p>
                </div>
            </div>
        </footer>
    );
}
