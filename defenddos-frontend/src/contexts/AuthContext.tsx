'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import {
    sanitizeEmail,
    sanitizeName,
    validatePassword,
    isValidEmail,
    secureStorage,
    checkRateLimit,
    startSessionTimeout,
    clearSessionTimeout
} from '@/lib/security';
import { cookieAuth } from '@/lib/cookies';

// ============================================
// API BASE URL
// ============================================
const API_BASE = '/api/backend'; // Uses Next.js rewrite to http://localhost:8082/api/v1

// ============================================
// TYPES
// ============================================
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
    avatar?: string;
    provider?: 'credentials' | 'google' | 'github';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
    loginWithGoogle: () => Promise<boolean>;
    loginWithGithub: () => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
    updateUser: (updates: Partial<User>) => void;
}

// ============================================
// STORAGE KEYS
// ============================================
const TOKEN_KEY = 'defenddos_auth_token';
const USER_KEY = 'defenddos_auth_user';

// ============================================
// CONTEXT
// ============================================
const defaultAuthContext: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    login: async () => false,
    loginWithGoogle: async () => false,
    loginWithGithub: async () => false,
    register: async () => false,
    logout: () => { },
    clearError: () => { },
    updateUser: () => { },
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// ============================================
// AUTH PROVIDER
// ============================================
export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    // Check for existing session on mount
    useEffect(() => {
        checkExistingSession();
    }, []);

    // Check for existing session
    const checkExistingSession = async () => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const userStr = localStorage.getItem(USER_KEY);

            if (token && userStr) {
                // Validate token with backend
                try {
                    const response = await fetch(`${API_BASE}/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.user) {
                            setState({
                                user: data.user,
                                isAuthenticated: true,
                                isLoading: false,
                                error: null,
                            });
                            return;
                        }
                    }
                } catch (e) {
                    // Backend not available, use local data
                    const user = JSON.parse(userStr) as User;
                    setState({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                    return;
                }

                // Token invalid, clear storage
                clearStorage();
            }
            setState(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Session check failed:', error);
            clearStorage();
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const clearStorage = () => {
        cookieAuth.clearAuth();
        secureStorage.clearAll();
        clearSessionTimeout();
    };

    // ============================================
    // LOGIN WITH CREDENTIALS
    // ============================================
    const login = useCallback(async (email: string, password: string, remember = false): Promise<boolean> => {
        // Rate limiting check
        if (!checkRateLimit('login', 5, 60000)) {
            const error = 'Too many login attempts. Please wait a minute.';
            setState(prev => ({ ...prev, error, isLoading: false }));
            toast.error(error);
            return false;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Validate and sanitize inputs
            const cleanEmail = sanitizeEmail(email);
            if (!isValidEmail(cleanEmail)) {
                throw new Error('Please enter a valid email address');
            }

            if (!password || password.length < 1) {
                throw new Error('Password is required');
            }

            // Try backend first
            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || 'defenddos-api-key'
                    },
                    body: JSON.stringify({ email: cleanEmail, password, rememberMe: remember })
                });

                const data = await response.json();

                if (data.success && data.token && data.user) {
                    // Use cookie-based storage (primary)
                    cookieAuth.setAuthToken(data.token, remember);
                    if (data.refreshToken) {
                        cookieAuth.setRefreshToken(data.refreshToken);
                    }
                    cookieAuth.setUser(data.user);

                    // Backup in secure storage
                    secureStorage.setToken(data.token);
                    secureStorage.setUser(data.user);

                    setState({
                        user: data.user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    // Start session timeout
                    const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT || '30');
                    startSessionTimeout(() => {
                        toast.error('Session expired. Please login again.');
                        clearStorage();
                        setState({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            error: null,
                        });
                    }, timeoutMinutes);

                    toast.success(`Welcome back, ${data.user.name}!`);
                    return true;
                } else {
                    throw new Error(data.message || 'Invalid credentials');
                }
            } catch (fetchError: any) {
                // Only allow demo mode if enabled
                const demoModeEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';

                if (demoModeEnabled && cleanEmail === 'demo@defenddos.com' && password === 'demo123') {
                    const demoUser: User = {
                        id: 'demo-user-1',
                        email: 'demo@defenddos.com',
                        name: 'Demo User',
                        role: 'admin',
                        provider: 'credentials',
                    };

                    const demoToken = 'demo-token-' + Date.now();
                    cookieAuth.setAuthToken(demoToken, remember);
                    cookieAuth.setUser(demoUser);
                    secureStorage.setToken(demoToken);
                    secureStorage.setUser(demoUser);

                    setState({
                        user: demoUser,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    toast.success('Welcome! (Demo Mode)');
                    return true;
                }

                // If backend unavailable and no demo mode, show helpful error
                if (fetchError.message?.includes('fetch')) {
                    throw new Error('Cannot connect to authentication server. Please try again later.');
                }
                throw fetchError;
            }
        } catch (error: any) {
            const message = error.message || 'Login failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: message,
            }));
            toast.error(message);
            return false;
        }
    }, []);

    // ============================================
    // OAUTH LOGIN (Google)
    // ============================================
    const loginWithGoogle = useCallback(async (): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
                throw new Error('Google Client ID not configured');
            }

            // Redirect to Google OAuth
            const redirectUri = window.location.origin;
            const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;

            window.location.href = authUrl;
            return true;
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Google sign-in initiation failed',
            }));
            toast.error('Google sign-in init failed');
            return false;
        }
    }, []);

    // Handle Google Redirect Token
    useEffect(() => {
        const handleGoogleCallback = async () => {
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                // Clear the hash immediately to clean up URL
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                window.history.replaceState(null, '', ' ');

                if (accessToken) {
                    setState(prev => ({ ...prev, isLoading: true }));
                    try {
                        // 1. Get Google User Info
                        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        });

                        if (!googleRes.ok) throw new Error('Failed to fetch Google profile');
                        const googleUser = await googleRes.json();

                        // 2. Login/Register with our Backend
                        const backendRes = await fetch(`${API_BASE}/auth/social`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: googleUser.email,
                                name: googleUser.name,
                                provider: 'google',
                                providerId: googleUser.sub,
                                avatarUrl: googleUser.picture
                            })
                        });

                        const data = await backendRes.json();

                        if (data.success && data.token && data.user) {
                            localStorage.setItem(TOKEN_KEY, data.token);
                            localStorage.setItem(USER_KEY, JSON.stringify(data.user));

                            setState({
                                user: data.user,
                                isAuthenticated: true,
                                isLoading: false,
                                error: null,
                            });

                            toast.success(`Welcome ${data.user.name}!`);
                        } else {
                            throw new Error(data.message || 'Social login failed');
                        }
                    } catch (error: any) {
                        console.error('Google login error:', error);
                        toast.error(error.message || 'Google Auth Failed');
                        setState(prev => ({ ...prev, isLoading: false, error: 'Auth failed' }));
                    }
                }
            }
        };

        handleGoogleCallback();
    }, []);

    // ============================================
    // OAUTH LOGIN (GitHub) - Demo mode
    // ============================================
    const loginWithGithub = useCallback(async (): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const githubUser: User = {
                id: `github-${Date.now()}`,
                email: 'user@github.com',
                name: 'GitHub User',
                role: 'user',
                provider: 'github',
            };

            const token = 'github-token-' + Date.now();
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(githubUser));

            setState({
                user: githubUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            toast.success('Signed in with GitHub!');
            return true;
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'GitHub sign-in failed',
            }));
            toast.error('GitHub sign-in failed');
            return false;
        }
    }, []);

    // ============================================
    // REGISTER
    // ============================================
    const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
        // Rate limiting
        if (!checkRateLimit('register', 3, 300000)) { // 3 attempts per 5 minutes
            const error = 'Too many registration attempts. Please wait 5 minutes.';
            setState(prev => ({ ...prev, error, isLoading: false }));
            toast.error(error);
            return false;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Validate and sanitize inputs
            const cleanName = sanitizeName(name);
            const cleanEmail = sanitizeEmail(email);

            if (!cleanName || cleanName.length < 2) {
                throw new Error('Name must be at least 2 characters');
            }

            if (!isValidEmail(cleanEmail)) {
                throw new Error('Please enter a valid email address');
            }

            // Validate password strength
            const passwordCheck = validatePassword(password);
            if (!passwordCheck.isValid) {
                throw new Error(passwordCheck.feedback[0] || 'Password does not meet requirements');
            }

            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': process.env.NEXT_PUBLIC_API_KEY || 'defenddos-api-key'
                    },
                    body: JSON.stringify({ name: cleanName, email: cleanEmail, password })
                });

                const data = await response.json();

                if (data.success && data.token && data.user) {
                    // Use cookie-based storage (primary)
                    cookieAuth.setAuthToken(data.token, true); // Remember me true for registration
                    if (data.refreshToken) {
                        cookieAuth.setRefreshToken(data.refreshToken);
                    }
                    cookieAuth.setUser(data.user);

                    // Backup in secure storage
                    secureStorage.setToken(data.token);
                    if (data.refreshToken) {
                        secureStorage.setRefreshToken(data.refreshToken);
                    }
                    secureStorage.setUser(data.user);

                    setState({
                        user: data.user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    // Start session timeout
                    const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT || '30');
                    startSessionTimeout(() => {
                        toast.error('Session expired. Please login again.');
                        clearStorage();
                        setState({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            error: null,
                        });
                    }, timeoutMinutes);

                    toast.success(`Welcome to DefenDDoS, ${data.user.name}!`);
                    return true;
                } else {
                    throw new Error(data.message || 'Registration failed');
                }
            } catch (fetchError: any) {
                // Only allow demo registration if enabled
                const demoModeEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';

                if (demoModeEnabled) {
                    const demoUser: User = {
                        id: `user-${Date.now()}`,
                        email: cleanEmail,
                        name: cleanName,
                        role: 'user',
                        provider: 'credentials',
                    };

                    const token = 'demo-token-' + Date.now();
                    cookieAuth.setAuthToken(token, true);
                    cookieAuth.setUser(demoUser);
                    secureStorage.setToken(token);
                    secureStorage.setUser(demoUser);

                    setState({
                        user: demoUser,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    toast.success('Account created! (Demo Mode)');
                    return true;
                }

                // If backend unavailable and no demo mode, show helpful error
                if (fetchError.message?.includes('fetch')) {
                    throw new Error('Cannot connect to authentication server. Please try again later.');
                }
                throw fetchError;
            }
        } catch (error: any) {
            const message = error.message || 'Registration failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: message,
            }));
            toast.error(message);
            return false;
        }
    }, []);

    // ============================================
    // LOGOUT
    // ============================================
    const logout = useCallback(async () => {
        const token = localStorage.getItem(TOKEN_KEY);

        // Try to logout from backend
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            // Ignore errors
        }

        clearStorage();
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
        toast.success('Logged out successfully');
    }, []);

    // ============================================
    // UPDATE USER
    // ============================================
    const updateUser = useCallback((updates: Partial<User>) => {
        setState(prev => {
            if (!prev.user) return prev;
            const updatedUser = { ...prev.user, ...updates };
            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            return { ...prev, user: updatedUser };
        });
    }, []);

    // ============================================
    // CLEAR ERROR
    // ============================================
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const value: AuthContextType = {
        ...state,
        login,
        loginWithGoogle,
        loginWithGithub,
        register,
        logout,
        clearError,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
