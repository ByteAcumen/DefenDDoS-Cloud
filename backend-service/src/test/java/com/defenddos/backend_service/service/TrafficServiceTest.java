package com.defenddos.backend_service.service;

import com.defenddos.backend_service.config.InfluxDBConfig;
import com.defenddos.backend_service.model.EnrichedTrafficPoint;
import com.defenddos.backend_service.model.TrafficPoint;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.client.WriteApi;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.client.write.Point;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Traffic Service Unit Tests")
class TrafficServiceTest {

    @Mock
    private InfluxDBConfig influxDBConfig;

    @Mock
    private InfluxDBClient influxDBClient;

    @Mock
    private WriteApi writeApi;

    @Mock
    private QueryApi queryApi;

    @Mock
    private MLDetectionService mlDetectionService;

    @InjectMocks
    private TrafficService trafficService;

    private TrafficPoint testTrafficPoint;

    @BeforeEach
    void setUp() {
        when(influxDBConfig.getClient()).thenReturn(influxDBClient);
        when(influxDBClient.getWriteApi()).thenReturn(writeApi);
        when(influxDBClient.getQueryApi()).thenReturn(queryApi);

        testTrafficPoint = new TrafficPoint();
        testTrafficPoint.setTimestamp(Instant.now().toString());
        testTrafficPoint.setSourceIp("192.168.1.100");
        testTrafficPoint.setDestinationIp("10.0.0.1");
        testTrafficPoint.setSourcePort(12345);
        testTrafficPoint.setDestinationPort(80);
        testTrafficPoint.setProtocol("TCP");
        testTrafficPoint.setPacketLength(1500);
        testTrafficPoint.setFlowDuration(1000L);
        testTrafficPoint.setPacketsPerSecond(100.0);
        testTrafficPoint.setBytesPerSecond(150000.0);
    }

    @Test
    @DisplayName("Should successfully ingest traffic data")
    void testIngestTraffic_Success() {
        // Act
        boolean result = trafficService.ingestTraffic(testTrafficPoint);

        // Assert
        assertThat(result).isTrue();
        verify(writeApi, times(1)).writePoint(
                eq("defenddos-bucket"),
                eq("defenddos-org"),
                any(Point.class)
        );
    }

