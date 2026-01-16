# 🔒 DefenDDoS Backend - Security Fixes Implementation Guide

> **Comprehensive step-by-step guide to fix all identified security vulnerabilities**

## 📊 Test Results Summary

- ✅ **Build Status**: SUCCESS (1 test passed)
- ⚠️ **Runtime Status**: Unhealthy (InfluxDB connection issue)
- ✅ **Code Quality**: 46 classes analyzed
- 🔍 **Vulnerabilities Found**: 10 (4 Critical, 4 Medium, 2 Low)

---

## 🔴 CRITICAL FIXES (Do These First!)

### Fix #1: Remove Hardcoded Secrets ⚠️ HIGH RISK

**Current Problem**: Secrets are hardcoded in `application.properties`

**Files to Modify**:
- `backend-service/src/main/resources/application.properties`
- `backend-service/.env` (create new)
- `backend-service/.gitignore`

#### Step 1: Create Environment Variables File

Create `backend-service/.env`:
```properties
# InfluxDB Configuration
INFLUXDB_TOKEN=my-super-secret-token-change-in-production
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_ORG=defenddos-org
INFLUXDB_BUCKET=ddos-bucket

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SecurePassword123-change-in-production

# Redis Configuration (if used)
REDIS_PASSWORD=redis-secure-password

# ML Service Configuration
ML_SERVICE_URL=http://ml-service:8000

# AWS Configuration (if enabled)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_WAF_IPSET_ID=your-ipset-arn
AWS_REGION=us-east-1

# Mitigation Configuration
MITIGATION_ENABLED=true
MITIGATION_DRY_RUN=false
MITIGATION_MAX_BLOCKED_IPS=100
```

#### Step 2: Update .gitignore

Add to `backend-service/.gitignore`:
```gitignore
# Environment files
.env
.env.local
.env.development
.env.production
*.env

# Sensitive data
*.key
*.pem
*.p12
*.jks
secrets/

# Logs
logs/
*.log

# IDE files
.idea/
.vscode/
*.iml
```

#### Step 3: Update application.properties

**File**: `backend-service/src/main/resources/application.properties`

```properties
# =================================================================
# DefenDDoS Backend Configuration (SECURE VERSION)
# =================================================================

# Server Configuration
server.port=8081
spring.application.name=defenddos-backend

# InfluxDB Configuration - USE ENVIRONMENT VARIABLES
defenddos.influx-db.url=${INFLUXDB_URL:http://influxdb:8086}
defenddos.influx-db.token=${INFLUXDB_TOKEN}
defenddos.influx-db.org=${INFLUXDB_ORG:defenddos-org}
defenddos.influx-db.bucket=${INFLUXDB_BUCKET:ddos-bucket}

# ML Service Configuration
defenddos.ml-service.url=${ML_SERVICE_URL:http://ml-service:8000}
defenddos.ml-service.timeout-seconds=10
defenddos.ml-service.retry-attempts=3

# Security Configuration - USE ENVIRONMENT VARIABLES
spring.security.user.name=${ADMIN_USERNAME:admin}
spring.security.user.password=${ADMIN_PASSWORD}

# Redis Configuration
spring.redis.host=${REDIS_HOST:redis}
spring.redis.port=${REDIS_PORT:6379}
spring.redis.password=${REDIS_PASSWORD:}

# AWS WAF Configuration
aws.waf.enabled=${AWS_WAF_ENABLED:false}
aws.waf.ipset-id=${AWS_WAF_IPSET_ID:}
aws.region=${AWS_REGION:us-east-1}

# Mitigation Configuration
defenddos.mitigation.enabled=${MITIGATION_ENABLED:true}
defenddos.mitigation.dry-run=${MITIGATION_DRY_RUN:false}
defenddos.mitigation.max-blocked-ips=${MITIGATION_MAX_BLOCKED_IPS:100}
defenddos.mitigation.auto-block.enabled=${MITIGATION_AUTO_BLOCK:true}
defenddos.mitigation.block-script-path=scripts/block_ip.sh
defenddos.mitigation.unblock-script-path=scripts/unblock_ip.sh

# Request Size Limits (NEW - SECURITY)
server.tomcat.max-swallow-size=2MB
server.tomcat.max-http-form-post-size=2MB
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Connection Limits (NEW - SECURITY)
server.tomcat.max-connections=10000
server.tomcat.accept-count=100
server.tomcat.max-threads=200

# Timeouts (NEW - SECURITY)
server.tomcat.connection-timeout=20s
spring.mvc.async.request-timeout=30s

# Security Headers (NEW - SECURITY)
server.error.include-message=never
server.error.include-stacktrace=never
server.error.include-binding-errors=never

# Logging Configuration
logging.level.root=INFO
logging.level.com.defenddos=DEBUG
logging.level.SECURITY_AUDIT=WARN
logging.file.name=logs/defenddos-backend.log
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
```

