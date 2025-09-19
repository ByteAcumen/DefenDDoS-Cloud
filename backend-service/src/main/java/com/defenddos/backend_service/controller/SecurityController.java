package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.service.AlertService;
import com.defenddos.backend_service.service.DetectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for security operations in the DefenDDoS system.
 * Provides endpoints for threat analysis, detection control, and security monitoring.
 */
@RestController
@RequestMapping("/api/v1/security")
public class SecurityController {

    private final DetectionService detectionService;
    private final AlertService alertService;

    public SecurityController(DetectionService detectionService, AlertService alertService) {
        this.detectionService = detectionService;
        this.alertService = alertService;
    }

    /**
     * Get security dashboard overview
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getSecurityDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("status", "operational");
        dashboard.put("detectionEnabled", true);
        dashboard.put("alertsEnabled", true);
        dashboard.put("lastScan", java.time.Instant.now());
        dashboard.put("systemHealth", "healthy");
        dashboard.put("activeThreats", 0); // This could be enhanced to track active threats
        
        return ResponseEntity.ok(dashboard);
    }

    /**
     * Manually analyze a specific IP address
     */
    @PostMapping("/analyze/{ipAddress}")
    public ResponseEntity<Map<String, Object>> analyzeIpAddress(@PathVariable String ipAddress) {
        try {
            String threatLevel = detectionService.analyzeIpAddress(ipAddress);
            
            Map<String, Object> analysis = new HashMap<>();
            analysis.put("ipAddress", ipAddress);
            analysis.put("threatLevel", threatLevel);
            analysis.put("analysisTime", java.time.Instant.now());
            analysis.put("recommendation", getRecommendation(threatLevel));
            
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Analysis failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Test the alert system
     */
    @PostMapping("/test-alert")
    public ResponseEntity<Map<String, String>> testAlert() {
        String result = alertService.testAlert();
        Map<String, String> response = new HashMap<>();
        response.put("message", result);
        return ResponseEntity.ok(response);
    }

    /**
     * Get system status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("timestamp", java.time.Instant.now());
        status.put("services", Map.of(
            "detection", "running",
            "alerts", "running",
            "database", "connected"
        ));
        status.put("uptime", "Available"); // Could be enhanced with actual uptime
        status.put("version", "2.0.0-SNAPSHOT");
        
        return ResponseEntity.ok(status);
    }

    /**
     * Manually trigger threat detection scan (for testing)
     */
    @PostMapping("/trigger-detection")
    public ResponseEntity<Map<String, Object>> triggerDetection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            detectionService.triggerManualDetection();
            response.put("success", true);
            response.put("message", "Detection scan triggered successfully");
            response.put("timestamp", java.time.Instant.now());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to trigger detection: " + e.getMessage());
            response.put("timestamp", java.time.Instant.now());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get threat level recommendations
     */
    private String getRecommendation(String threatLevel) {
        return switch (threatLevel) {
            case "CRITICAL" -> "IMMEDIATE ACTION REQUIRED: Block IP address and investigate source";
            case "HIGH" -> "HIGH PRIORITY: Monitor closely and consider blocking";
            case "MEDIUM" -> "MODERATE RISK: Increase monitoring for this IP";
            case "LOW" -> "LOW RISK: Continue monitoring";
            default -> "NORMAL: No action required";
        };
    }
}
