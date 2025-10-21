package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.dto.*;
import com.defenddos.backend_service.service.StatisticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for comprehensive statistics and analytics
 * Provides detailed data for frontend dashboards
 */
@RestController
@RequestMapping("/api/v1/statistics")
public class StatisticsController {
    
    private static final Logger logger = LoggerFactory.getLogger(StatisticsController.class);
    private final StatisticsService statisticsService;
    
    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }
    
    /**
     * Get comprehensive statistics with all details
     * GET /api/v1/statistics/detailed?range=-1h
     */
    @GetMapping("/detailed")
    public ResponseEntity<ApiResponse<DetailedStatisticsResponse>> getDetailedStatistics(
            @RequestParam(required = false, defaultValue = "-1h") String range) {
        try {
            logger.info("Fetching detailed statistics for range: {}", range);
            DetailedStatisticsResponse stats = statisticsService.getDetailedStatistics(range);
            return ResponseEntity.ok(ApiResponse.success("Detailed statistics retrieved", stats));
        } catch (Exception e) {
            logger.error("Failed to get detailed statistics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve statistics", "STATISTICS_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Get real-time metrics for live monitoring
     * GET /api/v1/statistics/realtime
     */
    @GetMapping("/realtime")
    public ResponseEntity<ApiResponse<RealTimeMetricsResponse>> getRealTimeMetrics() {
        try {
            logger.debug("Fetching real-time metrics");
            RealTimeMetricsResponse metrics = statisticsService.getRealTimeMetrics();
            return ResponseEntity.ok(ApiResponse.success("Real-time metrics retrieved", metrics));
        } catch (Exception e) {
            logger.error("Failed to get real-time metrics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve real-time metrics", "REALTIME_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Get attack analysis for a specific time period
     * GET /api/v1/statistics/attack-analysis?range=-1h
     */
    @GetMapping("/attack-analysis")
    public ResponseEntity<ApiResponse<AttackAnalysisResponse>> getAttackAnalysis(
            @RequestParam(required = false, defaultValue = "-1h") String range) {
        try {
            logger.info("Generating attack analysis for range: {}", range);
            AttackAnalysisResponse analysis = statisticsService.getAttackAnalysis(range);
            return ResponseEntity.ok(ApiResponse.success("Attack analysis completed", analysis));
        } catch (Exception e) {
            logger.error("Failed to generate attack analysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to generate attack analysis", "ANALYSIS_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Get ML prediction statistics
     * GET /api/v1/statistics/ml-stats?range=-1h
     */
    @GetMapping("/ml-stats")
    public ResponseEntity<ApiResponse<DetailedStatisticsResponse.MLStatistics>> getMLStatistics(
            @RequestParam(required = false, defaultValue = "-1h") String range) {
        try {
            logger.info("Fetching ML statistics for range: {}", range);
            DetailedStatisticsResponse.MLStatistics stats = statisticsService.getMLStatistics(range);
            return ResponseEntity.ok(ApiResponse.success("ML statistics retrieved", stats));
        } catch (Exception e) {
            logger.error("Failed to get ML statistics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve ML statistics", "ML_STATS_ERROR", e.getMessage()));
        }
    }
}
