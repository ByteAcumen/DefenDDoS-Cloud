package com.defenddos.backend_service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * System Health Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SystemHealthResponse {
    
    @JsonProperty("status")
    private String status;  // HEALTHY, DEGRADED, UNHEALTHY
    
    @JsonProperty("backend_status")
    private String backendStatus;
    
    @JsonProperty("ml_service_status")
    private String mlServiceStatus;
    
    @JsonProperty("database_status")
    private String databaseStatus;
    
    @JsonProperty("ml_models_loaded")
    private Boolean mlModelsLoaded;
    
    @JsonProperty("active_connections")
    private Integer activeConnections;
    
    @JsonProperty("uptime_seconds")
    private Long uptimeSeconds;
    
    @JsonProperty("version")
    private String version;
    
    @JsonProperty("timestamp")
    private String timestamp;
}
