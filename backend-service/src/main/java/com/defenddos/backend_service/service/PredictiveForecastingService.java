package com.defenddos.backend_service.service;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxTable;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.math3.stat.regression.SimpleRegression;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Predictive Attack Forecasting Service
 * 
 * Uses time-series analysis and machine learning to predict DDoS attacks
 * 15-60 minutes before they occur, enabling proactive defense measures.
 * 
 * Features:
 * - Exponential Moving Average (EMA) for trend detection
 * - Linear regression for traffic prediction
 * - Anomaly score calculation
 * - Attack probability estimation
 * - Multi-timeframe analysis (5min, 15min, 30min, 60min)
 */
@Service
@Slf4j
public class PredictiveForecastingService {

    @Autowired
    private InfluxDBClient influxDBClient;

    private static final String BUCKET = "defenddos-bucket";
    private static final String ORG = "defenddos-org";

    // EMA smoothing factors
    private static final double ALPHA_5MIN = 0.4;   // Fast EMA
    private static final double ALPHA_15MIN = 0.3;  // Medium EMA
    private static final double ALPHA_60MIN = 0.2;  // Slow EMA

    // Attack thresholds
    private static final double ATTACK_PROBABILITY_THRESHOLD = 0.75;
    private static final double TRAFFIC_SPIKE_THRESHOLD = 2.5; // 250% increase

    /**
     * Forecast attack probability for the next 15-60 minutes
     */
    public AttackForecast forecastAttack(int minutesAhead) {
        log.info("Generating attack forecast for {} minutes ahead", minutesAhead);

        try {
            // Step 1: Fetch historical traffic data
            List<TrafficDataPoint> historicalData = fetchHistoricalTraffic(180); // Last 3 hours

            if (historicalData.size() < 30) {
                log.warn("Insufficient historical data for forecasting");
                return AttackForecast.insufficient();
            }

            // Step 2: Calculate baseline metrics
            double baselineTraffic = calculateBaseline(historicalData);
            double currentTraffic = historicalData.get(historicalData.size() - 1).getRequestCount();

            // Step 3: Trend analysis using multiple EMAs
            double ema5 = calculateEMA(historicalData, 5, ALPHA_5MIN);
            double ema15 = calculateEMA(historicalData, 15, ALPHA_15MIN);
            double ema60 = calculateEMA(historicalData, 60, ALPHA_60MIN);

            // Step 4: Detect trend direction
            TrendDirection trend = detectTrend(ema5, ema15, ema60);

            // Step 5: Linear regression for prediction
            double predictedTraffic = predictTrafficLevel(historicalData, minutesAhead);

            // Step 6: Calculate anomaly score
            double anomalyScore = calculateAnomalyScore(currentTraffic, baselineTraffic, predictedTraffic);

            // Step 7: Estimate attack probability
            double attackProbability = estimateAttackProbability(
                anomalyScore, trend, currentTraffic, baselineTraffic
            );

            // Step 8: Detect attack patterns
            List<String> detectedPatterns = detectAttackPatterns(historicalData);

            // Step 9: Generate recommendations
            List<String> recommendations = generateRecommendations(attackProbability, trend);

            return AttackForecast.builder()
                .timestamp(Instant.now())
                .forecastMinutes(minutesAhead)
                .attackProbability(attackProbability)
                .isAttackLikely(attackProbability > ATTACK_PROBABILITY_THRESHOLD)
                .currentTraffic(currentTraffic)
                .predictedTraffic(predictedTraffic)
                .baselineTraffic(baselineTraffic)
                .anomalyScore(anomalyScore)
                .trend(trend)
                .confidence(calculateConfidence(historicalData.size()))
                .detectedPatterns(detectedPatterns)
                .recommendations(recommendations)
                .build();

        } catch (Exception e) {
            log.error("Error generating attack forecast", e);
            return AttackForecast.error(e.getMessage());
        }
    }

    /**
     * Fetch historical traffic data from InfluxDB
     */
    private List<TrafficDataPoint> fetchHistoricalTraffic(int minutes) {
        String flux = String.format("""
            from(bucket: "%s")
              |> range(start: -%dm)
              |> filter(fn: (r) => r._measurement == "traffic_data")
              |> filter(fn: (r) => r._field == "packets_per_second")
              |> aggregateWindow(every: 1m, fn: sum)
            """, BUCKET, minutes);

        QueryApi queryApi = influxDBClient.getQueryApi();
        List<FluxTable> tables = queryApi.query(flux, ORG);

        List<TrafficDataPoint> dataPoints = new ArrayList<>();
        for (FluxTable table : tables) {
            table.getRecords().forEach(record -> {
                dataPoints.add(TrafficDataPoint.builder()
                    .timestamp(record.getTime())
                    .requestCount(((Number) record.getValue()).doubleValue())
                    .build());
            });
        }

        return dataPoints.stream()
            .sorted(Comparator.comparing(TrafficDataPoint::getTimestamp))
            .collect(Collectors.toList());
    }

