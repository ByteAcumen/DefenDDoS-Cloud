package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.service.PredictiveForecastingService;
import com.defenddos.backend_service.service.PredictiveForecastingService.AttackForecast;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API Controller for Predictive Attack Forecasting
 * 
 * Endpoints:
 * - GET /api/forecast - Get current forecast
 * - GET /api/forecast/{minutes} - Get forecast N minutes ahead
 */
@RestController
@RequestMapping("/api/forecast")
@Slf4j
public class ForecastingController {

    @Autowired
    private PredictiveForecastingService forecastingService;

    /**
     * Get current attack forecast (next 15 minutes)
     * 
     * GET /api/forecast
     * 
     * Response:
     * {
     *   "currentTraffic": 5234,
     *   "baseline": 3500,
     *   "predictedTraffic": 8900,
     *   "anomalyScore": 0.72,
     *   "attackProbability": 0.85,
     *   "isAttackLikely": true,
     *   "trend": "STRONG_UPWARD",
     *   "recommendations": ["Enable rate limiting", "Alert security team"],
     *   ...
     * }
     */
    @GetMapping
    public ResponseEntity<AttackForecast> getCurrentForecast() {
        log.info("Fetching current attack forecast");
        
        try {
            AttackForecast forecast = forecastingService.generateForecast(15);
            
            return ResponseEntity.ok(forecast);
            
        } catch (Exception e) {
            log.error("Error generating forecast", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get forecast for specific time ahead
     * 
     * GET /api/forecast/30
     * 
     * Returns forecast for 30 minutes in the future
     */
    @GetMapping("/{minutes}")
    public ResponseEntity<AttackForecast> getForecast(
            @PathVariable int minutes) {
        
        log.info("Fetching forecast for {} minutes ahead", minutes);
        
        if (minutes < 1 || minutes > 120) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            AttackForecast forecast = forecastingService.generateForecast(minutes);
            
            return ResponseEntity.ok(forecast);
            
        } catch (Exception e) {
            log.error("Error generating forecast for {} minutes", minutes, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get forecasts for multiple timeframes
     * 
     * GET /api/forecast/multi?timeframes=15,30,60
     * 
     * Returns array of forecasts for each timeframe
     */
    @GetMapping("/multi")
    public ResponseEntity<MultiForecastResponse> getMultiTimeframeForecast(
            @RequestParam(defaultValue = "15,30,60") String timeframes) {
        
        log.info("Fetching multi-timeframe forecasts: {}", timeframes);
        
        try {
            String[] times = timeframes.split(",");
            java.util.List<AttackForecast> forecasts = new java.util.ArrayList<>();
            
            for (String time : times) {
                int minutes = Integer.parseInt(time.trim());
                AttackForecast forecast = forecastingService.generateForecast(minutes);
                forecasts.add(forecast);
            }
            
            MultiForecastResponse response = new MultiForecastResponse(forecasts);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error generating multi-timeframe forecasts", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class MultiForecastResponse {
        private java.util.List<AttackForecast> forecasts;
    }
}
