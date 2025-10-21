package com.defenddos.backend_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

/**
 * Enhanced traffic data response with ML predictions and detailed analysis
 * Provides comprehensive information for each traffic record
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnhancedTrafficDataResponse {
    
    // === BASIC TRAFFIC INFO ===
    private String sourceIp;
    private String destinationIp;
    private Integer sourcePort;
    private Integer destinationPort;
    private String protocol; // TCP, UDP, ICMP
    
    // === TRAFFIC METRICS ===
    private Long packetCount;
    private Long byteCount;
    private Double averagePacketSize;
    private Double packetsPerSecond;
    private Double bytesPerSecond;
    private Long durationSeconds;
    
    // === TCP FLAGS (if TCP traffic) ===
    private Boolean synFlag;
    private Boolean ackFlag;
    private Boolean finFlag;
    private Boolean rstFlag;
    private Boolean pshFlag;
    private Boolean urgFlag;
    
    // === ML PREDICTION DATA ===
    private Boolean isAttack;
    private String attackType; // SYN_FLOOD, UDP_FLOOD, HTTP_FLOOD, etc.
    private Double mlConfidence;
    private String mlModelUsed; // RANDOM_FOREST, LSTM_AUTOENCODER
    private Double anomalyScore;
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    
    // === DETAILED ML FEATURES ===
    private MLFeatures mlFeatures;
    
    // === THREAT INTELLIGENCE ===
    private Boolean isKnownThreat;
    private String threatCategory;
    private String threatSource; // Database, ML Model, Rule-based
    private Integer threatScore; // 0-100
    
    // === STATUS & ACTIONS ===
    private Boolean isBlocked;
    private String blockReason;
    private String mitigationAction; // NONE, RATE_LIMIT, BLOCK, DROP
    private String timestamp;
    
    // === CONNECTION INFO ===
    private Integer connectionCount;
    private Boolean isNewConnection;
    private String connectionState; // NEW, ESTABLISHED, RELATED
    
    // === GEOGRAPHIC INFO (if available) ===
    private String sourceCountry;
    private String sourceCity;
    private String sourceAsn;
    private String sourceOrganization;
    
    // === PATTERN DETECTION ===
    private Boolean isSuspiciousPattern;
    private String patternType; // SCANNING, FLOODING, BRUTE_FORCE
    private String patternDescription;
    
    // === RELATED DATA ===
    private Integer relatedAttacksFromSameIp;
    private Integer totalPacketsFromIpInWindow;
    private String firstSeenAt;
    private String lastSeenAt;
    
    // === METADATA ===
    private String recordId;
    private String analyzedAt;
    private String dataSource; // REAL_TIME, HISTORICAL, REPLAY
    
    // === NESTED CLASSES ===
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MLFeatures {
        // Statistical Features
        private Double meanPacketSize;
        private Double stdDevPacketSize;
        private Double minPacketSize;
        private Double maxPacketSize;
        
        // Flow Features
        private Double packetRate;
        private Double byteRate;
        private Double flowDuration;
        private Long totalFlowPackets;
        private Long totalFlowBytes;
        
        // Protocol Features
        private Integer synCount;
        private Integer ackCount;
        private Integer finCount;
        private Integer rstCount;
        private Double synAckRatio;
        
        // Time-based Features
        private Double interArrivalTimeMean;
        private Double interArrivalTimeStd;
        
        // Anomaly Indicators
        private Double zscore;
        private Double isolationScore;
        private Boolean isOutlier;
        
        // Entropy & Randomness
        private Double ipEntropy;
        private Double portEntropy;
        private Double packetSizeEntropy;
        
        // Custom DDoS Features
        private Double burstiness; // Measure of traffic burst patterns
        private Double repetitiveness; // Repetitive packet patterns
        private Integer uniqueDestinationPorts;
        private Integer uniqueSourcePorts;
        
        // Additional ML metadata
        private Map<String, Double> rawFeatureVector; // All features used by ML model
        private String featureVersion;
    }
}
