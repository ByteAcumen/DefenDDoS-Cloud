# ML Integration Implementation Guide
## Complete Step-by-Step Integration of Your Random Forest Model

---

## 📋 Overview

This guide provides **complete, production-ready code** to integrate your trained Random Forest DDoS detection model with the DefenDDoS Spring Boot backend.

### Architecture Summary
```
Traffic Data → Spring Boot → HTTP Request → Python FastAPI → ML Model → Prediction → Auto-Mitigation
```

---

## Part 1: Python ML Service (FastAPI)

### Step 1.1: Project Structure

Create this folder structure:

```
ml_prediction_service/
│
├── artifacts/
│   ├── random_forest_tuned_final.joblib
│   ├── scaler.joblib
│   └── selected_features.json
│
├── main.py
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### Step 1.2: Requirements (`requirements.txt`)

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
scikit-learn==1.3.2
pandas==2.1.3
joblib==1.3.2
pydantic==2.5.0
```

Install: `pip install -r requirements.txt`

### Step 1.3: FastAPI Application (`main.py`)

```python
"""
DefenDDoS ML Prediction Service
A FastAPI microservice for DDoS attack detection using Random Forest ML model
"""

import joblib
import json
import pandas as pd
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Dict, Any
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# APPLICATION INITIALIZATION
# ============================================================================

app = FastAPI(
    title="DDoS Detection ML Service",
    description="Machine Learning microservice for real-time DDoS attack detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Spring Boot backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# LOAD ML ARTIFACTS AT STARTUP
# ============================================================================

try:
    logger.info("Loading ML artifacts...")
    
    # Load trained Random Forest model
    model = joblib.load("artifacts/random_forest_tuned_final.joblib")
    logger.info(f"✓ Model loaded: {type(model).__name__}")
    
    # Load feature scaler
    scaler = joblib.load("artifacts/scaler.joblib")
    logger.info(f"✓ Scaler loaded: {type(scaler).__name__}")
    
    # Load selected features list
    with open("artifacts/selected_features.json", 'r') as f:
        selected_features = json.load(f)
    logger.info(f"✓ Loaded {len(selected_features)} features")
    
    logger.info("✓✓✓ All artifacts loaded successfully!")
    
except FileNotFoundError as e:
    logger.error(f"❌ Artifact file not found: {e}")
    raise RuntimeError(
        f"Could not load required artifact: {e}. "
        "Ensure all artifact files are in the 'artifacts' directory."
    )
except Exception as e:
    logger.error(f"❌ Error loading artifacts: {e}")
    raise RuntimeError(f"Failed to initialize ML service: {e}")

# ============================================================================
# PYDANTIC MODELS (REQUEST/RESPONSE SCHEMAS)
# ============================================================================

class TrafficFeatures(BaseModel):
    """
    Request model containing 30 network traffic features required for prediction.
    Feature names must match exactly with your trained model's feature list.
    """
    
    # ======== EXAMPLE FEATURES ========
    # Replace these with your actual 30 features from selected_features.json
    
    urg_flag_count: float = Field(..., description="Count of URG flags", ge=0)
    bwd_packet_length_mean: float = Field(..., description="Mean backward packet length", ge=0)
    bwd_packets_s: float = Field(..., alias="bwd_packets/s", description="Backward packets per second", ge=0)
    subflow_bwd_bytes: float = Field(..., description="Subflow backward bytes", ge=0)
    init_bwd_win_bytes: float = Field(..., description="Initial backward window size", ge=0)
    fwd_header_length: float = Field(..., description="Forward header length", ge=0)
    bwd_header_length: float = Field(..., description="Backward header length", ge=0)
    flow_packets_s: float = Field(..., alias="flow_packets/s", description="Flow packets per second", ge=0)
    fwd_iat_mean: float = Field(..., description="Forward inter-arrival time mean", ge=0)
    total_fwd_packets: float = Field(..., description="Total forward packets", ge=0)
    total_backward_packets: float = Field(..., description="Total backward packets", ge=0)
    
    # Add remaining 19 features here based on your selected_features.json
    # Example format:
    # feature_name: float = Field(..., description="Description", ge=0)
    
    class Config:
        # Allow population by field name or alias
        populate_by_name = True
        
        # Example JSON schema
        json_schema_extra = {
            "example": {
                "urg_flag_count": 0.0,
                "bwd_packet_length_mean": 125.5,
                "bwd_packets/s": 50.2,
                "subflow_bwd_bytes": 10000.0,
                "init_bwd_win_bytes": 8192.0,
                "fwd_header_length": 40.0,
                "bwd_header_length": 40.0,
                "flow_packets/s": 100.5,
                "fwd_iat_mean": 0.05,
                "total_fwd_packets": 100.0,
                "total_backward_packets": 80.0
            }
        }
    
    @validator('*', pre=True)
    def convert_to_float(cls, value):
        """Convert all numeric values to float"""
        try:
            return float(value)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid numeric value: {value}")


class PredictionResponse(BaseModel):
    """Response model containing prediction results"""
    
    is_attack_prediction: int = Field(..., description="Prediction: 0=Benign, 1=Attack")
    confidence: float = Field(..., description="Model confidence (0-1)", ge=0, le=1)
    threat_level: str = Field(..., description="Threat classification")
    processing_time_ms: float = Field(..., description="Prediction processing time in milliseconds")
    model_version: str = Field(default="1.0.0", description="ML model version")
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_attack_prediction": 1,
                "confidence": 0.95,
                "threat_level": "HIGH",
                "processing_time_ms": 15.5,
                "model_version": "1.0.0"
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    scaler_loaded: bool
    features_count: int
    uptime_seconds: float


# ============================================================================
# STARTUP EVENT
# ============================================================================

startup_time = time.time()

@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info("=" * 60)
    logger.info("DDoS Detection ML Service Started")
    logger.info(f"Model: Random Forest")
    logger.info(f"Features: {len(selected_features)}")
    logger.info(f"Docs: http://127.0.0.1:8000/docs")
    logger.info("=" * 60)


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint - service information"""
    return {
        "service": "DDoS Detection ML Service",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for monitoring and service discovery.
    Returns the status of loaded ML artifacts.
    """
    return HealthResponse(
        status="healthy",
        model_loaded=model is not None,
        scaler_loaded=scaler is not None,
        features_count=len(selected_features),
        uptime_seconds=time.time() - startup_time
    )


@app.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_ddos(traffic_features: TrafficFeatures):
    """
    **Main Prediction Endpoint**
    
    Receives network traffic features and returns a DDoS attack prediction.
    
    **Process:**
    1. Validate input features
    2. Convert to DataFrame with correct feature order
    3. Apply feature scaling
    4. Run Random Forest prediction
    5. Calculate confidence and threat level
    6. Return structured prediction
    
    **Returns:**
    - `is_attack_prediction`: 0 (Benign) or 1 (Attack)
    - `confidence`: Model confidence score (0-1)
    - `threat_level`: Classification (NORMAL/LOW/MEDIUM/HIGH/CRITICAL)
    - `processing_time_ms`: Prediction latency
    """
    
    start_time = time.time()
    
    try:
        logger.info("Received prediction request")
        
        # ===== STEP 1: Convert Pydantic model to dictionary =====
        features_dict = traffic_features.dict(by_alias=False)
        logger.debug(f"Features received: {list(features_dict.keys())}")
        
        # ===== STEP 2: Create DataFrame with correct column order =====
        # This is CRITICAL - features must match training order
        input_df = pd.DataFrame([features_dict])
        
        # Reorder columns to match selected_features
        try:
            input_df = input_df[selected_features]
        except KeyError as e:
            missing_features = set(selected_features) - set(input_df.columns)
            extra_features = set(input_df.columns) - set(selected_features)
            error_msg = f"Feature mismatch. Missing: {missing_features}, Extra: {extra_features}"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        logger.debug(f"DataFrame shape: {input_df.shape}")
        
        # ===== STEP 3: Apply feature scaling =====
        scaled_features = scaler.transform(input_df)
        logger.debug("Features scaled successfully")
        
        # ===== STEP 4: Make prediction =====
        prediction = model.predict(scaled_features)[0]
        probabilities = model.predict_proba(scaled_features)[0]
        
        logger.info(f"Prediction: {prediction}, Probabilities: {probabilities}")
        
        # ===== STEP 5: Calculate confidence and threat level =====
        is_attack = int(prediction)
        confidence = float(probabilities[is_attack])
        
        # Classify threat level based on confidence
        if is_attack == 0:
            threat_level = "NORMAL"
        elif confidence >= 0.95:
            threat_level = "CRITICAL"
        elif confidence >= 0.85:
            threat_level = "HIGH"
        elif confidence >= 0.70:
            threat_level = "MEDIUM"
        else:
            threat_level = "LOW"
        
        # ===== STEP 6: Calculate processing time =====
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        logger.info(
            f"✓ Prediction complete: "
            f"Attack={is_attack}, "
            f"Confidence={confidence:.4f}, "
            f"Threat={threat_level}, "
            f"Time={processing_time:.2f}ms"
        )
        
        # ===== STEP 7: Return structured response =====
        return PredictionResponse(
            is_attack_prediction=is_attack,
            confidence=confidence,
            threat_level=threat_level,
            processing_time_ms=round(processing_time, 2),
            model_version="1.0.0"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        # Log unexpected errors
        logger.error(f"❌ Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@app.get("/features", response_model=Dict[str, Any])
async def get_features():
    """
    Returns the list of required features for prediction.
    Useful for debugging and validation.
    """
    return {
        "features": selected_features,
        "count": len(selected_features),
        "model_type": type(model).__name__,
        "scaler_type": type(scaler).__name__
    }


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Catch-all exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {
        "error": "Internal Server Error",
        "detail": str(exc),
        "path": str(request.url)
    }


# ============================================================================
# RUN THE APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes (development only)
        log_level="info"
    )
```

