/**
 * Security Utilities for DefenDDoS
 * Industry-grade security functions for input validation, sanitization, and protection
 */

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize string input to prevent XSS attacks
 * Removes dangerous HTML tags and escape special characters
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        .trim()
        // Remove null bytes
        .replace(/\0/g, '')
        // Escape HTML special characters
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        // Remove potential script injections
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
}

/**
 * Sanitize email input
 * Only allows valid email characters
 */
export function sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';

    return email
        .toLowerCase()
        .trim()
        // Only allow valid email characters
        .replace(/[^a-z0-9@._+-]/g, '')
        // Maximum length
        .slice(0, 254);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize name input
 * Allows letters, spaces, hyphens, apostrophes
 */
export function sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return '';

    return name
        .trim()
        // Only allow safe name characters
        .replace(/[^a-zA-Z\s\-']/g, '')
        // Collapse multiple spaces
        .replace(/\s+/g, ' ')
        // Maximum length
        .slice(0, 100);
}

// ============================================
// PASSWORD SECURITY
// ============================================

export interface PasswordStrength {
    score: number;        // 0-5
    label: string;
    isStrong: boolean;
    feedback: string[];
}

/**
 * Check password strength with detailed feedback
 */
export function checkPasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
        return { score: 0, label: 'None', isStrong: false, feedback: ['Password is required'] };
    }

    // Length check
    if (password.length >= 8) {
        score++;
    } else {
        feedback.push('At least 8 characters required');
    }

    if (password.length >= 12) {
        score++;
    }

    // Lowercase
    if (/[a-z]/.test(password)) {
        score++;
    } else {
        feedback.push('Add lowercase letters');
    }

    // Uppercase
    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push('Add uppercase letters');
    }

    // Numbers
    if (/[0-9]/.test(password)) {
        score++;
    } else {
        feedback.push('Add numbers');
    }

    // Special characters
    if (/[^a-zA-Z0-9]/.test(password)) {
        score++;
    } else {
        feedback.push('Add special characters (!@#$%^&*)');
    }

    // Common password patterns to avoid
    const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'letmein', 'welcome', 'admin'];
    if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
        score = Math.max(0, score - 2);
        feedback.push('Avoid common password patterns');
    }

    // Sequential characters
    if (/(.)\1{2,}/.test(password)) {
        score = Math.max(0, score - 1);
        feedback.push('Avoid repeated characters');
    }

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

    return {
        score: Math.min(score, 5),
        label: labels[Math.min(score, 5)],
        isStrong: score >= 4,
        feedback,
    };
}

// ============================================
// CSRF PROTECTION
// ============================================

const CSRF_TOKEN_KEY = 'csrf_token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');

    // Store in sessionStorage (more secure than localStorage)
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    }

    return token;
}

/**
 * Get current CSRF token or generate new one
 */
export function getCSRFToken(): string {
    if (typeof window === 'undefined') return '';

    let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (!token) {
        token = generateCSRFToken();
    }
    return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
    if (typeof window === 'undefined') return false;

    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    return storedToken !== null && storedToken === token && token.length === 64;
}

// ============================================
// RATE LIMITING (Client-side)
// ============================================

interface RateLimitEntry {
    count: number;
    firstAttempt: number;
    lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    maxAttempts: number;      // Max attempts allowed
    windowMs: number;         // Time window in milliseconds
    blockDurationMs: number;  // How long to block after max attempts
}

const defaultRateLimitConfig: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 60 * 1000,        // 1 minute window
    blockDurationMs: 15 * 60 * 1000, // 15 minute block
};

/**
 * Check if action is rate limited
 */
export function checkRateLimit(
    key: string,
    config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const { maxAttempts, windowMs, blockDurationMs } = { ...defaultRateLimitConfig, ...config };
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry) {
        rateLimitStore.set(key, { count: 1, firstAttempt: now, lastAttempt: now });
        return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Check if still in block period
    if (entry.count >= maxAttempts) {
        const blockEndTime = entry.lastAttempt + blockDurationMs;
        if (now < blockEndTime) {
            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: blockEndTime
            };
        } else {
            // Block period expired, reset
            rateLimitStore.set(key, { count: 1, firstAttempt: now, lastAttempt: now });
            return { allowed: true, remainingAttempts: maxAttempts - 1 };
        }
    }

    // Check if window expired
    if (now - entry.firstAttempt > windowMs) {
        rateLimitStore.set(key, { count: 1, firstAttempt: now, lastAttempt: now });
        return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Increment count
    entry.count++;
    entry.lastAttempt = now;

    return {
        allowed: entry.count <= maxAttempts,
        remainingAttempts: Math.max(0, maxAttempts - entry.count),
        resetTime: entry.count >= maxAttempts ? now + blockDurationMs : undefined
    };
}

/**
 * Reset rate limit for a key (e.g., on successful login)
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

// ============================================
// SECURE TOKEN GENERATION
// ============================================

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = generateSecureToken(16);
    return `${timestamp}-${random}`;
}

// ============================================
// SECURE HASH (Client-side, for comparison only)
// ============================================

/**
 * Hash a string using SHA-256
 * Note: For passwords, always hash on the server with bcrypt/argon2
 * This is only for client-side comparisons or non-sensitive hashing
 */
export async function hashSHA256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// DEVICE FINGERPRINTING (Basic)
// ============================================

/**
 * Generate a basic device fingerprint for session validation
 */
export function getDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server';

    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
    ];

    return btoa(components.join('|'));
}

// ============================================
// EXPORTS
// ============================================

export const Security = {
    sanitizeInput,
    sanitizeEmail,
    sanitizeName,
    isValidEmail,
    checkPasswordStrength,
    generateCSRFToken,
    getCSRFToken,
    validateCSRFToken,
    checkRateLimit,
    resetRateLimit,
    generateSecureToken,
    generateSessionId,
    hashSHA256,
    getDeviceFingerprint,
};

export default Security;
