package com.defenddos.backend_service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Centralized security audit logging service.
 * Logs all security-related events to a separate audit log.
 */
@Service
public class SecurityAuditService {

    private static final Logger auditLogger = LoggerFactory.getLogger("SECURITY_AUDIT");

    /**
     * Log a blocked request
     */
    public void logBlockedRequest(String ip, String endpoint, String reason) {
        auditLogger.warn("BLOCKED_REQUEST | IP: {} | Endpoint: {} | Reason: {} | Timestamp: {}",
                ip, endpoint, reason, Instant.now());
    }

    /**
     * Log failed authentication attempt
     */
    public void logFailedAuthentication(String ip, String username) {
        auditLogger.warn("FAILED_AUTH | IP: {} | Username: {} | Timestamp: {}",
                ip, username, Instant.now());
    }

    /**
     * Log successful authentication
     */
    public void logSuccessfulAuthentication(String ip, String username) {
        auditLogger.info("SUCCESS_AUTH | IP: {} | Username: {} | Timestamp: {}",
                ip, username, Instant.now());
    }

    /**
     * Log IP blocking action
     */
    public void logIpBlocked(String ip, String reason, String source) {
        auditLogger.warn("IP_BLOCKED | IP: {} | Reason: {} | Source: {} | Timestamp: {}",
                ip, reason, source, Instant.now());
    }

    /**
     * Log IP unblocking action
     */
    public void logIpUnblocked(String ip, String source) {
        auditLogger.info("IP_UNBLOCKED | IP: {} | Source: {} | Timestamp: {}",
                ip, source, Instant.now());
    }

    /**
     * Log suspicious activity
     */
    public void logSuspiciousActivity(String ip, String activity, String details) {
        auditLogger.warn("SUSPICIOUS_ACTIVITY | IP: {} | Activity: {} | Details: {} | Timestamp: {}",
                ip, activity, details, Instant.now());
    }

    /**
     * Log rate limit exceeded
     */
    public void logRateLimitExceeded(String ip, String endpoint, int limit) {
        auditLogger.warn("RATE_LIMIT_EXCEEDED | IP: {} | Endpoint: {} | Limit: {}/min | Timestamp: {}",
                ip, endpoint, limit, Instant.now());
    }

    /**
     * Log attack detection
     */
    public void logAttackDetected(String sourceIp, String attackType, double confidence) {
        auditLogger.error("ATTACK_DETECTED | Source: {} | Type: {} | Confidence: {}% | Timestamp: {}",
                sourceIp, attackType, confidence * 100, Instant.now());
    }

    /**
     * Log privilege escalation attempt
     */
    public void logPrivilegeEscalation(String ip, String username, String attemptedAction) {
        auditLogger.error("PRIVILEGE_ESCALATION | IP: {} | User: {} | Action: {} | Timestamp: {}",
                ip, username, attemptedAction, Instant.now());
    }

    /**
     * Log data access
     */
    public void logDataAccess(String ip, String username, String resource) {
        auditLogger.info("DATA_ACCESS | IP: {} | User: {} | Resource: {} | Timestamp: {}",
                ip, username, resource, Instant.now());
    }

    /**
     * Log configuration change
     */
    public void logConfigurationChange(String ip, String username, String setting,
            String oldValue, String newValue) {
        auditLogger.warn("CONFIG_CHANGE | IP: {} | User: {} | Setting: {} | Old: {} | New: {} | Timestamp: {}",
                ip, username, setting, oldValue, newValue, Instant.now());
    }
}
