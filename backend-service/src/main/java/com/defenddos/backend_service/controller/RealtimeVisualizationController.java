package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.service.RealtimeVisualizationService;
import com.defenddos.backend_service.service.RealtimeVisualizationService.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * WebSocket Controller for Real-Time Visualization
 * 
 * WebSocket Topics (auto-streaming via @Scheduled in service):
 * - /topic/metrics - Live traffic metrics (every 1s)
 * - /topic/attacks - Attack events (on-demand)
 * - /topic/map - Geographic attack data (on-demand)
 * - /topic/threats - Threat feed (every 5s)
 * - /topic/performance - Performance metrics (every 2s)
 * 
 * REST Endpoints:
 * - GET /api/realtime/history/{minutes} - Get historical metrics
 * - GET /api/realtime/heatmap - Get attack heatmap
 * - POST /api/realtime/attack - Manually trigger attack event
 */
@Controller
@Slf4j
public class RealtimeVisualizationController {

    @Autowired
    private RealtimeVisualizationService visualizationService;

    /**
     * WebSocket subscription handler - triggers when client subscribes
     * 
     * Subscribe: SUBSCRIBE /topic/metrics
     */
    @SubscribeMapping("/topic/metrics")
    public TrafficMetrics onMetricsSubscribe() {
        log.debug("Client subscribed to metrics");
        // Return initial metrics immediately
        return TrafficMetrics.builder()
            .timestamp(Instant.now())
            .requestsPerSecond(0)
            .bandwidthMbps(0.0)
            .activeConnections(0)
            .blockedRequests(0)
            .averageResponseTime(0)
            .errorRate(0.0)
            .build();
    }

    /**
     * Client can send messages to request specific data
     * 
     * Send: SEND /app/attack {"sourceIp": "192.168.1.1", ...}
     */
    @MessageMapping("/attack")
    @SendTo("/topic/attacks")
    public AttackEvent handleAttackEvent(AttackEvent event) {
        log.info("Received attack event from client: {}", event.getSourceIp());
        
        // Process and broadcast to all subscribers
        visualizationService.streamAttackEvent(event);
        
        return event;
    }

    /**
     * WebSocket session management
     * 
     * Send: SEND /app/register {"sessionId": "...", "userId": "..."}
     */
    @MessageMapping("/register")
    public void registerSession(Map<String, String> payload) {
        String sessionId = payload.get("sessionId");
        String userId = payload.get("userId");
        
        log.info("Registering WebSocket session: {} for user: {}", sessionId, userId);
        visualizationService.registerSession(sessionId, userId);
    }

    // REST API Endpoints

    /**
     * Get historical metrics for graph rendering
     * 
     * GET /api/realtime/history/30
     * 
     * Returns last 30 minutes of metrics
     */
    @GetMapping("/api/realtime/history/{minutes}")
    @ResponseBody
    public ResponseEntity<HistoricalMetricsResponse> getHistoricalMetrics(
            @PathVariable int minutes) {
        
        log.info("Fetching {} minutes of historical metrics", minutes);
        
        try {
            List<TrafficMetrics> metrics = visualizationService.getHistoricalMetrics(minutes);
            
            HistoricalMetricsResponse response = new HistoricalMetricsResponse(
                metrics,
                metrics.size(),
                minutes
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching historical metrics", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get attack heatmap data
     * 
     * GET /api/realtime/heatmap
     * 
     * Returns geographic distribution of attacks
     */
    @GetMapping("/api/realtime/heatmap")
    @ResponseBody
    public ResponseEntity<AttackHeatmap> getAttackHeatmap() {
        log.info("Fetching attack heatmap");
        
        try {
            AttackHeatmap heatmap = visualizationService.getAttackHeatmap();
            return ResponseEntity.ok(heatmap);
            
        } catch (Exception e) {
            log.error("Error fetching attack heatmap", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Manually trigger attack event for testing
     * 
     * POST /api/realtime/attack
     * 
     * Body:
     * {
     *   "sourceIp": "192.168.1.100",
     *   "attackType": "DDoS",
     *   "severity": "HIGH",
     *   "country": "US",
     *   "city": "New York",
     *   "latitude": 40.7128,
     *   "longitude": -74.0060
     * }
     */
    @PostMapping("/api/realtime/attack")
    @ResponseBody
    public ResponseEntity<AttackResponse> triggerAttackEvent(
            @RequestBody AttackEventRequest request) {
        
        log.info("Triggering attack event: {} from {}", 
            request.getAttackType(), request.getSourceIp());
        
        try {
            AttackEvent event = AttackEvent.builder()
                .attackId(UUID.randomUUID().toString())
                .sourceIp(request.getSourceIp())
                .attackType(request.getAttackType())
                .severity(request.getSeverity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .country(request.getCountry())
                .city(request.getCity())
                .timestamp(Instant.now())
                .details(request.getDetails())
                .build();

            visualizationService.streamAttackEvent(event);
            
            AttackResponse response = new AttackResponse(
                true,
                "Attack event broadcasted",
                event.getAttackId()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error triggering attack event", e);
            AttackResponse response = new AttackResponse(
                false,
                "Failed to broadcast: " + e.getMessage(),
                null
            );
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Health check for WebSocket service
     * 
     * GET /api/realtime/health
     */
    @GetMapping("/api/realtime/health")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "realtime-visualization",
            "timestamp", Instant.now()
        ));
    }

    // DTOs
    @lombok.Data
    private static class AttackEventRequest {
        private String sourceIp;
        private String attackType;
        private String severity;
        private double latitude;
        private double longitude;
        private String country;
        private String city;
        private Map<String, Object> details;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class AttackResponse {
        private boolean success;
        private String message;
        private String attackId;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class HistoricalMetricsResponse {
        private List<TrafficMetrics> metrics;
        private int count;
        private int minutes;
    }
}
