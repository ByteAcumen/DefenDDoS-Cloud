package com.defenddos.backend_service.model;

import lombok.Data;
import lombok.Builder;
import java.time.Instant;

/**
 * Enriched traffic data model with 30 features for ML-based DDoS detection.
 * This model extends the basic TrafficPoint with advanced metrics.
 */
@Data
@Builder
public class EnrichedTrafficPoint {
    
    // Basic fields (from TrafficPoint)
    private String sourceIp;
    private String destinationIp;
    private Long packetCount;
    private Long byteCount;
    private Instant timestamp;
    
    // Feature 1-5: Packet Statistics
    private Double fwdPacketsPerSecond;
    private Double bwdPacketsPerSecond;
    private Long fwdPacketLengthMax;
    private Long fwdPacketLengthMin;
    private Double fwdPacketLengthMean;
    
    // Feature 6-10: Byte Statistics
    private Long bwdPacketLengthMax;
    private Long bwdPacketLengthMin;
    private Double bwdPacketLengthMean;
    private Long flowBytesPerSecond;
    private Long flowPacketsPerSecond;
    
    // Feature 11-15: Flow Characteristics
    private Double flowIatMean;
    private Long flowIatMax;
    private Long flowIatMin;
    private Long flowDuration;
    private Long activeTimeMax;
    
    // Feature 16-20: Direction Ratios
    private Double fwdHeaderLength;
    private Double bwdHeaderLength;
    private Double fwdPacketsPerSecondRatio;
    private Long subflowFwdPackets;
    private Long subflowBwdPackets;
    
    // Feature 21-25: TCP Flags
    private Long finFlagCount;
    private Long synFlagCount;
    private Long rstFlagCount;
    private Long pshFlagCount;
    private Long ackFlagCount;
    
    // Feature 26-30: Advanced Metrics
    private Long urgFlagCount;
    private Long cwrFlagCount;
    private Long eceFlagCount;
    private Double downUpRatio;
    private Double avgPacketSize;
    
    /**
     * Creates an EnrichedTrafficPoint from basic TrafficPoint with default values.
     * Used as fallback when full enrichment is not available.
     */
    public static EnrichedTrafficPoint fromBasicTrafficPoint(TrafficPoint basic) {
        return EnrichedTrafficPoint.builder()
                .sourceIp(basic.getSourceIp())
                .destinationIp(basic.getDestinationIp())
                .packetCount(basic.getPacketCount())
                .byteCount(basic.getByteCount())
                .timestamp(basic.getTimestamp())
                // Default values for missing features
                .fwdPacketsPerSecond(basic.getPacketCount() / 60.0) // Assuming 1-minute window
                .bwdPacketsPerSecond(0.0)
                .fwdPacketLengthMax(basic.getByteCount())
                .fwdPacketLengthMin(0L)
                .fwdPacketLengthMean(basic.getPacketCount() > 0 ? basic.getByteCount().doubleValue() / basic.getPacketCount() : 0.0)
                .bwdPacketLengthMax(0L)
                .bwdPacketLengthMin(0L)
                .bwdPacketLengthMean(0.0)
                .flowBytesPerSecond(basic.getByteCount() / 60)
                .flowPacketsPerSecond(basic.getPacketCount() / 60)
                .flowIatMean(0.0)
                .flowIatMax(0L)
                .flowIatMin(0L)
                .flowDuration(60000L) // 1 minute in milliseconds
                .activeTimeMax(60000L)
                .fwdHeaderLength(0.0)
                .bwdHeaderLength(0.0)
                .fwdPacketsPerSecondRatio(1.0)
                .subflowFwdPackets(basic.getPacketCount())
                .subflowBwdPackets(0L)
                .finFlagCount(0L)
                .synFlagCount(0L)
                .rstFlagCount(0L)
                .pshFlagCount(0L)
                .ackFlagCount(0L)
                .urgFlagCount(0L)
                .cwrFlagCount(0L)
                .eceFlagCount(0L)
                .downUpRatio(0.0)
                .avgPacketSize(basic.getPacketCount() > 0 ? basic.getByteCount().doubleValue() / basic.getPacketCount() : 0.0)
                .build();
    }
}
