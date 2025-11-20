package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.service.BlockchainThreatIntelService;
import com.defenddos.backend_service.service.BlockchainThreatIntelService.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API Controller for Blockchain Threat Intelligence
 * 
 * Endpoints:
 * - POST /api/threats/share - Share attack intelligence on blockchain
 * - GET /api/threats/{ip} - Query threat intel for IP
 * - GET /api/threats/reputation/{ip} - Get IP reputation score
 * - GET /api/threats/statistics - Get global threat statistics
 */
@RestController
@RequestMapping("/api/threats")
@Slf4j
public class ThreatIntelController {

    @Autowired
    private BlockchainThreatIntelService threatIntelService;

    /**
     * Share attack intelligence on blockchain
     * 
     * POST /api/threats/share
     * 
     * Body:
     * {
     *   "sourceIp": "192.168.1.100",
     *   "attackType": "DDoS",
     *   "severity": "CRITICAL",
     *   "timestamp": "2024-01-15T10:30:00Z",
     *   "details": { ... }
     * }
     */
    @PostMapping("/share")
    public ResponseEntity<ShareResponse> shareAttackIntelligence(
            @RequestBody AttackReport report) {
        
        log.info("Sharing attack intelligence for IP: {}", report.getSourceIp());
        
        try {
            String txHash = threatIntelService.shareAttackIntelligence(report);
            
            ShareResponse response = new ShareResponse(
                true,
                "Attack intelligence shared successfully",
                txHash
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error sharing attack intelligence", e);
            ShareResponse response = new ShareResponse(
                false,
                "Failed to share: " + e.getMessage(),
                null
            );
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Query threat intelligence for specific IP
     * 
     * GET /api/threats/192.168.1.100
     * 
     * Response:
     * {
     *   "ipAddress": "192.168.1.100",
     *   "firstSeen": "2024-01-10T08:00:00Z",
     *   "lastSeen": "2024-01-15T10:30:00Z",
     *   "reportCount": 15,
     *   "attackTypes": ["DDoS", "Brute Force"],
     *   "sources": ["node1", "node2", ...],
     *   "blockchainReferences": ["0xabc...", "0xdef..."]
     * }
     */
    @GetMapping("/{ip}")
    public ResponseEntity<ThreatIntelligence> queryThreatIntel(
            @PathVariable String ip) {
        
        log.info("Querying threat intelligence for IP: {}", ip);
        
        try {
            ThreatIntelligence intel = threatIntelService.queryThreatIntel(ip);
            
            if (intel == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(intel);
            
        } catch (Exception e) {
            log.error("Error querying threat intel for IP: {}", ip, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get IP reputation score
     * 
     * GET /api/threats/reputation/192.168.1.100
     * 
     * Response:
     * {
     *   "ipAddress": "192.168.1.100",
     *   "score": 35,
     *   "risk": "HIGH",
     *   "lastUpdated": "2024-01-15T10:30:00Z"
     * }
     */
    @GetMapping("/reputation/{ip}")
    public ResponseEntity<IPReputation> getIPReputation(
            @PathVariable String ip) {
        
        log.info("Getting reputation for IP: {}", ip);
        
        try {
            IPReputation reputation = threatIntelService.getIPReputation(ip);
            
            return ResponseEntity.ok(reputation);
            
        } catch (Exception e) {
            log.error("Error getting IP reputation: {}", ip, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update IP reputation score (after new attack)
     * 
     * POST /api/threats/reputation/{ip}/update
     * 
     * Body:
     * {
     *   "severity": "CRITICAL"
     * }
     */
    @PostMapping("/reputation/{ip}/update")
    public ResponseEntity<IPReputation> updateIPReputation(
            @PathVariable String ip,
            @RequestBody UpdateReputationRequest request) {
        
        log.info("Updating reputation for IP: {} with severity: {}", 
            ip, request.getSeverity());
        
        try {
            threatIntelService.updateIPReputation(ip, request.getSeverity());
            IPReputation updated = threatIntelService.getIPReputation(ip);
            
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            log.error("Error updating IP reputation: {}", ip, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get global threat statistics
     * 
     * GET /api/threats/statistics
     * 
     * Response:
     * {
     *   "totalReports": 150234,
     *   "uniqueIPs": 45678,
     *   "topAttackTypes": { "DDoS": 89000, "Brute Force": 35000, ... },
     *   "topCountries": { "US": 25000, "CN": 18000, ... },
     *   "last24Hours": 5432,
     *   "criticalThreats": 234
     * }
     */
    @GetMapping("/statistics")
    public ResponseEntity<ThreatStatistics> getGlobalStatistics() {
        log.info("Fetching global threat statistics");
        
        try {
            ThreatStatistics stats = threatIntelService.getGlobalThreatStatistics();
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("Error fetching threat statistics", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get recent threat reports
     * 
     * GET /api/threats/recent?limit=50
     * 
     * Returns list of recent attack reports from blockchain
     */
    @GetMapping("/recent")
    public ResponseEntity<List<AttackReport>> getRecentThreats(
            @RequestParam(defaultValue = "50") int limit) {
        
        log.info("Fetching {} recent threats", limit);
        
        try {
            // This would query recent reports from blockchain
            // For now, return empty list (implementation would go here)
            return ResponseEntity.ok(List.of());
            
        } catch (Exception e) {
            log.error("Error fetching recent threats", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // DTOs
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class ShareResponse {
        private boolean success;
        private String message;
        private String transactionHash;
    }

    @lombok.Data
    private static class UpdateReputationRequest {
        private String severity;
    }
}
