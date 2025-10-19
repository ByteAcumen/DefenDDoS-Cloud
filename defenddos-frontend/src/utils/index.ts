import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid } from 'date-fns';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers with proper suffixes (K, M, B, T)
 */
export function formatNumber(num: number): string {
  if (num === 0) return '0';
  
  const sizes = ['', 'K', 'M', 'B', 'T'];
  const i = Math.floor(Math.log(Math.abs(num)) / Math.log(1000));
  
  if (i === 0) return num.toString();
  
  const formatted = (num / Math.pow(1000, i)).toFixed(1);
  return `${formatted}${sizes[i]}`;
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date/time strings with fallback handling
 */
export function formatDate(
  dateString: string | number | Date,
  formatStr: string = 'PPp'
): string {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      return 'Invalid Date';
    }
    return format(date, formatStr);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatTimeAgo(dateString: string | number | Date): string {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      return 'Invalid Date';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Get severity color based on threat level
 */
export function getSeverityColor(severity: string): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  switch (severity.toLowerCase()) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        text: 'text-red-800 dark:text-red-200',
        border: 'border-red-200 dark:border-red-800',
        indicator: 'bg-red-500',
      };
    case 'high':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950',
        text: 'text-orange-800 dark:text-orange-200',
        border: 'border-orange-200 dark:border-orange-800',
        indicator: 'bg-orange-500',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        text: 'text-yellow-800 dark:text-yellow-200',
        border: 'border-yellow-200 dark:border-yellow-800',
        indicator: 'bg-yellow-500',
      };
    case 'low':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-200 dark:border-blue-800',
        indicator: 'bg-blue-500',
      };
    case 'normal':
    default:
      return {
        bg: 'bg-green-50 dark:bg-green-950',
        text: 'text-green-800 dark:text-green-200',
        border: 'border-green-200 dark:border-green-800',
        indicator: 'bg-green-500',
      };
  }
}

/**
 * Get status color for system health
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  indicator: string;
} {
  switch (status.toLowerCase()) {
    case 'operational':
    case 'healthy':
    case 'excellent':
    case 'running':
    case 'connected':
      return {
        bg: 'bg-green-50 dark:bg-green-950',
        text: 'text-green-700 dark:text-green-300',
        indicator: 'bg-green-500',
      };
    case 'degraded':
    case 'warning':
    case 'good':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        text: 'text-yellow-700 dark:text-yellow-300',
        indicator: 'bg-yellow-500',
      };
    case 'down':
    case 'critical':
    case 'error':
    case 'failed':
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        text: 'text-red-700 dark:text-red-300',
        indicator: 'bg-red-500',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950',
        text: 'text-gray-700 dark:text-gray-300',
        indicator: 'bg-gray-500',
      };
  }
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

/**
 * Generate random ID for components
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function for search and API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Sleep utility for animations and delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Generate gradient colors for charts
 */
export function generateChartGradient(
  severity: string
): { from: string; to: string } {
  switch (severity.toLowerCase()) {
    case 'critical':
      return { from: '#ef4444', to: '#dc2626' };
    case 'high':
      return { from: '#f97316', to: '#ea580c' };
    case 'medium':
      return { from: '#eab308', to: '#ca8a04' };
    case 'low':
      return { from: '#3b82f6', to: '#2563eb' };
    case 'normal':
    default:
      return { from: '#10b981', to: '#059669' };
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Get relative time intervals for data fetching
 */
export function getTimeIntervals() {
  return [
    { label: '5 minutes', value: '5m', seconds: 300 },
    { label: '15 minutes', value: '15m', seconds: 900 },
    { label: '1 hour', value: '1h', seconds: 3600 },
    { label: '6 hours', value: '6h', seconds: 21600 },
    { label: '24 hours', value: '24h', seconds: 86400 },
    { label: '7 days', value: '7d', seconds: 604800 },
  ];
}

/**
 * Local storage utilities with error handling
 */
export const storage = {
  get: (key: string, defaultValue: unknown = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};