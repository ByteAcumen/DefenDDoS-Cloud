package com.defenddos.backend_service.service;

import com.defenddos.backend_service.dto.MLPredictionResponse;
import com.defenddos.backend_service.model.EnrichedTrafficPoint;
import com.defenddos.backend_service.model.TrafficPoint;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DetectionService {

    private static final Logger logger = LoggerFactory.getLogger(DetectionService.class);

    private final InfluxDBClient influxDBClient;
    private final String bucket;
    private final String org;
    private final AlertService alertService;
    private final MitigationService mitigationService;

    @Autowired(required = false)
    private MLDetectionService mlDetectionService;

    // Define thresholds for different threat levels
    private static final long PACKET_THRESHOLD_LOW = 1000; // 1k packets/minute
    private static final long PACKET_THRESHOLD_MEDIUM = 5000; // 5k packets/minute
    private static final long PACKET_THRESHOLD_HIGH = 15000; // 15k packets/minute
    private static final long PACKET_THRESHOLD_CRITICAL = 50000; // 50k packets/minute

    public DetectionService(InfluxDBClient influxDBClient,
            @Value("${defenddos.influx-db.bucket}") String bucket,
            @Value("${defenddos.influx-db.org}") String org,
            AlertService alertService,
            MitigationService mitigationService) {
        this.influxDBClient = influxDBClient;
        this.bucket = bucket;
        this.org = org;
        this.alertService = alertService;
        this.mitigationService = mitigationService;
    }

    @Scheduled(fixedRate = 30000) // Run this method every 30 seconds for real-time detection
    public void checkForAnomalies() {
        logger.info("Starting anomaly detection scan...");

        // Simplified query - get packetCount by sourceIp without pivot
        String fluxQuery = String.format(
                "from(bucket: \"%s\") " +
                        "|> range(start: -5m) " +
                        "|> filter(fn: (r) => r._measurement == \"traffic_data\" and r._field == \"packetCount\") " +
                        "|> group(columns: [\"sourceIp\"]) " +
                        "|> sum()",
                bucket);

        logger.info("Detection query executed - scanning for threats...");
        try {
            QueryApi queryApi = influxDBClient.getQueryApi();

            // Add null check to prevent NullPointerException in tests
            if (queryApi == null) {
                logger.warn("InfluxDB QueryApi not available, skipping detection scan");
                return;
            }

            List<FluxTable> tables = queryApi.query(fluxQuery, org);
            logger.info("Query returned {} tables", tables.size());

            // Flatten tables to a stream of meaningful records
            java.util.List<TrafficRecord> trafficRecords = new java.util.ArrayList<>();
            tables.forEach(table -> {
                for (FluxRecord record : table.getRecords()) {
                    String sourceIp = (String) record.getValueByKey("sourceIp");
                    Object packetCountObj = record.getValue();
                    if (sourceIp != null && packetCountObj != null) {
                        trafficRecords.add(new TrafficRecord(sourceIp, convertToLong(packetCountObj)));
                    }
                }
            });

            // Process records in parallel using Reactor
            reactor.core.publisher.Flux.fromIterable(trafficRecords)
                    .parallel()
                    .runOn(reactor.core.scheduler.Schedulers.boundedElastic())
                    .flatMap(record -> processTrafficRecord(record))
                    .sequential() // Back to sequential for completion waiting
                    // conversion)
                    .then() // Return Mono<Void>
                    .block(); // Block to ensure task finishes before next schedule

        } catch (Exception e) {
            logger.error("Detection scan failed: {}", e.getMessage(), e);
        }
    }

    private reactor.core.publisher.Mono<Void> processTrafficRecord(TrafficRecord record) {
        String sourceIp = record.sourceIp;
        Long packetCount = record.packetCount;

        logger.debug("Processing traffic from {}: {} packets", sourceIp, packetCount);

        // Traditional threshold-based detection
        String threatLevel = classifyThreat(packetCount);

        // Prepare traffic point for ML
        TrafficPoint basicTraffic = new TrafficPoint();
        basicTraffic.setSourceIp(sourceIp);
        basicTraffic.setDestinationIp("unknown");
        basicTraffic.setPacketCount(packetCount);
        basicTraffic.setByteCount(packetCount * 64L);
        EnrichedTrafficPoint enrichedTraffic = EnrichedTrafficPoint.fromBasicTrafficPoint(basicTraffic);

        // ML Prediction
        reactor.core.publisher.Mono<Boolean> mlAttackMono;
        if (mlDetectionService != null) {
            mlAttackMono = mlDetectionService.predict(enrichedTraffic)
                    .map(response -> response != null && response.getIsAttack())
                    .defaultIfEmpty(false);
        } else {
            mlAttackMono = reactor.core.publisher.Mono.just(false);
        }

        return mlAttackMono.doOnNext(mlDetectedAttack -> {
            if (!threatLevel.equals("NORMAL") || mlDetectedAttack) {
                logger.warn("[THREAT DETECTED] {} level threat from IP: {}. Packets: {}. ML Detected: {}",
                        threatLevel, sourceIp, packetCount, mlDetectedAttack);

                alertService.sendThreatAlert(sourceIp, packetCount, threatLevel);

                if (threatLevel.equals("HIGH") || threatLevel.equals("CRITICAL") || mlDetectedAttack) {
                    String reason = String.format("%s threat detected: %d packets (ML: %s)", threatLevel, packetCount,
                            mlDetectedAttack);
                    boolean blocked = mitigationService.blockIp(sourceIp, reason);
                    if (blocked) {
                        alertService.sendCustomAlert("Automated Mitigation Applied",
                                "Blocked IP " + sourceIp + " due to " + threatLevel + " threat.");
                    }
                }
            }
        }).then();
    }

    // Helper class for data transfer
    private static class TrafficRecord {
        String sourceIp;
        Long packetCount;

        TrafficRecord(String ip, Long count) {
            this.sourceIp = ip;
            this.packetCount = count;
        }
    }

    /**
     * Helper method to convert various number types to Long
     */
    private Long convertToLong(Object value) {
        if (value instanceof Long) {
            return (Long) value;
        } else if (value instanceof Integer) {
            return ((Integer) value).longValue();
        } else if (value instanceof Double) {
            return ((Double) value).longValue();
        }
        return 0L;
    }

    /**
     * Classify threat level based on packet count
     */
    private String classifyThreat(long packetCount) {
        if (packetCount >= PACKET_THRESHOLD_CRITICAL) {
            return "CRITICAL";
        } else if (packetCount >= PACKET_THRESHOLD_HIGH) {
            return "HIGH";
        } else if (packetCount >= PACKET_THRESHOLD_MEDIUM) {
            return "MEDIUM";
        } else if (packetCount >= PACKET_THRESHOLD_LOW) {
            return "LOW";
        }
        return "NORMAL";
    }

    /**
     * Manually trigger anomaly detection (for testing)
     */
    public void triggerManualDetection() {
        logger.info("Manual detection triggered");
        checkForAnomalies();
    }

    /**
     * Manual analysis of a specific IP address
     */
    public String analyzeIpAddress(String ipAddress) {
        String fluxQuery = String.format(
                "from(bucket: \"%s\") " +
                        "|> range(start: -5m) " +
                        "|> filter(fn: (r) => r._measurement == \"traffic_data\" and r._field == \"packetCount\" and r.sourceIp == \"%s\") "
                        +
                        "|> sum()",
                bucket, ipAddress);

        QueryApi queryApi = influxDBClient.getQueryApi();
        final long[] totalPackets = { 0 };

        queryApi.query(fluxQuery, org).forEach(table -> {
            for (FluxRecord record : table.getRecords()) {
                Long packets = (Long) record.getValueByKey("_value");
                if (packets != null) {
                    totalPackets[0] = packets;
                }
            }
        });

        String threatLevel = classifyThreat(totalPackets[0]);
        System.out.printf("[ANALYSIS] IP %s analyzed: %d packets in 5 minutes - Threat Level: %s%n",
                ipAddress, totalPackets[0], threatLevel);

        return threatLevel;
    }
}
