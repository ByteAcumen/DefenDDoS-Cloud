package com.defenddos.backend_service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Service responsible for automated mitigation of detected threats.
 * Provides IP blocking/unblocking capabilities using Redis for distributed
 * storage.
 * 
 * NOTE: For Render/Cloud compatibility, this service uses Application-Layer
 * blocking
 * with Redis-backed storage to ensure consistency across multiple instances.
 */
@Service
public class MitigationService {

    private static final Logger logger = LoggerFactory.getLogger(MitigationService.class);

    // IP address validation pattern (both IPv4 and basic IPv6)
    private static final Pattern IP_PATTERN = Pattern.compile(
            "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|" +
                    "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$");

    private final RedisBlocklistService redisBlocklistService;
    private final SecurityAuditService auditService;

    @Value("${defenddos.mitigation.enabled:true}")
    private boolean mitigationEnabled;

    @Value("${defenddos.mitigation.dry-run:false}")
    private boolean dryRunMode;

    @Value("${defenddos.mitigation.max-blocked-ips:100}")
    private int maxBlockedIps;

    public MitigationService(RedisBlocklistService redisBlocklistService,
            SecurityAuditService auditService) {
        this.redisBlocklistService = redisBlocklistService;
        this.auditService = auditService;
        logger.info("MitigationService initialized with Redis-backed IP blocking");
    }

    /**
     * Validate reason string to prevent command injection
     */
    private boolean isValidReason(String reason) {
        if (reason == null || reason.isEmpty()) {
            return true; // Allow empty reasons
        }

        // Allow only safe characters: alphanumeric, spaces, basic punctuation
        // Max length: 200 characters
        return reason.matches("^[a-zA-Z0-9\\s\\-_.,!?()]{1,200}$");
    }

    /**
     * Sanitize reason string
     */
    private String sanitizeReason(String reason) {
        if (reason == null || reason.isEmpty()) {
            return "No reason provided";
        }

        // Remove any potentially dangerous characters
        String sanitized = reason.replaceAll("[^a-zA-Z0-9\\s\\-_.,!?()]", "");
        return sanitized.substring(0, Math.min(sanitized.length(), 200));
    }

    /**
     * Block an IP address using application-layer blocking
     */
    public boolean blockIp(String ipAddress, String reason) {
        if (!mitigationEnabled) {
            logger.info("Mitigation disabled - skipping IP block for: {}", ipAddress);
            return false;
        }

        String sanitizedIp = ipAddress.trim();

        // Validate and sanitize reason
        if (!isValidReason(reason)) {
            logger.warn("Invalid reason format, sanitizing: {}", reason);
            reason = sanitizeReason(reason);
        }

        // Validate IP address format
        if (!isValidIpAddress(sanitizedIp)) {
            logger.warn("Invalid IP address format attempted for blocking: {}", sanitizedIp);
            return false;
        }

        // Check if already blocked (check Redis)
        if (redisBlocklistService.isIpBlocked(sanitizedIp)) {
            logger.info("IP {} is already blocked", sanitizedIp);
            return true;
        }

        // Check maximum blocked IPs limit
        int currentBlockedCount = redisBlocklistService.getBlockedIps().size();
        if (currentBlockedCount >= maxBlockedIps) {
            logger.warn("Maximum blocked IPs limit ({}) reached. Cannot block: {}", maxBlockedIps, sanitizedIp);
            return false;
        }

        // Prevent blocking localhost or local IPs in dev (optional, but good safety)
        if (isProtectedIp(sanitizedIp)) {
            logger.warn("Attempted to block protected IP: {} - blocking prevented", sanitizedIp);
            return false;
        }

        if (dryRunMode) {
            logger.info("[DRY RUN] Would block IP: {} for reason: {}", sanitizedIp, reason);
            return true;
        }

        // Action: Add to Redis
        boolean success = redisBlocklistService.blockIp(sanitizedIp, reason);

        if (success) {
            auditService.logIpBlocked(sanitizedIp, reason, "MitigationService");
            logger.info("BLOCKED IP in Redis: {} for reason: {}", sanitizedIp, reason);
        } else {
            logger.error("Failed to block IP in Redis: {}", sanitizedIp);
        }

        return success;
    }

    /**
     * Unblock an IP address
     */
    public boolean unblockIp(String ipAddress) {
        String sanitizedIp = ipAddress.trim();

        if (!isValidIpAddress(sanitizedIp)) {
            logger.warn("Invalid IP address format for unblocking: {}", sanitizedIp);
            return false;
        }

        if (dryRunMode) {
            logger.info("[DRY RUN] Would unblock IP: {}", sanitizedIp);
            return true;
        }

        boolean success = redisBlocklistService.unblockIp(sanitizedIp);

        if (success) {
            auditService.logIpUnblocked(sanitizedIp, "MitigationService");
            logger.info("UNBLOCKED IP from Redis: {}", sanitizedIp);
        }

        return success;
    }

    /**
     * Check if an IP is blocked.
     * Used by IpBlockingFilter to reject requests.
     */
    public boolean isIpBlocked(String ipAddress) {
        if (dryRunMode || ipAddress == null) {
            return false;
        }
        return redisBlocklistService.isIpBlocked(ipAddress.trim());
    }

    /**
     * Get set of currently blocked IPs from Redis
     */
    public Set<String> getBlockedIps() {
        return redisBlocklistService.getBlockedIps();
    }

    /**
     * Get mitigation status information
     */
    public MitigationStatus getStatus() {
        int blockedCount = redisBlocklistService.getBlockedIps().size();
        return new MitigationStatus(
                mitigationEnabled,
                dryRunMode,
                blockedCount,
                maxBlockedIps);
    }

    /**
     * Validate IP address format
     */
    private boolean isValidIpAddress(String ip) {
        return ip != null && !ip.trim().isEmpty() && IP_PATTERN.matcher(ip.trim()).matches();
    }

    /**
     * Check if IP should be protected from blocking
     */
    private boolean isProtectedIp(String ip) {
        return ip.equals("127.0.0.1") ||
                ip.equals("::1") ||
                ip.equals("0.0.0.0");
    }

    /**
     * Status information for mitigation service
     */
    public static class MitigationStatus {
        private final boolean enabled;
        private final boolean dryRunMode;
        private final int blockedCount;
        private final int maxBlockedIps;

        public MitigationStatus(boolean enabled, boolean dryRunMode, int blockedCount, int maxBlockedIps) {
            this.enabled = enabled;
            this.dryRunMode = dryRunMode;
            this.blockedCount = blockedCount;
            this.maxBlockedIps = maxBlockedIps;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public boolean isDryRunMode() {
            return dryRunMode;
        }

        public int getBlockedCount() {
            return blockedCount;
        }

        public int getMaxBlockedIps() {
            return maxBlockedIps;
        }
    }
}
