package com.defenddos.backend_service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Set;

/**
 * Threat Intelligence Service - Maintains IP reputation and known attack patterns
 * Provides real-time threat intelligence for enhanced detection
 */
@Service
public class ThreatIntelligenceService {

    private static final Logger logger = LoggerFactory.getLogger(ThreatIntelligenceService.class);
    
    // In-memory threat intelligence database (in production, this would be external API or database)
    private final Map<String, ThreatInfo> knownThreats = new ConcurrentHashMap<>();
    private final Map<String, Integer> ipReputation = new ConcurrentHashMap<>();
    
    // Known malicious IP patterns
    private final Set<String> knownAttackerNetworks = ConcurrentHashMap.newKeySet();
    
    public ThreatIntelligenceService() {
        // Initialize with some known bad actor patterns
        initializeKnownThreats();
    }
    
    /**
     * Check if an IP is known to be malicious
     */
    public boolean isKnownThreat(String ipAddress) {
        return knownThreats.containsKey(ipAddress);
    }
    
    /**
     * Get threat information for an IP
     */
    public ThreatInfo getThreatInfo(String ipAddress) {
        return knownThreats.get(ipAddress);
    }
    
    /**
     * Report suspicious activity from an IP
     * Decreases reputation score
     */
    public void reportSuspiciousActivity(String ipAddress, String reason) {
        int currentReputation = ipReputation.getOrDefault(ipAddress, 100);
        int newReputation = Math.max(0, currentReputation - 10);
        ipReputation.put(ipAddress, newReputation);
        
        logger.info("Reputation updated for {}: {} -> {} (reason: {})", 
            ipAddress, currentReputation, newReputation, reason);
        
        // If reputation drops below threshold, add to known threats
        if (newReputation < 30 && !knownThreats.containsKey(ipAddress)) {
            addThreat(ipAddress, "Repeated suspicious activity: " + reason, "MEDIUM");
        }
    }
    
    /**
     * Get reputation score for an IP (0-100, higher is better)
     */
    public int getReputationScore(String ipAddress) {
        return ipReputation.getOrDefault(ipAddress, 100);
    }
    
    /**
     * Add a known threat to the database
     */
    public void addThreat(String ipAddress, String description, String severity) {
        ThreatInfo threat = new ThreatInfo(ipAddress, description, severity, System.currentTimeMillis());
        knownThreats.put(ipAddress, threat);
        logger.warn("⚠️  Added to threat database: {} - {} [{}]", ipAddress, description, severity);
    }
    
    /**
     * Remove an IP from threat database (whitelisting)
     */
    public boolean removeThreat(String ipAddress) {
        ThreatInfo removed = knownThreats.remove(ipAddress);
        if (removed != null) {
            ipReputation.put(ipAddress, 100); // Reset reputation
            logger.info("Removed {} from threat database", ipAddress);
            return true;
        }
        return false;
    }
    
    /**
     * Check if IP matches known attacker network patterns
     */
    public boolean matchesKnownAttackerPattern(String ipAddress) {
        for (String pattern : knownAttackerNetworks) {
            if (ipAddress.startsWith(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get all known threats
     */
    public Map<String, ThreatInfo> getAllThreats() {
        return Map.copyOf(knownThreats);
    }
    
    /**
     * Initialize with some known threat patterns
     */
    private void initializeKnownThreats() {
        // Example: Add some common known malicious network ranges
        // In production, this would be loaded from threat intelligence feeds
        logger.info("Threat Intelligence Service initialized");
    }
    
    /**
     * Threat information data class
     */
    public static class ThreatInfo {
        private final String ipAddress;
        private final String description;
        private final String severity;
        private final long timestamp;
        
        public ThreatInfo(String ipAddress, String description, String severity, long timestamp) {
            this.ipAddress = ipAddress;
            this.description = description;
            this.severity = severity;
            this.timestamp = timestamp;
        }
        
        public String getIpAddress() { return ipAddress; }
        public String getDescription() { return description; }
        public String getSeverity() { return severity; }
        public long getTimestamp() { return timestamp; }
    }
}