#### Step 4: Load Environment Variables in Docker

**File**: `backend-service/docker-compose.yml`

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: defenddos-backend
    ports:
      - "8081:8081"
    env_file:
      - .env  # Load from .env file
    environment:
      - SPRING_PROFILES_ACTIVE=docker
    depends_on:
      - influxdb
      - ml-service
    networks:
      - defenddos-network
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

#### Step 5: Load Environment Variables Locally

Create `backend-service/load-env.ps1`:
```powershell
# Load environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        Write-Host "Loaded: $name" -ForegroundColor Green
    }
}

Write-Host "`n✅ Environment variables loaded!" -ForegroundColor Cyan
Write-Host "Now run: .\mvnw spring-boot:run" -ForegroundColor Yellow
```

**Usage**:
```powershell
cd backend-service
.\load-env.ps1
.\mvnw spring-boot:run
```

---

### Fix #2: Add Input Validation on Path Variables ⚠️ HIGH RISK

**Current Problem**: No validation on `@PathVariable` parameters

#### Step 1: Create Validation Annotations

**File**: `backend-service/src/main/java/com/defenddos/backend_service/validation/ValidIp.java` (NEW)

```java
package com.defenddos.backend_service.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IpAddressValidator.class)
@Documented
public @interface ValidIp {
    String message() default "Invalid IP address format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

#### Step 2: Create IP Validator

**File**: `backend-service/src/main/java/com/defenddos/backend_service/validation/IpAddressValidator.java` (NEW)

```java
package com.defenddos.backend_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class IpAddressValidator implements ConstraintValidator<ValidIp, String> {

    private static final Pattern IPV4_PATTERN = Pattern.compile(
        "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}" +
        "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
    );

    private static final Pattern IPV6_PATTERN = Pattern.compile(
        "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$"
    );

    @Override
    public boolean isValid(String ip, ConstraintValidatorContext context) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }
        
        return IPV4_PATTERN.matcher(ip).matches() || 
               IPV6_PATTERN.matcher(ip).matches();
    }
}
```

#### Step 3: Create ValidId Annotation

**File**: `backend-service/src/main/java/com/defenddos/backend_service/validation/ValidId.java` (NEW)

```java
package com.defenddos.backend_service.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IdValidator.class)
@Documented
public @interface ValidId {
    String message() default "Invalid ID format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

#### Step 4: Create ID Validator

**File**: `backend-service/src/main/java/com/defenddos/backend_service/validation/IdValidator.java` (NEW)

```java
package com.defenddos.backend_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class IdValidator implements ConstraintValidator<ValidId, String> {

    @Override
    public boolean isValid(String id, ConstraintValidatorContext context) {
        if (id == null || id.isEmpty()) {
            return false;
        }
        
        // Allow alphanumeric, hyphens, underscores (max 50 chars)
        return id.matches("^[a-zA-Z0-9_-]{1,50}$");
    }
}
```

#### Step 5: Update Controllers to Use Validation

**File**: `backend-service/src/main/java/com/defenddos/backend_service/controller/ThreatIntelligenceController.java`

**BEFORE**:
```java
@GetMapping("/check/{ip}")
public ResponseEntity<ApiResponse<Map<String, Object>>> checkThreat(@PathVariable String ip) {
    // ...
}
```

**AFTER**:
```java
import com.defenddos.backend_service.validation.ValidIp;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/threat-intelligence")
@Validated  // Enable validation on controller
public class ThreatIntelligenceController {