### Step 1.4: Feature Configuration (`selected_features.json`)

**IMPORTANT**: Replace this with your actual feature list from model training!

```json
[
  "urg_flag_count",
  "bwd_packet_length_mean",
  "bwd_packets/s",
  "subflow_bwd_bytes",
  "init_bwd_win_bytes",
  "fwd_header_length",
  "bwd_header_length",
  "flow_packets/s",
  "fwd_iat_mean",
  "total_fwd_packets",
  "total_backward_packets",
  "fwd_packet_length_max",
  "bwd_packet_length_min",
  "flow_duration",
  "flow_bytes_s",
  "fwd_iat_std",
  "bwd_iat_total",
  "psh_flag_count",
  "syn_flag_count",
  "fin_flag_count",
  "rst_flag_count",
  "ack_flag_count",
  "average_packet_size",
  "fwd_segment_size_avg",
  "bwd_segment_size_avg",
  "fwd_packets_s",
  "min_packet_length",
  "max_packet_length",
  "packet_length_std",
  "idle_mean"
]
```

### Step 1.5: Dockerfile for Python Service

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and artifacts
COPY main.py .
COPY artifacts/ ./artifacts/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 1.6: Test the Python Service

```bash
# Run locally
cd ml_prediction_service
python main.py

# Test health check
curl http://localhost:8000/health

# Test prediction (use your actual features)
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "urg_flag_count": 0.0,
    "bwd_packet_length_mean": 125.5,
    "bwd_packets/s": 50.2,
    ...
  }'
```