    /**
     * Calculate baseline traffic using median of historical data
     */
    private double calculateBaseline(List<TrafficDataPoint> data) {
        List<Double> values = data.stream()
            .map(TrafficDataPoint::getRequestCount)
            .sorted()
            .collect(Collectors.toList());

        int size = values.size();
        if (size == 0) return 0.0;
        
        if (size % 2 == 0) {
            return (values.get(size / 2 - 1) + values.get(size / 2)) / 2.0;
        } else {
            return values.get(size / 2);
        }
    }

    /**
     * Calculate Exponential Moving Average
     */
    private double calculateEMA(List<TrafficDataPoint> data, int period, double alpha) {
        if (data.size() < period) return 0.0;

        // Start with SMA (Simple Moving Average)
        double sma = data.subList(0, period).stream()
            .mapToDouble(TrafficDataPoint::getRequestCount)
            .average()
            .orElse(0.0);

        double ema = sma;

        // Calculate EMA for remaining data points
        for (int i = period; i < data.size(); i++) {
            double current = data.get(i).getRequestCount();
            ema = (current * alpha) + (ema * (1 - alpha));
        }

        return ema;
    }

    /**
     * Detect trend direction using EMA crossovers
     */
    private TrendDirection detectTrend(double ema5, double ema15, double ema60) {
        if (ema5 > ema15 && ema15 > ema60) {
            return TrendDirection.STRONG_UPWARD;
        } else if (ema5 > ema15) {
            return TrendDirection.UPWARD;
        } else if (ema5 < ema15 && ema15 < ema60) {
            return TrendDirection.STRONG_DOWNWARD;
        } else if (ema5 < ema15) {
            return TrendDirection.DOWNWARD;
        } else {
            return TrendDirection.STABLE;
        }
    }

    /**
     * Predict future traffic level using linear regression
     */
    private double predictTrafficLevel(List<TrafficDataPoint> data, int minutesAhead) {
        SimpleRegression regression = new SimpleRegression();

        // Convert timestamps to minutes from start
        Instant startTime = data.get(0).getTimestamp();
        
        for (TrafficDataPoint point : data) {
            long minutesFromStart = ChronoUnit.MINUTES.between(startTime, point.getTimestamp());
            regression.addData(minutesFromStart, point.getRequestCount());
        }

        long futureMinutes = ChronoUnit.MINUTES.between(startTime, Instant.now()) + minutesAhead;
        return Math.max(0, regression.predict(futureMinutes));
    }

    /**
     * Calculate anomaly score (0-1)
     */
    private double calculateAnomalyScore(double current, double baseline, double predicted) {
        if (baseline == 0) return 0.0;

        double deviationFromBaseline = Math.abs(current - baseline) / baseline;
        double deviationFromPredicted = Math.abs(current - predicted) / (predicted + 1);

        // Weighted average of deviations
        double score = (deviationFromBaseline * 0.6) + (deviationFromPredicted * 0.4);

        // Normalize to 0-1
        return Math.min(1.0, score);
    }

    /**
     * Estimate attack probability (0-1)
     */
    private double estimateAttackProbability(
        double anomalyScore,
        TrendDirection trend,
        double current,
        double baseline
    ) {
        double probability = 0.0;

        // Base probability from anomaly score
        probability += anomalyScore * 0.4;

        // Add probability based on trend
        switch (trend) {
            case STRONG_UPWARD -> probability += 0.3;
            case UPWARD -> probability += 0.15;
            case STABLE -> probability += 0.05;
            case DOWNWARD -> probability -= 0.05;
            case STRONG_DOWNWARD -> probability -= 0.1;
        }

        // Add probability based on traffic spike
        if (baseline > 0) {
            double spike = current / baseline;
            if (spike > TRAFFIC_SPIKE_THRESHOLD) {
                probability += 0.3;
            } else if (spike > 1.5) {
                probability += 0.15;
            }
        }

        return Math.max(0.0, Math.min(1.0, probability));
    }

    /**
     * Detect known attack patterns in traffic
     */
    private List<String> detectAttackPatterns(List<TrafficDataPoint> data) {
        List<String> patterns = new ArrayList<>();

        if (data.size() < 10) return patterns;

        // Pattern 1: Exponential growth
        double recentGrowth = calculateGrowthRate(data.subList(data.size() - 10, data.size()));
        if (recentGrowth > 1.5) {
            patterns.add("EXPONENTIAL_GROWTH");
        }

        // Pattern 2: Sustained high traffic
        long highTrafficCount = data.subList(data.size() - 30, data.size()).stream()
            .filter(d -> d.getRequestCount() > calculateBaseline(data) * 2)
            .count();
        if (highTrafficCount > 20) {
            patterns.add("SUSTAINED_HIGH_TRAFFIC");
        }

        // Pattern 3: Sudden spike
        if (data.size() >= 2) {
            double lastDiff = data.get(data.size() - 1).getRequestCount() - 
                            data.get(data.size() - 2).getRequestCount();
            double avgDiff = data.stream()
                .mapToDouble(TrafficDataPoint::getRequestCount)
                .average()
                .orElse(0.0);
            
            if (lastDiff > avgDiff * 5) {
                patterns.add("SUDDEN_SPIKE");
            }
        }

        return patterns;
    }