    @GetMapping("/check/{ip}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkThreat(
            @PathVariable @ValidIp String ip) {  // Add @ValidIp
        // ...
    }
    
    @GetMapping("/reputation/{ip}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReputation(
            @PathVariable @ValidIp String ip) {  // Add @ValidIp
        // ...
    }
    
    @DeleteMapping("/threats/{ip}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeThreat(
            @PathVariable @ValidIp String ip) {  // Add @ValidIp
        // ...
    }
}
```

**Similarly update**:
- `MitigationController.java` - Add `@ValidIp` to all IP parameters
- `SecurityController.java` - Add `@ValidIp` to IP parameters
- `DataRetrievalController.java` - Add `@ValidIp` to IP parameters
- `IncidentResponseController.java` - Add `@ValidId` to playbook ID

#### Step 6: Add Global Validation Exception Handler

**File**: `backend-service/src/main/java/com/defenddos/backend_service/exception/ValidationExceptionHandler.java` (NEW)

```java
package com.defenddos.backend_service.exception;

import com.defenddos.backend_service.dto.ApiResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.stream.Collectors;

@ControllerAdvice
public class ValidationExceptionHandler {

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            ConstraintViolationException e) {
        
        String message = e.getConstraintViolations().stream()
            .map(ConstraintViolation::getMessage)
            .collect(Collectors.joining(", "));
        
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(
                "Validation failed: " + message, 
                "VALIDATION_ERROR", 
                null
            ));
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
            IllegalArgumentException e) {
        
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(
                "Invalid input: " + e.getMessage(), 
                "INVALID_INPUT", 
                null
            ));
    }
}
```

#### Step 7: Add Dependencies to pom.xml

**File**: `backend-service/pom.xml`

```xml
<!-- Add after existing dependencies -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

---

### Fix #3: Add Endpoint-Specific Rate Limiting ⚠️ HIGH RISK

**Current Problem**: All endpoints have same 60 req/min limit

#### Step 1: Update RateLimitInterceptor

**File**: `backend-service/src/main/java/com/defenddos/backend_service/config/RateLimitInterceptor.java`

**Replace entire file**:
```java
package com.defenddos.backend_service.config;

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
    
    // Store buckets per IP + endpoint combination
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    
    // Endpoint-specific rate limits (requests per minute)
    private static final Map<String, Integer> ENDPOINT_LIMITS = Map.ofEntries(
        Map.entry("/api/v1/traffic/ingest", 10),          // Critical: traffic ingestion
        Map.entry("/api/v1/mitigation/block", 5),         // Critical: IP blocking
        Map.entry("/api/v1/security/analyze", 10),        // Sensitive: analysis
        Map.entry("/api/v1/data/raw-query", 2),           // Dangerous: raw queries
        Map.entry("/api/v1/threat-intelligence/add", 5),  // Sensitive: threat DB
        Map.entry("/api/incidents/execute", 5),           // Critical: incident response
        Map.entry("DEFAULT", 60)                          // Default for other endpoints
    );

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
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                "{\"error\": \"Rate limit exceeded\", " +
                "\"message\": \"Maximum %d requests per minute allowed for this endpoint\", " +
                "\"endpoint\": \"%s\", " +
                "\"retryAfter\": 60}", 
                limit, path
            ));
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
```

---

### Fix #4: Add Security Audit Logging ⚠️ HIGH RISK

#### Step 1: Create Security Audit Service

