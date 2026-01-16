package com.defenddos.backend_service.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import com.defenddos.backend_service.config.DefenDDoSProperties;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Redis-backed IP blocklist service with local Caffeine cache for performance.
 * Provides distributed IP blocking across multiple backend instances.
 */
@Service
public class RedisBlocklistService {

    private static final Logger logger = LoggerFactory.getLogger(RedisBlocklistService.class);
    private static final String BLOCKLIST_PREFIX = "defenddos:blocked:";

    private final RedisTemplate<String, String> redisTemplate;
    private final DefenDDoSProperties properties;
    private final Cache<String, Boolean> localCache;

    public RedisBlocklistService(RedisTemplate<String, String> redisTemplate,
            DefenDDoSProperties properties) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;

        // Local Caffeine cache for fast reads
        int cacheSeconds = properties.getRedis().getLocalCacheSeconds();
        this.localCache = Caffeine.newBuilder()
                .expireAfterWrite(cacheSeconds, TimeUnit.SECONDS)
                .maximumSize(10000)
                .build();

        logger.info("RedisBlocklistService initialized with {}s local cache TTL", cacheSeconds);
    }

    /**
     * Block an IP address in Redis with TTL
     */
    public boolean blockIp(String ip, String reason) {
        try {
            String key = BLOCKLIST_PREFIX + ip;
            long ttl = properties.getRedis().getTtlHours();

            redisTemplate.opsForValue().set(key, reason, ttl, TimeUnit.HOURS);
            localCache.put(ip, true); // Update local cache

            logger.debug("Blocked IP in Redis: {} with TTL {}h", ip, ttl);
            return true;
        } catch (Exception e) {
            logger.error("Failed to block IP in Redis: {}", ip, e);
            return false;
        }
    }

    /**
     * Unblock an IP address from Redis
     */
    public boolean unblockIp(String ip) {
        try {
            String key = BLOCKLIST_PREFIX + ip;
            redisTemplate.delete(key);
            localCache.invalidate(ip); // Remove from local cache

            logger.debug("Unblocked IP in Redis: {}", ip);
            return true;
        } catch (Exception e) {
            logger.error("Failed to unblock IP in Redis: {}", ip, e);
            return false;
        }
    }

    /**
     * Check if an IP is blocked (with local cache for performance)
     */
    public boolean isIpBlocked(String ip) {
        // Check local cache first (fast path - sub-millisecond)
        Boolean cached = localCache.getIfPresent(ip);
        if (cached != null) {
            logger.trace("IP {} found in local cache: {}", ip, cached);
            return cached;
        }

        // Check Redis (slow path - few milliseconds)
        try {
            String key = BLOCKLIST_PREFIX + ip;
            Boolean exists = redisTemplate.hasKey(key);

            if (exists != null && exists) {
                localCache.put(ip, true); // Cache the result
                logger.debug("IP {} is blocked (Redis check)", ip);
                return true;
            } else {
                // Cache 'false' (not blocked) to prevent cache stampede on Redis
                // This means a newly blocked IP might be allowed for 'localCacheSeconds'
                // on this specific instance if it was recently checked.
                localCache.put(ip, false);
                return false;
            }
        } catch (Exception e) {
            logger.warn("Redis check failed for IP: {}, failing open (allowing request)", ip);
            return false; // Fail-open strategy for availability
        }
    }

    /**
     * Get all currently blocked IPs from Redis
     */
    public Set<String> getBlockedIps() {
        try {
            Set<String> keys = redisTemplate.keys(BLOCKLIST_PREFIX + "*");
            if (keys == null) {
                return Collections.emptySet();
            }

            return keys.stream()
                    .map(key -> key.replace(BLOCKLIST_PREFIX, ""))
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            logger.error("Failed to retrieve blocked IPs from Redis", e);
            return Collections.emptySet();
        }
    }

    /**
     * Get the reason why an IP was blocked
     */
    public String getBlockReason(String ip) {
        try {
            String key = BLOCKLIST_PREFIX + ip;
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            logger.error("Failed to get block reason for IP: {}", ip, e);
            return null;
        }
    }

    /**
     * Clear the local cache (useful for testing or manual refresh)
     */
    public void clearLocalCache() {
        localCache.invalidateAll();
        logger.info("Local cache cleared");
    }
}
