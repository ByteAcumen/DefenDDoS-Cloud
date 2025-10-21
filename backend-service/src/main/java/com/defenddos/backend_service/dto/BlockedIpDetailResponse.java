package com.defenddos.backend_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Comprehensive blocked IP information with ML context and history
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockedIpDetailResponse {
    
    private String ipAddress;
    private String blockReason;
    private String blockMethod; // ML_DETECTION, RULE_BASED, MANUAL
    
    // === BLOCK INFO ===
    private String blockedAt;
    private String willUnblockAt;
    private Long blockDurationHours;
    private Boolean isPermanentBlock;
    private Integer blockCount; // How many times this IP was blocked
    
    // === ATTACK DETAILS ===
    private String primaryAttackType;
    private List<String> detectedAttackTypes;
    private Double mlConfidence;
    private String severity;
    private Integer totalAttacks;
    
    // === TRAFFIC STATISTICS ===
    private Long totalPackets;
    private Long totalBytes;
    private Long peakPacketsPerSecond;
    private String firstSeenAt;
    private String lastSeenAt;
    private Long activeDurationSeconds;
    
    // === ML PREDICTION HISTORY ===
    private List<MLPredictionHistory> predictionHistory;
    
    // === TARGETED SYSTEMS ===
    private List<String> targetedDestinationIps;
    private List<Integer> targetedPorts;
    
    // === THREAT INTELLIGENCE ===
    private Boolean isKnownMalicious;
    private List<String> threatDatabases; // Sources that flagged this IP
    private String geolocation;
    private String organization;
    private String asn;
    
    // === ACTIONS TAKEN ===
    private List<MitigationAction> mitigationActions;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MLPredictionHistory {
        private String timestamp;
        private Boolean wasAttack;
        private String attackType;
        private Double confidence;
        private String modelUsed;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MitigationAction {
        private String action; // RATE_LIMIT, BLOCK, UNBLOCK
        private String timestamp;
        private String reason;
        private String initiatedBy; // SYSTEM, ADMIN, ML_MODEL
    }
}