    @Test
    @DisplayName("Should handle null traffic point")
    void testIngestTraffic_NullPoint() {
        // Act & Assert
        assertThatThrownBy(() -> trafficService.ingestTraffic(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Traffic point cannot be null");
    }

    @Test
    @DisplayName("Should handle InfluxDB write exception")
    void testIngestTraffic_WriteException() {
        doThrow(new RuntimeException("InfluxDB write error"))
                .when(writeApi).writePoint(anyString(), anyString(), any(Point.class));

        // Act
        boolean result = trafficService.ingestTraffic(testTrafficPoint);

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should successfully ingest batch traffic")
    void testIngestBatchTraffic_Success() {
        List<TrafficPoint> batch = Arrays.asList(testTrafficPoint, testTrafficPoint, testTrafficPoint);

        // Act
        int result = trafficService.ingestBatchTraffic(batch);

        // Assert
        assertThat(result).isEqualTo(3);
        verify(writeApi, times(3)).writePoint(
                eq("defenddos-bucket"),
                eq("defenddos-org"),
                any(Point.class)
        );
    }

    @Test
    @DisplayName("Should handle partial batch failures")
    void testIngestBatchTraffic_PartialFailure() {
        List<TrafficPoint> batch = Arrays.asList(testTrafficPoint, testTrafficPoint, testTrafficPoint);

        doNothing()
                .doThrow(new RuntimeException("Write error"))
                .doNothing()
                .when(writeApi).writePoint(anyString(), anyString(), any(Point.class));

        // Act
        int result = trafficService.ingestBatchTraffic(batch);

        // Assert
        assertThat(result).isEqualTo(2);
    }

    @Test
    @DisplayName("Should create correct InfluxDB Point with all fields")
    void testCreateInfluxDBPoint() {
        ArgumentCaptor<Point> pointCaptor = ArgumentCaptor.forClass(Point.class);

        // Act
        trafficService.ingestTraffic(testTrafficPoint);

        // Assert
        verify(writeApi).writePoint(eq("defenddos-bucket"), eq("defenddos-org"), pointCaptor.capture());
        Point capturedPoint = pointCaptor.getValue();
        assertThat(capturedPoint).isNotNull();
    }

    @Test
    @DisplayName("Should query recent traffic successfully")
    void testGetRecentTraffic_Success() {
        // Mock Flux query response
        FluxTable mockTable = mock(FluxTable.class);
        FluxRecord mockRecord = mock(FluxRecord.class);
        
        when(mockRecord.getValueByKey("sourceIp")).thenReturn("192.168.1.100");
        when(mockRecord.getValueByKey("destinationIp")).thenReturn("10.0.0.1");
        when(mockRecord.getValueByKey("protocol")).thenReturn("TCP");
        when(mockRecord.getTime()).thenReturn(Instant.now());
        
        when(mockTable.getRecords()).thenReturn(Collections.singletonList(mockRecord));
        when(queryApi.query(anyString(), anyString())).thenReturn(Collections.singletonList(mockTable));

        // Act
        List<EnrichedTrafficPoint> result = trafficService.getRecentTraffic(10);

        // Assert
        assertThat(result).isNotNull();
        verify(queryApi, times(1)).query(anyString(), eq("defenddos-org"));
    }

    @Test
    @DisplayName("Should query traffic by time range")
    void testGetTrafficByTimeRange_Success() {
        Instant start = Instant.now().minusSeconds(3600);
        Instant end = Instant.now();

        FluxTable mockTable = mock(FluxTable.class);
        when(mockTable.getRecords()).thenReturn(Collections.emptyList());
        when(queryApi.query(anyString(), anyString())).thenReturn(Collections.singletonList(mockTable));

        // Act
        List<EnrichedTrafficPoint> result = trafficService.getTrafficByTimeRange(start, end);

        // Assert
        assertThat(result).isNotNull();
        verify(queryApi, times(1)).query(contains("range"), eq("defenddos-org"));
    }

    @Test
    @DisplayName("Should query traffic by source IP")
    void testGetTrafficBySourceIp_Success() {
        String sourceIp = "192.168.1.100";

        FluxTable mockTable = mock(FluxTable.class);
        when(mockTable.getRecords()).thenReturn(Collections.emptyList());
        when(queryApi.query(anyString(), anyString())).thenReturn(Collections.singletonList(mockTable));

        // Act
        List<EnrichedTrafficPoint> result = trafficService.getTrafficBySourceIp(sourceIp);

        // Assert
        assertThat(result).isNotNull();
        verify(queryApi, times(1)).query(contains(sourceIp), eq("defenddos-org"));
    }

    @Test
    @DisplayName("Should handle query exceptions gracefully")
    void testGetRecentTraffic_QueryException() {
        when(queryApi.query(anyString(), anyString()))
                .thenThrow(new RuntimeException("Query execution failed"));

        // Act
        List<EnrichedTrafficPoint> result = trafficService.getRecentTraffic(10);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should validate traffic point before ingestion")
    void testValidateTrafficPoint() {
        TrafficPoint invalidPoint = new TrafficPoint();
        // Missing required fields

        // Act & Assert
        assertThatThrownBy(() -> trafficService.ingestTraffic(invalidPoint))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Should handle concurrent batch ingestion")
    void testConcurrentBatchIngestion() {
        List<TrafficPoint> largeBatch = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            largeBatch.add(testTrafficPoint);
        }

        // Act
        int result = trafficService.ingestBatchTraffic(largeBatch);

        // Assert
        assertThat(result).isEqualTo(1000);
        verify(writeApi, times(1000)).writePoint(anyString(), anyString(), any(Point.class));
    }

    @Test
    @DisplayName("Should enrich traffic with ML predictions")
    void testEnrichTrafficWithMLPredictions() {
        Map<String, Object> mlPrediction = new HashMap<>();
        mlPrediction.put("prediction", "Benign");
        mlPrediction.put("confidence", 0.95);
        mlPrediction.put("threat_level", "low");

        when(mlDetectionService.analyzeSingleTraffic(any())).thenReturn(mlPrediction);

        FluxTable mockTable = mock(FluxTable.class);
        FluxRecord mockRecord = mock(FluxRecord.class);
        
        when(mockRecord.getValueByKey("sourceIp")).thenReturn("192.168.1.100");
        when(mockRecord.getTime()).thenReturn(Instant.now());
        when(mockTable.getRecords()).thenReturn(Collections.singletonList(mockRecord));
        when(queryApi.query(anyString(), anyString())).thenReturn(Collections.singletonList(mockTable));

        // Act
        List<EnrichedTrafficPoint> result = trafficService.getRecentTraffic(1);

        // Assert
        assertThat(result).isNotEmpty();
    }
}
