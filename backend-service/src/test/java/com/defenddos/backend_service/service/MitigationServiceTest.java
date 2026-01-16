package com.defenddos.backend_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

class MitigationServiceTest {

    @Mock
    private RedisBlocklistService redisBlocklistService;

    @Mock
    private SecurityAuditService auditService;

    @InjectMocks
    private MitigationService mitigationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Set properties using reflection
        ReflectionTestUtils.setField(mitigationService, "mitigationEnabled", true);
        ReflectionTestUtils.setField(mitigationService, "dryRunMode", false);
        ReflectionTestUtils.setField(mitigationService, "maxBlockedIps", 100);

        // Default mock behavior
        when(redisBlocklistService.blockIp(anyString(), anyString())).thenReturn(true);
        when(redisBlocklistService.isIpBlocked(anyString())).thenReturn(false);
        when(redisBlocklistService.getBlockedIps()).thenReturn(Collections.emptySet());
    }

    @Test
    @DisplayName("Should block valid IPv4 address")
    void testBlockValidIPv4() {
        String ip = "192.168.1.100";
        String reason = "Test block";
        
        boolean result = mitigationService.blockIp(ip, reason);
        
        assertTrue(result, "Should successfully block valid IPv4");
        verify(redisBlocklistService, times(1)).blockIp(eq(ip), eq(reason));
        verify(auditService, times(1)).logIpBlocked(eq(ip), eq(reason), anyString());
    }

    @Test
    @DisplayName("Should reject invalid IP format")
    void testRejectInvalidIP() {
        boolean result = mitigationService.blockIp("invalid.ip.address", "Test");
        assertFalse(result, "Should reject invalid IP format");
        verify(redisBlocklistService, times(0)).blockIp(anyString(), anyString());
    }

    @Test
    @DisplayName("Should not block protected IPs")
    void testProtectedIPs() {
        boolean result = mitigationService.blockIp("127.0.0.1", "Test");
        assertFalse(result, "Should not block localhost");

        result = mitigationService.blockIp("::1", "Test");
        assertFalse(result, "Should not block IPv6 localhost");
        
        verify(redisBlocklistService, times(0)).blockIp(anyString(), anyString());
    }

    @Test
    @DisplayName("Should sanitize malicious reason string")
    void testSanitizeReason() {
        String ip = "192.168.1.1";
        String maliciousReason = "Test <script>alert('xss')</script>";
        // Note: The reason is sanitized inside blockIp via sanitizeReason method (if not dry run)
        // Since we are mocking redisBlocklistService, we check what was passed to it.
        
        mitigationService.blockIp(ip, maliciousReason);

        // Verify that the call to redisBlocklistService used a sanitized string
        verify(redisBlocklistService).blockIp(eq(ip),  org.mockito.ArgumentMatchers.argThat(arg -> 
            arg != null && !arg.contains("<script>") && !arg.contains("</script>")
        ));
    }

    @Test
    @DisplayName("Should respect max blocked IPs limit")
    void testMaxBlockedLimit() {
        // Mock current set to be full (100 items)
        Set<String> mockSet = java.util.stream.IntStream.range(0, 100)
            .mapToObj(i -> "10.0.0." + i)
            .collect(java.util.stream.Collectors.toSet());
            
        when(redisBlocklistService.getBlockedIps()).thenReturn(mockSet);

        boolean result = mitigationService.blockIp("10.0.1.1", "Test overflow");
        
        assertFalse(result, "Should reject when limit reached");
        verify(redisBlocklistService, times(0)).blockIp(eq("10.0.1.1"), anyString());
    }
}
