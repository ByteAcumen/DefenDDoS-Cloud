package com.defenddos.backend_service.model;

import com.influxdb.annotations.Column;
import com.influxdb.annotations.Measurement;
import lombok.Data;
import java.time.Instant;

@Data // Lombok annotation to automatically create getters, setters, etc.
@Measurement(name = "traffic_data") // This will be the table name in InfluxDB
public class TrafficPoint {

    @Column(tag = true) // Tags are indexed for faster queries
    private String sourceIp;

    @Column(tag = true)
    private String destinationIp;

    @Column
    private Long packetCount;

    @Column
    private Long byteCount;

    @Column(timestamp = true) // Marks this field as the official timestamp
    private Instant timestamp;

    // Manual getters and setters (backup for Lombok)
    public String getSourceIp() { return sourceIp; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }
    
    public String getDestinationIp() { return destinationIp; }
    public void setDestinationIp(String destinationIp) { this.destinationIp = destinationIp; }
    
    public Long getPacketCount() { return packetCount; }
    public void setPacketCount(Long packetCount) { this.packetCount = packetCount; }
    
    public Long getByteCount() { return byteCount; }
    public void setByteCount(Long byteCount) { this.byteCount = byteCount; }
    
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
