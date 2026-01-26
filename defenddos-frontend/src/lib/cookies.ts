/**
 * Cookie Management Utilities
 * Secure cookie handling for authentication tokens
 */

// Cookie options for production security
export interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
}

/**
 * Set a cookie with secure options
 */
export function setCookie(
    name: string,
    value: string,
    options: CookieOptions = {}
): void {
    if (typeof document === 'undefined') return;

    const {
        maxAge = 7 * 24 * 60 * 60, // 7 days default
        path = '/',
        secure = process.env.NODE_ENV === 'production',
        sameSite = 'lax'
    } = options;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    cookieString += `; path=${path}`;
    cookieString += `; max-age=${maxAge}`;
    cookieString += `; SameSite=${sameSite}`;

    if (secure) {
        cookieString += '; Secure';
    }

    document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(nameEQ)) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }

    return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, path: string = '/'): void {
    if (typeof document === 'undefined') return;

    document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
    return getCookie(name) !== null;
}

// Token-specific cookie management
const TOKEN_COOKIE_NAME = 'defenddos_token';
const REFRESH_TOKEN_COOKIE_NAME = 'defenddos_refresh_token';
const USER_COOKIE_NAME = 'defenddos_user';

export const cookieAuth = {
    /**
     * Store authentication token in cookie
     */
    setAuthToken(token: string, rememberMe: boolean = false): void {
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
        setCookie(TOKEN_COOKIE_NAME, token, {
            maxAge,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });
    },

    /**
     * Get authentication token from cookie
     */
    getAuthToken(): string | null {
        return getCookie(TOKEN_COOKIE_NAME);
    },

    /**
     * Store refresh token in cookie
     */
    setRefreshToken(token: string): void {
        setCookie(REFRESH_TOKEN_COOKIE_NAME, token, {
            maxAge: 30 * 24 * 60 * 60, // 30 days
            secure: true,
            sameSite: 'strict',
            path: '/'
        });
    },

    /**
     * Get refresh token from cookie
     */
    getRefreshToken(): string | null {
        return getCookie(REFRESH_TOKEN_COOKIE_NAME);
    },

    /**
     * Store user data in cookie (small data only)
     */
    setUser(user: any): void {
        const userData = JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
        setCookie(USER_COOKIE_NAME, userData, {
            maxAge: 7 * 24 * 60 * 60,
            path: '/'
        });
    },

    /**
     * Get user data from cookie
     */
    getUser(): any | null {
        const userData = getCookie(USER_COOKIE_NAME);
        if (!userData) return null;

        try {
            return JSON.parse(userData);
        } catch {
            return null;
        }
    },

    /**
     * Check if user is authenticated (has valid token)
     */
    isAuthenticated(): boolean {
        return hasCookie(TOKEN_COOKIE_NAME);
    },

    /**
     * Clear all authentication cookies
     */
    clearAuth(): void {
        deleteCookie(TOKEN_COOKIE_NAME);
        deleteCookie(REFRESH_TOKEN_COOKIE_NAME);
        deleteCookie(USER_COOKIE_NAME);
    }
};

/**
 * Validate token format (basic check)
 */
export function isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    // Check if it looks like a JWT (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length === 3) return true;

    // Or if it's our demo token format
    if (token.startsWith('demo-token-') || token.startsWith('github-token-')) return true;

    return false;
}
