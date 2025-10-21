package com.defenddos.backend_service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Traffic Data Response DTO for frontend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TrafficDataResponse {
    
    @JsonProperty("source_ip")
    private String sourceIp;
    
    @JsonProperty("destination_ip")
    private String destinationIp;
    
    @JsonProperty("packet_count")
    private Long packetCount;
    
    @JsonProperty("byte_count")
    private Long byteCount;
    
    @JsonProperty("timestamp")
    private String timestamp;
    
    @JsonProperty("threat_level")
    private String threatLevel;
    
    @JsonProperty("is_blocked")
    private Boolean isBlocked;
    
    @JsonProperty("packets_per_second")
    private Double packetsPerSecond;
    
    @JsonProperty("bytes_per_second")
    private Double bytesPerSecond;
}
