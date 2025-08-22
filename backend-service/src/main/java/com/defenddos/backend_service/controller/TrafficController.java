package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.model.TrafficPoint;
import com.defenddos.backend_service.service.TrafficService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.Instant;

@RestController // Marks this class to handle web requests
@RequestMapping("/api/v1/traffic") // All endpoints in this class start with this path
public class TrafficController {

    private final TrafficService trafficService;

    @Autowired
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
}
