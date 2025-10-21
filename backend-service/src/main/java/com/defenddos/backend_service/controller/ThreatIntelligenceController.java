package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.dto.ApiResponse;
import com.defenddos.backend_service.service.ThreatIntelligenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

/**
 * REST Controller for threat intelligence operations
 * Provides endpoints for IP reputation checking and threat management
 */
@RestController
@RequestMapping("/api/v1/threat-intelligence")
public class ThreatIntelligenceController {

    private static final Logger logger = LoggerFactory.getLogger(ThreatIntelligenceController.class);
    
    private final ThreatIntelligenceService threatIntelligenceService;

    public ThreatIntelligenceController(ThreatIntelligenceService threatIntelligenceService) {
        this.threatIntelligenceService = threatIntelligenceService;
    }

    /**
     * Check if an IP is a known threat
     */
    @GetMapping("/check/{ip}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkThreat(@PathVariable String ip) {
        boolean isKnownThreat = threatIntelligenceService.isKnownThreat(ip);
        int reputationScore = threatIntelligenceService.getReputationScore(ip);
        
        Map<String, Object> result = new HashMap<>();
        result.put("ipAddress", ip);
        result.put("isKnownThreat", isKnownThreat);
        result.put("reputationScore", reputationScore);
        result.put("riskLevel", getRiskLevel(reputationScore));
        
        if (isKnownThreat) {
            ThreatIntelligenceService.ThreatInfo threat = threatIntelligenceService.getThreatInfo(ip);
            result.put("threatInfo", Map.of(
                "description", threat.getDescription(),
                "severity", threat.getSeverity(),
                "detectedAt", threat.getTimestamp()
            ));
        }
        
        return ResponseEntity.ok(ApiResponse.success("Threat check completed", result));
    }

    /**
     * Get reputation score for an IP
     */
    @GetMapping("/reputation/{ip}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReputation(@PathVariable String ip) {
        int reputationScore = threatIntelligenceService.getReputationScore(ip);
        
        Map<String, Object> result = new HashMap<>();
        result.put("ipAddress", ip);
        result.put("reputationScore", reputationScore);
        result.put("riskLevel", getRiskLevel(reputationScore));
        
        return ResponseEntity.ok(ApiResponse.success("Reputation retrieved", result));
    }

    /**
     * Get all known threats
     */
    @GetMapping("/threats")
    public ResponseEntity<ApiResponse<Map<String, ThreatIntelligenceService.ThreatInfo>>> getAllThreats() {
        Map<String, ThreatIntelligenceService.ThreatInfo> threats = threatIntelligenceService.getAllThreats();
        
        return ResponseEntity.ok(ApiResponse.success(
            String.format("Retrieved %d known threats", threats.size()), threats));
    }

    /**
     * Manually add a threat
     */
    @PostMapping("/threats/add")
    public ResponseEntity<ApiResponse<Map<String, String>>> addThreat(@RequestBody Map<String, String> request) {
        String ipAddress = request.get("ipAddress");
        String description = request.get("description");
        String severity = request.getOrDefault("severity", "MEDIUM");
        
        if (ipAddress == null || ipAddress.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request", "VALIDATION_ERROR", 
                            "IP address is required"));
        }
        
        threatIntelligenceService.addThreat(ipAddress, description, severity);
        
        Map<String, String> result = new HashMap<>();
        result.put("ipAddress", ipAddress);
        result.put("status", "added");
        
        return ResponseEntity.ok(ApiResponse.success("Threat added successfully", result));
    }

    /**
     * Remove a threat (whitelist)
     */
    @DeleteMapping("/threats/{ip}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeThreat(@PathVariable String ip) {
        boolean removed = threatIntelligenceService.removeThreat(ip);
        
        Map<String, Object> result = new HashMap<>();
        result.put("ipAddress", ip);
        result.put("removed", removed);
        
        if (removed) {
            return ResponseEntity.ok(ApiResponse.success("Threat removed successfully", result));
        } else {
            return ResponseEntity.ok(ApiResponse.success("IP was not in threat database", result));
        }
    }

    /**
     * Report suspicious activity
     */
    @PostMapping("/report-suspicious")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportSuspicious(@RequestBody Map<String, String> request) {
        String ipAddress = request.get("ipAddress");
        String reason = request.getOrDefault("reason", "Manual report");
        
        if (ipAddress == null || ipAddress.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request", "VALIDATION_ERROR", 
                            "IP address is required"));
        }
        
        threatIntelligenceService.reportSuspiciousActivity(ipAddress, reason);
        int newReputation = threatIntelligenceService.getReputationScore(ipAddress);
        
        Map<String, Object> result = new HashMap<>();
        result.put("ipAddress", ipAddress);
        result.put("reputationScore", newReputation);
        result.put("riskLevel", getRiskLevel(newReputation));
        
        return ResponseEntity.ok(ApiResponse.success("Suspicious activity reported", result));
    }

    /**
     * Helper method to determine risk level from reputation score
     */
    private String getRiskLevel(int reputationScore) {
        if (reputationScore >= 80) {
            return "LOW";
        } else if (reputationScore >= 50) {
            return "MEDIUM";
        } else if (reputationScore >= 30) {
            return "HIGH";
        } else {
            return "CRITICAL";
        }
    }
}
