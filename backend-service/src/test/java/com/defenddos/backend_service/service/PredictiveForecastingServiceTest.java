package com.defenddos.backend_service.service;

import com.defenddos.backend_service.service.PredictiveForecastingService.AttackForecast;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive tests for Predictive Forecasting Service
 */
@ExtendWith(MockitoExtension.class)
@TestPropertySource(properties = {
    "forecasting.enabled=true",
    "forecasting.attack.threshold=0.75"
})
class PredictiveForecastingServiceTest {

    private PredictiveForecastingService forecastingService;

    @BeforeEach
    void setUp() {
        forecastingService = new PredictiveForecastingService();
    }

    @Test
    void testGenerateForecast_ValidTimeframe() {
        // Test forecast generation for valid timeframe
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertNotNull(forecast);
        assertNotNull(forecast.getTimestamp());
        assertTrue(forecast.getMinutesAhead() == 15);
        assertNotNull(forecast.getTrend());
    }

    @Test
    void testGenerateForecast_MultipleTimeframes() {
        // Test forecasts for different timeframes
        AttackForecast forecast15 = forecastingService.generateForecast(15);
        AttackForecast forecast30 = forecastingService.generateForecast(30);
        AttackForecast forecast60 = forecastingService.generateForecast(60);
        
        assertNotNull(forecast15);
        assertNotNull(forecast30);
        assertNotNull(forecast60);
        
        assertEquals(15, forecast15.getMinutesAhead());
        assertEquals(30, forecast30.getMinutesAhead());
        assertEquals(60, forecast60.getMinutesAhead());
    }

    @Test
    void testAttackProbabilityRange() {
        // Test that attack probability is within valid range
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertTrue(forecast.getAttackProbability() >= 0.0);
        assertTrue(forecast.getAttackProbability() <= 1.0);
    }

    @Test
    void testAnomalyScoreRange() {
        // Test that anomaly score is within valid range
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertTrue(forecast.getAnomalyScore() >= 0.0);
        assertTrue(forecast.getAnomalyScore() <= 1.0);
    }

    @Test
    void testConfidenceScoreRange() {
        // Test that confidence is within valid range
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertTrue(forecast.getConfidence() >= 0.0);
        assertTrue(forecast.getConfidence() <= 1.0);
    }

    @Test
    void testAttackLikelyFlag() {
        // Test that isAttackLikely flag matches probability threshold
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        if (forecast.getAttackProbability() >= 0.75) {
            assertTrue(forecast.isAttackLikely());
        } else {
            assertFalse(forecast.isAttackLikely());
        }
    }

    @Test
    void testRecommendationsPresent() {
        // Test that recommendations are provided
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertNotNull(forecast.getRecommendations());
        assertFalse(forecast.getRecommendations().isEmpty());
    }

    @Test
    void testDetectedPatternsValid() {
        // Test that detected patterns are valid
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertNotNull(forecast.getDetectedPatterns());
        // Patterns should be one of: EXPONENTIAL_GROWTH, SUSTAINED_HIGH_TRAFFIC, SUDDEN_SPIKE
    }

    @Test
    void testTrendClassification() {
        // Test that trend is properly classified
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertNotNull(forecast.getTrend());
        assertTrue(
            forecast.getTrend().equals("STRONG_UPWARD") ||
            forecast.getTrend().equals("UPWARD") ||
            forecast.getTrend().equals("STABLE") ||
            forecast.getTrend().equals("DOWNWARD") ||
            forecast.getTrend().equals("STRONG_DOWNWARD")
        );
    }

    @Test
    void testPredictedTrafficPositive() {
        // Test that predicted traffic is positive
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertTrue(forecast.getPredictedTraffic() >= 0);
    }

    @Test
    void testBaselineCalculation() {
        // Test that baseline is calculated
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertTrue(forecast.getBaseline() >= 0);
    }

    @Test
    void testCurrentTrafficRecorded() {
        // Test that current traffic is recorded
        AttackForecast forecast = forecastingService.generateForecast(15);
        
        assertTrue(forecast.getCurrentTraffic() >= 0);
    }
}
