package com.defenddos.backend_service.service;

import com.defenddos.backend_service.model.TrafficPoint;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.WriteApiBlocking;
import com.influxdb.client.domain.WritePrecision;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service // Marks this as a Spring service
public class TrafficService {

    private final InfluxDBClient influxDBClient;
    private final String bucket;
    private final String org;

    // Spring automatically provides the InfluxDBClient and property values here
    @Autowired
    public TrafficService(InfluxDBClient influxDBClient,
                          @Value("${influx.bucket}") String bucket,
                          @Value("${influx.org}") String org) {
        this.influxDBClient = influxDBClient;
        this.bucket = bucket;
        this.org = org;
    }

    public void save(TrafficPoint trafficPoint) {
        WriteApiBlocking writeApi = influxDBClient.getWriteApiBlocking();
        
        // Write the data point to InfluxDB with bucket, org, and precision
        writeApi.writeMeasurement(bucket, org, WritePrecision.NS, trafficPoint);
        
        System.out.println("Successfully wrote data point from IP: " + trafficPoint.getSourceIp());
    }
}