    /**
     * Calculate growth rate of recent traffic
     */
    private double calculateGrowthRate(List<TrafficDataPoint> data) {
        if (data.size() < 2) return 0.0;

        double first = data.get(0).getRequestCount();
        double last = data.get(data.size() - 1).getRequestCount();

        if (first == 0) return 0.0;
        return last / first;
    }

    /**
     * Calculate forecast confidence based on data quality
     */
    private double calculateConfidence(int dataPoints) {
        if (dataPoints < 30) return 0.3;
        if (dataPoints < 60) return 0.5;
        if (dataPoints < 120) return 0.7;
        if (dataPoints < 180) return 0.85;
        return 0.95;
    }

    /**
     * Generate actionable recommendations
     */
    private List<String> generateRecommendations(double attackProbability, TrendDirection trend) {
        List<String> recommendations = new ArrayList<>();

        if (attackProbability > 0.9) {
            recommendations.add("CRITICAL: Activate DDoS mitigation immediately");
            recommendations.add("Scale up infrastructure resources");
            recommendations.add("Enable aggressive rate limiting");
            recommendations.add("Consider blocking suspicious IPs proactively");
        } else if (attackProbability > 0.75) {
            recommendations.add("HIGH ALERT: Monitor traffic closely");
            recommendations.add("Prepare mitigation systems for activation");
            recommendations.add("Increase rate limiting thresholds");
            recommendations.add("Alert security team");
        } else if (attackProbability > 0.5) {
            recommendations.add("MEDIUM ALERT: Increased monitoring recommended");
            recommendations.add("Review recent traffic patterns");
            recommendations.add("Verify mitigation systems are operational");
        } else {
            recommendations.add("Traffic levels normal");
            recommendations.add("Continue standard monitoring");
        }

        if (trend == TrendDirection.STRONG_UPWARD) {
            recommendations.add("Traffic trend is strongly upward - prepare for surge");
        }

        return recommendations;
    }

    /**
     * Scheduled task to generate forecasts every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void generateScheduledForecasts() {
        log.info("Running scheduled attack forecast");
        
        // Generate forecasts for different timeframes
        AttackForecast forecast15 = forecastAttack(15);
        AttackForecast forecast30 = forecastAttack(30);
        AttackForecast forecast60 = forecastAttack(60);

        // Log high-probability attacks
        if (forecast15.getAttackProbability() > ATTACK_PROBABILITY_THRESHOLD) {
            log.warn("HIGH ATTACK PROBABILITY DETECTED: {}% in 15 minutes", 
                forecast15.getAttackProbability() * 100);
        }

        // TODO: Store forecasts in InfluxDB for historical analysis
        // TODO: Trigger alerts if probability exceeds threshold
    }

    // Inner classes
    public enum TrendDirection {
        STRONG_UPWARD, UPWARD, STABLE, DOWNWARD, STRONG_DOWNWARD
    }

    @lombok.Data
    @lombok.Builder
    public static class TrafficDataPoint {
        private Instant timestamp;
        private double requestCount;
    }

    @lombok.Data
    @lombok.Builder
    public static class AttackForecast {
        private Instant timestamp;
        private int forecastMinutes;
        private double attackProbability;
        private boolean isAttackLikely;
        private double currentTraffic;
        private double predictedTraffic;
        private double baselineTraffic;
        private double anomalyScore;
        private TrendDirection trend;
        private double confidence;
        private List<String> detectedPatterns;
        private List<String> recommendations;
        private String errorMessage;

        public static AttackForecast insufficient() {
            return AttackForecast.builder()
                .timestamp(Instant.now())
                .attackProbability(0.0)
                .isAttackLikely(false)
                .confidence(0.0)
                .errorMessage("Insufficient historical data")
                .detectedPatterns(Collections.emptyList())
                .recommendations(List.of("Collect more traffic data for accurate forecasting"))
                .build();
        }

        public static AttackForecast error(String message) {
            return AttackForecast.builder()
                .timestamp(Instant.now())
                .attackProbability(0.0)
                .isAttackLikely(false)
                .confidence(0.0)
                .errorMessage(message)
                .detectedPatterns(Collections.emptyList())
                .recommendations(Collections.emptyList())
                .build();
        }
    }
}
