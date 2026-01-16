package com.defenddos.backend_service.config;

import com.defenddos.backend_service.service.SecurityAuditService;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enhanced rate limiting interceptor with endpoint-specific limits.
 * Prevents API abuse with granular control per endpoint type.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitInterceptor.class);

    private final SecurityAuditService auditService;

    // Store buckets per IP + endpoint combination
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    // Endpoint-specific rate limits (requests per minute)
    private static final Map<String, Integer> ENDPOINT_LIMITS = Map.ofEntries(
            Map.entry("/api/v1/traffic/ingest", 10), // Critical: traffic ingestion
            Map.entry("/api/v1/mitigation/block", 5), // Critical: IP blocking
            Map.entry("/api/v1/security/analyze", 10), // Sensitive: analysis
            Map.entry("/api/v1/data/raw-query", 2), // Dangerous: raw queries
            Map.entry("/api/v1/threat-intelligence/add", 5), // Sensitive: threat DB
            Map.entry("/api/incidents/execute", 5), // Critical: incident response
            Map.entry("DEFAULT", 60) // Default for other endpoints
    );

    public RateLimitInterceptor(SecurityAuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
            Object handler) throws Exception {
        String ip = getClientIpAddress(request);
        String path = request.getRequestURI();

        // Determine rate limit for this endpoint
        int limit = determineRateLimit(path);

        // Create unique key for IP + endpoint combination
        String bucketKey = ip + ":" + getEndpointCategory(path);
        Bucket bucket = cache.computeIfAbsent(bucketKey,
                k -> createBucketWithLimit(limit));

        if (bucket.tryConsume(1)) {
            logger.debug("Request allowed for IP: {} on {}", ip, path);
            return true;
        } else {
            logger.warn("Rate limit exceeded for IP: {} on {} (limit: {}/min)",
                    ip, path, limit);

            // Log to security audit
            auditService.logRateLimitExceeded(ip, path, limit);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                    "{\"error\": \"Rate limit exceeded\", " +
                            "\"message\": \"Maximum %d requests per minute allowed for this endpoint\", " +
                            "\"endpoint\": \"%s\", " +
                            "\"retryAfter\": 60}",
                    limit, path));
            return false;
        }
    }

    /**
     * Determine rate limit based on endpoint path
     */
    private int determineRateLimit(String path) {
        return ENDPOINT_LIMITS.entrySet().stream()
                .filter(entry -> !entry.getKey().equals("DEFAULT") && path.contains(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(ENDPOINT_LIMITS.get("DEFAULT"));
    }

    /**
     * Get endpoint category for bucket key (prevents cache explosion)
     */
    private String getEndpointCategory(String path) {
        for (String endpoint : ENDPOINT_LIMITS.keySet()) {
            if (!endpoint.equals("DEFAULT") && path.contains(endpoint)) {
                return endpoint;
            }
        }
        return "DEFAULT";
    }

    /**
     * Create bucket with specified limit
     */
    private Bucket createBucketWithLimit(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(requestsPerMinute)
                .refillGreedy(requestsPerMinute, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Extract client IP address (handles proxies)
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
