package com.defenddos.backend_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Real-Time WebSocket Visualization Service
 * 
 * Provides live streaming data for interactive dashboards and attack visualization.
 * Uses WebSocket/STOMP protocol for bi-directional real-time communication.
 * 
 * Features:
 * 1. Live traffic metrics streaming (every 1 second)
 * 2. Attack map visualization (geographic attack origins)
 * 3. Real-time threat feed
 * 4. Live performance graphs
 * 5. Connection pool management (auto-cleanup)
 * 
 * WebSocket Topics:
 * - /topic/metrics - Traffic metrics (QPS, bandwidth, connections)
 * - /topic/attacks - Attack events and severity
 * - /topic/map - Geographic attack visualization data
 * - /topic/threats - Real-time threat intelligence feed
 * - /topic/performance - System performance metrics
 */
@Service
@Slf4j
public class RealtimeVisualizationService {

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    private final ObjectMapper objectMapper;
    private final Map<String, LiveSession> activeSessions;
    private final MetricsBuffer metricsBuffer;
    private final ThreatFeed threatFeed;

    public RealtimeVisualizationService() {
        this.objectMapper = new ObjectMapper();
        this.activeSessions = new ConcurrentHashMap<>();
        this.metricsBuffer = new MetricsBuffer();
        this.threatFeed = new ThreatFeed();
    }

    /**
     * Stream live traffic metrics every second
     */
    @Scheduled(fixedRate = 1000) // Every 1 second
    public void streamTrafficMetrics() {
        if (messagingTemplate == null || activeSessions.isEmpty()) {
            return;
        }

        try {
            TrafficMetrics metrics = collectTrafficMetrics();
            metricsBuffer.add(metrics);

            // Broadcast to all connected clients
            messagingTemplate.convertAndSend("/topic/metrics", metrics);

            log.trace("Streamed metrics: QPS={}, Bandwidth={}MB/s", 
                metrics.getRequestsPerSecond(), 
                metrics.getBandwidthMbps());

        } catch (Exception e) {
            log.error("Error streaming traffic metrics", e);
        }
    }

    /**
     * Stream attack events in real-time
     */
    public void streamAttackEvent(AttackEvent event) {
        if (messagingTemplate == null) {
            log.warn("WebSocket messaging not configured");
            return;
        }

        try {
            // Add to threat feed
            threatFeed.add(event);

            // Broadcast attack event
            messagingTemplate.convertAndSend("/topic/attacks", event);

            // Also send to map visualization
            AttackMapPoint mapPoint = convertToMapPoint(event);
            messagingTemplate.convertAndSend("/topic/map", mapPoint);

            log.info("Streamed attack event: {} from {}", 
                event.getAttackType(), event.getSourceIp());

        } catch (Exception e) {
            log.error("Error streaming attack event", e);
        }
    }

    /**
     * Stream threat intelligence updates
     */
    @Scheduled(fixedRate = 5000) // Every 5 seconds
    public void streamThreatFeed() {
        if (messagingTemplate == null || activeSessions.isEmpty()) {
            return;
        }

        try {
            List<ThreatIntelligence> recentThreats = threatFeed.getRecent(10);
            
            ThreatUpdate update = ThreatUpdate.builder()
                .timestamp(Instant.now())
                .threats(recentThreats)
                .totalThreats(threatFeed.getTotalCount())
                .criticalThreats(threatFeed.getCriticalCount())
                .build();

            messagingTemplate.convertAndSend("/topic/threats", update);

        } catch (Exception e) {
            log.error("Error streaming threat feed", e);
        }
    }

    /**
     * Stream system performance metrics
     */
    @Scheduled(fixedRate = 2000) // Every 2 seconds
    public void streamPerformanceMetrics() {
        if (messagingTemplate == null || activeSessions.isEmpty()) {
            return;
        }

        try {
            PerformanceMetrics performance = collectPerformanceMetrics();
            messagingTemplate.convertAndSend("/topic/performance", performance);

        } catch (Exception e) {
            log.error("Error streaming performance metrics", e);
        }
    }

    /**
     * Get historical metrics for graph rendering
     */
    public List<TrafficMetrics> getHistoricalMetrics(int minutes) {
        return metricsBuffer.getLastN(minutes * 60); // Convert to seconds
    }

