package com.defenddos.backend_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

/**
 * Comprehensive attack analysis report for detailed investigation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttackAnalysisResponse {
    
    // === ATTACK IDENTIFICATION ===
    private String attackId;
    private String attackType;
    private String attackCategory; // VOLUMETRIC, PROTOCOL, APPLICATION
    private String severity;
    
    // === ATTACK TIMELINE ===
    private String startTime;
    private String endTime;
    private Long durationSeconds;
    private Boolean isOngoing;
    
    // === ATTACK SOURCE ===
    private List<String> attackingIps;
    private Integer uniqueAttackerCount;
    private String primaryAttackerIp;
    private Map<String, AttackerInfo> topAttackers;
    
    // === ATTACK TARGET ===
    private List<String> targetIps;
    private List<Integer> targetPorts;
    private String primaryTargetIp;
    private String targetedService;
    
    // === ATTACK METRICS ===
    private Long totalPackets;
    private Long totalBytes;
    private Long peakPacketsPerSecond;
    private Long peakBytesPerSecond;
    private Double averagePacketSize;
    
    // === ML DETECTION ===
    private Double mlConfidence;
    private String detectionMethod; // ML_MODEL, RULE_BASED, HYBRID
    private List<String> modelsUsed;
    private Map<String, Double> modelConfidences;
    
    // === ATTACK CHARACTERISTICS ===
    private String protocol;
    private Boolean isSpoofed;
    private Boolean isDistributed;
    private Integer botnetSize; // Estimated if distributed
    private String attackPattern;
    
    // === TRAFFIC PATTERNS ===
    private List<TrafficPatternInfo> trafficPatterns;
    private Map<String, Long> protocolDistribution;
    private Map<Integer, Long> portDistribution;
    
    // === IMPACT ASSESSMENT ===
    private String impactLevel; // LOW, MODERATE, SEVERE, CRITICAL
    private List<String> affectedServices;
    private Double estimatedLossPercentage;
    private Boolean serviceDisruption;
    
    // === MITIGATION APPLIED ===
    private List<String> mitigationActions;
    private Integer ipsBlocked;
    private Long packetsDropped;
    private String mitigationEffectiveness; // EFFECTIVE, PARTIAL, INEFFECTIVE
    
    // === TIME SERIES DATA ===
    private List<TimeSeriesDataPoint> attackTimeline;
    
    // === GEOGRAPHIC DISTRIBUTION ===
    private Map<String, Integer> attackersByCountry;
    private Map<String, Integer> attackersByAsn;
    
    // === RECOMMENDATIONS ===
    private List<String> recommendations;
    private String suggestedAction;
    
    // === METADATA ===
    private String analyzedAt;
    private String analystNotes;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttackerInfo {
        private String ipAddress;
        private Long packets;
        private Long bytes;
        private String attackType;
        private Double mlConfidence;
        private Boolean isBlocked;
        private String country;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrafficPatternInfo {
        private String patternType;
        private String description;
        private Double confidence;
        private List<String> indicators;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesDataPoint {
        private String timestamp;
        private Long packets;
        private Long bytes;
        private Double mlConfidence;
        private String severity;
    }
}