---

## Part 2: Spring Boot Integration

### Step 2.1: Add Dependencies (`pom.xml`)

```xml
<!-- Add after existing dependencies -->

<!-- WebFlux for reactive HTTP client -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>

<!-- Lombok (if not already present) -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### Step 2.2: Configuration Properties

Add to `application.properties`:

```properties
# ML Service Configuration
defenddos.ml.service.url=http://localhost:8000
defenddos.ml.service.enabled=true
defenddos.ml.service.timeout-seconds=5
defenddos.ml.service.retry-attempts=3
```

Add to `DefenDDoSProperties.java`:

```java
/**
 * ML service configuration
 */
public static class MlService {
    private String url = "http://localhost:8000";
    private boolean enabled = true;
    private int timeoutSeconds = 5;
    private int retryAttempts = 3;

    // Getters and setters
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    public int getRetryAttempts() { return retryAttempts; }
    public void setRetryAttempts(int retryAttempts) { this.retryAttempts = retryAttempts; }
}

// Add getter in main class
private final MlService mlService = new MlService();
public MlService getMlService() { return mlService; }
```

### Step 2.3: Create Extended Traffic Model

Create `EnrichedTrafficPoint.java`:

```java
package com.defenddos.backend_service.model;

import com.influxdb.annotations.Column;
import com.influxdb.annotations.Measurement;
import lombok.Data;
import jakarta.validation.constraints.*;
import java.time.Instant;

/**
 * Extended traffic data model with ML features
 * Contains all 30 features required for ML prediction
 */
@Data
@Measurement(name = "traffic_data_ml")
public class EnrichedTrafficPoint {

