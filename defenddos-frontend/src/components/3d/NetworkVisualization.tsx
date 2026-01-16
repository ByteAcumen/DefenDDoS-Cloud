'use client';
// @ts-nocheck - Three.js types will be resolved after full installation

import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NetworkNode {
  id: string;
  position: [number, number, number];
  status: 'healthy' | 'warning' | 'danger';
}

interface NetworkConnection {
  from: string;
  to: string;
  flow: number;
}

interface NetworkVisualizationProps {
  nodes?: NetworkNode[];
  connections?: NetworkConnection[];
}

function NetworkGraph({ nodes = [], connections = [] }: NetworkVisualizationProps) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.Line[]>([]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }

    // Animate connection lines
    linesRef.current.forEach((line, index) => {
      if (line.material instanceof THREE.LineBasicMaterial) {
        const time = state.clock.getElapsedTime();
        line.material.opacity = 0.3 + Math.sin(time * 2 + index) * 0.2;
      }
    });
  });

  // Default nodes if none provided
  const defaultNodes: NetworkNode[] = [
    { id: 'center', position: [0, 0, 0], status: 'healthy' },
    { id: 'node1', position: [3, 1, 0], status: 'healthy' },
    { id: 'node2', position: [-3, -1, 0], status: 'warning' },
    { id: 'node3', position: [0, 3, 2], status: 'healthy' },
    { id: 'node4', position: [2, -2, -1], status: 'danger' },
    { id: 'node5', position: [-2, 2, 1], status: 'healthy' },
  ];

  const activeNodes = nodes.length > 0 ? nodes : defaultNodes;

  const getColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'danger': return '#ef4444';
      default: return '#0ea5e9';
    }
  };

  return (
    <group ref={groupRef}>
      {/* Render nodes */}
      {activeNodes.map((node) => (
        <mesh key={node.id} position={node.position}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color={getColor(node.status)}
            emissive={getColor(node.status)}
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Render connections (example connections) */}
      {activeNodes.slice(1).map((node, index) => {
        const start = new THREE.Vector3(...activeNodes[0].position);
        const end = new THREE.Vector3(...node.position);
        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <line key={`line-${index}`} geometry={geometry}>
            <lineBasicMaterial
              color="#0ea5e9"
              transparent
              opacity={0.4}
              linewidth={2}
            />
          </line>
        );
      })}
    </group>
  );
}

export function NetworkVisualization({ nodes, connections }: NetworkVisualizationProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        className="w-full h-full"
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <NetworkGraph nodes={nodes} connections={connections} />
      </Canvas>
    </div>
  );
}