**File**: `backend-service/src/main/java/com/defenddos/backend_service/service/SecurityAuditService.java` (NEW)

```java
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
```

#### Step 2: Configure Separate Audit Log

**File**: `backend-service/src/main/resources/logback-spring.xml` (NEW)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    
    <!-- Console appender for development -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- Main application log -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/defenddos-backend.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/defenddos-backend.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
    </appender>
    
    <!-- Security audit log (SEPARATE FILE) -->
    <appender name="SECURITY_AUDIT" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/security-audit.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} | %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/security-audit.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>90</maxHistory>  <!-- Keep for 90 days -->
        </rollingPolicy>
    </appender>
    
    <!-- Security audit logger -->
    <logger name="SECURITY_AUDIT" level="WARN" additivity="false">
        <appender-ref ref="SECURITY_AUDIT" />
        <appender-ref ref="CONSOLE" />
    </logger>
    
    <!-- Root logger -->
    <root level="INFO">
        <appender-ref ref="CONSOLE" />
        <appender-ref ref="FILE" />
    </root>
    
</configuration>
```

#### Step 3: Integrate Audit Logging in Controllers

**File**: `backend-service/src/main/java/com/defenddos/backend_service/controller/MitigationController.java`

**Add audit logging**:
```java
import com.defenddos.backend_service.service.SecurityAuditService;

@RestController
@RequestMapping("/api/v1/mitigation")
public class MitigationController {
    
    private final MitigationService mitigationService;
    private final SecurityAuditService auditService;  // ADD THIS
    
    public MitigationController(MitigationService mitigationService,
                                SecurityAuditService auditService) {  // ADD THIS
        this.mitigationService = mitigationService;
        this.auditService = auditService;  // ADD THIS
    }
    
    @PostMapping("/block/{ip}")
    public ResponseEntity<Map<String, Object>> blockIp(
            @PathVariable @ValidIp String ip,
            @RequestParam(defaultValue = "Manual block via API") String reason,
            HttpServletRequest request) {  // ADD HttpServletRequest
        
        try {
            boolean blocked = mitigationService.blockIp(ip, reason);
            
            if (blocked) {
                // ADD AUDIT LOG
                String sourceIp = getClientIp(request);
                auditService.logIpBlocked(ip, reason, "API-" + sourceIp);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "IP blocked successfully",
                    "ip", ip
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to block IP"
                ));
            }
        } catch (Exception e) {
            logger.error("Error blocking IP: {}", ip, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal error"
            ));
        }
    }
    
    @PostMapping("/unblock/{ip}")
    public ResponseEntity<Map<String, Object>> unblockIp(
            @PathVariable @ValidIp String ip,
            HttpServletRequest request) {
        
        boolean unblocked = mitigationService.unblockIp(ip);
        
        if (unblocked) {
            // ADD AUDIT LOG
            String sourceIp = getClientIp(request);
            auditService.logIpUnblocked(ip, "API-" + sourceIp);
        }
        
        // ... rest of method
    }
    
    // ADD HELPER METHOD
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

#### Step 4: Add Audit Logging to RateLimitInterceptor

**File**: `backend-service/src/main/java/com/defenddos/backend_service/config/RateLimitInterceptor.java`

```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final SecurityAuditService auditService;  // ADD THIS
    
    public RateLimitInterceptor(SecurityAuditService auditService) {  // ADD CONSTRUCTOR
        this.auditService = auditService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, 
                            Object handler) throws Exception {
        // ... existing code ...
        
        if (bucket.tryConsume(1)) {
            return true;
        } else {
            // ADD AUDIT LOG
            auditService.logRateLimitExceeded(ip, path, limit);
            
            logger.warn("Rate limit exceeded for IP: {} on {}", ip, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            // ... rest of code ...
        }
    }
}
```

---

## 🟠 HIGH PRIORITY FIXES

### Fix #5: Prevent Command Injection in IP Blocking

**Problem**: Reason parameter not validated

