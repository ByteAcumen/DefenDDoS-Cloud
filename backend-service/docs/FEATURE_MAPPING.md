# Model Integration - Feature Mapping Guide

## Your Trained Models

Successfully integrated the following trained models:

1. **random_forest_tuned_final.joblib** - Random Forest Classifier
2. **lstm_autoencoder_tuned_final.h5** - LSTM Autoencoder (for future use)
3. **scaler.joblib** - StandardScaler for feature normalization
4. **selected_features.json** - 30 selected features configuration

## Feature Mapping

### Selected 30 Features (in order):

| # | Feature Name | Description | Type |
|---|--------------|-------------|------|
| 1 | `urg_flag_count` | URG flag count | TCP Flag |
| 2 | `bwd_packet_length_mean` | Mean backward packet length | Packet |
| 3 | `bwd_packets/s` | Backward packets per second | Rate |
| 4 | `subflow_bwd_bytes` | Subflow backward bytes | Flow |
| 5 | `init_bwd_win_bytes` | Initial backward window bytes | Window |
| 6 | `bwd_packet_length_max` | Maximum backward packet length | Packet |
| 7 | `fwd_packet_length_min` | Minimum forward packet length | Packet |
| 8 | `bwd_packets_length_total` | Total backward packets length | Packet |
| 9 | `packet_length_min` | Minimum packet length | Packet |
| 10 | `fwd_packets_length_total` | Total forward packets length | Packet |
| 11 | `fwd_act_data_packets` | Forward active data packets | Packet |
| 12 | `fwd_iat_total` | Forward inter-arrival time total | Timing |
| 13 | `avg_packet_size` | Average packet size | Packet |
| 14 | `packet_length_std` | Packet length standard deviation | Packet |
| 15 | `init_fwd_win_bytes` | Initial forward window bytes | Window |
| 16 | `fwd_iat_mean` | Forward inter-arrival time mean | Timing |
| 17 | `down/up_ratio` | Download/Upload ratio | Ratio |
| 18 | `packet_length_mean` | Mean packet length | Packet |
| 19 | `subflow_fwd_bytes` | Subflow forward bytes | Flow |
| 20 | `avg_fwd_segment_size` | Average forward segment size | Segment |
| 21 | `ack_flag_count` | ACK flag count | TCP Flag |
| 22 | `fwd_iat_std` | Forward IAT standard deviation | Timing |
| 23 | `flow_iat_mean` | Flow inter-arrival time mean | Timing |
| 24 | `total_fwd_packets` | Total forward packets | Count |
| 25 | `flow_iat_std` | Flow IAT standard deviation | Timing |
| 26 | `fwd_psh_flags` | Forward PSH flags | TCP Flag |
| 27 | `flow_packets/s` | Flow packets per second | Rate |
| 28 | `fwd_packet_length_mean` | Forward packet length mean | Packet |
| 29 | `packet_length_max` | Maximum packet length | Packet |
| 30 | `total_backward_packets` | Total backward packets | Count |

## JSON Request Format

When sending requests to the ML service, use this format:

```json
{
  "source_ip": "192.168.1.100",
  "destination_ip": "10.0.0.1",
  "urg_flag_count": 0.0,
  "bwd_packet_length_mean": 0.0,
  "bwd_packets/s": 100.0,
  "subflow_bwd_bytes": 50000.0,
  "init_bwd_win_bytes": 8192.0,
  "bwd_packet_length_max": 1500.0,
  "fwd_packet_length_min": 40.0,
  "bwd_packets_length_total": 150000.0,
  "packet_length_min": 40.0,
  "fwd_packets_length_total": 500000.0,
  "fwd_act_data_packets": 5000.0,
  "fwd_iat_total": 60000.0,
  "avg_packet_size": 800.0,
  "packet_length_std": 200.0,
  "init_fwd_win_bytes": 8192.0,
  "fwd_iat_mean": 10.0,
  "down/up_ratio": 0.5,
  "packet_length_mean": 750.0,
  "subflow_fwd_bytes": 250000.0,
  "avg_fwd_segment_size": 750.0,
  "ack_flag_count": 4500.0,
  "fwd_iat_std": 5.0,
  "flow_iat_mean": 10.0,
  "total_fwd_packets": 10000.0,
  "flow_iat_std": 5.0,
  "fwd_psh_flags": 100.0,
  "flow_packets/s": 500.0,
  "fwd_packet_length_mean": 750.0,
  "packet_length_max": 1500.0,
  "total_backward_packets": 1500.0
}
```

## Model Architecture

### Random Forest Classifier
- **Type**: Supervised Learning - Classification
- **Purpose**: Binary classification (Benign vs Attack)
- **Input**: 30 features (scaled)
- **Output**: 
  - Class: 0 (BENIGN) or 1 (DDoS_ATTACK)
  - Confidence: Probability score (0.0 - 1.0)
- **Preprocessing**: StandardScaler normalization

