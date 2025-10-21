'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@/contexts/ThemeContext';
import EnhancedHeader from './EnhancedHeader';
import EnhancedSidebar from './EnhancedSidebar';
import ConnectionStatus from '../ConnectionStatus';

interface EnhancedRootLayoutProps {
  children: React.ReactNode;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function EnhancedRootLayout({ children }: EnhancedRootLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Pages without layout (landing, auth, etc.)
  const noLayoutPages = ['/', '/login', '/register'];
  const showLayout = !noLayoutPages.includes(pathname || '');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background transition-colors duration-300">
          {showLayout ? (
            <>
              {/* Enhanced Header */}
              <EnhancedHeader 
                onMenuToggle={toggleSidebar} 
                isSidebarOpen={isSidebarOpen}
              />

              {/* Enhanced Sidebar */}
              <EnhancedSidebar 
                isOpen={isSidebarOpen} 
                onClose={closeSidebar}
              />

              {/* Main Content Area */}
              <main className="pt-14 sm:pt-16 lg:ml-[280px] min-h-screen transition-all duration-200 bg-background">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ 
                      duration: 0.2, 
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    className="p-3 sm:p-4 lg:p-6 xl:p-8"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Connection Status Indicator */}
              <ConnectionStatus />
            </>
          ) : (
            // No layout for auth pages
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ 
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Enhanced Toast Notifications with Theme Support */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: '',
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                borderRadius: '12px',
                border: '1px solid var(--toast-border)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                backdropFilter: 'blur(12px)',
                padding: '16px',
                maxWidth: '400px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
                style: {
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.05)',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.05)',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#ffffff',
                },
              },
            }}
          />

          {/* React Query DevTools (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false}
              position="bottom"
            />
          )}
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