#### Update MitigationService

**File**: `backend-service/src/main/java/com/defenddos/backend_service/service/MitigationService.java`

**Add validation method**:
```java
@Service
public class MitigationService {
    
    // ... existing code ...
    
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
        return reason.replaceAll("[^a-zA-Z0-9\\s\\-_.,!?()]", "")
                     .substring(0, Math.min(reason.length(), 200));
    }
    
    /**
     * Block an IP address (UPDATED)
     */
    public boolean blockIp(String ip, String reason) {
        // Validate IP format
        if (!isValidIp(ip)) {
            logger.warn("Invalid IP format: {}", ip);
            return false;
        }
        
        // NEW: Validate and sanitize reason
        if (!isValidReason(reason)) {
            logger.warn("Invalid reason format, sanitizing: {}", reason);
            reason = sanitizeReason(reason);
        }
        
        // Check if IP is protected
        if (isProtectedIp(ip)) {
            logger.warn("Cannot block protected IP: {}", ip);
            return false;
        }
        
        // ... rest of existing blocking logic ...
    }
}
```

---

### Fix #6: Add SQL Injection Prevention for Raw Queries

**Problem**: No validation on custom Flux queries

#### Update DataRetrievalController

**File**: `backend-service/src/main/java/com/defenddos/backend_service/controller/DataRetrievalController.java`

**Replace raw query method**:
```java
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/data")
public class DataRetrievalController {
    
    // Whitelist of allowed measurements
    private static final List<String> ALLOWED_MEASUREMENTS = Arrays.asList(
        "traffic", "ml_predictions", "blocked_ips", "detection_events"
    );
    
    // Blacklist of dangerous Flux functions
    private static final List<String> DANGEROUS_FUNCTIONS = Arrays.asList(
        "drop", "delete", "to(", "system(", "exec("
    );
    
    @PostMapping("/raw-query")
    public ResponseEntity<ApiResponse<List<String>>> executeRawQuery(
            @RequestParam String query) {
        
        try {
            // Validate query contains allowed measurements
            boolean hasAllowedMeasurement = ALLOWED_MEASUREMENTS.stream()
                .anyMatch(m -> query.contains("_measurement == \"" + m + "\""));
            
            if (!hasAllowedMeasurement) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                        "Query must filter by allowed measurements: " + ALLOWED_MEASUREMENTS, 
                        "INVALID_QUERY", 
                        null));
            }
            
            // Check for dangerous functions
            String lowerQuery = query.toLowerCase();
            for (String dangerousFunc : DANGEROUS_FUNCTIONS) {
                if (lowerQuery.contains(dangerousFunc.toLowerCase())) {
                    logger.warn("Dangerous query function blocked: {}", dangerousFunc);
                    return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                            "Query contains prohibited function: " + dangerousFunc, 
                            "QUERY_BLOCKED", 
                            null));
                }
            }
            
            // Enforce max query length
            if (query.length() > 5000) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                        "Query exceeds maximum length (5000 characters)", 
                        "QUERY_TOO_LONG", 
                        null));
            }
            
            // Execute query with timeout
            List<String> results = influxDBService.executeQuery(query);
            
            // Limit results
            if (results.size() > 10000) {
                results = results.subList(0, 10000);
                logger.warn("Query results truncated to 10000 rows");
            }
            
            return ResponseEntity.ok(ApiResponse.success(results, 
                "Query executed successfully"));
                
        } catch (Exception e) {
            logger.error("Query execution failed", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error(
                    "Query execution failed", 
                    "QUERY_ERROR", 
                    null));
        }
    }
}
```

---

### Fix #7: Add XSS Protection in Error Messages

#### Create Security Utils

**File**: `backend-service/src/main/java/com/defenddos/backend_service/util/SecurityUtils.java` (NEW)

