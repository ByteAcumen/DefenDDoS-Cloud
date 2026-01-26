package com.defenddos.backend_service.service;

import com.defenddos.backend_service.config.DefenDDoSProperties;
import com.defenddos.backend_service.dto.MLPredictionRequest;
import com.defenddos.backend_service.dto.MLPredictionResponse;
import com.defenddos.backend_service.model.EnrichedTrafficPoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Service for ML-based DDoS detection.
 * Communicates with Python FastAPI ML service for attack prediction.
 */
@Service
public class MLDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(MLDetectionService.class);
    
    // Cache ML predictions for 30 seconds to reduce load
    private final Map<String, CachedPrediction> predictionCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 30_000; // 30 seconds

    private final WebClient mlServiceWebClient;
    private final DefenDDoSProperties properties;
    private final MitigationService mitigationService;

    public MLDetectionService(
            WebClient mlServiceWebClient,
            DefenDDoSProperties properties,
            MitigationService mitigationService) {
        this.mlServiceWebClient = mlServiceWebClient;
        this.properties = properties;
        this.mitigationService = mitigationService;
    }

    /**
     * Predicts if traffic is a DDoS attack using ML model.
     * 
     * @param enrichedTraffic Enriched traffic data with 30 features
     * @return ML prediction response or null if service is disabled/unavailable
     */
    /**
     * Predicts if traffic is a DDoS attack using ML model.
     * 
     * @param enrichedTraffic Enriched traffic data with 30 features
     * @return Mono<MLPredictionResponse> or empty if disabled/error
     */
    public Mono<MLPredictionResponse> predict(EnrichedTrafficPoint enrichedTraffic) {
        // Check if ML service is enabled
        if (!properties.getMlService().isEnabled()) {
            logger.debug("ML service is disabled, skipping prediction");
            return Mono.empty();
        }

        // Check cache first
        String cacheKey = enrichedTraffic.getSourceIp();
        CachedPrediction cached = predictionCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            logger.debug("Using cached ML prediction for IP: {}", cacheKey);
            return Mono.just(cached.response);
        }

        try {
            // Convert enriched traffic to ML request DTO
            MLPredictionRequest request = buildMLRequest(enrichedTraffic);

            // Call ML service with retry logic and increased timeout
            return mlServiceWebClient.post()
                    .uri("/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MLPredictionResponse.class)
                    .retryWhen(Retry.fixedDelay(
                            properties.getMlService().getRetryAttempts(),
                            Duration.ofSeconds(1)).filter(throwable -> throwable instanceof WebClientResponseException))
                    .timeout(Duration.ofSeconds(properties.getMlService().getTimeoutSeconds()))
                    .doOnNext(response -> {
                        // Cache the successful response
                        if (response != null) {
                            predictionCache.put(cacheKey, new CachedPrediction(response));
                            // Cleanup expired entries periodically
                            if (predictionCache.size() > 1000) {
                                cleanupExpiredCache();
                            }
                        }
                        
                        if (response != null && response.getIsAttack()) {
                            logger.info(
                                    "ML Detection: Attack detected from {} - Type: {}, Confidence: {}, Severity: {}",
                                    enrichedTraffic.getSourceIp(),
                                    response.getAttackType(),
                                    response.getConfidence(),
                                    response.getSeverity());

                            // Trigger mitigation if high-confidence attack
                            if (response.shouldTriggerMitigation()) {
                                mitigationService.blockIp(
                                        enrichedTraffic.getSourceIp(),
                                        "ML-detected " + response.getAttackType() +
                                                " attack (confidence: "
                                                + String.format("%.2f", response.getConfidence()) + ")");
                            }
                        }
                    })
                    .onErrorResume(throwable -> {
                        logger.error("ML service error for IP {}: {}",
                                enrichedTraffic.getSourceIp(), throwable.getMessage());
                        return Mono.empty();
                    });

        } catch (Exception e) {
            logger.error("Unexpected error during ML prediction for IP {}: {}",
                    enrichedTraffic.getSourceIp(), e.getMessage(), e);
            return Mono.empty();
        }
    }

    /**
     * Builds ML prediction request from enriched traffic data.
     */
    private MLPredictionRequest buildMLRequest(EnrichedTrafficPoint traffic) {
        return MLPredictionRequest.builder()
                .sourceIp(traffic.getSourceIp())
                .destinationIp(traffic.getDestinationIp())
                .packetCount(traffic.getPacketCount())
                .byteCount(traffic.getByteCount())
                .fwdPacketsPerSecond(traffic.getFwdPacketsPerSecond())
                .bwdPacketsPerSecond(traffic.getBwdPacketsPerSecond())
                .fwdPacketLengthMax(traffic.getFwdPacketLengthMax())
                .fwdPacketLengthMin(traffic.getFwdPacketLengthMin())
                .fwdPacketLengthMean(traffic.getFwdPacketLengthMean())
                .bwdPacketLengthMax(traffic.getBwdPacketLengthMax())
                .bwdPacketLengthMin(traffic.getBwdPacketLengthMin())
                .bwdPacketLengthMean(traffic.getBwdPacketLengthMean())
                .flowBytesPerSecond(traffic.getFlowBytesPerSecond())
                .flowPacketsPerSecond(traffic.getFlowPacketsPerSecond())
                .flowIatMean(traffic.getFlowIatMean())
                .flowIatMax(traffic.getFlowIatMax())
                .flowIatMin(traffic.getFlowIatMin())
                .flowDuration(traffic.getFlowDuration())
                .activeTimeMax(traffic.getActiveTimeMax())
                .fwdHeaderLength(traffic.getFwdHeaderLength())
                .bwdHeaderLength(traffic.getBwdHeaderLength())
                .fwdPacketsPerSecondRatio(traffic.getFwdPacketsPerSecondRatio())
                .subflowFwdPackets(traffic.getSubflowFwdPackets())
                .subflowBwdPackets(traffic.getSubflowBwdPackets())
                .finFlagCount(traffic.getFinFlagCount())
                .synFlagCount(traffic.getSynFlagCount())
                .rstFlagCount(traffic.getRstFlagCount())
                .pshFlagCount(traffic.getPshFlagCount())
                .ackFlagCount(traffic.getAckFlagCount())
                .urgFlagCount(traffic.getUrgFlagCount())
                .cwrFlagCount(traffic.getCwrFlagCount())
                .eceFlagCount(traffic.getEceFlagCount())
                .downUpRatio(traffic.getDownUpRatio())
                .avgPacketSize(traffic.getAvgPacketSize())
                .build();
    }

    /**
     * Health check for ML service availability.
     * 
     * @return true if ML service is reachable, false otherwise
     */
    public boolean isMLServiceHealthy() {
        if (!properties.getMlService().isEnabled()) {
            return false;
        }

        try {
            String response = mlServiceWebClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            return response != null && response.contains("healthy");
        } catch (Exception e) {
            logger.warn("ML service health check failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Cleanup expired cache entries to prevent memory leak
     */
    private void cleanupExpiredCache() {
        predictionCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
        logger.debug("Cleaned up expired ML prediction cache entries. Current size: {}", predictionCache.size());
    }
    
    /**
     * Inner class for caching ML predictions with TTL
     */
    private static class CachedPrediction {
        private final MLPredictionResponse response;
        private final long timestamp;
        
        public CachedPrediction(MLPredictionResponse response) {
            this.response = response;
            this.timestamp = System.currentTimeMillis();
        }
        
        public boolean isExpired() {
            return (System.currentTimeMillis() - timestamp) > CACHE_TTL_MS;
        }
    }
}
