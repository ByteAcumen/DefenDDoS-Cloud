package com.defenddos.backend_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Real-time metrics response for live DDoS monitoring
 * Optimized for frequent updates and dashboard display
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealTimeMetricsResponse {
    
    // === CURRENT TRAFFIC METRICS ===
    private Long currentPacketsPerSecond;
    private Long currentBytesPerSecond;
    private Long currentConnectionsPerSecond;
    private Double currentAveragePacketSize;
    
    // === BASELINE COMPARISON ===
    private Long baselinePacketsPerSecond;
    private Long baselineBytesPerSecond;
    private Double trafficIncreasePercentage; // % increase from baseline
    private Boolean isAnomalous; // True if traffic is significantly above baseline
    
    // === ACTIVE THREATS ===
    private Integer activeThreats;
    private Integer activeBlockedIps;
    private String currentThreatLevel; // SAFE, LOW, MEDIUM, HIGH, CRITICAL
    private List<ActiveThreatInfo> recentThreats; // Last 10 detected threats
    
    // === ML DETECTION STATUS ===
    private Boolean mlServiceActive;
    private Double lastMLConfidence;
    private String lastMLPrediction; // BENIGN or ATTACK
    private String lastMLAttackType;
    private Integer mlPredictionsInLastMinute;
    
    // === SYSTEM STATUS ===
    private String systemStatus; // OPERATIONAL, DEGRADED, CRITICAL
    private Double cpuUsage; // if available
    private Double memoryUsage; // if available
    private Long uptimeSeconds;
    
    // === RECENT ACTIVITY ===
    private List<String> recentBlockedIps;
    private List<String> recentAttackTypes;
    private Long totalRequestsInLastMinute;
    private Long blockedRequestsInLastMinute;
    
    // === ATTACK DETECTION STATS (last 5 minutes) ===
    private Integer attacksDetectedLastMinute;
    private Integer attacksDetectedLast5Minutes;
    private Double attackDetectionRate; // attacks per minute
    
    // === METADATA ===
    private String timestamp;
    private Long dataPointsAnalyzed;
    private String monitoringWindow; // e.g., "last 1 minute"
    
    // === NESTED CLASSES ===
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveThreatInfo {
        private String sourceIp;
        private String attackType;
        private Double mlConfidence;
        private String severity;
        private Long packetsPerSecond;
        private String detectedAt;
        private Boolean isBlocked;
        private String action; // BLOCKED, MONITORED, RATE_LIMITED
    }
}
