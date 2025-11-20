package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.model.EnrichedTrafficPoint;
import com.defenddos.backend_service.model.TrafficPoint;
import com.defenddos.backend_service.service.TrafficService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@WebMvcTest(TrafficController.class)
@DisplayName("Traffic Controller Unit Tests")
class TrafficControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TrafficService trafficService;

    private TrafficPoint testTrafficPoint;
    private EnrichedTrafficPoint testEnrichedPoint;

    @BeforeEach
    void setUp() {
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

        testEnrichedPoint = new EnrichedTrafficPoint();
        testEnrichedPoint.setTimestamp(Instant.now().toString());
        testEnrichedPoint.setSourceIp("192.168.1.100");
        testEnrichedPoint.setThreatLevel("low");
        testEnrichedPoint.setPredictionLabel("Benign");
        testEnrichedPoint.setConfidence(0.95);
    }

    @Test
    @WithMockUser
    @DisplayName("Should successfully ingest traffic data")
    void testIngestTraffic_Success() throws Exception {
        when(trafficService.ingestTraffic(any(TrafficPoint.class)))
                .thenReturn(true);

        mockMvc.perform(post("/api/traffic/ingest")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testTrafficPoint)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Traffic data ingested successfully"));

        verify(trafficService, times(1)).ingestTraffic(any(TrafficPoint.class));
    }

    @Test
    @WithMockUser
    @DisplayName("Should handle traffic ingestion failure")
    void testIngestTraffic_Failure() throws Exception {
        when(trafficService.ingestTraffic(any(TrafficPoint.class)))
                .thenReturn(false);

        mockMvc.perform(post("/api/traffic/ingest")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testTrafficPoint)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value("error"));
    }

    @Test
    @WithMockUser
    @DisplayName("Should validate required fields on ingest")
    void testIngestTraffic_ValidationFailure() throws Exception {
        TrafficPoint invalidPoint = new TrafficPoint();
        // Missing required fields

        mockMvc.perform(post("/api/traffic/ingest")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPoint)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    @DisplayName("Should successfully ingest batch traffic data")
    void testIngestBatchTraffic_Success() throws Exception {
        List<TrafficPoint> trafficBatch = Arrays.asList(testTrafficPoint, testTrafficPoint);
        when(trafficService.ingestBatchTraffic(anyList()))
                .thenReturn(2);

        mockMvc.perform(post("/api/traffic/ingest/batch")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(trafficBatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.ingested").value(2));

        verify(trafficService, times(1)).ingestBatchTraffic(anyList());
    }

    @Test
    @WithMockUser
    @DisplayName("Should retrieve recent traffic")
    void testGetRecentTraffic_Success() throws Exception {
        List<EnrichedTrafficPoint> mockTraffic = Arrays.asList(testEnrichedPoint, testEnrichedPoint);
        when(trafficService.getRecentTraffic(anyInt()))
                .thenReturn(mockTraffic);

        mockMvc.perform(get("/api/traffic/recent")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].sourceIp").value("192.168.1.100"));

        verify(trafficService, times(1)).getRecentTraffic(10);
    }

    @Test
    @WithMockUser
    @DisplayName("Should retrieve traffic by time range")
    void testGetTrafficByTimeRange_Success() throws Exception {
        List<EnrichedTrafficPoint> mockTraffic = Arrays.asList(testEnrichedPoint);
        when(trafficService.getTrafficByTimeRange(any(Instant.class), any(Instant.class)))
                .thenReturn(mockTraffic);

        mockMvc.perform(get("/api/traffic/range")
                        .param("start", Instant.now().minusSeconds(3600).toString())
                        .param("end", Instant.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        verify(trafficService, times(1)).getTrafficByTimeRange(any(Instant.class), any(Instant.class));
    }

    @Test
    @WithMockUser
    @DisplayName("Should retrieve traffic by source IP")
    void testGetTrafficBySourceIp_Success() throws Exception {
        List<EnrichedTrafficPoint> mockTraffic = Arrays.asList(testEnrichedPoint);
        when(trafficService.getTrafficBySourceIp(anyString()))
                .thenReturn(mockTraffic);

        mockMvc.perform(get("/api/traffic/source/{sourceIp}", "192.168.1.100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sourceIp").value("192.168.1.100"));

        verify(trafficService, times(1)).getTrafficBySourceIp("192.168.1.100");
    }

    @Test
    @DisplayName("Should reject unauthorized access")
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(post("/api/traffic/ingest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testTrafficPoint)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    @DisplayName("Should handle service exceptions gracefully")
    void testIngestTraffic_ServiceException() throws Exception {
        when(trafficService.ingestTraffic(any(TrafficPoint.class)))
                .thenThrow(new RuntimeException("Database connection error"));

        mockMvc.perform(post("/api/traffic/ingest")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testTrafficPoint)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser
    @DisplayName("Should validate IP address format")
    void testIngestTraffic_InvalidIpAddress() throws Exception {
        testTrafficPoint.setSourceIp("invalid-ip");

        mockMvc.perform(post("/api/traffic/ingest")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testTrafficPoint)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    @DisplayName("Should handle empty batch request")
    void testIngestBatchTraffic_EmptyList() throws Exception {
        List<TrafficPoint> emptyBatch = Collections.emptyList();

        mockMvc.perform(post("/api/traffic/ingest/batch")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyBatch)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    @DisplayName("Should apply rate limiting")
    void testRateLimiting() throws Exception {
        when(trafficService.ingestTraffic(any(TrafficPoint.class)))
                .thenReturn(true);

        // Simulate multiple requests (actual rate limiting tested in integration tests)
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/traffic/ingest")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testTrafficPoint)))
                    .andExpect(status().isOk());
        }

        verify(trafficService, times(5)).ingestTraffic(any(TrafficPoint.class));
    }
}
