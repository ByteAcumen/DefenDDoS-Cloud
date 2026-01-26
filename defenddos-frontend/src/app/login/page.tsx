'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Loader2, Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Zod Schema
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login, loginWithGoogle, loginWithGithub, isAuthenticated, isLoading, error: authError, clearError } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false
        }
    });

    // Handle Authentication Redirect
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    // Clear Auth Context Errors on Mount
    useEffect(() => {
        clearError();
    }, []);

    const onSubmit = async (data: LoginFormValues) => {
        clearError();
        const success = await login(data.email, data.password, data.rememberMe);
        if (success) {
            router.push('/dashboard');
        } else {
            // Error is handled by AuthContext, but we can set focus or specific field errors if we had detailed API responses
        }
    };

    const handleGoogleLogin = async () => {
        const success = await loginWithGoogle();
        if (success) router.push('/dashboard');
    };

    const handleGithubLogin = async () => {
        const success = await loginWithGithub();
        if (success) router.push('/dashboard');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center animate-pulse">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Background Gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px]" />
            </div>

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-center px-20 z-10">
                <div className="max-w-xl">
                    <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">DefenDDoS</span>
                    </Link>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl font-bold text-white leading-tight mb-6"
                    >
                        Secure Access to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                            Critical Infrastructure
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-400 mb-8 max-w-md"
                    >
                        Authenticate securely using industry-standard protocols.
                        Your session is protected by end-to-end encryption.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex gap-4"
                    >
                        <div className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold text-white">256-bit</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Encryption</div>
                        </div>
                        <div className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold text-white">OAuth 2.0</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Standard</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 relative z-10 backdrop-blur-sm lg:backdrop-blur-none bg-slate-950/50 lg:bg-transparent">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-xl"
                >
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-400">Sign in to access your dashboard</p>
                    </div>

                    {/* Quick Demo Login Helper */}
                    <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                        <p className="font-semibold mb-1 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Demo Credentials:
                        </p>
                        <code className="bg-black/20 px-2 py-0.5 rounded text-blue-200">demo@defenddos.com</code> / <code className="bg-black/20 px-2 py-0.5 rounded text-blue-200">demo123</code>
                    </div>

                    {authError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {authError}
                        </div>
                    )}

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-white font-medium"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /></svg>
                            Google
                        </button>
                        <button
                            onClick={handleGithubLogin}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-white font-medium"
                        >
                            <Github className="w-5 h-5" />
                            GitHub
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider">or email</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="name@company.com"
                                    className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500/50'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    {...register('password')}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`w-full pl-11 pr-11 py-3 bg-white/5 border ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500/50'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    {...register('rememberMe')}
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                                />
                                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                            </label>
                            <Link href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-400 text-sm">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium hover:underline decoration-blue-400/30 underline-offset-4">
                            Create Account
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
