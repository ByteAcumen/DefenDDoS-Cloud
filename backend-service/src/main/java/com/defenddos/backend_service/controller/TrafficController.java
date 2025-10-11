package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.dto.*;
import com.defenddos.backend_service.model.EnrichedTrafficPoint;
import com.defenddos.backend_service.model.TrafficPoint;
import com.defenddos.backend_service.model.TrafficSummaryPoint;
import com.defenddos.backend_service.service.MLDetectionService;
import com.defenddos.backend_service.service.TrafficService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Enhanced REST Controller for traffic data management
 * Provides robust API endpoints with consistent response format for frontend integration
 */
@RestController
@RequestMapping("/api/v1/traffic")
public class TrafficController {

    private static final Logger logger = LoggerFactory.getLogger(TrafficController.class);
    
    private final TrafficService trafficService;
    
    @Autowired(required = false)
    private MLDetectionService mlDetectionService;

    public TrafficController(TrafficService trafficService) {
        this.trafficService = trafficService;
    }

    /**
     * Ingest network traffic data
     * POST /api/v1/traffic/ingest
     */
    @PostMapping("/ingest")
    public ResponseEntity<ApiResponse<TrafficDataResponse>> ingestTraffic(@RequestBody TrafficPoint trafficPoint) {
        try {
            // Validate input
            if (trafficPoint.getSourceIp() == null || trafficPoint.getDestinationIp() == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Invalid traffic data", "VALIDATION_ERROR", 
                                "Source IP and Destination IP are required"));
            }
            
            // Set timestamp if not provided
            if (trafficPoint.getTimestamp() == null) {
                trafficPoint.setTimestamp(Instant.now());
            }
            
            // Save to database
            trafficService.save(trafficPoint);
            logger.info("Traffic ingested: {} -> {} ({} packets, {} bytes)", 
                    trafficPoint.getSourceIp(), trafficPoint.getDestinationIp(),
                    trafficPoint.getPacketCount(), trafficPoint.getByteCount());
            
            // Build response
            TrafficDataResponse data = TrafficDataResponse.builder()
                    .sourceIp(trafficPoint.getSourceIp())
                    .destinationIp(trafficPoint.getDestinationIp())
                    .packetCount(trafficPoint.getPacketCount())
                    .byteCount(trafficPoint.getByteCount())
                    .timestamp(trafficPoint.getTimestamp().toString())
                    .build();
            