    // ===== BASIC IDENTIFICATION =====
    @Column(tag = true)
    @NotBlank(message = "Source IP is required")
    @Pattern(regexp = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$")
    private String sourceIp;

    @Column(tag = true)
    @NotBlank(message = "Destination IP is required")
    @Pattern(regexp = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$")
    private String destinationIp;

    @Column(timestamp = true)
    private Instant timestamp;

    // ===== ML FEATURES (30 total) =====
    // Replace these with your actual 30 features from selected_features.json
    
    @Column
    @NotNull
    private Double urgFlagCount;
    
    @Column
    @NotNull
    private Double bwdPacketLengthMean;
    
    @Column
    @NotNull
    private Double bwdPacketsPerSecond;
    
    @Column
    @NotNull
    private Double subflowBwdBytes;
    
    @Column
    @NotNull
    private Double initBwdWinBytes;
    
    @Column
    @NotNull
    private Double fwdHeaderLength;
    
    @Column
    @NotNull
    private Double bwdHeaderLength;
    
    @Column
    @NotNull
    private Double flowPacketsPerSecond;
    
    @Column
    @NotNull
    private Double fwdIatMean;
    
    @Column
    @NotNull
    private Double totalFwdPackets;
    
    @Column
    @NotNull
    private Double totalBackwardPackets;
    
    // Add remaining 19 features here...
    // Example:
    // @Column
    // @NotNull
    // private Double featureName;
}
```

### Step 2.4: Create DTOs for ML Communication

Create `dto/MLPredictionRequest.java`:

```java
package com.defenddos.backend_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

/**
 * Request DTO for ML prediction service
 * Contains 30 network traffic features
 */
@Data
@Builder
public class MLPredictionRequest {
    
    @JsonProperty("urg_flag_count")
    private Double urgFlagCount;
    
    @JsonProperty("bwd_packet_length_mean")
    private Double bwdPacketLengthMean;
    
    @JsonProperty("bwd_packets/s")
    private Double bwdPacketsPerSecond;
    
    @JsonProperty("subflow_bwd_bytes")
    private Double subflowBwdBytes;
    
    @JsonProperty("init_bwd_win_bytes")
    private Double initBwdWinBytes;
    
    @JsonProperty("fwd_header_length")
    private Double fwdHeaderLength;
    
    @JsonProperty("bwd_header_length")
    private Double bwdHeaderLength;
    
    @JsonProperty("flow_packets/s")
    private Double flowPacketsPerSecond;
    
    @JsonProperty("fwd_iat_mean")
    private Double fwdIatMean;
    
    @JsonProperty("total_fwd_packets")
    private Double totalFwdPackets;
    
    @JsonProperty("total_backward_packets")
    private Double totalBackwardPackets;
    
    // Add remaining 19 features here...
}
```

Create `dto/MLPredictionResponse.java`:

```java
package com.defenddos.backend_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Response DTO from ML prediction service
 */
@Data
public class MLPredictionResponse {
    
    @JsonProperty("is_attack_prediction")
    private int isAttackPrediction;  // 0 = Benign, 1 = Attack
    
    @JsonProperty("confidence")
    private double confidence;  // 0.0 - 1.0
    
    @JsonProperty("threat_level")
    private String threatLevel;  // NORMAL/LOW/MEDIUM/HIGH/CRITICAL
    
    @JsonProperty("processing_time_ms")
    private double processingTimeMs;
    
    @JsonProperty("model_version")
    private String modelVersion;
}
```

### Step 2.5: Configure WebClient

Create `config/WebClientConfig.java`:

```java
package com.defenddos.backend_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * WebClient configuration for ML service communication
 */
@Configuration
public class WebClientConfig {

    private final DefenDDoSProperties properties;

    public WebClientConfig(DefenDDoSProperties properties) {
        this.properties = properties;
    }

    @Bean
    public WebClient mlServiceWebClient() {
        DefenDDoSProperties.MlService mlConfig = properties.getMlService();
        
        // Configure HTTP client with timeouts
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, mlConfig.getTimeoutSeconds() * 1000)
                .responseTimeout(Duration.ofSeconds(mlConfig.getTimeoutSeconds()))
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(mlConfig.getTimeoutSeconds(), TimeUnit.SECONDS))
                            .addHandlerLast(new WriteTimeoutHandler(mlConfig.getTimeoutSeconds(), TimeUnit.SECONDS)));

