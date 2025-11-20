package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.service.AdvancedFingerprintingService;
import com.defenddos.backend_service.service.AdvancedFingerprintingService.FingerprintRequest;
import com.defenddos.backend_service.service.AdvancedFingerprintingService.TrafficFingerprint;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

/**
 * REST API Controller for Advanced Traffic Fingerprinting
 * 
 * Endpoints:
 * - POST /api/fingerprint/generate - Generate fingerprint for traffic
 * - GET /api/fingerprint/{fingerprint}/ips - Get IPs using same fingerprint
 * - GET /api/fingerprint/{fingerprint}/bot-network - Check if bot network
 */
@RestController
@RequestMapping("/api/fingerprint")
@Slf4j
public class FingerprintController {

    @Autowired
    private AdvancedFingerprintingService fingerprintingService;

    /**
     * Generate comprehensive fingerprint for traffic
     * 
     * POST /api/fingerprint/generate
     * Body: FingerprintRequest JSON
     * 
     * Example:
     * {
     *   "sourceIp": "192.168.1.100",
     *   "userAgent": "Mozilla/5.0...",
     *   "tlsVersion": "771",
     *   "cipherSuites": ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384"],
     *   "http2": true,
     *   "tcpWindowSize": 65535,
     *   "ttl": 64
     * }
     */
    @PostMapping("/generate")
    public ResponseEntity<TrafficFingerprint> generateFingerprint(
            @RequestBody FingerprintRequest request) {
        
        log.info("Generating fingerprint for IP: {}", request.getSourceIp());
        
        try {
            TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
            
            return ResponseEntity.ok(fingerprint);
            
        } catch (Exception e) {
            log.error("Error generating fingerprint", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all IPs associated with a fingerprint
     * 
     * GET /api/fingerprint/{fingerprint}/ips
     * 
     * Response: ["192.168.1.1", "192.168.1.2", ...]
     */
    @GetMapping("/{fingerprint}/ips")
    public ResponseEntity<Set<String>> getIPsForFingerprint(
            @PathVariable String fingerprint) {
        
        log.debug("Querying IPs for fingerprint: {}", fingerprint);
        
        Set<String> ips = fingerprintingService.getIPsForFingerprint(fingerprint);
        
        return ResponseEntity.ok(ips);
    }

    /**
     * Check if fingerprint represents a bot network
     * 
     * GET /api/fingerprint/{fingerprint}/bot-network
     * 
     * Response: { "isBotNetwork": true, "ipCount": 15 }
     */
    @GetMapping("/{fingerprint}/bot-network")
    public ResponseEntity<BotNetworkResponse> checkBotNetwork(
            @PathVariable String fingerprint) {
        
        log.debug("Checking bot network for fingerprint: {}", fingerprint);
        
        boolean isBotNetwork = fingerprintingService.isPotentialBotNetwork(fingerprint);
        Set<String> ips = fingerprintingService.getIPsForFingerprint(fingerprint);
        
        BotNetworkResponse response = new BotNetworkResponse(
            isBotNetwork,
            ips.size(),
            ips
        );
        
        return ResponseEntity.ok(response);
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class BotNetworkResponse {
        private boolean isBotNetwork;
        private int ipCount;
        private Set<String> ips;
    }
}
