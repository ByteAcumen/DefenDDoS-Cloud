package com.defenddos.backend_service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Enhanced ML Prediction Response with additional frontend-friendly fields
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MLPredictionResponse {

    @JsonProperty("is_attack")
    private Boolean isAttack;

    @JsonProperty("attack_type")
    private String attackType;

    @JsonProperty("confidence")
    private Double confidence;
    
    @JsonProperty("rf_confidence")
    private Double rfConfidence;
    
    @JsonProperty("lstm_anomaly_score")
    private Double lstmAnomalyScore;

    @JsonProperty("severity")
    private String severity;

    @JsonProperty("timestamp")
    private String timestamp;

    @JsonProperty("model_version")
    private String modelVersion;
    
    @JsonProperty("detection_method")
    private String detectionMethod;
    
    @JsonProperty("source_ip")
    private String sourceIp;
    
    @JsonProperty("recommended_action")
    private String recommendedAction;
    
    @JsonProperty("threat_level")
    private Integer threatLevel;  // 0-5 scale for frontend visualization

    /**
     * Check if this is a high-confidence attack prediction
     */
    public boolean isHighConfidenceAttack() {
        return isAttack != null && isAttack && confidence != null && confidence >= 0.5;
    }

    /**
     * Check if mitigation should be triggered
     * Now triggers on ANY detected attack with sufficient confidence OR high LSTM anomaly
     */
    public boolean shouldTriggerMitigation() {
        // Trigger if attack detected with moderate confidence
        if (isAttack != null && isAttack && confidence != null && confidence >= 0.5) {
            return true;
        }
        
        // Trigger if LSTM detects very high anomaly (>100 indicates serious anomaly)
        if (lstmAnomalyScore != null && lstmAnomalyScore > 100.0) {
            return true;
        }
        
        // Trigger on any HIGH or CRITICAL severity
        if (severity != null && 
            (severity.equalsIgnoreCase("HIGH") || 
             severity.equalsIgnoreCase("CRITICAL") ||
             severity.equalsIgnoreCase("MEDIUM"))) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Determine if this is a critical threat requiring immediate action
     */
    public boolean isCriticalThreat() {
        return (confidence != null && confidence >= 0.7) ||
               (lstmAnomalyScore != null && lstmAnomalyScore > 150.0) ||
               (severity != null && severity.equalsIgnoreCase("CRITICAL"));
    }
    
    /**
     * Get confidence as percentage for frontend display
     */
    @JsonProperty("confidence_percentage")
    public Double getConfidencePercentage() {
        return confidence != null ? confidence * 100 : null;
    }
    
    /**
     * Get display-friendly severity color
     */
    @JsonProperty("severity_color")
    public String getSeverityColor() {
        if (severity == null) return "gray";
        switch (severity.toUpperCase()) {
            case "CRITICAL": return "red";
            case "HIGH": return "orange";
            case "MEDIUM": return "yellow";
            case "LOW": return "blue";
            default: return "green";
        }
    }
}
