# Frontend Enhancement Implementation Guide

**Version:** 1.0  
**Last Updated:** January 2025  
**For:** Development Team  

---

## 📋 Table of Contents

1. [WebSocket Integration](#1-websocket-integration)
2. [Alert System Implementation](#2-alert-system-implementation)
3. [Mobile Responsive Design](#3-mobile-responsive-design)
4. [Performance Optimization](#4-performance-optimization)
5. [Accessibility Implementation](#5-accessibility-implementation)
6. [Testing Strategy](#6-testing-strategy)

---

## 1. WebSocket Integration

### 1.1 Backend Setup (Spring Boot)

**Step 1:** Add WebSocket dependencies to `pom.xml`
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

**Step 2:** Create WebSocket configuration
```java
// backend-service/src/main/java/com/defenddos/config/WebSocketConfig.java
package com.defenddos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker to send messages to clients
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix for messages FROM client
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback for browsers without WebSocket support
    }
}
```

**Step 3:** Create WebSocket message service
```java
// backend-service/src/main/java/com/defenddos/service/WebSocketNotificationService.java
package com.defenddos.service;

import com.defenddos.dto.ThreatAlert;
import com.defenddos.dto.TrafficUpdate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send traffic update to all connected clients
     */
    public void sendTrafficUpdate(TrafficUpdate update) {
        log.debug("Broadcasting traffic update: {}", update);
        messagingTemplate.convertAndSend("/topic/traffic", update);
    }

    /**
     * Send threat alert to all connected clients
     */
    public void sendThreatAlert(ThreatAlert alert) {
        log.info("Broadcasting threat alert: {}", alert);
        messagingTemplate.convertAndSend("/topic/threats", alert);
    }

    /**
     * Send IP block notification
     */
    public void sendIPBlockedNotification(String ipAddress, String reason) {
        log.info("Broadcasting IP block notification: {}", ipAddress);
        var notification = Map.of(
            "type", "IP_BLOCKED",
            "ipAddress", ipAddress,
            "reason", reason,
            "timestamp", Instant.now()
        );
        messagingTemplate.convertAndSend("/topic/ip-blocks", notification);
    }

    /**
     * Send ML prediction result
     */
    public void sendMLPrediction(MLPredictionResult result) {
        messagingTemplate.convertAndSend("/topic/ml-predictions", result);
    }
}
```

**Step 4:** Integrate with existing services
```java
// In TrafficController.java or DetectionService.java
@Autowired
private WebSocketNotificationService wsNotificationService;

// After processing traffic
wsNotificationService.sendTrafficUpdate(new TrafficUpdate(
    timestamp,
    packetsPerSecond,
    bytesPerSecond,
    activeThreats
));

// After detecting threat
if (detectionResult.isThreat()) {
    wsNotificationService.sendThreatAlert(new ThreatAlert(
        detectionResult.getThreatLevel(),
        detectionResult.getSourceIp(),
        detectionResult.getAttackType(),
        detectionResult.getConfidence()
    ));
}
```

### 1.2 Frontend Setup (Next.js)

**Step 1:** Install dependencies
```bash
cd defenddos-frontend
pnpm add socket.io-client
```

**Step 2:** Create WebSocket client
```typescript
// src/lib/websocket/client.ts
import { io, Socket } from 'socket.io-client';

export interface TrafficUpdate {
  timestamp: string;
  packetsPerSecond: number;
  bytesPerSecond: number;
  activeThreats: number;
}

export interface ThreatAlert {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceIp: string;
  attackType: string;
  confidence: number;
  timestamp: string;
}

export interface IPBlockedNotification {
  type: 'IP_BLOCKED';
  ipAddress: string;
  reason: string;
  timestamp: string;
}

class DefenDDoSWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    if (typeof window === 'undefined') return; // SSR safety
    this.connect();
  }

  private connect() {
    const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
    
    this.socket = io(wsUrl, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Falling back to polling.');
      }
    });
  }

  // Subscribe to traffic updates
  onTrafficUpdate(callback: (data: TrafficUpdate) => void) {
    this.socket?.on('/topic/traffic', callback);
    return () => this.socket?.off('/topic/traffic', callback);
  }

  // Subscribe to threat alerts
  onThreatAlert(callback: (alert: ThreatAlert) => void) {
    this.socket?.on('/topic/threats', callback);
    return () => this.socket?.off('/topic/threats', callback);
  }

  // Subscribe to IP block notifications
  onIPBlocked(callback: (notification: IPBlockedNotification) => void) {
    this.socket?.on('/topic/ip-blocks', callback);
    return () => this.socket?.off('/topic/ip-blocks', callback);
  }

  // Disconnect
  disconnect() {
    this.socket?.disconnect();
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
let wsClient: DefenDDoSWebSocketClient | null = null;

export function getWebSocketClient(): DefenDDoSWebSocketClient {
  if (!wsClient) {
    wsClient = new DefenDDoSWebSocketClient();
  }
  return wsClient;
}
```

**Step 3:** Create React Hook
```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useState, useCallback } from 'react';
import { getWebSocketClient, TrafficUpdate, ThreatAlert, IPBlockedNotification } from '@/lib/websocket/client';
import { toast } from 'react-hot-toast';

export function useTrafficUpdates() {
  const [latestUpdate, setLatestUpdate] = useState<TrafficUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsClient = getWebSocketClient();
    setIsConnected(wsClient.isConnected());

    const unsubscribe = wsClient.onTrafficUpdate((update) => {
      setLatestUpdate(update);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { latestUpdate, isConnected };
}

export function useThreatAlerts() {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);

  useEffect(() => {
    const wsClient = getWebSocketClient();

    const unsubscribe = wsClient.onThreatAlert((alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts

      // Show toast notification
      const message = `${alert.severity} threat from ${alert.sourceIp}`;
      if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
        toast.error(message, { duration: 5000 });
      } else {
        toast.warning(message, { duration: 3000 });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, clearAlerts };
}

export function useIPBlockNotifications() {
  useEffect(() => {
    const wsClient = getWebSocketClient();

    const unsubscribe = wsClient.onIPBlocked((notification) => {
      toast.success(`IP ${notification.ipAddress} blocked: ${notification.reason}`);
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
```

**Step 4:** Use in Dashboard
```typescript
// src/app/dashboard/page.tsx
import { useTrafficUpdates, useThreatAlerts, useIPBlockNotifications } from '@/hooks/useWebSocket';

export default function DashboardPage() {
  const { latestUpdate, isConnected } = useTrafficUpdates();
  const { alerts, clearAlerts } = useThreatAlerts();
  useIPBlockNotifications(); // Just for toast notifications

  return (
    <div>
      {/* Connection indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm">
          {isConnected ? 'Live Updates Active' : 'Reconnecting...'}
        </span>
      </div>

      {/* Real-time metrics */}
      {latestUpdate && (
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Packets/sec"
            value={latestUpdate.packetsPerSecond}
            realTime={true}
          />
          <MetricCard
            title="Bytes/sec"
            value={latestUpdate.bytesPerSecond}
            realTime={true}
          />
          <MetricCard
            title="Active Threats"
            value={latestUpdate.activeThreats}
            realTime={true}
          />
        </div>
      )}

      {/* Recent alerts */}
      <div>
        <h3>Recent Threats ({alerts.length})</h3>
        <button onClick={clearAlerts}>Clear All</button>
        {alerts.map((alert, index) => (
          <AlertCard key={index} alert={alert} />
        ))}
      </div>
    </div>
  );
}
```

---

## 2. Alert System Implementation

### 2.1 Alert Rules Engine (Frontend)

**Step 1:** Create alert rule types
```typescript
// src/types/alerts.ts
export type MetricType = 
  | 'packets_per_sec' 
  | 'bytes_per_sec' 
  | 'active_threats' 
  | 'blocked_ips_count'
  | 'ml_confidence'
  | 'threat_level';

export type Operator = '>' | '<' | '>=' | '<=' | '==' | '!=';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type NotificationChannel = 'email' | 'slack' | 'webhook' | 'sms' | 'browser';

export interface AlertCondition {
  metric: MetricType;
  operator: Operator;
  value: number | string;
}

export interface AlertAction {
  type: NotificationChannel;
  config: {
    // Email config
    recipients?: string[];
    subject?: string;
    
    // Slack config
    webhookUrl?: string;
    channel?: string;
    
    // Webhook config
    url?: string;
    method?: 'POST' | 'GET';
    headers?: Record<string, string>;
    
    // SMS config
    phoneNumbers?: string[];
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  conditionLogic: 'AND' | 'OR'; // How to combine conditions
  severity: SeverityLevel;
  actions: AlertAction[];
  cooldownMinutes: number; // Prevent alert spam
  createdAt: string;
  updatedAt: string;
}

export interface TriggeredAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: SeverityLevel;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}
```

**Step 2:** Create alert rules manager
```typescript
// src/lib/alerts/alert-engine.ts
import { AlertRule, AlertCondition, TriggeredAlert } from '@/types/alerts';

export class AlertEngine {
  private rules: Map<string, AlertRule> = new Map();
  private lastTriggered: Map<string, Date> = new Map();

  constructor(rules: AlertRule[] = []) {
    rules.forEach(rule => this.rules.set(rule.id, rule));
  }

  /**
   * Evaluate all rules against current metrics
   */
  evaluateRules(metrics: Record<string, number | string>): TriggeredAlert[] {
    const triggeredAlerts: TriggeredAlert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      const lastTrigger = this.lastTriggered.get(rule.id);
      if (lastTrigger) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastTrigger.getTime() < cooldownMs) {
          continue; // Still in cooldown
        }
      }

      // Evaluate conditions
      const conditionResults = rule.conditions.map(condition => 
        this.evaluateCondition(condition, metrics)
      );

      // Apply logic (AND/OR)
      const shouldTrigger = rule.conditionLogic === 'AND'
        ? conditionResults.every(result => result)
        : conditionResults.some(result => result);

      if (shouldTrigger) {
        const alert: TriggeredAlert = {
          id: `alert-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: this.generateAlertMessage(rule, metrics),
          triggeredAt: new Date().toISOString(),
          acknowledged: false,
        };

        triggeredAlerts.push(alert);
        this.lastTriggered.set(rule.id, new Date());
      }
    }

    return triggeredAlerts;
  }

  private evaluateCondition(condition: AlertCondition, metrics: Record<string, number | string>): boolean {
    const actualValue = metrics[condition.metric];
    const expectedValue = condition.value;

    if (actualValue === undefined) return false;

    switch (condition.operator) {
      case '>':
        return Number(actualValue) > Number(expectedValue);
      case '<':
        return Number(actualValue) < Number(expectedValue);
      case '>=':
        return Number(actualValue) >= Number(expectedValue);
      case '<=':
        return Number(actualValue) <= Number(expectedValue);
      case '==':
        return actualValue == expectedValue;
      case '!=':
        return actualValue != expectedValue;
      default:
        return false;
    }
  }

  private generateAlertMessage(rule: AlertRule, metrics: Record<string, number | string>): string {
    const conditionStrings = rule.conditions.map(c => 
      `${c.metric} ${c.operator} ${c.value} (current: ${metrics[c.metric]})`
    );
    
    return `Alert: ${rule.name} - ${conditionStrings.join(` ${rule.conditionLogic} `)}`;
  }

  addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string) {
    this.rules.delete(ruleId);
    this.lastTriggered.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates, updatedAt: new Date().toISOString() });
    }
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }
}
```

**Step 3:** Create Alert Rules UI
```typescript
// src/app/alerts/page.tsx
'use client';