            return ResponseEntity.ok(ApiResponse.success("Traffic data ingested successfully", data));
            
        } catch (Exception e) {
            logger.error("Failed to ingest traffic: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to ingest traffic data", "INGESTION_ERROR", e.getMessage()));
        }
    }

    /**
     * Query traffic data with time range filtering
     * GET /api/v1/traffic/query?range=-5m
     */
    @GetMapping("/query")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> queryTraffic(
            @RequestParam(required = false, defaultValue = "-1h") String range) {
        try {
            List<Map<String, Object>> data = trafficService.getTrafficData(range);
            logger.info("Query traffic: range={}, results={}", range, data.size());
            
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Retrieved %d traffic records", data.size()), data));
                    
        } catch (Exception e) {
            logger.error("Failed to query traffic: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to query traffic data", "QUERY_ERROR", e.getMessage()));
        }
    }

    /**
     * Get traffic summary aggregated by IP
     * GET /api/v1/traffic/summary?range=-1h
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTrafficSummary(
            @RequestParam(required = false, defaultValue = "-1h") String range) {
        try {
            List<Map<String, Object>> summary = trafficService.getTrafficSummaryByIp(range);
            logger.info("Traffic summary: range={}, IPs={}", range, summary.size());
            
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Retrieved summary for %d IPs", summary.size()), summary));
                    
        } catch (Exception e) {
            logger.error("Failed to get traffic summary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get traffic summary", "SUMMARY_ERROR", e.getMessage()));
        }
    }

    /**
     * Get traffic visualization data for charts
     * GET /api/v1/traffic/visualization?range=-5m&window=1m
     */
    @GetMapping("/visualization")
    public ResponseEntity<ApiResponse<List<TrafficSummaryPoint>>> getTrafficVisualization(
            @RequestParam(required = false, defaultValue = "-1h") String range,
            @RequestParam(required = false, defaultValue = "1m") String window) {
        try {
            List<TrafficSummaryPoint> visualization = trafficService.getTrafficSummary(range, window);
            logger.info("Traffic visualization: range={}, window={}, points={}", range, window, visualization.size());
            
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Retrieved %d visualization points", visualization.size()), visualization));
                    
        } catch (Exception e) {
            logger.error("Failed to get visualization data: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get visualization data", "VISUALIZATION_ERROR", e.getMessage()));
        }
    }

    /**
     * ML-based attack prediction endpoint
     * POST /api/v1/traffic/predict-attack
     */
    @PostMapping("/predict-attack")
    public ResponseEntity<ApiResponse<MLPredictionResponse>> predictAttack(@RequestBody TrafficPoint trafficPoint) {
        try {
            // Check if ML service is available
            if (mlDetectionService == null) {
                logger.warn("ML detection service not configured");
                return ResponseEntity.ok(ApiResponse.error(
                        "ML service not available", "ML_DISABLED", 
                        "Machine learning detection is not configured"));
            }
            
            // Validate input
            if (trafficPoint.getSourceIp() == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Invalid input", "VALIDATION_ERROR", 
                                "Source IP is required"));
            }
            
            // Convert basic traffic to enriched traffic with features
            EnrichedTrafficPoint enrichedTraffic = 
                    EnrichedTrafficPoint.fromBasicTrafficPoint(trafficPoint);
            
            // Get ML prediction
            MLPredictionResponse prediction = mlDetectionService.predict(enrichedTraffic);
            
            if (prediction != null) {
                // Enhance response with additional fields
                prediction.setSourceIp(trafficPoint.getSourceIp());
                
                // Set threat level for frontend (0-5 scale)
                if (prediction.getSeverity() != null) {
                    switch (prediction.getSeverity().toUpperCase()) {
                        case "CRITICAL": prediction.setThreatLevel(5); break;
                        case "HIGH": prediction.setThreatLevel(4); break;
                        case "MEDIUM": prediction.setThreatLevel(3); break;
                        case "LOW": prediction.setThreatLevel(2); break;
                        default: prediction.setThreatLevel(1);
                    }
                }
                
                // Set recommended action
                if (prediction.getIsAttack()) {
                    if ("CRITICAL".equalsIgnoreCase(prediction.getSeverity()) || 
                        "HIGH".equalsIgnoreCase(prediction.getSeverity())) {
                        prediction.setRecommendedAction("BLOCK_IP");
                    } else {
                        prediction.setRecommendedAction("MONITOR");
                    }
                } else {
                    prediction.setRecommendedAction("ALLOW");
                }
                
                logger.info("ML prediction for {}: attack={}, type={}, confidence={}, severity={}", 
                        trafficPoint.getSourceIp(), prediction.getIsAttack(), 
                        prediction.getAttackType(), prediction.getConfidence(), prediction.getSeverity());
                
                return ResponseEntity.ok(ApiResponse.success("ML prediction completed", prediction));
            } else {
                logger.warn("ML service returned null prediction for {}", trafficPoint.getSourceIp());
                return ResponseEntity.ok(ApiResponse.error(
                        "Prediction failed", "ML_ERROR", 
                        "ML service did not return a prediction"));
            }
            
        } catch (Exception e) {
            logger.error("ML prediction error for {}: {}", trafficPoint.getSourceIp(), e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("ML prediction failed", "ML_ERROR", e.getMessage()));
        }
    }

    /**
     * ML service health check endpoint
     * GET /api/v1/traffic/ml-health
     */
    @GetMapping("/ml-health")
    public ResponseEntity<ApiResponse<SystemHealthResponse>> checkMLHealth() {
        try {
            SystemHealthResponse health = SystemHealthResponse.builder()
                    .timestamp(Instant.now().toString())
                    .build();
            
            if (mlDetectionService == null) {
                health.setStatus("ML_DISABLED");
                health.setMlServiceStatus("NOT_CONFIGURED");
                health.setMlModelsLoaded(false);
                
                return ResponseEntity.ok(ApiResponse.success(
                        "ML service is not configured", health));
            }
            
            boolean healthy = mlDetectionService.isMLServiceHealthy();
            health.setStatus(healthy ? "HEALTHY" : "UNHEALTHY");
            health.setMlServiceStatus(healthy ? "OPERATIONAL" : "UNAVAILABLE");
            health.setMlModelsLoaded(healthy);
            
            logger.debug("ML health check: {}", healthy);
            
            return ResponseEntity.ok(ApiResponse.success(
                    healthy ? "ML service is operational" : "ML service is not responding", 
                    health));
                    
        } catch (Exception e) {
            logger.error("ML health check failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Health check failed", "HEALTH_CHECK_ERROR", e.getMessage()));
        }
    }
}