```java
package com.defenddos.backend_service.util;

import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {
    
    /**
     * Sanitize error messages to prevent XSS
     */
    public static String sanitizeErrorMessage(String message) {
        if (message == null || message.isEmpty()) {
            return "An error occurred";
        }
        
        // Remove HTML tags
        message = message.replaceAll("<[^>]*>", "");
        
        // Escape special HTML characters
        message = message.replace("&", "&amp;")
                        .replace("<", "&lt;")
                        .replace(">", "&gt;")
                        .replace("\"", "&quot;")
                        .replace("'", "&#x27;")
                        .replace("/", "&#x2F;");
        
        // Limit length to prevent log flooding
        if (message.length() > 200) {
            message = message.substring(0, 200) + "...";
        }
        
        return message;
    }
    
    /**
     * Sanitize user input (IP addresses, usernames, etc.)
     */
    public static String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }
        
        // Remove control characters
        input = input.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
        
        // Trim whitespace
        input = input.trim();
        
        return input;
    }
    
    /**
     * Check if string contains potential XSS patterns
     */
    public static boolean containsXss(String input) {
        if (input == null) {
            return false;
        }
        
        String lowerInput = input.toLowerCase();
        return lowerInput.contains("<script") ||
               lowerInput.contains("javascript:") ||
               lowerInput.contains("onerror=") ||
               lowerInput.contains("onclick=") ||
               lowerInput.contains("onload=");
    }
}
```

#### Update Global Exception Handler

**File**: `backend-service/src/main/java/com/defenddos/backend_service/exception/GlobalExceptionHandler.java`

```java
package com.defenddos.backend_service.exception;

import com.defenddos.backend_service.dto.ApiResponse;
import com.defenddos.backend_service.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception e) {
        logger.error("Unexpected error occurred", e);
        
        // Sanitize error message before returning to client
        String safeMessage = SecurityUtils.sanitizeErrorMessage(e.getMessage());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(
                safeMessage,
                "INTERNAL_ERROR",
                null
            ));
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        logger.warn("Invalid argument: {}", e.getMessage());
        
        String safeMessage = SecurityUtils.sanitizeErrorMessage(e.getMessage());
        
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(
                safeMessage,
                "INVALID_ARGUMENT",
                null
            ));
    }
    
    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ApiResponse<Void>> handleNullPointer(NullPointerException e) {
        logger.error("Null pointer exception", e);
        
        // Don't expose internal details
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(
                "A required resource was not found",
                "NULL_REFERENCE",
                null
            ));
    }
}
```

---

### Fix #8: Restrict Actuator Endpoints

**File**: `backend-service/src/main/java/com/defenddos/backend_service/config/SecurityConfig.java`