import { useState } from 'react';
import { AlertRule, AlertCondition, AlertAction } from '@/types/alerts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert Rules</h1>
          <p className="text-muted-foreground">
            Configure automated alerts for threat detection
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Alert Rule
        </Button>
      </div>

      {/* Alert Rules List */}
      <div className="grid gap-4">
        {rules.map(rule => (
          <AlertRuleCard
            key={rule.id}
            rule={rule}
            onToggle={() => {/* Toggle enabled */}}
            onEdit={() => {/* Edit rule */}}
            onDelete={() => {/* Delete rule */}}
          />
        ))}
      </div>

      {/* Create/Edit Modal */}
      {isCreating && (
        <AlertRuleBuilder
          onSave={(rule) => {
            setRules(prev => [...prev, rule]);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}

function AlertRuleCard({ rule, onToggle, onEdit, onDelete }: any) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{rule.name}</h3>
            <Badge variant={rule.severity.toLowerCase()}>
              {rule.severity}
            </Badge>
            {rule.enabled ? (
              <ToggleRight className="w-5 h-5 text-green-500" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {rule.description}
          </p>
          
          {/* Conditions */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Conditions ({rule.conditionLogic}):</p>
            {rule.conditions.map((condition, index) => (
              <div key={index} className="text-sm">
                <code className="bg-secondary px-2 py-1 rounded">
                  {condition.metric} {condition.operator} {condition.value}
                </code>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground">Notifications:</p>
            <div className="flex gap-2 mt-2">
              {rule.actions.map((action, index) => (
                <Badge key={index} variant="outline">
                  {action.type}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {rule.enabled ? <ToggleRight /> : <ToggleLeft />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

---

## 3. Mobile Responsive Design

### 3.1 Responsive Breakpoints

**Update Tailwind Config:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    screens: {
      'xs': '320px',   // Small phones
      'sm': '640px',   // Large phones
      'md': '768px',   // Tablets
      'lg': '1024px',  // Small laptops
      'xl': '1280px',  // Desktops
      '2xl': '1536px', // Large screens
    },
    extend: {
      // Mobile-specific utilities
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
};

export default config;
```

### 3.2 Mobile Navigation

```typescript
// src/components/layout/MobileNav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Activity, Shield, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/traffic', label: 'Traffic', icon: Activity },
  { href: '/threat-detection', label: 'Threats', icon: Shield },
  { href: '/system', label: 'System', icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-card rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-64 bg-card z-40 shadow-2xl p-6"
            >
              <nav className="mt-16 space-y-4">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar (Alternative) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 safe-bottom">
        <nav className="flex justify-around items-center h-16">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[44px]',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('w-6 h-6', isActive && 'scale-110')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
```

### 3.3 Responsive Cards

```typescript
// src/components/dashboard/ResponsiveMetricCard.tsx
export function ResponsiveMetricCard({ title, value, icon, change }: any) {
  return (
    <Card className="p-4 sm:p-6">
      {/* Mobile: Horizontal layout */}
      <div className="flex sm:flex-col items-center sm:items-start gap-4">
        {/* Icon */}
        <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 sm:w-full">
          <p className="text-sm sm:text-base text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">
            {value.toLocaleString()}
          </p>
          
          {/* Change indicator - hide on very small screens */}
          {change && (
            <p className="hidden xs:block text-xs sm:text-sm text-green-500 mt-1">
              +{change.value}% {change.timeframe}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### 3.4 Touch Optimizations

```typescript
// src/hooks/useSwipeGesture.ts
import { useEffect, useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGesture(handlers: SwipeHandlers) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const MIN_SWIPE_DISTANCE = 50;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
          if (deltaX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > MIN_SWIPE_DISTANCE) {
          if (deltaY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers]);
}

// Usage in component
export function SwipeableCard() {
  useSwipeGesture({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
  });

  return <div>Swipe me!</div>;
}
```

---

## 4. Performance Optimization

### 4.1 Code Splitting

```typescript
// src/app/analytics/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy chart components
const ThreatGlobe = dynamic(
  () => import('@/components/charts/ThreatGlobe'),
  {
    loading: () => <ChartSkeleton height={400} />,
    ssr: false, // Disable SSR for 3D components
  }
);

const AdvancedHeatmap = dynamic(
  () => import('@/components/charts/AdvancedHeatmap'),
  {
    loading: () => <ChartSkeleton height={300} />,
  }
);

export default function AnalyticsPage() {
  return (
    <div>
      <ThreatGlobe />
      <AdvancedHeatmap />
    </div>
  );
}
```

### 4.2 React.memo Optimization

```typescript
// src/components/charts/MetricCard.tsx
import React, { memo } from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}

// Prevent re-render if props haven't changed
export const MetricCard = memo(function MetricCard({
  title,
  value,
  icon,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return <MetricCardSkeleton />;
  }

  return (
    <div className="metric-card">
      {icon}
      <h3>{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.value === nextProps.value &&
    prevProps.loading === nextProps.loading
  );
});
```

### 4.3 Virtual Scrolling Implementation

```typescript
// src/components/lists/VirtualizedIPList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualizedIPListProps {
  ips: string[];
  onUnblock: (ip: string) => void;
}

export function VirtualizedIPList({ ips, onUnblock }: VirtualizedIPListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: ips.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Each row is 60px
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto border rounded-lg"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const ip = ips[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <IPRow ip={ip} onUnblock={() => onUnblock(ip)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IPRow({ ip, onUnblock }: { ip: string; onUnblock: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 border-b hover:bg-secondary">
      <span className="font-mono">{ip}</span>
      <button
        onClick={onUnblock}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Unblock
      </button>
    </div>
  );
}
```

---

## 5. Accessibility Implementation

### 5.1 Keyboard Navigation

```typescript
// src/components/ui/AccessibleButton.tsx
import { forwardRef, KeyboardEvent } from 'react';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  ariaLabel?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  function AccessibleButton({ children, ariaLabel, onClick, ...props }, ref) {
    
    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      // Enter or Space activates button
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(e as any);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

### 5.2 ARIA Live Regions

```typescript
// src/components/dashboard/LiveAlertRegion.tsx
export function LiveAlertRegion({ alerts }: { alerts: ThreatAlert[] }) {
  const latestAlert = alerts[0];

  return (
    <>
      {/* Visual alert display */}
      <div className="space-y-2">
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      {/* Screen reader announcement (hidden visually) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {latestAlert && (
          `New ${latestAlert.severity} threat detected from ${latestAlert.sourceIp}`
        )}
      </div>
    </>
  );
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
// src/components/ui/Badge.test.tsx
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100');

    rerender(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100');
  });

  it('accepts custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });
});
```

### 6.2 Integration Tests

```typescript
// cypress/e2e/dashboard.cy.ts
describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
  });

  it('loads dashboard with metrics', () => {
    cy.get('[data-testid="metric-packets"]').should('be.visible');
    cy.get('[data-testid="metric-threats"]').should('be.visible');
    cy.get('[data-testid="metric-blocked-ips"]').should('be.visible');
  });

  it('displays real-time traffic chart', () => {
    cy.get('[data-testid="traffic-chart"]').should('be.visible');
  });

  it('triggers manual scan', () => {
    cy.get('button').contains('Scan Now').click();
    cy.contains('Detection scan triggered').should('be.visible');
  });

  it('changes time range', () => {
    cy.get('select[aria-label="Time range"]').select('Last 6 hours');
    cy.wait(1000); // Wait for data to load
    cy.get('[data-testid="traffic-chart"]').should('be.visible');
  });
});
```

---

## ✅ Implementation Checklist

### Phase 1 (Weeks 1-2)
- [ ] WebSocket backend configuration
- [ ] WebSocket frontend client
- [ ] Real-time dashboard updates
- [ ] Mobile responsive layout
- [ ] Code splitting for routes
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] User documentation

### Phase 2 (Weeks 3-4)
- [ ] Alert rules engine
- [ ] Alert notifications (email, Slack)
- [ ] ML model dashboard
- [ ] Dark mode enhancements
- [ ] Virtual scrolling
- [ ] Developer documentation
- [ ] API documentation improvements

### Phase 3 (Weeks 5-6)
- [ ] PWA configuration
- [ ] Authentication system
- [ ] Advanced visualizations
- [ ] Unit tests (80% coverage)
- [ ] E2E tests
- [ ] Performance testing

### Phase 4 (Weeks 7-8)
- [ ] Customizable dashboard
- [ ] Internationalization
- [ ] Visual regression tests
- [ ] CI/CD pipeline
- [ ] Video tutorials
- [ ] Production deployment

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Development Team  
