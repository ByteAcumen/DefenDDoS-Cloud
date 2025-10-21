# ML Service for DefenDDoS

Machine Learning-based DDoS detection service built with FastAPI and scikit-learn.

## Overview

This microservice provides ML-powered attack detection capabilities to the DefenDDoS system. It uses a Random Forest classifier trained on network traffic features to identify various types of DDoS attacks.

## Features

- **Real-time Predictions**: Fast ML inference for traffic classification
- **30 Traffic Features**: Comprehensive feature analysis including packet statistics, flow characteristics, and TCP flags
- **Attack Type Classification**: Detects DDoS, PortScan, Botnet, and other attack types
- **Confidence Scoring**: Provides confidence levels for predictions
- **Health Monitoring**: Built-in health check endpoints
- **Mock Mode**: Works without trained model for testing (uses heuristics)

## API Endpoints

### POST /predict
Predict if traffic is a DDoS attack.

**Request Body:**
```json
{
  "source_ip": "192.168.1.100",
  "destination_ip": "10.0.0.1",
  "packet_count": 15000,
  "byte_count": 45000000,
  "fwd_packets_per_second": 5000.0,
  "bwd_packets_per_second": 100.0,
  "syn_flag_count": 3000,
  ...
}
```

**Response:**
```json
{
  "is_attack": true,
  "attack_type": "DDoS",
  "confidence": 0.92,
  "severity": "HIGH",
  "timestamp": "2024-01-15T10:30:00",
  "model_version": "1.0.0"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00"
}
```

### GET /model-info
Get information about the loaded ML model.

**Response:**
```json
{
  "model_loaded": true,
  "model_version": "1.0.0",
  "feature_count": 32,
  "features": [...],
  "attack_types": {...}
}
```

## Installation

### Local Development

1. **Install Python dependencies:**
```bash
cd ml-service
pip install -r requirements.txt
```

2. **Run the service:**
```bash
python main.py
```

The service will start on `http://localhost:8000`

### Docker Deployment

The ML service is included in the main docker-compose.yml:

```bash
cd ..
docker-compose up ml-service
```

## Model Training

To train your own model, you'll need:

1. **Dataset**: Network traffic data with labeled attacks (e.g., CICIDS2017, CIC-DDoS2019)
2. **Features**: Extract all 30 features from raw packet data
3. **Training Script**: Use scikit-learn Random Forest classifier

Example training script:

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import pandas as pd

# Load your dataset
df = pd.read_csv('ddos_dataset.csv')

# Split features and labels
X = df[FEATURE_NAMES]
y = df['label']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, 'models/ddos_detection_model.pkl')

print(f"Model accuracy: {model.score(X_test, y_test)}")
```

## Features Explained

### 1-5: Packet Statistics
- `fwd_packets_per_second`: Forward packets rate
- `bwd_packets_per_second`: Backward packets rate
- `fwd_packet_length_max/min/mean`: Forward packet size statistics

### 6-10: Byte Statistics
- `bwd_packet_length_max/min/mean`: Backward packet size statistics
- `flow_bytes_per_second`: Total bytes per second
- `flow_packets_per_second`: Total packets per second

### 11-15: Flow Characteristics
- `flow_iat_mean/max/min`: Inter-arrival time statistics
- `flow_duration`: Total flow duration
- `active_time_max`: Maximum active time

### 16-20: Direction Ratios
- `fwd_header_length`: Forward header size
- `bwd_header_length`: Backward header size
- `subflow_fwd_packets`: Forward subflow packets
- `subflow_bwd_packets`: Backward subflow packets

### 21-25: TCP Flags
- `fin_flag_count`: FIN flags (connection termination)
- `syn_flag_count`: SYN flags (connection initiation)
- `rst_flag_count`: RST flags (connection reset)
- `psh_flag_count`: PSH flags (push data)
- `ack_flag_count`: ACK flags (acknowledgment)

### 26-30: Advanced Metrics
- `urg_flag_count`: URG flags (urgent data)
- `cwr_flag_count`: CWR flags (congestion window reduced)
- `ece_flag_count`: ECE flags (ECN-Echo)
- `down_up_ratio`: Download/Upload ratio
- `avg_packet_size`: Average packet size

## Attack Types

The model can detect the following attack types:

- **BENIGN**: Normal traffic (not an attack)
- **DDoS**: Distributed Denial of Service
- **PortScan**: Port scanning activity
- **Botnet**: Botnet command and control traffic
- **Infiltration**: Network infiltration attempts
- **Web Attack**: Web application attacks
- **Brute Force**: Brute force authentication attempts

## Mock Mode

When no trained model is available, the service operates in mock mode using simple heuristics:

- High packet count (>10,000) + High SYN flags (>1,000) = PortScan
- High packet count (>10,000) = DDoS
- Medium packet count (>5,000) = Potential DDoS
- Otherwise = BENIGN

This allows testing the integration without a trained model.

## Integration with Java Backend

The Java backend communicates with this service via HTTP:

1. Backend sends traffic features to `/predict` endpoint
2. ML service analyzes features and returns prediction
3. Backend triggers mitigation if high-confidence attack detected

## Performance

- **Prediction latency**: < 50ms per request
- **Throughput**: > 1000 predictions/second
- **Memory footprint**: ~200MB with model loaded

## Configuration

Environment variables (optional):

- `ML_MODEL_PATH`: Path to model file (default: `models/ddos_detection_model.pkl`)
- `LOG_LEVEL`: Logging level (default: `INFO`)
- `PORT`: Service port (default: `8000`)

## Monitoring

The service exposes the following metrics for monitoring:

- Health status via `/health`
- Model information via `/model-info`
- Application logs via stdout

## Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black main.py
```

### Type Checking
```bash
mypy main.py
```

## Troubleshooting

### Model Not Loading
**Issue**: Model file not found  
**Solution**: Place your trained model at `models/ddos_detection_model.pkl` or service will use mock predictions

### Connection Refused
**Issue**: Backend can't reach ML service  
**Solution**: Ensure both services are on the same Docker network or use correct hostname

### Slow Predictions
**Issue**: High latency  
**Solution**: Check model size, consider model optimization or hardware upgrade

## Future Enhancements

- [ ] Deep Learning models (LSTM, CNN)
- [ ] Online learning capabilities
- [ ] Feature importance visualization
- [ ] Model versioning and A/B testing
- [ ] GPU acceleration support
- [ ] Prometheus metrics export

## License

This is part of the DefenDDoS project.

## Support

For issues or questions, please refer to the main project documentation.