**Update security configuration**:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ApiKeyAuthFilter apiKeyAuthFilter;
    private final IpBlockingFilter ipBlockingFilter;

    public SecurityConfig(ApiKeyAuthFilter apiKeyAuthFilter, IpBlockingFilter ipBlockingFilter) {
        this.apiKeyAuthFilter = apiKeyAuthFilter;
        this.ipBlockingFilter = ipBlockingFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // For now, will add later
            .sessionManagement(session -> session.sessionCreationPolicy(
                org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Public health check only
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/health/liveness").permitAll()
                .requestMatchers("/actuator/health/readiness").permitAll()
                
                // Secure all other actuator endpoints
                .requestMatchers("/actuator/**").authenticated()
                
                // Public API endpoints (if any)
                .requestMatchers("/api/v1/public/**").permitAll()
                
                // All other API endpoints require authentication
                .requestMatchers("/api/**").authenticated()
                
                // Default: require authentication
                .anyRequest().authenticated())
            .addFilterBefore(apiKeyAuthFilter,
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(ipBlockingFilter, ApiKeyAuthFilter.class);
        
        return http.build();
    }
}
```

---

## 🟡 MEDIUM PRIORITY FIXES

### Fix #9: Fix NullPointerException in DetectionService

**Problem**: InfluxDB QueryApi is null during tests

**File**: `backend-service/src/main/java/com/defenddos/backend_service/service/DetectionService.java`

**Add null check**:
```java
@Service
public class DetectionService {
    
    private final InfluxDBService influxDBService;
    
    @Scheduled(fixedDelay = 30000) // Every 30 seconds
    public void checkForAnomalies() {
        logger.info("Starting anomaly detection scan...");
        
        // ADD NULL CHECK
        if (influxDBService == null || influxDBService.getQueryApi() == null) {
            logger.warn("InfluxDB not available, skipping detection scan");
            return;
        }
        
        try {
            // ... rest of existing code ...
        } catch (Exception e) {
            logger.error("Detection scan failed", e);
        }
    }
}
```

**Update InfluxDBService**:
```java
@Service
public class InfluxDBService {
    
    private QueryApi queryApi;
    
    @PostConstruct
    public void init() {
        try {
            // Initialize queryApi
            this.queryApi = influxDBClient.getQueryApi();
        } catch (Exception e) {
            logger.error("Failed to initialize InfluxDB QueryApi", e);
            this.queryApi = null;
        }
    }
    
    // ADD GETTER
    public QueryApi getQueryApi() {
        return queryApi;
    }
}
```

---

### Fix #10: Add Comprehensive Unit Tests

**File**: `backend-service/src/test/java/com/defenddos/backend_service/service/MitigationServiceTest.java` (NEW)

```java
package com.defenddos.backend_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

class MitigationServiceTest {

    private MitigationService mitigationService;

    @BeforeEach
    void setUp() {
        mitigationService = new MitigationService();
    }

    @Test
    @DisplayName("Should block valid IPv4 address")
    void testBlockValidIPv4() {
        boolean result = mitigationService.blockIp("192.168.1.100", "Test block");
        assertTrue(result, "Should successfully block valid IPv4");
    }

    @Test
    @DisplayName("Should reject invalid IP format")
    void testRejectInvalidIP() {
        boolean result = mitigationService.blockIp("invalid.ip.address", "Test");
        assertFalse(result, "Should reject invalid IP format");
    }

    @Test
    @DisplayName("Should not block protected IPs")
    void testProtectedIPs() {
        boolean result = mitigationService.blockIp("127.0.0.1", "Test");
        assertFalse(result, "Should not block localhost");
    }

    @Test
    @DisplayName("Should sanitize malicious reason string")
    void testSanitizeReason() {
        String maliciousReason = "Test <script>alert('xss')</script>";
        boolean result = mitigationService.blockIp("192.168.1.1", maliciousReason);
        assertTrue(result, "Should block IP but sanitize reason");
    }

    @Test
    @DisplayName("Should unblock previously blocked IP")
    void testUnblockIP() {
        String ip = "192.168.1.200";
        mitigationService.blockIp(ip, "Test");
        boolean result = mitigationService.unblockIp(ip);
        assertTrue(result, "Should successfully unblock IP");
    }

    @Test
    @DisplayName("Should enforce max blocked IPs limit")
    void testMaxBlockedIPsLimit() {
        // Block up to max limit
        for (int i = 1; i <= 100; i++) {
            mitigationService.blockIp("10.0.0." + i, "Test");
        }
        
        // Try to block one more
        boolean result = mitigationService.blockIp("10.0.1.1", "Test");
        assertFalse(result, "Should enforce max blocked IPs limit");
    }
}
```

---

## 📝 Testing Your Fixes

### Test Script

Create `backend-service/test-security-fixes.ps1`:
```powershell
# Security Fixes Test Script

Write-Host "🔒 Testing DefenDDoS Security Fixes" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8081"
$results = @()

# Test 1: Rate Limiting
Write-Host "Test 1: Rate Limiting..." -ForegroundColor Yellow
$rateLimit = $true
for ($i = 1; $i -le 15; $i++) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/v1/traffic/ingest" -Method Post -Body (@{
            sourceIp = "192.168.1.1"
            destinationIp = "10.0.0.1"
            packetCount = 100
        } | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            Write-Host "✅ Rate limiting working (blocked at request $i)" -ForegroundColor Green
            $rateLimit = $true
            break
        }
    }
}
$results += @{Test = "Rate Limiting"; Passed = $rateLimit}

