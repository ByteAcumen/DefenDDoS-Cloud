'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBackendHealth } from '@/hooks/useBackendApi';
import { WifiOff, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ConnectionStatus() {
  const [showStatus, setShowStatus] = useState(false);
  const backendHealth = useBackendHealth();

  const isDisconnected = backendHealth.isError || (backendHealth.data === false);
  const isReconnecting = backendHealth.isLoading;

  useEffect(() => {
    // Only show status if disconnected or reconnecting
    if (isDisconnected || isReconnecting) {
      setShowStatus(true);
    } else {
      // Hide after a delay when connection is restored
      const timer = setTimeout(() => setShowStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isDisconnected, isReconnecting]);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full shadow-lg border backdrop-blur-md bg-background/80"
          style={{
            borderColor: isDisconnected ? 'rgba(239, 68, 68, 0.5)' : 'rgba(234, 179, 8, 0.5)'
          }}
        >
          {isReconnecting ? (
            <>
              <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
              <span className="text-sm font-medium text-yellow-500">Reconnecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Offline</span>
              <button
                onClick={() => backendHealth.refetch()}
                className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-300"
              >
                Retry
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
