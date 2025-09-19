package com.defenddos.backend_service.service;

import com.defenddos.backend_service.model.TrafficPoint;
import com.defenddos.backend_service.model.TrafficSummaryPoint;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.WriteApiBlocking;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import com.influxdb.client.domain.WritePrecision;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

@Service // Marks this as a Spring service
public class TrafficService {

    private static final Logger logger = LoggerFactory.getLogger(TrafficService.class);
    
    private final InfluxDBClient influxDBClient;
    private final String bucket;
    private final String org;

    // Spring automatically provides the InfluxDBClient and property values here
    public TrafficService(InfluxDBClient influxDBClient,
                          @Value("${influx.bucket}") String bucket,
                          @Value("${influx.org}") String org) {
        this.influxDBClient = influxDBClient;
        this.bucket = bucket;
        this.org = org;
    }

    public void save(TrafficPoint trafficPoint) {
        WriteApiBlocking writeApi = influxDBClient.getWriteApiBlocking();
        
        try {
            // Write the data point to InfluxDB with bucket, org, and precision
            writeApi.writeMeasurement(bucket, org, WritePrecision.NS, trafficPoint);
            logger.info("Successfully ingested traffic data from source IP: {}, bytes: {}, packets: {}", 
                trafficPoint.getSourceIp(), trafficPoint.getByteCount(), trafficPoint.getPacketCount());
        } catch (Exception e) {
            logger.error("Failed to write to InfluxDB for source IP: {}", trafficPoint.getSourceIp(), e);
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        }
    }

    /**
     * Query traffic data from InfluxDB for analytics
     * @param timeRange Time range for the query (e.g., "-1h", "-30m", "-5m")
     * @return List of traffic data records
     */
    public List<Map<String, Object>> getTrafficData(String timeRange) {
        // Default to the last hour if no range is specified
        if (timeRange == null || timeRange.isEmpty()) {
            timeRange = "-1h";
        }

        // Flux query to retrieve data from the specified time range
        String fluxQuery = String.format(
            "from(bucket: \"%s\") |> range(start: %s) |> filter(fn: (r) => r._measurement == \"traffic_data\")",
            bucket, timeRange
        );

        QueryApi queryApi = influxDBClient.getQueryApi();
        List<FluxTable> tables = queryApi.query(fluxQuery, org);

        // Convert the query result into a more usable format (List of Maps)
        List<Map<String, Object>> result = new ArrayList<>();
        for (FluxTable table : tables) {
            for (FluxRecord record : table.getRecords()) {
                Map<String, Object> dataPoint = new HashMap<>();
                dataPoint.put("time", record.getTime());
                dataPoint.put("sourceIp", record.getValueByKey("sourceIp"));
                dataPoint.put("destinationIp", record.getValueByKey("destinationIp"));
                dataPoint.put("field", record.getField());
                dataPoint.put("value", record.getValue());
                result.add(dataPoint);
            }
        }
        return result;
    }

    /**
     * Get traffic summary aggregated by source IP for threat analysis
     * @param timeRange Time range for analysis
     * @return List of aggregated traffic data by IP
     */
    public List<Map<String, Object>> getTrafficSummaryByIp(String timeRange) {
        if (timeRange == null || timeRange.isEmpty()) {
            timeRange = "-1h";
        }

        String fluxQuery = String.format(
            "from(bucket: \"%s\") " +
            "|> range(start: %s) " +
            "|> filter(fn: (r) => r._measurement == \"traffic_data\" and r._field == \"packetCount\") " +
            "|> group(columns: [\"sourceIp\"]) " +
            "|> sum() " +
            "|> group()",
            bucket, timeRange
        );

        QueryApi queryApi = influxDBClient.getQueryApi();
        List<FluxTable> tables = queryApi.query(fluxQuery, org);

        List<Map<String, Object>> result = new ArrayList<>();
        for (FluxTable table : tables) {
            for (FluxRecord record : table.getRecords()) {
                Map<String, Object> summary = new HashMap<>();
                summary.put("sourceIp", record.getValueByKey("sourceIp"));
                summary.put("totalPackets", record.getValue());
                summary.put("timeRange", timeRange);
                result.add(summary);
            }
        }
        return result;
    }

    /**
     * Get aggregated traffic data for visualization (charts/graphs)
     * @param timeRange Time range for analysis (e.g., "-1h", "-30m")
     * @param windowPeriod Aggregation window (e.g., "1m", "5m", "15m")
     * @return List of time-series data points for visualization
     */
    public List<TrafficSummaryPoint> getTrafficSummary(String timeRange, String windowPeriod) {
        if (timeRange == null || timeRange.isEmpty()) {
            timeRange = "-1h"; // Default to the last hour
        }
        if (windowPeriod == null || windowPeriod.isEmpty()) {
            windowPeriod = "1m"; // Default to 1-minute windows
        }

        String fluxQuery = String.format(
            "from(bucket: \"%s\")\n" +
            "  |> range(start: %s)\n" +
            "  |> filter(fn: (r) => r._measurement == \"traffic_data\" and r._field == \"packetCount\")\n" +
            "  |> aggregateWindow(every: %s, fn: sum, createEmpty: true)\n" +
            "  |> yield(name: \"sum\")",
            bucket, timeRange, windowPeriod
        );

        QueryApi queryApi = influxDBClient.getQueryApi();
        List<FluxTable> tables = queryApi.query(fluxQuery, org);

        // Convert the result into our DTO for visualization
        List<TrafficSummaryPoint> summaryPoints = new ArrayList<>();
        for (FluxTable table : tables) {
            for (FluxRecord record : table.getRecords()) {
                Long value = record.getValue() instanceof Long ? (Long) record.getValue() : 0L;
                summaryPoints.add(new TrafficSummaryPoint(record.getTime(), value));
            }
        }
        return summaryPoints;
    }
}