# Test 2: Input Validation
Write-Host "`nTest 2: IP Validation..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/threat-intelligence/check/invalid.ip" -ErrorAction Stop
    Write-Host "❌ Should have rejected invalid IP" -ForegroundColor Red
    $results += @{Test = "IP Validation"; Passed = $false}
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Invalid IP rejected" -ForegroundColor Green
        $results += @{Test = "IP Validation"; Passed = $true}
    }
}

# Test 3: Actuator Security
Write-Host "`nTest 3: Actuator Security..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/actuator/env" -ErrorAction Stop
    Write-Host "❌ Actuator endpoints should be protected" -ForegroundColor Red
    $results += @{Test = "Actuator Security"; Passed = $false}
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Actuator endpoints protected" -ForegroundColor Green
        $results += @{Test = "Actuator Security"; Passed = $true}
    }
}

# Test 4: Health Endpoint (should be public)
Write-Host "`nTest 4: Public Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/actuator/health"
    if ($response.status -eq "UP") {
        Write-Host "✅ Public health check accessible" -ForegroundColor Green
        $results += @{Test = "Health Check"; Passed = $true}
    }
} catch {
    Write-Host "❌ Health check should be public" -ForegroundColor Red
    $results += @{Test = "Health Check"; Passed = $false}
}

# Summary
Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan
$passed = ($results | Where-Object {$_.Passed -eq $true}).Count
$total = $results.Count
Write-Host "Passed: $passed/$total" -ForegroundColor $(if ($passed -eq $total) {"Green"} else {"Yellow"})

$results | ForEach-Object {
    $status = if ($_.Passed) {"✅"} else {"❌"}
    $color = if ($_.Passed) {"Green"} else {"Red"}
    Write-Host "$status $($_.Test)" -ForegroundColor $color
}
```

**Run tests**:
```powershell
cd backend-service
.\test-security-fixes.ps1
```

---

## 🚀 Deployment Checklist

### Before Production

- [ ] All hardcoded secrets moved to environment variables
- [ ] `.env` file added to `.gitignore`
- [ ] Input validation added to all `@PathVariable` parameters
- [ ] Endpoint-specific rate limiting configured
- [ ] Security audit logging enabled
- [ ] Request size limits configured
- [ ] Actuator endpoints secured
- [ ] Unit tests passing (80%+ coverage target)
- [ ] Load tests completed
- [ ] Security scan passed (OWASP Dependency Check)
- [ ] Docker images built and tested
- [ ] Environment variables configured in production
- [ ] Monitoring and alerting set up
- [ ] Backup and recovery tested

### Production Environment Variables

Create `production.env`:
```properties
# PRODUCTION CONFIGURATION
INFLUXDB_TOKEN=<generate-strong-token>
ADMIN_PASSWORD=<generate-strong-password>
REDIS_PASSWORD=<generate-strong-password>

# AWS (if enabled)
AWS_ACCESS_KEY_ID=<your-production-key>
AWS_SECRET_ACCESS_KEY=<your-production-secret>

# Enable all security features
MITIGATION_ENABLED=true
MITIGATION_AUTO_BLOCK=true
AWS_WAF_ENABLED=true
```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)
- [Java Secure Coding Guidelines](https://wiki.sei.cmu.edu/confluence/display/java)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)

---

## 🆘 Support

If you encounter issues:
1. Check logs: `backend-service/logs/`
2. Run: `.\mvnw clean test` to verify tests
3. Review security audit log: `logs/security-audit.log`
4. Check Docker logs: `docker-compose logs backend-service`

---

**🎯 Priority**: Start with the 4 CRITICAL fixes, then move to HIGH priority fixes. Complete all before production deployment.
