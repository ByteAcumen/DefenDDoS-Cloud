'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Loading component for 3D scenes
function Scene3DLoader() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-slate-900/50 backdrop-blur-sm rounded-lg">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
        <p className="mt-4 text-sm text-slate-400">Loading 3D visualization...</p>
      </div>
    </div>
  );
}

// Lazy load Globe3D component (NO SSR for Three.js)
export const Globe3DLazy = dynamic(() => import('./Globe3D').then(mod => ({ default: mod.Globe3D })), {
  ssr: false,
  loading: () => <Scene3DLoader />,
});

// Lazy load Network Visualization (NO SSR for Three.js)
export const NetworkVisualizationLazy = dynamic(() => import('./NetworkVisualization').then(mod => ({ default: mod.NetworkVisualization })), {
  ssr: false,
  loading: () => <Scene3DLoader />,
});

// Particle Field component not yet created - placeholder export
export const ParticleFieldLazy = Globe3DLazy; // Use Globe3D as fallback until ParticleField is implemented

// Wrapper component with error boundary
export function Scene3DWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback || <Scene3DLoader />}>
      {children}
    </Suspense>
  );
}
