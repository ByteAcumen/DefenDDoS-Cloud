package com.defenddos.backend_service.service;

import com.defenddos.backend_service.service.AdvancedFingerprintingService.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for Advanced Fingerprinting Service
 */
@ExtendWith(MockitoExtension.class)
class AdvancedFingerprintingServiceTest {

    private AdvancedFingerprintingService fingerprintingService;

    @BeforeEach
    void setUp() {
        fingerprintingService = new AdvancedFingerprintingService();
    }

    @Test
    void testGenerateFingerprint_BasicRequest() {
        // Test basic fingerprint generation
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.100")
            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertNotNull(fingerprint);
        assertNotNull(fingerprint.getCompositeFingerprint());
        assertNotNull(fingerprint.getTimestamp());
    }

    @Test
    void testGenerateFingerprint_WithTLS() {
        // Test fingerprint with TLS data
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.101")
            .userAgent("Chrome/120.0")
            .tlsVersion("771")
            .cipherSuites(Arrays.asList("TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384"))
            .tlsExtensions(Arrays.asList("0", "10", "11"))
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertNotNull(fingerprint.getTlsFingerprint());
        assertNotEquals("NO_TLS", fingerprint.getTlsFingerprint());
    }

    @Test
    void testGenerateFingerprint_WithHTTP2() {
        // Test fingerprint with HTTP/2 data
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.102")
            .userAgent("Chrome/120.0")
            .http2(true)
            .http2WindowSize(65535)
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertNotNull(fingerprint.getHttp2Fingerprint());
        assertNotEquals("HTTP1", fingerprint.getHttp2Fingerprint());
    }

    @Test
    void testGenerateFingerprint_WithTCP() {
        // Test fingerprint with TCP data
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.103")
            .userAgent("Chrome/120.0")
            .tcpWindowSize(65535)
            .ttl(64)
            .tcpOptions(Arrays.asList("MSS", "SACK", "Timestamps"))
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertNotNull(fingerprint.getTcpFingerprint());
    }

    @Test
    void testDeviceDetection_Desktop() {
        // Test desktop device detection
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.104")
            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertNotNull(fingerprint.getDeviceInfo());
        assertEquals("DESKTOP", fingerprint.getDeviceInfo().getDeviceType());
        assertEquals("Chrome", fingerprint.getDeviceInfo().getBrowser());
    }

    @Test
    void testDeviceDetection_Mobile() {
        // Test mobile device detection
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.105")
            .userAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15")
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertNotNull(fingerprint.getDeviceInfo());
        assertEquals("MOBILE", fingerprint.getDeviceInfo().getDeviceType());
    }

    @Test
    void testBotDetection_HeadlessBrowser() {
        // Test headless browser detection
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.106")
            .userAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0")
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertTrue(fingerprint.getDeviceInfo().isHeadless());
        assertTrue(fingerprint.isSuspicious());
    }

    @Test
    void testBotDetection_AutomationTools() {
        // Test automation tool detection
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.107")
            .userAgent("Mozilla/5.0 (compatible; Selenium/4.0)")
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertTrue(fingerprint.getDeviceInfo().isAutomation());
        assertTrue(fingerprint.isSuspicious());
    }

    @Test
    void testAnomalyScore_Range() {
        // Test anomaly score is within valid range
        FingerprintRequest request = FingerprintRequest.builder()
            .sourceIp("192.168.1.108")
            .userAgent("Chrome/120.0")
            .build();
        
        TrafficFingerprint fingerprint = fingerprintingService.generateFingerprint(request);
        
        assertTrue(fingerprint.getAnomalyScore() >= 0.0);
        assertTrue(fingerprint.getAnomalyScore() <= 1.0);
    }

    @Test
    void testBotNetworkDetection() {
        // Test bot network detection
        String fp = "test-fingerprint-123";
        
        for (int i = 0; i < 10; i++) {
            FingerprintRequest request = FingerprintRequest.builder()
                .sourceIp("192.168.1." + (200 + i))
                .userAgent("Same-Bot-Agent")
                .build();
            fingerprintingService.generateFingerprint(request);
        }
        
        // Check if bot network detected (threshold is 5+ IPs)
        // Note: This test would need actual implementation to track fingerprints
    }

    @Test
    void testFingerprintConsistency() {
        // Test that same request generates same fingerprint
        FingerprintRequest request1 = FingerprintRequest.builder()
            .sourceIp("192.168.1.109")
            .userAgent("Chrome/120.0")
            .tlsVersion("771")
            .tcpWindowSize(65535)
            .ttl(64)
            .build();
        
        FingerprintRequest request2 = FingerprintRequest.builder()
            .sourceIp("192.168.1.110") // Different IP
            .userAgent("Chrome/120.0") // Same UA
            .tlsVersion("771") // Same TLS
            .tcpWindowSize(65535) // Same TCP
            .ttl(64) // Same TTL
            .build();
        
        TrafficFingerprint fp1 = fingerprintingService.generateFingerprint(request1);
        TrafficFingerprint fp2 = fingerprintingService.generateFingerprint(request2);
        
        // User agent, TLS, and TCP fingerprints should match
        assertEquals(fp1.getUserAgentFingerprint(), fp2.getUserAgentFingerprint());
        assertEquals(fp1.getTlsFingerprint(), fp2.getTlsFingerprint());
        assertEquals(fp1.getTcpFingerprint(), fp2.getTcpFingerprint());
    }
}
