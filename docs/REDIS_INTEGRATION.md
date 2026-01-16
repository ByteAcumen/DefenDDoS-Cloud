# Redis Integration Guide

**Version:** 1.0  
**Date:** January 2026  
**Status:** Integrated & Tested

---

## 🚀 Overview

The DefenDDoS backend now uses **Redis** for managing blocked IPs (Blocklist). This replaces the previous in-memory `ConcurrentHashMap` implementation, offering several critical advantages for production environments:

1.  **Persistence:** Blocked IPs survive application restarts.
2.  **Distributed State:** Multiple backend instances can share the same blocklist (essential for scaling).
3.  **TTL Management:** Built-in expiration for temporary blocks (e.g., 24-hour bans) is handled automatically by Redis.
4.  **Performance:** Extremely fast O(1) lookups for measuring if an incoming request is from a blocked IP.

---

## ⚙️ Configuration

### 1. Docker Compose
The `docker-compose.yml` has been updated to include a Redis 7.2 service:

```yaml
  redis:
    image: redis:7.2-alpine
    container_name: defenddos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --requirepass "defenddos-redis-secret" --appendonly yes
    networks:
      - defenddos-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "defenddos-redis-secret", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### 2. Application Properties
The backend connects using standard Spring Data Redis configuration in `application.properties` (or mapped via `DefenDDoSProperties.java`):

```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=defenddos-redis-secret
spring.data.redis.database=0
```

### 3. Java Configuration
A new configuration class `DefenDDoSProperties` now handles Redis settings type-safely:

```java
@Data
public class DefenDDoSProperties {
    // ... other props
    private Redis redis = new Redis();

    @Data
    public static class Redis {
        private String host = "localhost";
        private int port = 6379;
        private String password;
        private int ttlSeconds = 86400; // 24 hours
    }
}
```

---

## 🛠️ Implementation Details

### `RedisBlocklistService`
A new service component `RedisBlocklistService` handles the low-level Redis interactions using `StringRedisTemplate`.

**Key Methods:**
- `blockIp(String ip, String reason)`: Adds IP to Redis with a TTL.
- `isBlocked(String ip)`: Checks existence (and effectively "touches" the TTL if we wanted to implement sliding expiration).
- `unblockIp(String ip)`: Removes the key.

### `MitigationService` Refactoring
The `MitigationService` was refactored to depend on `RedisBlocklistService` instead of managing its own `ConcurrentHashMap`.

- **Old Way:** `blockedIps.put(ip, details)` (Lost on restart)
- **New Way:** `redisBlocklistService.blockIp(ip, reason)` (Persistent)

---

## 🧪 Testing

The implementation includes robust unit testing using Mockito to verify logic without needing a running Redis instance during build time.

**Test File:** `src/test/java/com/defenddos/backend_service/service/MitigationServiceTest.java`

**Test Cases:**
1.  **Block IP:** Verifies `redisBlocklistService.blockIp` is called with correct parameters.
2.  **Check IP:** Verifies `isBlocked` returns correct boolean status.
3.  **Validation:** Ensures invalid IPs (e.g., `invalid.ip`, `::1`) are rejected before hitting Redis.
4.  **Sanitization:** verifies that script tags in "reasons" are stripped before storage.

---

## 🔄 Migration Steps

If you are upgrading an existing deployment:
1.  **Stop services:** `docker-compose down`
2.  **Pull Redis:** `docker-compose pull redis`
3.  **Start all:** `docker-compose up -d`
4.  **Verify:** Check logs for "MitigationService initialized with Redis-backed IP blocking".
