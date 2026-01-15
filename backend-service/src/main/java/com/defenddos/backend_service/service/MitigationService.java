package com.defenddos.backend_service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Service responsible for automated mitigation of detected threats
 * Provides IP blocking/unblocking capabilities.
 * 
 * NOTE: For Render/Cloud compatibility, this service uses Application-Layer
 * blocking.
 * It maintains a list of blocked IPs in memory. An IpBlockingFilter should be
 * used
 * to reject requests from these IPs.
 */
@Service
public class MitigationService {

    private static final Logger logger = LoggerFactory.getLogger(MitigationService.class);

    // IP address validation pattern (both IPv4 and basic IPv6)
    private static final Pattern IP_PATTERN = Pattern.compile(
            "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|" +
                    "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$");

    // Track blocked IPs (Thread-safe Set)
    private final Set<String> blockedIps = ConcurrentHashMap.newKeySet();

    @Value("${defenddos.mitigation.enabled:true}")
    private boolean mitigationEnabled;

    @Value("${defenddos.mitigation.dry-run:false}")
    private boolean dryRunMode;

    @Value("${defenddos.mitigation.max-blocked-ips:100}")
    private int maxBlockedIps;

    /**
     * Block an IP address using application-layer blocking
     */
    /**
     * Block an IP address using application-layer blocking
     */
    public boolean blockIp(String ipAddress, String reason) {
        if (!mitigationEnabled) {
            logger.info("Mitigation disabled - skipping IP block for: {}", ipAddress);
            return false;
        }

        String sanitizedIp = ipAddress.trim();

        // Validate IP address format
        if (!isValidIpAddress(sanitizedIp)) {
            logger.warn("Invalid IP address format attempted for blocking: {}", sanitizedIp);
            return false;
        }

        // Check if already blocked
        if (blockedIps.contains(sanitizedIp)) {
            logger.info("IP {} is already blocked", sanitizedIp);
            return true;
        }

        // Check maximum blocked IPs limit
        if (blockedIps.size() >= maxBlockedIps) {
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

        // Action: Add to memory set
        blockedIps.add(sanitizedIp);
        logger.info("BLOCKED IP: {} for reason: {}. Total blocked: {}", sanitizedIp, reason, blockedIps.size());

        // TODO: In a real distributed system, publish this event to Redis/Kafka so
        // other instances also block it.
        return true;
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

        if (!blockedIps.contains(sanitizedIp)) {
            logger.info("IP {} is not currently blocked", sanitizedIp);
            return true;
        }

        if (dryRunMode) {
            logger.info("[DRY RUN] Would unblock IP: {}", sanitizedIp);
            return true;
        }

        blockedIps.remove(sanitizedIp);
        logger.info("UNBLOCKED IP: {}. Total blocked: {}", sanitizedIp, blockedIps.size());
        return true;
    }

    /**
     * Check if an IP is blocked.
     * Used by IpBlockingFilter to reject requests.
     */
    public boolean isIpBlocked(String ipAddress) {
        return !dryRunMode && ipAddress != null && blockedIps.contains(ipAddress.trim());
    }

    /**
     * Get set of currently blocked IPs
     */
    public Set<String> getBlockedIps() {
        return Set.copyOf(blockedIps);
    }

    /**
     * Get mitigation status information
     */
    public MitigationStatus getStatus() {
        return new MitigationStatus(
                mitigationEnabled,
                dryRunMode,
                blockedIps.size(),
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
