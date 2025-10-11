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
    private static final long PACKET_THRESHOLD_LOW = 1000;      // 1k packets/minute
    private static final long PACKET_THRESHOLD_MEDIUM = 5000;   // 5k packets/minute  
    private static final long PACKET_THRESHOLD_HIGH = 15000;    // 15k packets/minute
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
            bucket
        );

        logger.info("Detection query executed - scanning for threats...");
        try {
            QueryApi queryApi = influxDBClient.getQueryApi();
            List<FluxTable> tables = queryApi.query(fluxQuery, org);
            logger.info("Query returned {} tables", tables.size());
            
            tables.forEach(table -> {
                logger.info("Found table with {} records", table.getRecords().size());
                for (FluxRecord record : table.getRecords()) {
                    String sourceIp = (String) record.getValueByKey("sourceIp");
                    Object packetCountObj = record.getValue();  // Get the sum value
                    
                    if (sourceIp != null && packetCountObj != null) {
                        Long packetCount = convertToLong(packetCountObj);
                        logger.info("Detected traffic from {}: {} packets", sourceIp, packetCount);
                        
                        // Traditional threshold-based detection
                        String threatLevel = classifyThreat(packetCount);
                        
                        // ML-based detection (if enabled)
                        boolean mlDetectedAttack = false;
                        if (mlDetectionService != null) {
                            try {
                                // Create basic traffic point with available data
                                TrafficPoint basicTraffic = new TrafficPoint();
                                basicTraffic.setSourceIp(sourceIp);
                                basicTraffic.setDestinationIp("unknown"); // Not available in summary query
                                basicTraffic.setPacketCount(packetCount);
                                basicTraffic.setByteCount(packetCount * 64L); // Estimate: typical packet size
                                
                                // Convert to enriched traffic with estimated features
                                EnrichedTrafficPoint enrichedTraffic = 
                                        EnrichedTrafficPoint.fromBasicTrafficPoint(basicTraffic);
                                
                                // Get ML prediction
                                MLPredictionResponse mlResponse = mlDetectionService.predict(enrichedTraffic);
                                if (mlResponse != null && mlResponse.getIsAttack()) {
                                    mlDetectedAttack = true;
                                    logger.info("ML model detected attack from {}: {} (confidence: {})",
                                            sourceIp, mlResponse.getAttackType(), mlResponse.getConfidence());
                                }
                            } catch (Exception e) {
                                logger.error("ML detection failed for IP {}: {}", sourceIp, e.getMessage());
                            }
                        }
                        
                        // Take action if either detection method flags an attack
                        if (!threatLevel.equals("NORMAL") || mlDetectedAttack) {
                            // Potential attack detected - log and respond
                            logger.warn("[THREAT DETECTED] {} level threat from IP: {}. Packets in last 5 minutes: {}", 
                                threatLevel, sourceIp, packetCount);
                            
                            // Send alert notification
                            alertService.sendThreatAlert(sourceIp, packetCount, threatLevel);
                            
                            // Auto-mitigation for HIGH and CRITICAL threats
                            if (threatLevel.equals("HIGH") || threatLevel.equals("CRITICAL") || mlDetectedAttack) {
                                String reason = String.format("%s threat detected: %d packets", threatLevel, packetCount);
                                boolean blocked = mitigationService.blockIp(sourceIp, reason);
                                
                                if (blocked) {
                                    logger.info("✅ Successfully applied AUTO-MITIGATION for IP: {} ({})", sourceIp, threatLevel);
                                    // Send additional alert about mitigation action
                                    alertService.sendCustomAlert(
                                        "Automated Mitigation Applied",
                                        String.format("IP %s has been automatically blocked due to %s threat level detection. " +
                                            "Traffic volume: %d packets. Review and unblock if necessary.", 
                                            sourceIp, threatLevel, packetCount)
                                    );
                                } else {
                                    logger.warn("Failed to apply mitigation for IP: {} ({})", sourceIp, threatLevel);
                                }
                            }
                        }
                    }
                }
            });
        } catch (Exception e) {
            logger.error("Detection scan failed: {}", e.getMessage(), e);
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
            "|> filter(fn: (r) => r._measurement == \"traffic_data\" and r._field == \"packetCount\" and r.sourceIp == \"%s\") " +
            "|> sum()",
            bucket, ipAddress
        );

        QueryApi queryApi = influxDBClient.getQueryApi();
        final long[] totalPackets = {0};
        
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
