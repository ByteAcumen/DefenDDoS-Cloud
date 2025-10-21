package com.defenddos.backend_service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Traffic Summary Response DTO for frontend dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TrafficSummaryResponse {
    
    @JsonProperty("source_ip")
    private String sourceIp;
    
    @JsonProperty("total_packets")
    private Long totalPackets;
    
    @JsonProperty("total_bytes")
    private Long totalBytes;
    
    @JsonProperty("connection_count")
    private Integer connectionCount;
    
    @JsonProperty("avg_packet_size")
    private Double avgPacketSize;
    
    @JsonProperty("threat_score")
    private Double threatScore;  // 0-100 scale
    
    @JsonProperty("is_suspicious")
    private Boolean isSuspicious;
    
    @JsonProperty("first_seen")
    private String firstSeen;
    
    @JsonProperty("last_seen")
    private String lastSeen;
    
    @JsonProperty("destination_ips")
    private List<String> destinationIps;
    
    @JsonProperty("status")
    private String status;  // NORMAL, SUSPICIOUS, BLOCKED
}
