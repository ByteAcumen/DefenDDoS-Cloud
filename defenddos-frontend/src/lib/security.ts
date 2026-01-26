/**
 * Security Utilities for DefenDDoS
 * Provides input validation, sanitization, and security helpers
 */

// ============================================
// EMAIL VALIDATION
// ============================================
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

// ============================================
// PASSWORD VALIDATION
// ============================================
export interface PasswordStrength {
    isValid: boolean;
    score: number;
    feedback: string[];
}

export function validatePassword(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    // Minimum length
    if (password.length >= 8) {
        score++;
    } else {
        feedback.push('Password must be at least 8 characters long');
    }

    // Contains lowercase
    if (/[a-z]/.test(password)) {
        score++;
    } else {
        feedback.push('Must contain at least one lowercase letter');
    }

    // Contains uppercase
    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push('Must contain at least one uppercase letter');
    }

    // Contains number
    if (/[0-9]/.test(password)) {
        score++;
    } else {
        feedback.push('Must contain at least one number');
    }

    // Contains special character
    if (/[^a-zA-Z0-9]/.test(password)) {
        score++;
    } else {
        feedback.push('Must contain at least one special character');
    }

    // Additional security checks
    if (password.length >= 12) score++;
    if (/(.)\1{2,}/.test(password)) {
        feedback.push('Avoid repeating characters');
        score--;
    }

    return {
        isValid: score >= 5 && feedback.length === 0,
        score: Math.max(0, Math.min(5, score)),
        feedback
    };
}

// ============================================
// INPUT SANITIZATION
// ============================================
export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().slice(0, 254);
}

export function sanitizeName(name: string): string {
    return name
        .trim()
        .replace(/[^a-zA-Z0-9\s.-]/g, '') // Allow only alphanumeric, spaces, dots, hyphens
        .slice(0, 100);
}

// ============================================
// RATE LIMITING (Client-side)
// ============================================
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
    key: string,
    maxRequests: number = 5,
    windowMs: number = 60000
): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs
        });
        return true;
    }

    if (entry.count >= maxRequests) {
        return false;
    }

    entry.count++;
    return true;
}

export function getRateLimitInfo(key: string): {
    remaining: number;
    resetIn: number;
} {
    const entry = rateLimitStore.get(key);
    const maxRequests = 5;

    if (!entry) {
        return { remaining: maxRequests, resetIn: 0 };
    }

    const now = Date.now();
    const resetIn = Math.max(0, entry.resetTime - now);
    const remaining = Math.max(0, maxRequests - entry.count);

    return { remaining, resetIn };
}

// ============================================
// CSRF TOKEN GENERATION
// ============================================
export function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ============================================
// SECURE TOKEN STORAGE
// ============================================
const TOKEN_KEY = 'defenddos_auth_token';
const REFRESH_TOKEN_KEY = 'defenddos_refresh_token';
const USER_KEY = 'defenddos_user';

export const secureStorage = {
    setToken(token: string): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(TOKEN_KEY, token);
            } catch (error) {
                console.error('Failed to store token:', error);
            }
        }
    },

    getToken(): string | null {
        if (typeof window !== 'undefined') {
            try {
                return localStorage.getItem(TOKEN_KEY);
            } catch (error) {
                console.error('Failed to retrieve token:', error);
                return null;
            }
        }
        return null;
    },

    setRefreshToken(token: string): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(REFRESH_TOKEN_KEY, token);
            } catch (error) {
                console.error('Failed to store refresh token:', error);
            }
        }
    },

    getRefreshToken(): string | null {
        if (typeof window !== 'undefined') {
            try {
                return localStorage.getItem(REFRESH_TOKEN_KEY);
            } catch (error) {
                console.error('Failed to retrieve refresh token:', error);
                return null;
            }
        }
        return null;
    },

    setUser(user: any): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(USER_KEY, JSON.stringify(user));
            } catch (error) {
                console.error('Failed to store user:', error);
            }
        }
    },

    getUser(): any | null {
        if (typeof window !== 'undefined') {
            try {
                const userStr = localStorage.getItem(USER_KEY);
                return userStr ? JSON.parse(userStr) : null;
            } catch (error) {
                console.error('Failed to retrieve user:', error);
                return null;
            }
        }
        return null;
    },

    clearAll(): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            } catch (error) {
                console.error('Failed to clear storage:', error);
            }
        }
    }
};

// ============================================
// XSS PREVENTION
// ============================================
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================
// SESSION TIMEOUT
// ============================================
let sessionTimeoutId: NodeJS.Timeout | null = null;

export function startSessionTimeout(
    onTimeout: () => void,
    timeoutMinutes: number = 30
): void {
    clearSessionTimeout();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    sessionTimeoutId = setTimeout(() => {
        onTimeout();
    }, timeoutMs);
}

export function clearSessionTimeout(): void {
    if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        sessionTimeoutId = null;
    }
}

export function resetSessionTimeout(
    onTimeout: () => void,
    timeoutMinutes: number = 30
): void {
    startSessionTimeout(onTimeout, timeoutMinutes);
}
