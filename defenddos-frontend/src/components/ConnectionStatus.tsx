'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useBackendHealth, useMLHealth } from '@/hooks/useBackendApi';
import { RefreshCw, X, CheckCircle, XCircle, Activity } from 'lucide-react';

export default function ConnectionStatus() {
  const [isExpanded, setIsExpanded] = useState(false);  const backendHealth = useBackendHealth();
  const mlHealth = useMLHealth();
  
  // Simplified connection check - just verify query succeeded
  const isBackendConnected = backendHealth.isSuccess;
  const isMLConnected = mlHealth.isSuccess;
  
  const isFullyConnected = isBackendConnected; // Backend is primary, ML is optional

  const handleRefresh = () => {
    backendHealth.refetch();
    mlHealth.refetch();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-20 right-0 w-96 glass-card rounded-xl shadow-2xl overflow-hidden border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
              <h3 className="text-foreground font-semibold text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Service Status
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={backendHealth.isLoading || mlHealth.isLoading}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-primary hover:text-primary-600 disabled:opacity-50"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-4 h-4 ${(backendHealth.isLoading || mlHealth.isLoading) ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Services */}
            <div className="p-4 space-y-3">
              {/* Backend API */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    backendHealth.isLoading 
                      ? 'bg-yellow-500 animate-pulse' 
                      : isBackendConnected 
                        ? 'bg-green-500' 
                        : 'bg-red-500 animate-pulse'
                  }`} />
                  <span className="text-foreground font-medium text-sm">Backend API</span>
                </div>
                {backendHealth.isLoading ? (
                  <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                ) : isBackendConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              {/* ML Service */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    mlHealth.isLoading 
                      ? 'bg-yellow-500 animate-pulse' 
                      : isMLConnected 
                        ? 'bg-green-500' 
                        : 'bg-red-500 animate-pulse'
                  }`} />
                  <span className="text-foreground font-medium text-sm">ML Service</span>
                </div>
                {mlHealth.isLoading ? (
                  <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                ) : isMLConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            {/* Issues Section */}
            {(!isBackendConnected || !isMLConnected) && !backendHealth.isLoading && !mlHealth.isLoading && (
              <div className="px-4 pb-4">
                <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <p className="text-red-400 font-semibold text-xs mb-2">Issues:</p>
                  <ul className="space-y-1">
                    {!isBackendConnected && (
                      <li className="text-red-300 text-xs flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>Backend API is not responding</span>
                      </li>
                    )}
                    {!isMLConnected && (
                      <li className="text-red-300 text-xs flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>ML Service is not responding</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-secondary/20">
              <p className="text-xs text-muted-foreground text-center">
                Last checked: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-3 px-5 py-3 rounded-full shadow-xl
          transition-all duration-300 font-medium text-sm
          ${isFullyConnected 
            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
          }
        `}
      >
        <div className="flex items-center gap-2">
          {isFullyConnected ? (
            <CheckCircle className="w-4 h-4 text-white" />
          ) : (
            <div className="relative">
              <div className="w-4 h-4 bg-white/30 rounded-full animate-ping absolute" />
              <XCircle className="w-4 h-4 text-white relative" />
            </div>
          )}
          <span className="text-white">
            {isFullyConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </motion.button>
    </div>
  );
}