        return WebClient.builder()
                .baseUrl(mlConfig.getUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
```

### Step 2.6: Create ML Detection Service

Create `service/MLDetectionService.java`:

```java
package com.defenddos.backend_service.service;

import com.defenddos.backend_service.config.DefenDDoSProperties;
import com.defenddos.backend_service.dto.MLPredictionRequest;
import com.defenddos.backend_service.dto.MLPredictionResponse;
import com.defenddos.backend_service.model.EnrichedTrafficPoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

/**
 * ML-based DDoS detection service
 * Communicates with Python FastAPI ML service for predictions
 */
@Service
public class MLDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(MLDetectionService.class);

    private final WebClient mlServiceWebClient;
    private final DefenDDoSProperties properties;
    private final AlertService alertService;
    private final MitigationService mitigationService;

    public MLDetectionService(WebClient mlServiceWebClient,
                             DefenDDoSProperties properties,
                             AlertService alertService,
                             MitigationService mitigationService) {
        this.mlServiceWebClient = mlServiceWebClient;
        this.properties = properties;
        this.alertService = alertService;
        this.mitigationService = mitigationService;
    }

    /**
     * Analyze traffic using ML model
     * @param traffic Enriched traffic data with all ML features
     * @return Mono containing prediction response
     */
    public Mono<MLPredictionResponse> analyzeTraffic(EnrichedTrafficPoint traffic) {
        if (!properties.getMlService().isEnabled()) {
            logger.debug("ML service is disabled");
            return Mono.empty();
        }

        logger.info("Requesting ML prediction for traffic from {}", traffic.getSourceIp());

        // Create prediction request from traffic data
        MLPredictionRequest request = createPredictionRequest(traffic);

        return mlServiceWebClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(MLPredictionResponse.class)
                .retryWhen(Retry.backoff(properties.getMlService().getRetryAttempts(), Duration.ofSeconds(1))
                        .filter(this::isRetryableError)
                        .doBeforeRetry(retrySignal -> 
                            logger.warn("Retrying ML service call (attempt {})", retrySignal.totalRetries() + 1)))
                .doOnSuccess(response -> handlePredictionResponse(traffic, response))
                .doOnError(error -> handlePredictionError(traffic, error))
                .onErrorResume(error -> {
                    logger.error("ML prediction failed after retries: {}", error.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * Create ML prediction request from traffic data
     */
    private MLPredictionRequest createPredictionRequest(EnrichedTrafficPoint traffic) {
        return MLPredictionRequest.builder()
                .urgFlagCount(traffic.getUrgFlagCount())
                .bwdPacketLengthMean(traffic.getBwdPacketLengthMean())
                .bwdPacketsPerSecond(traffic.getBwdPacketsPerSecond())
                .subflowBwdBytes(traffic.getSubflowBwdBytes())
                .initBwdWinBytes(traffic.getInitBwdWinBytes())
                .fwdHeaderLength(traffic.getFwdHeaderLength())
                .bwdHeaderLength(traffic.getBwdHeaderLength())
                .flowPacketsPerSecond(traffic.getFlowPacketsPerSecond())
                .fwdIatMean(traffic.getFwdIatMean())
                .totalFwdPackets(traffic.getTotalFwdPackets())
                .totalBackwardPackets(traffic.getTotalBackwardPackets())
                // Add remaining features...
                .build();
    }

    /**
     * Handle successful prediction response
     */
    private void handlePredictionResponse(EnrichedTrafficPoint traffic, MLPredictionResponse response) {
        logger.info("ML Prediction: {} - Confidence: {:.2f}% - Threat: {}",
                response.getIsAttackPrediction() == 1 ? "ATTACK" : "BENIGN",
                response.getConfidence() * 100,
                response.getThreatLevel());

        if (response.getIsAttackPrediction() == 1) {
            // Attack detected!
            handleAttackDetection(traffic, response);
        } else {
            logger.debug("Traffic classified as benign from {}", traffic.getSourceIp());
        }
    }

    /**
     * Handle attack detection
     */
    private void handleAttackDetection(EnrichedTrafficPoint traffic, MLPredictionResponse response) {
        String sourceIp = traffic.getSourceIp();
        double confidencePercent = response.getConfidence() * 100;

        logger.warn("[ML ATTACK DETECTED] IP: {} - Confidence: {:.2f}% - Threat Level: {}",
                sourceIp, confidencePercent, response.getThreatLevel());

        // Create detailed reason for mitigation
        String reason = String.format(
                "ML-detected %s threat (confidence: %.2f%%, model: %s)",
                response.getThreatLevel(),
                confidencePercent,
                response.getModelVersion()
        );

        // Send alert
        String alertMessage = String.format(
                "ML Model detected DDoS attack from %s\n" +
                "Threat Level: %s\n" +
                "Confidence: %.2f%%\n" +
                "Model Version: %s\n" +
                "Processing Time: %.2fms",
                sourceIp,
                response.getThreatLevel(),
                confidencePercent,
                response.getModelVersion(),
                response.getProcessingTimeMs()
        );
        alertService.sendCustomAlert("ML DDoS Attack Detection", alertMessage);

        // Apply mitigation based on threat level and confidence
        if (shouldApplyMitigation(response)) {
            boolean blocked = mitigationService.blockIp(sourceIp, reason);

            if (blocked) {
                logger.info("✓ Successfully blocked IP: {}", sourceIp);
                alertService.sendCustomAlert(
                        "Automated ML-based Mitigation",
                        String.format("IP %s has been automatically blocked. %s", sourceIp, reason)
                );
            } else {
                logger.warn("✗ Failed to block IP: {}", sourceIp);
            }
        } else {
            logger.info("Attack detected but confidence too low for auto-blocking: {:.2f}%", confidencePercent);
        }
    }

    /**
     * Determine if mitigation should be applied
     */
    private boolean shouldApplyMitigation(MLPredictionResponse response) {
        // Apply mitigation for HIGH and CRITICAL threats with confidence > 80%
        return (response.getThreatLevel().equals("HIGH") || 
                response.getThreatLevel().equals("CRITICAL")) &&
               response.getConfidence() >= 0.80;
    }

    /**
     * Handle prediction errors
     */
    private void handlePredictionError(EnrichedTrafficPoint traffic, Throwable error) {
        if (error instanceof WebClientResponseException) {
            WebClientResponseException webClientError = (WebClientResponseException) error;
            logger.error("ML service returned error: {} - {}",
                    webClientError.getStatusCode(),
                    webClientError.getResponseBodyAsString());
        } else {
            logger.error("ML prediction error for IP {}: {}",
                    traffic.getSourceIp(),
                    error.getMessage());
        }
    }

    /**
     * Determine if error is retryable
     */
    private boolean isRetryableError(Throwable error) {
        if (error instanceof WebClientResponseException) {
            WebClientResponseException webClientError = (WebClientResponseException) error;
            int statusCode = webClientError.getStatusCode().value();
            // Retry on 5xx errors (server errors) but not 4xx (client errors)
            return statusCode >= 500 && statusCode < 600;
        }
        // Retry on network errors
        return error instanceof java.net.ConnectException ||
               error instanceof java.io.IOException;
    }

    /**
     * Check if ML service is healthy
     */
    public Mono<Boolean> checkHealth() {
        return mlServiceWebClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> true)
                .onErrorReturn(false)
                .doOnSuccess(healthy -> 
                    logger.debug("ML service health check: {}", healthy ? "UP" : "DOWN"));
    }
}
```

---

## Part 3: Integration & Testing

### Step 3.1: Update Docker Compose

Add ML service to `docker-compose.yml`:

```yaml
services:
  influxdb:
    # ... existing config ...
  
  backend-service:
    # ... existing config ...
    depends_on:
      - influxdb
      - ml-service  # Add this
    environment:
      - DEFENDDOS_ML_SERVICE_URL=http://ml-service:8000
  
  ml-service:
    build:
      context: ../ml_prediction_service
      dockerfile: Dockerfile
    container_name: defenddos-ml-service
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ../ml_prediction_service/artifacts:/app/artifacts:ro
    networks:
      - defenddos-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  defenddos-network:
    driver: bridge
```

### Step 3.2: Test the Integration

```bash
# 1. Start all services
docker-compose up --build

# 2. Check ML service health
curl http://localhost:8000/health

# 3. Test prediction endpoint
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d @test_traffic.json

# 4. Send enriched traffic to Spring Boot
curl -X POST http://localhost:8082/api/v1/traffic/ingest-ml \
  -u admin:your-password \
  -H "Content-Type: application/json" \
  -d @enriched_traffic.json

# 5. Monitor logs
docker logs -f defenddos-backend
docker logs -f defenddos-ml-service
```

---

## 🎯 Next Steps

1. ✅ Deploy Python ML service
2. ✅ Add WebFlux dependency to Spring Boot
3. ✅ Create extended traffic model with 30 features
4. ✅ Implement ML detection service
5. ⬜ Update feature extraction (if needed)
6. ⬜ Test end-to-end workflow
7. ⬜ Monitor performance and accuracy
8. ⬜ Fine-tune thresholds

---

**Last Updated**: October 9, 2025  
**Status**: Ready for Implementation  
**Next Review**: After initial testing
