package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.service.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/statistics")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" }, allowCredentials = "true")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> getDetailedStatistics(
            @RequestParam(defaultValue = "-1h") String range) {
        return ResponseEntity.ok(statisticsService.getDetailedStatistics(range));
    }

    @GetMapping("/realtime")
    public ResponseEntity<Map<String, Object>> getRealtimeMetrics(
            @RequestParam(defaultValue = "1m") String window) {
        return ResponseEntity.ok(statisticsService.getRealtimeMetrics(window));
    }

    @GetMapping("/attack-analysis")
    public ResponseEntity<Map<String, Object>> getAttackAnalysis(
            @RequestParam(defaultValue = "-1h") String range,
            @RequestParam(required = false) String sourceIp) {
        return ResponseEntity.ok(statisticsService.getAttackAnalysis(range, sourceIp));
    }

    @GetMapping("/ml-stats")
    public ResponseEntity<Map<String, Object>> getMLStats(
            @RequestParam(defaultValue = "-1h") String range) {
        return ResponseEntity.ok(statisticsService.getMLStats(range));
    }
}
