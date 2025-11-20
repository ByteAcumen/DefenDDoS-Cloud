package com.defenddos.backend_service.service;

import com.defenddos.backend_service.service.BlockchainThreatIntelService.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for Blockchain Threat Intelligence Service
 */
@ExtendWith(MockitoExtension.class)
class BlockchainThreatIntelServiceTest {

    private BlockchainThreatIntelService threatIntelService;

    @BeforeEach
    void setUp() {
        threatIntelService = new BlockchainThreatIntelService();
    }

    @Test
    void testGetIPReputation_NewIP() {
        // Test reputation for new IP (should be 100)
        IPReputation reputation = threatIntelService.getIPReputation("192.168.1.100");
        
        assertNotNull(reputation);
        assertEquals("192.168.1.100", reputation.getIpAddress());
        assertEquals(100, reputation.getScore());
        assertEquals("SAFE", reputation.getRisk());
    }

    @Test
    void testUpdateIPReputation_Critical() {
        // Test reputation update for critical attack
        String ip = "192.168.1.101";
        threatIntelService.updateIPReputation(ip, "CRITICAL");
        
        IPReputation reputation = threatIntelService.getIPReputation(ip);
        assertEquals(70, reputation.getScore()); // 100 - 30 = 70
        assertEquals("MODERATE", reputation.getRisk());
    }

    @Test
    void testUpdateIPReputation_Multiple() {
        // Test multiple reputation updates
        String ip = "192.168.1.102";
        
        threatIntelService.updateIPReputation(ip, "HIGH");
        IPReputation rep1 = threatIntelService.getIPReputation(ip);
        assertEquals(80, rep1.getScore()); // 100 - 20
        
        threatIntelService.updateIPReputation(ip, "MEDIUM");
        IPReputation rep2 = threatIntelService.getIPReputation(ip);
        assertEquals(70, rep2.getScore()); // 80 - 10
        
        threatIntelService.updateIPReputation(ip, "CRITICAL");
        IPReputation rep3 = threatIntelService.getIPReputation(ip);
        assertEquals(40, rep3.getScore()); // 70 - 30
        assertEquals("HIGH", rep3.getRisk());
    }

    @Test
    void testReputationScoreFloor() {
        // Test that score doesn't go below 0
        String ip = "192.168.1.103";
        
        for (int i = 0; i < 10; i++) {
            threatIntelService.updateIPReputation(ip, "CRITICAL");
        }
        
        IPReputation reputation = threatIntelService.getIPReputation(ip);
        assertTrue(reputation.getScore() >= 0);
        assertEquals("MALICIOUS", reputation.getRisk());
    }

    @Test
    void testRiskClassification() {
        // Test risk classification for different scores
        String ip1 = "192.168.1.104";
        String ip2 = "192.168.1.105";
        String ip3 = "192.168.1.106";
        
        // SAFE (80-100)
        IPReputation safe = threatIntelService.getIPReputation(ip1);
        assertEquals("SAFE", safe.getRisk());
        
        // MODERATE (50-79)
        threatIntelService.updateIPReputation(ip2, "CRITICAL");
        IPReputation moderate = threatIntelService.getIPReputation(ip2);
        assertEquals("MODERATE", moderate.getRisk());
        
        // MALICIOUS (0-19)
        for (int i = 0; i < 5; i++) {
            threatIntelService.updateIPReputation(ip3, "CRITICAL");
        }
        IPReputation malicious = threatIntelService.getIPReputation(ip3);
        assertEquals("MALICIOUS", malicious.getRisk());
    }

    @Test
    void testShareAttackIntelligence() {
        // Test attack intelligence sharing
        AttackReport report = AttackReport.builder()
            .sourceIp("192.168.1.107")
            .attackType("DDoS")
            .severity("CRITICAL")
            .timestamp(Instant.now())
            .build();
        
        String txHash = threatIntelService.shareAttackIntelligence(report);
        
        assertNotNull(txHash);
        assertTrue(txHash.startsWith("0x") || txHash.equals("LOCAL_STORAGE"));
    }

    @Test
    void testGlobalThreatStatistics() {
        // Test global statistics retrieval
        ThreatStatistics stats = threatIntelService.getGlobalThreatStatistics();
        
        assertNotNull(stats);
        assertTrue(stats.getTotalReports() >= 0);
        assertTrue(stats.getUniqueIPs() >= 0);
        assertNotNull(stats.getTopAttackTypes());
    }
}
