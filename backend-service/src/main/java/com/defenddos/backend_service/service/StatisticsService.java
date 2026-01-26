package com.defenddos.backend_service.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class StatisticsService {

    public Map<String, Object> getDetailedStatistics(String range) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTraffic", 10245);
        stats.put("maliciousTraffic", 123);
        stats.put("blockedIPs", 45);
        stats.put("activeThreats", 2);
        stats.put("mitigationStatus", "ACTIVE");
        stats.put("systemHealth", 98.5);
        return stats;
    }

    public Map<String, Object> getRealtimeMetrics(String window) {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("requestsPerSecond", 450);
        metrics.put("bandwidthUsage", "125 Mbps");
        metrics.put("latency", "12ms");
        metrics.put("cpuUsage", "23%");
        metrics.put("memoryUsage", "45%");
        return metrics;
    }

    public Map<String, Object> getAttackAnalysis(String range, String sourceIp) {
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("attackType", "DDoS - SYN Flood");
        analysis.put("severity", "HIGH");
        analysis.put("sourceIp", sourceIp != null ? sourceIp : "Unknown");
        analysis.put("pattern", "Repeated SYN packets without ACK");
        analysis.put("recommendedAction", "Block Source IP");
        return analysis;
    }

    public Map<String, Object> getMLStats(String range) {
        Map<String, Object> mlStats = new HashMap<>();
        mlStats.put("modelAccuracy", 0.98);
        mlStats.put("predictionsCount", 50000);
        mlStats.put("falsePositives", 12);
        mlStats.put("lastTraining", "2024-03-20T10:00:00Z");
        return mlStats;
    }
}
