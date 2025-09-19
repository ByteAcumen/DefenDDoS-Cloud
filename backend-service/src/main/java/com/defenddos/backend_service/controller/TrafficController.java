package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.model.TrafficPoint;
import com.defenddos.backend_service.model.TrafficSummaryPoint;
import com.defenddos.backend_service.service.TrafficService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for traffic data management in the DefenDDoS system.
 * Provides endpoints for ingesting network traffic data and querying analytics.
 */
@RestController
@RequestMapping("/api/v1/traffic")
public class TrafficController {

    private final TrafficService trafficService;

    public TrafficController(TrafficService trafficService) {
        this.trafficService = trafficService;
    }

    @PostMapping("/ingest") // Listens for POST requests to /api/v1/traffic/ingest
    public ResponseEntity<String> ingestTraffic(@RequestBody TrafficPoint trafficPoint) {
        // Automatically set the timestamp if it wasn't provided in the request
        if (trafficPoint.getTimestamp() == null) {
            trafficPoint.setTimestamp(Instant.now());
        }
        
        trafficService.save(trafficPoint);
        
        return ResponseEntity.ok("Traffic data ingested successfully.");
    }

    @GetMapping("/query") // Handles GET requests to /api/v1/traffic/query
    public ResponseEntity<List<Map<String, Object>>> queryTraffic(
            @RequestParam(required = false) String range) {
        
        // Call the service method to get the data
        List<Map<String, Object>> data = trafficService.getTrafficData(range);
        
        // Return the data with an OK status
        return ResponseEntity.ok(data);
    }

    @GetMapping("/summary") // Handles GET requests to /api/v1/traffic/summary
    public ResponseEntity<List<Map<String, Object>>> getTrafficSummary(
            @RequestParam(required = false) String range) {
        
        // Get aggregated traffic data by IP for threat analysis
        List<Map<String, Object>> summary = trafficService.getTrafficSummaryByIp(range);
        
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/visualization") // Handles GET requests to /api/v1/traffic/visualization
    public ResponseEntity<List<TrafficSummaryPoint>> getTrafficVisualization(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) String window) {
        
        // Get time-series data for charts and graphs
        List<TrafficSummaryPoint> visualization = trafficService.getTrafficSummary(range, window);
        
        return ResponseEntity.ok(visualization);
    }
}
