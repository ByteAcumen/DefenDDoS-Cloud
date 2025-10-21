package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.dto.ApiResponse;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller for retrieving ALL data from the database
 * Provides comprehensive access to all stored data
 */
@RestController
@RequestMapping("/api/v1/data")
public class DataRetrievalController {
    
    private static final Logger logger = LoggerFactory.getLogger(DataRetrievalController.class);
    
    private final InfluxDBClient influxDBClient;
    private final String bucket;
    private final String org;
    
    public DataRetrievalController(
            InfluxDBClient influxDBClient,
            @Value("${defenddos.influx-db.bucket}") String bucket,
            @Value("${defenddos.influx-db.org}") String org) {
        this.influxDBClient = influxDBClient;
        this.bucket = bucket;
        this.org = org;
    }
    
    /**
     * Get ALL traffic data from database
     * GET /api/v1/data/traffic/all?range=-24h&limit=1000
     */
    @GetMapping("/traffic/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllTrafficData(
            @RequestParam(required = false, defaultValue = "-24h") String range,
            @RequestParam(required = false, defaultValue = "1000") int limit) {
        try {
            String query = String.format(
                "from(bucket: \"%s\") " +
                "|> range(start: %s) " +
                "|> filter(fn: (r) => r._measurement == \"traffic_data\") " +
                "|> limit(n: %d)",
                bucket, range, limit
            );
            
            List<Map<String, Object>> results = executeQuery(query);
            logger.info("Retrieved {} traffic data records", results.size());
            
            return ResponseEntity.ok(ApiResponse.success(
                String.format("Retrieved %d traffic records", results.size()), results));
                
        } catch (Exception e) {
            logger.error("Failed to retrieve traffic data: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve traffic data", "QUERY_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Get ALL ML predictions from database
     * GET /api/v1/data/ml-predictions/all?range=-24h
     */
    @GetMapping("/ml-predictions/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllMLPredictions(
            @RequestParam(required = false, defaultValue = "-24h") String range) {
        try {
            String query = String.format(
                "from(bucket: \"%s\") " +
                "|> range(start: %s) " +
                "|> filter(fn: (r) => r._measurement == \"ml_predictions\")",
                bucket, range
            );
            
            List<Map<String, Object>> results = executeQuery(query);
            logger.info("Retrieved {} ML prediction records", results.size());
            
            return ResponseEntity.ok(ApiResponse.success(
                String.format("Retrieved %d ML predictions", results.size()), results));
                
        } catch (Exception e) {
            logger.error("Failed to retrieve ML predictions: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve ML predictions", "QUERY_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Get ALL blocked IPs from database
     * GET /api/v1/data/blocked-ips/all?range=-30d
     */
    @GetMapping("/blocked-ips/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllBlockedIps(
            @RequestParam(required = false, defaultValue = "-30d") String range) {
        try {
            String query = String.format(
                "from(bucket: \"%s\") " +
                "|> range(start: %s) " +
                "|> filter(fn: (r) => r._measurement == \"blocked_ips\")",
                bucket, range
            );
            
            List<Map<String, Object>> results = executeQuery(query);
            logger.info("Retrieved {} blocked IP records", results.size());
            
            return ResponseEntity.ok(ApiResponse.success(
                String.format("Retrieved %d blocked IP records", results.size()), results));
                
        } catch (Exception e) {
            logger.error("Failed to retrieve blocked IPs: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve blocked IPs", "QUERY_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Get ALL detection events from database
     * GET /api/v1/data/detection-events/all?range=-24h
     */
    @GetMapping("/detection-events/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllDetectionEvents(
            @RequestParam(required = false, defaultValue = "-24h") String range) {
        try {
            String query = String.format(
                "from(bucket: \"%s\") " +
                "|> range(start: %s) " +
                "|> filter(fn: (r) => r._measurement == \"detection_events\")",
                bucket, range
            );
            
            List<Map<String, Object>> results = executeQuery(query);
            logger.info("Retrieved {} detection event records", results.size());
            
            return ResponseEntity.ok(ApiResponse.success(
                String.format("Retrieved %d detection events", results.size()), results));
                
        } catch (Exception e) {
            logger.error("Failed to retrieve detection events: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve detection events", "QUERY_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Get ALL data for a specific IP address
     * GET /api/v1/data/ip/{ip}/all?range=-24h
     */
    @GetMapping("/ip/{ip}/all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllDataForIp(
            @PathVariable String ip,
            @RequestParam(required = false, defaultValue = "-24h") String range) {
        try {
            Map<String, Object> ipData = new HashMap<>();
            
            // Get traffic data for this IP
            String trafficQuery = String.format(
                "from(bucket: \"%s\") " +
                "|> range(start: %s) " +
                "|> filter(fn: (r) => r._measurement == \"traffic_data\" and r.sourceIp == \"%s\")",
                bucket, range, ip
            );
            ipData.put("traffic", executeQuery(trafficQuery));
            
            // Get ML predictions for this IP
            String mlQuery = String.format(
                "from(bucket: \"%s\") " +
                "|> range(start: %s) " +
                "|> filter(fn: (r) => r._measurement == \"ml_predictions\" and r.sourceIp == \"%s\")",
                bucket, range, ip
            );
            ipData.put("mlPredictions", executeQuery(mlQuery));
            
            // Get detection events for this IP
            String detectionQuery = String.format(
                "from(bucket: \"%s\") " +
                "|> range(start: %s) " +
                "|> filter(fn: (r) => r._measurement == \"detection_events\" and r.sourceIp == \"%s\")",
                bucket, range, ip
            );
            ipData.put("detectionEvents", executeQuery(detectionQuery));
            
            // Get blocked IP records
            String blockedQuery = String.format(
                "from(bucket: \"%s\") " +
                "|> range(start: %s) " +
                "|> filter(fn: (r) => r._measurement == \"blocked_ips\" and r.ip == \"%s\")",
                bucket, range, ip
            );
            ipData.put("blockHistory", executeQuery(blockedQuery));
            
            logger.info("Retrieved comprehensive data for IP: {}", ip);
            
            return ResponseEntity.ok(ApiResponse.success(
                String.format("Retrieved all data for IP %s", ip), ipData));
                
        } catch (Exception e) {
            logger.error("Failed to retrieve data for IP {}: {}", ip, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve IP data", "QUERY_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Get database statistics and measurement counts
     * GET /api/v1/data/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDatabaseStatistics() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Count records in each measurement
            String[] measurements = {"traffic_data", "ml_predictions", "blocked_ips", "detection_events"};
            
            for (String measurement : measurements) {
                String query = String.format(
                    "from(bucket: \"%s\") " +
                    "|> range(start: -30d) " +
                    "|> filter(fn: (r) => r._measurement == \"%s\") " +
                    "|> count()",
                    bucket, measurement
                );
                
                try {
                    QueryApi queryApi = influxDBClient.getQueryApi();
                    List<FluxTable> tables = queryApi.query(query, org);
                    
                    long count = 0;
                    for (FluxTable table : tables) {
                        for (FluxRecord record : table.getRecords()) {
                            Object value = record.getValue();
                            if (value instanceof Number) {
                                count += ((Number) value).longValue();
                            }
                        }
                    }
                    
                    stats.put(measurement + "_count", count);
                } catch (Exception e) {
                    stats.put(measurement + "_count", 0);
                }
            }
            
            // Add bucket info
            stats.put("bucket", bucket);
            stats.put("organization", org);
            stats.put("timestamp", new Date().toString());
            
            logger.info("Retrieved database statistics");
            
            return ResponseEntity.ok(ApiResponse.success("Database statistics retrieved", stats));
                
        } catch (Exception e) {
            logger.error("Failed to retrieve database statistics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve statistics", "QUERY_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Export all data as JSON
     * GET /api/v1/data/export?range=-24h
     */
    @GetMapping("/export")
    public ResponseEntity<ApiResponse<Map<String, List<Map<String, Object>>>>> exportAllData(
            @RequestParam(required = false, defaultValue = "-24h") String range) {
        try {
            Map<String, List<Map<String, Object>>> export = new HashMap<>();
            
            // Export traffic data
            String trafficQuery = String.format(
                "from(bucket: \"%s\") |> range(start: %s) |> filter(fn: (r) => r._measurement == \"traffic_data\")",
                bucket, range
            );
            export.put("traffic_data", executeQuery(trafficQuery));
            
            // Export ML predictions
            String mlQuery = String.format(
                "from(bucket: \"%s\") |> range(start: %s) |> filter(fn: (r) => r._measurement == \"ml_predictions\")",
                bucket, range
            );
            export.put("ml_predictions", executeQuery(mlQuery));
            
            // Export detection events
            String detectionQuery = String.format(
                "from(bucket: \"%s\") |> range(start: %s) |> filter(fn: (r) => r._measurement == \"detection_events\")",
                bucket, range
            );
            export.put("detection_events", executeQuery(detectionQuery));
            
            // Export blocked IPs
            String blockedQuery = String.format(
                "from(bucket: \"%s\") |> range(start: %s) |> filter(fn: (r) => r._measurement == \"blocked_ips\")",
                bucket, range
            );
            export.put("blocked_ips", executeQuery(blockedQuery));
            
            int totalRecords = export.values().stream().mapToInt(List::size).sum();
            logger.info("Exported {} total records from database", totalRecords);
            
            return ResponseEntity.ok(ApiResponse.success(
                String.format("Exported %d total records", totalRecords), export));
                
        } catch (Exception e) {
            logger.error("Failed to export data: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to export data", "EXPORT_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Helper method to execute Flux query and convert to List of Maps
     */
    private List<Map<String, Object>> executeQuery(String query) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        try {
            QueryApi queryApi = influxDBClient.getQueryApi();
            List<FluxTable> tables = queryApi.query(query, org);
            
            for (FluxTable table : tables) {
                for (FluxRecord record : table.getRecords()) {
                    Map<String, Object> dataPoint = new HashMap<>();
                    
                    // Add timestamp
                    if (record.getTime() != null) {
                        dataPoint.put("time", record.getTime().toString());
                    }
                    
                    // Add measurement
                    dataPoint.put("measurement", record.getMeasurement());
                    
                    // Add field and value
                    dataPoint.put("field", record.getField());
                    dataPoint.put("value", record.getValue());
                    
                    // Add all tags
                    record.getValues().forEach((key, value) -> {
                        if (!key.startsWith("_") && !key.equals("result") && !key.equals("table")) {
                            dataPoint.put(key, value);
                        }
                    });
                    
                    results.add(dataPoint);
                }
            }
            
        } catch (Exception e) {
            logger.error("Query execution failed: {}", e.getMessage());
        }
        
        return results;
    }
}
