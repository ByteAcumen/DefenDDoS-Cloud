package com.defenddos.backend_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

/**
 * Comprehensive statistics response for DDoS detection dashboard
 * Provides detailed metrics for frontend visualization and analysis
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetailedStatisticsResponse {
    
    // === TRAFFIC OVERVIEW ===
    private Long totalPackets;
    private Long totalBytes;
    private Long totalConnections;
    private Double averagePacketSize;
    private Double packetsPerSecond;
    private Double bytesPerSecond;
    
    // === IP STATISTICS ===
    private Integer uniqueSourceIps;
    private Integer uniqueDestinationIps;
    private Integer blockedIpsCount;
    private Integer whitelistedIpsCount;
    
    // === ATTACK DETECTION ===
    private Integer totalAttacksDetected;
    private Integer attacksBlockedByML;
    private Integer attacksBlockedByRules;
    private Double averageMLConfidence;
    private String currentThreatLevel; // SAFE, LOW, MEDIUM, HIGH, CRITICAL
    
    // === ML PREDICTIONS ===
    private MLStatistics mlStatistics;
    
    // === ATTACK TYPES BREAKDOWN ===
    private Map<String, Integer> attackTypeDistribution; // e.g., {"SYN_FLOOD": 45, "UDP_FLOOD": 30}
    private Map<String, Long> attackTypeBytesDistribution;
    
    // === TOP THREATS ===
    private List<TopThreatInfo> topThreats; // Top attacking IPs with details
    private List<TopTargetInfo> topTargets; // Most targeted destination IPs
    
    // === TIME SERIES DATA ===
    private List<TimeSeriesPoint> trafficTimeSeries; // Traffic over time
    private List<TimeSeriesPoint> attackTimeSeries; // Attacks over time
    
    // === PROTOCOL DISTRIBUTION ===
    private Map<String, Long> protocolDistribution; // TCP, UDP, ICMP counts
    private Map<Integer, Long> portDistribution; // Port numbers and their usage
    
    // === GEOGRAPHIC INFO (if available) ===
    private Map<String, Integer> attacksByCountry;
    
    // === SYSTEM PERFORMANCE ===
    private Double detectionAccuracy; // Percentage
    private Double falsePositiveRate;
    private Long averageDetectionTimeMs;
    
    // === TIME RANGE ===
    private String timeRangeStart;
    private String timeRangeEnd;
    private String timeRange; // e.g., "-1h"
    
    // === METADATA ===
    private String generatedAt;
    private String status;
    
    // === NESTED CLASSES ===
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MLStatistics {
        private Integer totalPredictions;
        private Integer attackPredictions;
        private Integer benignPredictions;
        private Double averageConfidence;
        private Double highConfidencePredictions; // Percentage with confidence > 0.8
        private Map<String, Double> modelAccuracyByType; // Accuracy per attack type
        private Boolean mlServiceAvailable;
        private String mlServiceVersion;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopThreatInfo {
        private String sourceIp;
        private Long totalPackets;
        private Long totalBytes;
        private Integer attackCount;
        private String primaryAttackType;
        private Double mlConfidence;
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL
        private Boolean isBlocked;
        private String firstSeenAt;
        private String lastSeenAt;
        private List<String> attackTypes; // All detected attack types from this IP
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopTargetInfo {
        private String destinationIp;
        private Long totalPackets;
        private Long totalBytes;
        private Integer attackCount;
        private Integer uniqueAttackers;
        private String mostCommonAttackType;
        private String severity;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesPoint {
        private String timestamp;
        private Long packets;
        private Long bytes;
        private Integer attacks;
        private Double mlConfidence;
        private Integer blockedRequests;
    }
}