    /**
     * Get attack heatmap data
     */
    public AttackHeatmap getAttackHeatmap() {
        Map<String, Integer> countryAttacks = threatFeed.getAttacksByCountry();
        Map<String, Integer> cityAttacks = threatFeed.getAttacksByCity();

        return AttackHeatmap.builder()
            .countries(countryAttacks)
            .cities(cityAttacks)
            .totalAttacks(threatFeed.getTotalCount())
            .timestamp(Instant.now())
            .build();
    }

    /**
     * Register new WebSocket session
     */
    public void registerSession(String sessionId, String userId) {
        LiveSession session = LiveSession.builder()
            .sessionId(sessionId)
            .userId(userId)
            .connectedAt(Instant.now())
            .lastActivity(Instant.now())
            .build();

        activeSessions.put(sessionId, session);
        log.info("WebSocket session registered: {}", sessionId);
    }

    /**
     * Unregister WebSocket session
     */
    public void unregisterSession(String sessionId) {
        activeSessions.remove(sessionId);
        log.info("WebSocket session unregistered: {}", sessionId);
    }

    /**
     * Update session activity timestamp
     */
    public void updateSessionActivity(String sessionId) {
        LiveSession session = activeSessions.get(sessionId);
        if (session != null) {
            session.setLastActivity(Instant.now());
        }
    }

    /**
     * Clean up inactive sessions (older than 5 minutes)
     */
    @Scheduled(fixedRate = 60000) // Every minute
    public void cleanupInactiveSessions() {
        Instant threshold = Instant.now().minusSeconds(300); // 5 minutes

        List<String> inactiveSessions = activeSessions.entrySet().stream()
            .filter(entry -> entry.getValue().getLastActivity().isBefore(threshold))
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());

        inactiveSessions.forEach(this::unregisterSession);

