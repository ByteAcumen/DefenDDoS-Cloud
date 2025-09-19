package com.defenddos.backend_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrafficSummaryPoint {
    private Instant time;
    private Long totalPackets;
}