### LSTM Autoencoder
- **Type**: Deep Learning - Anomaly Detection
- **Purpose**: Anomaly detection (available for future integration)
- **Input**: 30 features (sequence)
- **Output**: Reconstruction error (threshold-based anomaly detection)

## Integration Flow

```
1. Traffic Data Captured
   ↓
2. Extract 30 Features (in correct order)
   ↓
3. Send JSON Request to ML Service
   ↓
4. ML Service Loads scaler.joblib
   ↓
5. Features Scaled (StandardScaler)
   ↓
6. Random Forest Prediction
   ↓
7. Return: {is_attack, attack_type, confidence, severity}
   ↓
8. Backend Triggers Mitigation (if high confidence)
```

## Attack Classification

### Binary Classification:
- **Class 0**: BENIGN (Normal Traffic)
- **Class 1**: DDoS_ATTACK (Attack Detected)

### Severity Levels (calculated):
- **CRITICAL**: Confidence ≥ 0.9 AND packets > 20,000
- **HIGH**: Confidence ≥ 0.8 AND packets > 10,000
- **MEDIUM**: Confidence ≥ 0.7 AND packets > 5,000
- **LOW**: Confidence ≥ 0.6
- **NORMAL**: Confidence < 0.6 OR BENIGN class

## Feature Extraction from Raw Traffic

To extract these features from raw packet data, you need:

### Packet Capture Tools:
- **CICFlowMeter** - Recommended for feature extraction
- **Tshark/Wireshark** - Raw packet analysis
- **Custom Python Scripts** - Using scapy/pyshark

### Example CICFlowMeter Usage:
```bash
java -jar CICFlowMeter.jar
# Configure: Input = pcap file, Output = CSV with features
```

### Example Python Feature Extraction:
```python
from scapy.all import rdpcap, IP, TCP

def extract_features(pcap_file):
    packets = rdpcap(pcap_file)
    
    # Initialize feature counters
    features = {
        'total_fwd_packets': 0,
        'total_backward_packets': 0,
        'fwd_packets_length_total': 0,
        'bwd_packets_length_total': 0,
        'urg_flag_count': 0,
        'ack_flag_count': 0,
        'fwd_psh_flags': 0,
        # ... extract all 30 features
    }
    
    for packet in packets:
        if IP in packet and TCP in packet:
            # Extract features from packet
            if is_forward_packet(packet):
                features['total_fwd_packets'] += 1
                features['fwd_packets_length_total'] += len(packet)
                if packet[TCP].flags & 0x20:  # URG flag
                    features['urg_flag_count'] += 1
            # ... continue for all features
    
    return features
```

## Testing Your Models

### 1. Test ML Service Directly
```powershell
curl -X POST http://localhost:8000/predict `
  -H "Content-Type: application/json" `
  -d (Get-Content test-traffic.json -Raw)
```

### 2. Check Model Info
```powershell
curl http://localhost:8000/model-info
```

Expected response:
```json
{
  "rf_model_loaded": true,
  "scaler_loaded": true,
  "model_version": "2.0.0",
  "feature_count": 30,
  "features": [...],
  "attack_types": {"0": "BENIGN", "1": "DDoS_ATTACK"},
  "model_type": "Random Forest Classifier",
  "scaling": "StandardScaler"
}
```

### 3. Test via Backend
```powershell
curl -X POST http://localhost:8082/api/v1/traffic/predict-attack `
  -H "Content-Type: application/json" `
  -u admin:DefenDDoS123! `
  -d @test-traffic.json
```

## Model Performance

Your trained models should have:
- **Accuracy**: > 95%
- **Precision**: > 90%
- **Recall**: > 95%
- **F1-Score**: > 93%
- **Inference Time**: < 50ms per prediction

## Updating Models

To update with newly trained models:

1. Train new models with same 30 features
2. Save as:
   - `random_forest_tuned_final.joblib`
   - `scaler.joblib`
   - `selected_features.json`
3. Copy to `ml-service/models/`
4. Restart ML service:
   ```powershell
   docker-compose restart ml-service
   ```

## Troubleshooting

### Model Won't Load
```powershell
# Check files exist
ls ml-service/models/

# Check ML service logs
docker-compose logs ml-service
```

### Feature Mismatch
- Ensure all 30 features are provided
- Check feature names match exactly (case-sensitive)
- Verify feature order matches `selected_features.json`

### Low Confidence Predictions
- Check if scaler is loaded
- Verify feature values are realistic
- Review training data distribution

## Next Steps

1. ✅ Models integrated and loaded
2. ⏳ Test predictions with real traffic data
3. ⏳ Extract features from live packet captures
4. ⏳ Fine-tune confidence thresholds
5. ⏳ Integrate LSTM model for anomaly detection

## Support

For detailed implementation, see:
- `ml-service/main.py` - ML service implementation
- `ML_INTEGRATION_SETUP.md` - Setup guide
- `QUICKSTART.md` - Quick start guide
