package com.defenddos.backend_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for ML prediction API.
 * Contains traffic features for ML model classification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLPredictionRequest {

    @NotNull
    @JsonProperty("source_ip")
    private String sourceIp;

    @NotNull
    @JsonProperty("destination_ip")
    private String destinationIp;

    @NotNull
    @JsonProperty("packet_count")
    private Long packetCount;

    @NotNull
    @JsonProperty("byte_count")
    private Long byteCount;

    // Feature 1-5: Packet Statistics
    @JsonProperty("fwd_packets_per_second")
    private Double fwdPacketsPerSecond;

    @JsonProperty("bwd_packets_per_second")
    private Double bwdPacketsPerSecond;

    @JsonProperty("fwd_packet_length_max")
    private Long fwdPacketLengthMax;

    @JsonProperty("fwd_packet_length_min")
    private Long fwdPacketLengthMin;

    @JsonProperty("fwd_packet_length_mean")
    private Double fwdPacketLengthMean;

    // Feature 6-10: Byte Statistics
    @JsonProperty("bwd_packet_length_max")
    private Long bwdPacketLengthMax;

    @JsonProperty("bwd_packet_length_min")
    private Long bwdPacketLengthMin;

    @JsonProperty("bwd_packet_length_mean")
    private Double bwdPacketLengthMean;

    @JsonProperty("flow_bytes_per_second")
    private Long flowBytesPerSecond;

    @JsonProperty("flow_packets_per_second")
    private Long flowPacketsPerSecond;

    // Feature 11-15: Flow Characteristics
    @JsonProperty("flow_iat_mean")
    private Double flowIatMean;

    @JsonProperty("flow_iat_max")
    private Long flowIatMax;

    @JsonProperty("flow_iat_min")
    private Long flowIatMin;

    @JsonProperty("flow_duration")
    private Long flowDuration;

    @JsonProperty("active_time_max")
    private Long activeTimeMax;

    // Feature 16-20: Direction Ratios
    @JsonProperty("fwd_header_length")
    private Double fwdHeaderLength;

    @JsonProperty("bwd_header_length")
    private Double bwdHeaderLength;

    @JsonProperty("fwd_packets_per_second_ratio")
    private Double fwdPacketsPerSecondRatio;

    @JsonProperty("subflow_fwd_packets")
    private Long subflowFwdPackets;

    @JsonProperty("subflow_bwd_packets")
    private Long subflowBwdPackets;

    // Feature 21-25: TCP Flags
    @JsonProperty("fin_flag_count")
    private Long finFlagCount;

    @JsonProperty("syn_flag_count")
    private Long synFlagCount;

    @JsonProperty("rst_flag_count")
    private Long rstFlagCount;

    @JsonProperty("psh_flag_count")
    private Long pshFlagCount;

    @JsonProperty("ack_flag_count")
    private Long ackFlagCount;

    // Feature 26-30: Advanced Metrics
    @JsonProperty("urg_flag_count")
    private Long urgFlagCount;

    @JsonProperty("cwr_flag_count")
    private Long cwrFlagCount;

    @JsonProperty("ece_flag_count")
    private Long eceFlagCount;

    @JsonProperty("down_up_ratio")
    private Double downUpRatio;

    @JsonProperty("avg_packet_size")
    private Double avgPacketSize;
}
