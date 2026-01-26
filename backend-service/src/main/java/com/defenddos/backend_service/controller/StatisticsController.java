package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.dto.ApiResponse;
import com.defenddos.backend_service.service.StatisticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/statistics")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" }, allowCredentials = "true")
public class StatisticsController {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsController.class);
    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/detailed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDetailedStatistics(
            @RequestParam(defaultValue = "-1h") String range) {
        try {
            Map<String, Object> stats = statisticsService.getDetailedStatistics(range);
            return ResponseEntity.ok(ApiResponse.success("Retrieved detailed statistics", stats));
        } catch (Exception e) {
            logger.error("Error in getDetailedStatistics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get statistics", "STATS_ERROR", e.getMessage()));
        }
    }

    @GetMapping("/realtime")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRealtimeMetrics(
            @RequestParam(defaultValue = "1m") String window) {
        try {
            Map<String, Object> metrics = statisticsService.getRealtimeMetrics(window);
            return ResponseEntity.ok(ApiResponse.success("Retrieved realtime metrics", metrics));
        } catch (Exception e) {
            logger.error("Error in getRealtimeMetrics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get realtime metrics", "METRICS_ERROR", e.getMessage()));
        }
    }

    @GetMapping("/attack-analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAttackAnalysis(
            @RequestParam(defaultValue = "-1h") String range,
            @RequestParam(required = false) String sourceIp) {
        try {
            Map<String, Object> analysis = statisticsService.getAttackAnalysis(range, sourceIp);
            return ResponseEntity.ok(ApiResponse.success("Retrieved attack analysis", analysis));
        } catch (Exception e) {
            logger.error("Error in getAttackAnalysis: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get attack analysis", "ANALYSIS_ERROR", e.getMessage()));
        }
    }

    @GetMapping("/ml-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMLStats(
            @RequestParam(defaultValue = "-1h") String range) {
        try {
            Map<String, Object> mlStats = statisticsService.getMLStats(range);
            return ResponseEntity.ok(ApiResponse.success("Retrieved ML statistics", mlStats));
        } catch (Exception e) {
            logger.error("Error in getMLStats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get ML stats", "ML_STATS_ERROR", e.getMessage()));
        }
    }
}
