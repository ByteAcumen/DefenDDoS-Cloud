package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.service.MitigationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

/**
 * REST controller for managing IP mitigation (blocking/unblocking)
 * Provides manual control over the automated defense system
 */
@RestController
@RequestMapping("/api/v1/mitigation")
public class MitigationController {

    private static final Logger logger = LoggerFactory.getLogger(MitigationController.class);
    
    private final MitigationService mitigationService;

    public MitigationController(MitigationService mitigationService) {
        this.mitigationService = mitigationService;
    }

    /**
     * Get mitigation service status
     */
    @GetMapping("/status")
    public ResponseEntity<MitigationService.MitigationStatus> getStatus() {
        logger.debug("Retrieving mitigation service status");
        return ResponseEntity.ok(mitigationService.getStatus());
    }

    /**
     * Get list of currently blocked IPs
     */
    @GetMapping("/blocked")
    public ResponseEntity<Map<String, Object>> getBlockedIps() {
        Set<String> blockedIps = mitigationService.getBlockedIps();
        logger.debug("Retrieved {} blocked IPs", blockedIps.size());
        
        return ResponseEntity.ok(Map.of(
            "blockedIps", blockedIps,
            "count", blockedIps.size(),
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Manually block an IP address
     */
    @PostMapping("/block/{ip}")
    public ResponseEntity<Map<String, Object>> blockIp(
            @PathVariable String ip,
            @RequestParam(defaultValue = "Manual block via API") String reason) {
        
        logger.info("Manual block request for IP: {} with reason: {}", ip, reason);
        
        boolean success = mitigationService.blockIp(ip, reason);
        
        if (success) {
            logger.info("Successfully blocked IP: {}", ip);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "IP successfully blocked",
                "ip", ip,
                "reason", reason,
                "timestamp", System.currentTimeMillis()
            ));
        } else {
            logger.warn("Failed to block IP: {}", ip);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to block IP - check logs for details",
                "ip", ip,
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Manually unblock an IP address
     */
    @PostMapping("/unblock/{ip}")
    public ResponseEntity<Map<String, Object>> unblockIp(@PathVariable String ip) {
        logger.info("Manual unblock request for IP: {}", ip);
        
        boolean success = mitigationService.unblockIp(ip);
        
        if (success) {
            logger.info("Successfully unblocked IP: {}", ip);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "IP successfully unblocked",
                "ip", ip,
                "timestamp", System.currentTimeMillis()
            ));
        } else {
            logger.warn("Failed to unblock IP: {}", ip);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to unblock IP - check logs for details",
                "ip", ip,
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Bulk operation - block multiple IPs
     */
    @PostMapping("/block/bulk")
    public ResponseEntity<Map<String, Object>> blockMultipleIps(
            @RequestBody Map<String, Object> request) {
        
        @SuppressWarnings("unchecked")
        java.util.List<String> ips = (java.util.List<String>) request.get("ips");
        String reason = (String) request.getOrDefault("reason", "Bulk block via API");
        
        if (ips == null || ips.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "No IPs provided for blocking"
            ));
        }
        
        logger.info("Bulk block request for {} IPs", ips.size());
        
        int successCount = 0;
        java.util.List<String> failed = new java.util.ArrayList<>();
        
        for (String ip : ips) {
            if (mitigationService.blockIp(ip, reason)) {
                successCount++;
            } else {
                failed.add(ip);
            }
        }
        
        logger.info("Bulk block completed: {}/{} successful", successCount, ips.size());
        
        return ResponseEntity.ok(Map.of(
            "success", failed.isEmpty(),
            "totalRequested", ips.size(),
            "successCount", successCount,
            "failedCount", failed.size(),
            "failedIps", failed,
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Clear all blocked IPs (emergency unblock)
     */
    @PostMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearAllBlocks() {
        logger.warn("Emergency clear all blocks requested");
        
        Set<String> blockedIps = mitigationService.getBlockedIps();
        int initialCount = blockedIps.size();
        int successCount = 0;
        
        for (String ip : blockedIps) {
            if (mitigationService.unblockIp(ip)) {
                successCount++;
            }
        }
        
        logger.info("Emergency clear completed: {}/{} IPs unblocked", successCount, initialCount);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Emergency clear completed",
            "initiallyBlocked", initialCount,
            "successfullyUnblocked", successCount,
            "remainingBlocked", mitigationService.getBlockedIps().size(),
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Check if a specific IP is blocked
     */
    @GetMapping("/check/{ip}")
    public ResponseEntity<Map<String, Object>> checkIpStatus(@PathVariable String ip) {
        boolean isBlocked = mitigationService.getBlockedIps().contains(ip);
        
        return ResponseEntity.ok(Map.of(
            "ip", ip,
            "isBlocked", isBlocked,
            "status", isBlocked ? "blocked" : "allowed",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
