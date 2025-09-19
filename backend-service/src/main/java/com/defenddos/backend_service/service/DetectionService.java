package com.defenddos.backend_service.service;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class DetectionService {

    private static final Logger logger = LoggerFactory.getLogger(DetectionService.class);
    
    private final InfluxDBClient influxDBClient;
    private final String bucket;
    private final String org;
    private final AlertService alertService;
    private final MitigationService mitigationService;

    // Define thresholds for different threat levels
    private static final long PACKET_THRESHOLD_LOW = 1000;      // 1k packets/minute
    private static final long PACKET_THRESHOLD_MEDIUM = 5000;   // 5k packets/minute  
    private static final long PACKET_THRESHOLD_HIGH = 15000;    // 15k packets/minute
    private static final long PACKET_THRESHOLD_CRITICAL = 50000; // 50k packets/minute

    public DetectionService(InfluxDBClient influxDBClient,
                            @Value("${influx.bucket}") String bucket,
                            @Value("${influx.org}") String org,
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
        logger.debug("Starting anomaly detection scan...");

        String fluxQuery = String.format(
            "from(bucket: \"%s\") " +
            "|> range(start: -1m) " + // Check traffic in the last minute
            "|> filter(fn: (r) => r._measurement == \"traffic_data\" and r._field == \"packetCount\") " +
            "|> group(columns: [\"sourceIp\"]) " +
            "|> sum() " + // Sum up the packets for each source IP
            "|> group()",
            bucket
        );

        QueryApi queryApi = influxDBClient.getQueryApi();
        queryApi.query(fluxQuery, org).forEach(table -> {
            for (FluxRecord record : table.getRecords()) {
                Long totalPackets = (Long) record.getValueByKey("_value");
                String sourceIp = (String) record.getValueByKey("sourceIp");

                if (totalPackets != null && sourceIp != null) {
                    String threatLevel = classifyThreat(totalPackets);
                    
                    if (!threatLevel.equals("NORMAL")) {
                        // Potential attack detected - log and respond
                        logger.warn("[THREAT DETECTED] {} level threat from IP: {}. Packets in last minute: {}", 
                            threatLevel, sourceIp, totalPackets);
                        
                        // Send alert notification
                        alertService.sendThreatAlert(sourceIp, totalPackets, threatLevel);
                        
                        // Auto-mitigation for HIGH and CRITICAL threats
                        if (threatLevel.equals("HIGH") || threatLevel.equals("CRITICAL")) {
                            String reason = String.format("%s threat detected: %d packets/minute", threatLevel, totalPackets);
                            boolean blocked = mitigationService.blockIp(sourceIp, reason);
                            
                            if (blocked) {
                                logger.info("Successfully applied mitigation for IP: {} ({})", sourceIp, threatLevel);
                                // Send additional alert about mitigation action
                                alertService.sendCustomAlert(
                                    "Automated Mitigation Applied",
                                    String.format("IP %s has been automatically blocked due to %s threat level detection. " +
                                        "Traffic volume: %d packets/minute. Review and unblock if necessary.", 
                                        sourceIp, threatLevel, totalPackets)
                                );
                            } else {
                                logger.warn("Failed to apply mitigation for IP: {} ({})", sourceIp, threatLevel);
                            }
                        }
                    }
                }
            }
        });
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
