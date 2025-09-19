package com.defenddos.backend_service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Service responsible for automated mitigation of detected threats
 * Provides IP blocking/unblocking capabilities with safety checks
 */
@Service
public class MitigationService {

    private static final Logger logger = LoggerFactory.getLogger(MitigationService.class);
    
    // IP address validation pattern (both IPv4 and basic IPv6)
    private static final Pattern IP_PATTERN = Pattern.compile(
        "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|" +
        "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$"
    );
    
    // Track blocked IPs to prevent duplicates and enable management
    private final Set<String> blockedIps = ConcurrentHashMap.newKeySet();
    
    @Value("${defenddos.mitigation.enabled:true}")
    private boolean mitigationEnabled;
    
    @Value("${defenddos.mitigation.dry-run:true}")
    private boolean dryRunMode;
    
    @Value("${defenddos.mitigation.block-script-path:/usr/local/bin/block_ip.sh}")
    private String blockScriptPath;
    
    @Value("${defenddos.mitigation.unblock-script-path:/usr/local/bin/unblock_ip.sh}")
    private String unblockScriptPath;
    
    @Value("${defenddos.mitigation.max-blocked-ips:100}")
    private int maxBlockedIps;

    /**
     * Block an IP address using configured mitigation strategy
     */
    public boolean blockIp(String ipAddress, String reason) {
        if (!mitigationEnabled) {
            logger.info("Mitigation disabled - skipping IP block for: {}", ipAddress);
            return false;
        }
        
        // Validate IP address format
        if (!isValidIpAddress(ipAddress)) {
            logger.warn("Invalid IP address format attempted for blocking: {}", ipAddress);
            return false;
        }
        
        // Check if already blocked
        if (blockedIps.contains(ipAddress)) {
            logger.info("IP {} is already blocked", ipAddress);
            return true;
        }
        
        // Check maximum blocked IPs limit
        if (blockedIps.size() >= maxBlockedIps) {
            logger.warn("Maximum blocked IPs limit ({}) reached. Cannot block: {}", maxBlockedIps, ipAddress);
            return false;
        }
        
        // Prevent blocking localhost or common safe IPs
        if (isProtectedIp(ipAddress)) {
            logger.warn("Attempted to block protected IP: {} - blocking prevented", ipAddress);
            return false;
        }
        
        try {
            if (dryRunMode) {
                logger.info("[DRY RUN] Would block IP: {} for reason: {}", ipAddress, reason);
                simulateBlock(ipAddress);
            } else {
                logger.info("Blocking IP: {} for reason: {}", ipAddress, reason);
                executeBlockCommand(ipAddress);
            }
            
            blockedIps.add(ipAddress);
            logger.info("Successfully blocked IP: {}. Total blocked IPs: {}", ipAddress, blockedIps.size());
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to block IP: {} - {}", ipAddress, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Unblock an IP address
     */
    public boolean unblockIp(String ipAddress) {
        if (!isValidIpAddress(ipAddress)) {
            logger.warn("Invalid IP address format for unblocking: {}", ipAddress);
            return false;
        }
        
        if (!blockedIps.contains(ipAddress)) {
            logger.info("IP {} is not currently blocked", ipAddress);
            return true;
        }
        
        try {
            if (dryRunMode) {
                logger.info("[DRY RUN] Would unblock IP: {}", ipAddress);
            } else {
                logger.info("Unblocking IP: {}", ipAddress);
                executeUnblockCommand(ipAddress);
            }
            
            blockedIps.remove(ipAddress);
            logger.info("Successfully unblocked IP: {}. Total blocked IPs: {}", ipAddress, blockedIps.size());
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to unblock IP: {} - {}", ipAddress, e.getMessage(), e);
            return false;
        }
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
            maxBlockedIps,
            blockScriptPath,
            unblockScriptPath
        );
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
        // Protect localhost, local network, and common safe ranges
        return ip.equals("127.0.0.1") || 
               ip.equals("::1") ||
               ip.startsWith("192.168.") ||
               ip.startsWith("10.") ||
               ip.startsWith("172.16.") ||
               ip.equals("0.0.0.0");
    }

    /**
     * Execute the actual block command
     */
    private void executeBlockCommand(String ipAddress) throws IOException, InterruptedException {
        String[] command = {blockScriptPath, ipAddress};
        Process process = new ProcessBuilder(command)
            .redirectErrorStream(true)
            .start();
        
        // Capture output for logging
        String output = captureProcessOutput(process);
        int exitCode = process.waitFor();
        
        if (exitCode == 0) {
            logger.debug("Block command executed successfully for IP: {}. Output: {}", ipAddress, output);
        } else {
            throw new RuntimeException("Block command failed with exit code: " + exitCode + ". Output: " + output);
        }
    }

    /**
     * Execute the unblock command
     */
    private void executeUnblockCommand(String ipAddress) throws IOException, InterruptedException {
        String[] command = {unblockScriptPath, ipAddress};
        Process process = new ProcessBuilder(command)
            .redirectErrorStream(true)
            .start();
        
        String output = captureProcessOutput(process);
        int exitCode = process.waitFor();
        
        if (exitCode == 0) {
            logger.debug("Unblock command executed successfully for IP: {}. Output: {}", ipAddress, output);
        } else {
            throw new RuntimeException("Unblock command failed with exit code: " + exitCode + ". Output: " + output);
        }
    }

    /**
     * Simulate blocking for dry-run mode
     */
    private void simulateBlock(String ipAddress) {
        // In dry-run mode, just log what would happen
        logger.info("[SIMULATION] iptables -A INPUT -s {} -j DROP", ipAddress);
        
        // Add a small delay to simulate command execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Capture process output for logging
     */
    private String captureProcessOutput(Process process) throws IOException {
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }
        return output.toString().trim();
    }

    /**
     * Status information for mitigation service
     */
    public static class MitigationStatus {
        private final boolean enabled;
        private final boolean dryRunMode;
        private final int blockedCount;
        private final int maxBlockedIps;
        private final String blockScriptPath;
        private final String unblockScriptPath;

        public MitigationStatus(boolean enabled, boolean dryRunMode, int blockedCount, 
                              int maxBlockedIps, String blockScriptPath, String unblockScriptPath) {
            this.enabled = enabled;
            this.dryRunMode = dryRunMode;
            this.blockedCount = blockedCount;
            this.maxBlockedIps = maxBlockedIps;
            this.blockScriptPath = blockScriptPath;
            this.unblockScriptPath = unblockScriptPath;
        }

        // Getters
        public boolean isEnabled() { return enabled; }
        public boolean isDryRunMode() { return dryRunMode; }
        public int getBlockedCount() { return blockedCount; }
        public int getMaxBlockedIps() { return maxBlockedIps; }
        public String getBlockScriptPath() { return blockScriptPath; }
        public String getUnblockScriptPath() { return unblockScriptPath; }
    }
}
