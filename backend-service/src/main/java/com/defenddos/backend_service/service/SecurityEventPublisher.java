package com.defenddos.backend_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for publishing security events to Kafka for audit trail and external integrations.
 * All security-relevant actions should be logged through this service.
 */
@Service
public class SecurityEventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(SecurityEventPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final boolean kafkaEnabled;
    
    @Value("${incident.kafka.topic:security-incidents}")
    private String kafkaTopic;

    public SecurityEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${spring.kafka.enabled:false}") boolean kafkaEnabled) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.kafkaEnabled = kafkaEnabled;
        
        if (kafkaEnabled) {
            logger.info("Security Event Publisher initialized - Kafka enabled");
        } else {
            logger.info("Security Event Publisher initialized - Kafka disabled (events will be logged only)");
        }
    }

    /**
     * Publish threat detection event
     */
    public void publishThreatDetected(String sourceIp, String threatLevel, long packetCount, boolean mlDetected) {
        Map<String, Object> event = Map.of(
            "eventType", "THREAT_DETECTED",
            "timestamp", Instant.now().toString(),
            "sourceIp", sourceIp,
            "threatLevel", threatLevel,
            "packetCount", packetCount,
            "mlDetected", mlDetected
        );
        
        publishEvent(event);
    }

    /**
     * Publish IP blocking event
     */
    public void publishIpBlocked(String ip, String reason, String blockedBy) {
        Map<String, Object> event = Map.of(
            "eventType", "IP_BLOCKED",
            "timestamp", Instant.now().toString(),
            "ip", ip,
            "reason", reason,
            "blockedBy", blockedBy
        );
        
        publishEvent(event);
    }

    /**
     * Publish IP unblocking event
     */
    public void publishIpUnblocked(String ip, String unblockedBy) {
        Map<String, Object> event = Map.of(
            "eventType", "IP_UNBLOCKED",
            "timestamp", Instant.now().toString(),
            "ip", ip,
            "unblockedBy", unblockedBy
        );
        
        publishEvent(event);
    }

    /**
     * Publish rate limit exceeded event
     */
    public void publishRateLimitExceeded(String ip, String endpoint, int limit) {
        Map<String, Object> event = Map.of(
            "eventType", "RATE_LIMIT_EXCEEDED",
            "timestamp", Instant.now().toString(),
            "ip", ip,
            "endpoint", endpoint,
            "limit", limit
        );
        
        publishEvent(event);
    }

    /**
     * Publish ML prediction event
     */
    public void publishMlPrediction(String ip, String prediction, double confidence, String attackType) {
        Map<String, Object> event = Map.of(
            "eventType", "ML_PREDICTION",
            "timestamp", Instant.now().toString(),
            "ip", ip,
            "prediction", prediction,
            "confidence", confidence,
            "attackType", attackType
        );
        
        publishEvent(event);
    }

    /**
     * Publish traffic ingestion event (sampled - not every single traffic point)
     */
    public void publishTrafficSample(String sourceIp, String destinationIp, long packetCount, long byteCount) {
        Map<String, Object> event = Map.of(
            "eventType", "TRAFFIC_SAMPLE",
            "timestamp", Instant.now().toString(),
            "sourceIp", sourceIp,
            "destinationIp", destinationIp,
            "packetCount", packetCount,
            "byteCount", byteCount
        );
        
        publishEvent(event);
    }

    /**
     * Generic event publisher
     */
    private void publishEvent(Map<String, Object> event) {
        try {
            // Always log locally
            logger.info("Security Event: {}", event.get("eventType"));
            logger.debug("Event details: {}", event);
            
            // Publish to Kafka if enabled
            if (kafkaEnabled && kafkaTemplate != null) {
                String json = objectMapper.writeValueAsString(event);
                kafkaTemplate.send(kafkaTopic, json);
                logger.trace("Published to Kafka topic: {}", kafkaTopic);
            }
        } catch (Exception e) {
            logger.error("Failed to publish security event: {}", event.get("eventType"), e);
        }
    }

    /**
     * Health check - verify Kafka connectivity
     */
    public boolean isKafkaHealthy() {
        if (!kafkaEnabled || kafkaTemplate == null) {
            return false;
        }
        
        try {
            // Send test message
            kafkaTemplate.send(kafkaTopic, "{\"eventType\":\"HEALTH_CHECK\",\"timestamp\":\"" + 
                Instant.now().toString() + "\"}");
            return true;
        } catch (Exception e) {
            logger.warn("Kafka health check failed: {}", e.getMessage());
            return false;
        }
    }
}