        if (!inactiveSessions.isEmpty()) {
            log.info("Cleaned up {} inactive WebSocket sessions", inactiveSessions.size());
        }
    }

    // Data collection methods
    private TrafficMetrics collectTrafficMetrics() {
        // In production, these would come from actual metrics collectors
        Random random = new Random();
        
        return TrafficMetrics.builder()
            .timestamp(Instant.now())
            .requestsPerSecond(random.nextInt(1000) + 500)
            .bandwidthMbps(random.nextDouble() * 100)
            .activeConnections(random.nextInt(5000) + 1000)
            .blockedRequests(random.nextInt(100))
            .averageResponseTime(random.nextInt(200) + 50)
            .errorRate(random.nextDouble() * 0.05)
            .build();
    }

    private PerformanceMetrics collectPerformanceMetrics() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;

        return PerformanceMetrics.builder()
            .timestamp(Instant.now())
            .cpuUsage(getCpuUsage())
            .memoryUsed(usedMemory / (1024 * 1024)) // Convert to MB
            .memoryTotal(totalMemory / (1024 * 1024))
            .diskUsage(getDiskUsage())
            .networkThroughput(getNetworkThroughput())
            .activeThreads(Thread.activeCount())
            .build();
    }

    private double getCpuUsage() {
        // Placeholder - would use JMX or OS metrics in production
        return new Random().nextDouble() * 100;
    }

    private double getDiskUsage() {
        // Placeholder - would use JMX or OS metrics in production
        return new Random().nextDouble() * 100;
    }

    private double getNetworkThroughput() {
        // Placeholder - would use JMX or OS metrics in production
        return new Random().nextDouble() * 1000;
    }

    private AttackMapPoint convertToMapPoint(AttackEvent event) {
        return AttackMapPoint.builder()
            .latitude(event.getLatitude())
            .longitude(event.getLongitude())
            .sourceIp(event.getSourceIp())
            .country(event.getCountry())
            .city(event.getCity())
            .attackType(event.getAttackType())
            .severity(event.getSeverity())
            .timestamp(event.getTimestamp())
            .build();
    }

    // Inner classes
    @lombok.Data
    @lombok.Builder
    public static class TrafficMetrics {
        private Instant timestamp;
        private int requestsPerSecond;
        private double bandwidthMbps;
        private int activeConnections;
        private int blockedRequests;
        private int averageResponseTime;
        private double errorRate;
    }

    @lombok.Data
    @lombok.Builder
    public static class AttackEvent {
        private String attackId;
        private String sourceIp;
        private String attackType;
        private String severity;
        private double latitude;
        private double longitude;
        private String country;
        private String city;
        private Instant timestamp;
        private Map<String, Object> details;
    }

    @lombok.Data
    @lombok.Builder
    public static class AttackMapPoint {
        private double latitude;
        private double longitude;
        private String sourceIp;
        private String country;
        private String city;
        private String attackType;
        private String severity;
        private Instant timestamp;
    }

    @lombok.Data
    @lombok.Builder
    public static class ThreatIntelligence {
        private String threatId;
        private String threatType;
        private String severity;
        private String description;
        private Instant timestamp;
        private Map<String, Object> indicators;
    }

    @lombok.Data
    @lombok.Builder
    public static class ThreatUpdate {
        private Instant timestamp;
        private List<ThreatIntelligence> threats;
        private int totalThreats;
        private int criticalThreats;
    }

    @lombok.Data
    @lombok.Builder
    public static class PerformanceMetrics {
        private Instant timestamp;
        private double cpuUsage;
        private long memoryUsed;
        private long memoryTotal;
        private double diskUsage;
        private double networkThroughput;
        private int activeThreads;
    }

    @lombok.Data
    @lombok.Builder
    public static class AttackHeatmap {
        private Map<String, Integer> countries;
        private Map<String, Integer> cities;
        private int totalAttacks;
        private Instant timestamp;
    }

    @lombok.Data
    @lombok.Builder
    private static class LiveSession {
        private String sessionId;
        private String userId;
        private Instant connectedAt;
        private Instant lastActivity;
    }

    // Helper classes
    private static class MetricsBuffer {
        private final LinkedList<TrafficMetrics> buffer = new LinkedList<>();
        private static final int MAX_SIZE = 3600; // 1 hour at 1 second intervals

        public synchronized void add(TrafficMetrics metrics) {
            buffer.addLast(metrics);
            if (buffer.size() > MAX_SIZE) {
                buffer.removeFirst();
            }
        }

        public synchronized List<TrafficMetrics> getLastN(int n) {
            int size = buffer.size();
            int start = Math.max(0, size - n);
            return new ArrayList<>(buffer.subList(start, size));
        }
    }

    private static class ThreatFeed {
        private final LinkedList<AttackEvent> events = new LinkedList<>();
        private static final int MAX_SIZE = 1000;
        private final Map<String, Integer> countryCount = new ConcurrentHashMap<>();
        private final Map<String, Integer> cityCount = new ConcurrentHashMap<>();

        public synchronized void add(AttackEvent event) {
            events.addFirst(event);
            if (events.size() > MAX_SIZE) {
                events.removeLast();
            }

            // Update geographic counters
            countryCount.merge(event.getCountry(), 1, Integer::sum);
            cityCount.merge(event.getCity(), 1, Integer::sum);
        }

        public synchronized List<ThreatIntelligence> getRecent(int count) {
            return events.stream()
                .limit(count)
                .map(this::convertToThreatIntel)
                .collect(Collectors.toList());
        }

        public int getTotalCount() {
            return events.size();
        }

        public int getCriticalCount() {
            return (int) events.stream()
                .filter(e -> "CRITICAL".equals(e.getSeverity()))
                .count();
        }

        public Map<String, Integer> getAttacksByCountry() {
            return new HashMap<>(countryCount);
        }

        public Map<String, Integer> getAttacksByCity() {
            return new HashMap<>(cityCount);
        }

        private ThreatIntelligence convertToThreatIntel(AttackEvent event) {
            return ThreatIntelligence.builder()
                .threatId(event.getAttackId())
                .threatType(event.getAttackType())
                .severity(event.getSeverity())
                .description("Attack from " + event.getSourceIp() + " (" + event.getCountry() + ")")
                .timestamp(event.getTimestamp())
                .indicators(Map.of(
                    "source_ip", event.getSourceIp(),
                    "country", event.getCountry(),
                    "city", event.getCity()
                ))
                .build();
        }
    }
}
