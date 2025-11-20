# ML Service for DDoS Detection
# FastAPI-based microservice for ML predictions using trained Random Forest and LSTM models

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import numpy as np
from datetime import datetime
import logging
import joblib
import json
from pathlib import Path
import tensorflow as tf
from tensorflow import keras

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DefenDDoS ML Service",
    description="Machine Learning service for DDoS attack detection using Random Forest and LSTM",
    version="3.0.0"
)

# Feature enhancement for new services
class FingerprintFeaturesModel(BaseModel):
    """Model for fingerprint-based predictions"""
    composite_fingerprint: str
    tls_fingerprint: str
    http2_settings: str
    tcp_window_size: int
    device_type: str
    user_agent: str

class ForecastEnhancementModel(BaseModel):
    """Model for enhancing forecast predictions with ML"""
    current_traffic: int
    baseline: int
    ema_5min: Optional[float] = None
    ema_15min: Optional[float] = None
    ema_30min: Optional[float] = None
    attack_probability: float
    anomaly_score: float

# Load selected features from configuration
SELECTED_FEATURES_PATH = Path("models/selected_features.json")
if SELECTED_FEATURES_PATH.exists():
    with open(SELECTED_FEATURES_PATH, 'r') as f:
        SELECTED_FEATURES = json.load(f)
    logger.info(f"Loaded {len(SELECTED_FEATURES)} selected features from configuration")
else:
    logger.warning("selected_features.json not found, using default features")
    SELECTED_FEATURES = [
        'urg_flag_count', 'bwd_packet_length_mean', 'bwd_packets/s', 'subflow_bwd_bytes',
        'init_bwd_win_bytes', 'bwd_packet_length_max', 'fwd_packet_length_min',
        'bwd_packets_length_total', 'packet_length_min', 'fwd_packets_length_total',
        'fwd_act_data_packets', 'fwd_iat_total', 'avg_packet_size', 'packet_length_std',
        'init_fwd_win_bytes', 'fwd_iat_mean', 'down/up_ratio', 'packet_length_mean',
        'subflow_fwd_bytes', 'avg_fwd_segment_size', 'ack_flag_count', 'fwd_iat_std',
        'flow_iat_mean', 'total_fwd_packets', 'flow_iat_std', 'fwd_psh_flags',
        'flow_packets/s', 'fwd_packet_length_mean', 'packet_length_max', 'total_backward_packets'
    ]

# Attack type mapping (0 = Benign, 1 = Attack)
ATTACK_TYPES = {
    0: "BENIGN",
    1: "DDoS_ATTACK"
}


class TrafficFeatures(BaseModel):
    """Request model for ML prediction with actual network traffic features"""
    source_ip: str
    destination_ip: str
    
    # Selected 30 features from training
    urg_flag_count: float = 0.0
    bwd_packet_length_mean: float = 0.0
    bwd_packets_per_s: float = Field(default=0.0, alias="bwd_packets/s")
    subflow_bwd_bytes: float = 0.0
    init_bwd_win_bytes: float = 0.0
    bwd_packet_length_max: float = 0.0
    fwd_packet_length_min: float = 0.0
    bwd_packets_length_total: float = 0.0
    packet_length_min: float = 0.0
    fwd_packets_length_total: float = 0.0
    fwd_act_data_packets: float = 0.0
    fwd_iat_total: float = 0.0
    avg_packet_size: float = 0.0
    packet_length_std: float = 0.0
    init_fwd_win_bytes: float = 0.0
    fwd_iat_mean: float = 0.0
    down_up_ratio: float = Field(default=0.0, alias="down/up_ratio")
    packet_length_mean: float = 0.0
    subflow_fwd_bytes: float = 0.0
    avg_fwd_segment_size: float = 0.0
    ack_flag_count: float = 0.0
    fwd_iat_std: float = 0.0
    flow_iat_mean: float = 0.0
    total_fwd_packets: float = 0.0
    flow_iat_std: float = 0.0
    fwd_psh_flags: float = 0.0
    flow_packets_per_s: float = Field(default=0.0, alias="flow_packets/s")
    fwd_packet_length_mean: float = 0.0
    packet_length_max: float = 0.0
    total_backward_packets: float = 0.0
    
    class Config:
        populate_by_name = True  # Allow both field names and aliases


class PredictionResponse(BaseModel):
    """Response model for ML prediction"""
    is_attack: bool
    attack_type: str
    confidence: float
    severity: str
    timestamp: str
    model_version: str
    # Enhanced fields for LSTM integration
    rf_confidence: Optional[float] = None
    lstm_anomaly_score: Optional[float] = None
    is_anomaly: Optional[bool] = None
    detection_method: str = "combined"  # "rf_only", "lstm_only", or "combined"


class MLModel:
    """ML Model wrapper for predictions using Random Forest and LSTM"""
    
    def __init__(self):
        self.rf_model = None
        self.scaler = None
        self.lstm_model = None
        self.model_version = "2.0.0"
        self.rf_loaded = False
        self.scaler_loaded = False
        self.lstm_loaded = False
        self.load_models()
    
    def load_models(self):
        """Load the trained Random Forest model, scaler, and LSTM autoencoder"""
        # Load Random Forest model
        # Try both possible filenames for compatibility
        rf_paths = [
            Path("models/random_forest_TUNED_model.joblib"),
            Path("models/random_forest_tuned_final.joblib")
        ]
        
        for rf_path in rf_paths:
            if rf_path.exists():
                try:
                    self.rf_model = joblib.load(rf_path)
                    self.rf_loaded = True
                    logger.info(f"✅ Random Forest model loaded successfully from {rf_path}")
                    break
                except Exception as e:
                    logger.error(f"Failed to load Random Forest model from {rf_path}: {e}")
                    self.rf_loaded = False
        
        if not self.rf_loaded:
            logger.warning(f"❌ Random Forest model not found at any of: {rf_paths}")
        
        # Load scaler
        scaler_path = Path("models/scaler.joblib")
        if scaler_path.exists():
            try:
                self.scaler = joblib.load(scaler_path)
                self.scaler_loaded = True
                logger.info(f"✅ Scaler loaded successfully from {scaler_path}")
            except Exception as e:
                logger.error(f"Failed to load scaler: {e}")
                self.scaler_loaded = False
        else:
            logger.warning(f"❌ Scaler not found at {scaler_path}")
            self.scaler_loaded = False
        
        # Load LSTM autoencoder model (.keras format - TensorFlow 2.15+ compatible)
        # Try both .keras (new format) and .h5 (legacy format)
        lstm_paths = [
            Path("models/lstm_autoencoder_TUNED_model.keras"),
            Path("models/lstm_autoencoder_tuned_final.keras"),
            Path("models/lstm_autoencoder_tuned_final.h5")
        ]
        
        for lstm_path in lstm_paths:
            if lstm_path.exists():
                try:
                    logger.info(f"🔄 Attempting to load LSTM model from {lstm_path}...")
                    
                    # Load .keras format (recommended for TensorFlow 2.15+)
                    if str(lstm_path).endswith('.keras'):
                        self.lstm_model = keras.models.load_model(lstm_path, compile=False)
                        self.lstm_loaded = True
                        logger.info(f"✅ LSTM autoencoder loaded successfully from {lstm_path} (.keras format)")
                        break
                    # Load .h5 format (legacy, may have compatibility issues)
                    else:
                        try:
                            # First try: Load with compile=False
                            self.lstm_model = keras.models.load_model(lstm_path, compile=False)
                            self.lstm_loaded = True
                            logger.info(f"✅ LSTM autoencoder loaded successfully from {lstm_path} (.h5 format)")
                            break
                        except Exception as e1:
                            logger.warning(f"Failed to load LSTM with compile=False: {e1}")
                            try:
                                # Second try: Load with safe_mode=False (TF 2.15+)
                                self.lstm_model = keras.models.load_model(lstm_path, compile=False, safe_mode=False)
                                self.lstm_loaded = True
                                logger.info(f"✅ LSTM autoencoder loaded from {lstm_path} with safe_mode=False")
                                break
                            except Exception as e2:
                                logger.error(f"Failed to load LSTM with safe_mode=False: {e2}")
                                continue
                                
                except Exception as e:
                    logger.error(f"❌ Failed to load LSTM model from {lstm_path}: {e}")
                    self.lstm_loaded = False
                    continue
        
        if not self.lstm_loaded:
            logger.warning(f"❌ LSTM model not found or failed to load from any of: {lstm_paths}")
            logger.info("ℹ️  Continuing without LSTM - Random Forest classifier will still work")
    
    def predict(self, features: np.ndarray) -> Dict[str, Any]:
        """
        Make prediction using both Random Forest and LSTM models
        Returns: Dictionary with RF prediction, LSTM anomaly score, and combined decision
        """
        result = {
            "rf_prediction": None,
            "rf_confidence": 0.0,
            "lstm_anomaly_score": None,
            "is_anomaly": False,
            "combined_prediction": None,
            "combined_confidence": 0.0
        }
        
        # Random Forest Prediction
        if self.rf_loaded and self.rf_model is not None:
            try:
                # Scale features if scaler is available
                if self.scaler_loaded and self.scaler is not None:
                    features_scaled = self.scaler.transform(features)
                else:
                    features_scaled = features
                
                # Get RF prediction and probability
                rf_prediction = self.rf_model.predict(features_scaled)[0]
                rf_probabilities = self.rf_model.predict_proba(features_scaled)[0]
                rf_confidence = float(max(rf_probabilities))
                
                result["rf_prediction"] = int(rf_prediction)
                result["rf_confidence"] = rf_confidence
                
                logger.info(f"RF Prediction: {rf_prediction}, Confidence: {rf_confidence:.4f}")
            except Exception as e:
                logger.error(f"RF Prediction error: {e}")
        
        # LSTM Anomaly Detection
        if self.lstm_loaded and self.lstm_model is not None:
            try:
                # Scale features for LSTM
                if self.scaler_loaded and self.scaler is not None:
                    features_scaled = self.scaler.transform(features)
                else:
                    features_scaled = features
                
                # LSTM expects shape (batch_size, time_steps, features)
                # Reshape from (1, 30) to (1, 1, 30) for sequence input
                features_reshaped = features_scaled.reshape((features_scaled.shape[0], 1, features_scaled.shape[1]))
                
                # LSTM autoencoder: reconstruct input and calculate error
                reconstruction = self.lstm_model.predict(features_reshaped, verbose=0)
                # Reshape reconstruction back to (1, 30) for comparison
                reconstruction_flat = reconstruction.reshape((reconstruction.shape[0], -1))
                reconstruction_error = np.mean(np.abs(features_scaled - reconstruction_flat))
                
                # Threshold for anomaly detection (tune based on validation data)
                anomaly_threshold = 0.5
                is_anomaly = reconstruction_error > anomaly_threshold
                
                result["lstm_anomaly_score"] = float(reconstruction_error)
                result["is_anomaly"] = bool(is_anomaly)
                
                logger.info(f"LSTM Anomaly Score: {reconstruction_error:.4f}, Is Anomaly: {is_anomaly}")
            except Exception as e:
                logger.error(f"LSTM Prediction error: {e}")
        
        # Combined Decision: Use both RF and LSTM
        if result["rf_prediction"] is not None:
            # If RF says attack OR LSTM detects anomaly -> Attack
            if result["rf_prediction"] == 1 or result["is_anomaly"]:
                result["combined_prediction"] = 1  # Attack
                # Confidence boosted if both models agree
                if result["rf_prediction"] == 1 and result["is_anomaly"]:
                    result["combined_confidence"] = min(0.99, result["rf_confidence"] * 1.15)
                else:
                    result["combined_confidence"] = result["rf_confidence"]
            else:
                result["combined_prediction"] = 0  # Benign
                # Confidence reduced if LSTM shows some anomaly
                if result["lstm_anomaly_score"] and result["lstm_anomaly_score"] > 0.3:
                    result["combined_confidence"] = result["rf_confidence"] * 0.9
                else:
                    result["combined_confidence"] = result["rf_confidence"]
        else:
            # Fallback: only LSTM available
            result["combined_prediction"] = 1 if result["is_anomaly"] else 0
            result["combined_confidence"] = 0.7 if result["is_anomaly"] else 0.8
        
        return result
    
    def _mock_prediction(self, features: np.ndarray) -> tuple:
        """
        Mock prediction for testing when models are not available.
        Uses simple heuristics based on feature patterns.
        """
        # Use average packet size and packet counts for heuristic
        avg_packet_size = features[0][12] if len(features[0]) > 12 else 0
        total_fwd_packets = features[0][23] if len(features[0]) > 23 else 0
        
        # Simple heuristic: High packet count or unusual packet sizes = potential attack
        if total_fwd_packets > 10000:
            return 1, 0.85  # Attack with high confidence
        elif total_fwd_packets > 5000:
            return 1, 0.70  # Attack with medium confidence
        elif avg_packet_size > 1500 or avg_packet_size < 40:
            return 1, 0.65  # Suspicious packet sizes
        else:
            return 0, 0.95  # BENIGN with high confidence


# Initialize ML model
ml_model = MLModel()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "DefenDDoS ML Service",
        "version": "2.0.0",
        "status": "running",
        "rf_model_loaded": ml_model.rf_loaded,
        "scaler_loaded": ml_model.scaler_loaded,
        "lstm_model_loaded": ml_model.lstm_loaded,
        "features_count": len(SELECTED_FEATURES)
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "rf_model_loaded": ml_model.rf_loaded,
        "scaler_loaded": ml_model.scaler_loaded,
        "lstm_model_loaded": ml_model.lstm_loaded,
        "model_version": ml_model.model_version,
        "features_count": len(SELECTED_FEATURES),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_attack(features: TrafficFeatures):
    """
    Predict if traffic is a DDoS attack using trained Random Forest model
    
    Args:
        features: Traffic features for prediction
    
    Returns:
        PredictionResponse with attack classification and confidence
    """
    try:
        # Extract features in the exact order as SELECTED_FEATURES
        feature_dict = features.dict(by_alias=True)
        feature_values = []
        
        # Map API fields to selected features
        feature_mapping = {
            'urg_flag_count': feature_dict.get('urg_flag_count', 0.0),
            'bwd_packet_length_mean': feature_dict.get('bwd_packet_length_mean', 0.0),
            'bwd_packets/s': feature_dict.get('bwd_packets/s', 0.0),
            'subflow_bwd_bytes': feature_dict.get('subflow_bwd_bytes', 0.0),
            'init_bwd_win_bytes': feature_dict.get('init_bwd_win_bytes', 0.0),
            'bwd_packet_length_max': feature_dict.get('bwd_packet_length_max', 0.0),
            'fwd_packet_length_min': feature_dict.get('fwd_packet_length_min', 0.0),
            'bwd_packets_length_total': feature_dict.get('bwd_packets_length_total', 0.0),
            'packet_length_min': feature_dict.get('packet_length_min', 0.0),
            'fwd_packets_length_total': feature_dict.get('fwd_packets_length_total', 0.0),
            'fwd_act_data_packets': feature_dict.get('fwd_act_data_packets', 0.0),
            'fwd_iat_total': feature_dict.get('fwd_iat_total', 0.0),
            'avg_packet_size': feature_dict.get('avg_packet_size', 0.0),
            'packet_length_std': feature_dict.get('packet_length_std', 0.0),
            'init_fwd_win_bytes': feature_dict.get('init_fwd_win_bytes', 0.0),
            'fwd_iat_mean': feature_dict.get('fwd_iat_mean', 0.0),
            'down/up_ratio': feature_dict.get('down/up_ratio', 0.0),
            'packet_length_mean': feature_dict.get('packet_length_mean', 0.0),
            'subflow_fwd_bytes': feature_dict.get('subflow_fwd_bytes', 0.0),
            'avg_fwd_segment_size': feature_dict.get('avg_fwd_segment_size', 0.0),
            'ack_flag_count': feature_dict.get('ack_flag_count', 0.0),
            'fwd_iat_std': feature_dict.get('fwd_iat_std', 0.0),
            'flow_iat_mean': feature_dict.get('flow_iat_mean', 0.0),
            'total_fwd_packets': feature_dict.get('total_fwd_packets', 0.0),
            'flow_iat_std': feature_dict.get('flow_iat_std', 0.0),
            'fwd_psh_flags': feature_dict.get('fwd_psh_flags', 0.0),
            'flow_packets/s': feature_dict.get('flow_packets/s', 0.0),
            'fwd_packet_length_mean': feature_dict.get('fwd_packet_length_mean', 0.0),
            'packet_length_max': feature_dict.get('packet_length_max', 0.0),
            'total_backward_packets': feature_dict.get('total_backward_packets', 0.0)
        }
        
        # Build feature array in correct order
        for feature_name in SELECTED_FEATURES:
            feature_values.append(feature_mapping.get(feature_name, 0.0))
        
        # Convert to numpy array for prediction
        feature_array = np.array([feature_values])
        
        logger.info(f"Feature array shape: {feature_array.shape}, values: {feature_array[0][:5]}...")
        
        # Make prediction using both models
        prediction_result = ml_model.predict(feature_array)
        
        # Use combined prediction
        prediction_class = prediction_result["combined_prediction"]
        confidence = prediction_result["combined_confidence"]
        
        # Determine attack type
        attack_type = ATTACK_TYPES.get(prediction_class, "UNKNOWN")
        is_attack = (prediction_class != 0)
        
        # Determine severity based on attack type, confidence, and LSTM anomaly score
        lstm_score = prediction_result.get("lstm_anomaly_score", 0.0)
        severity = _calculate_severity(
            attack_type, 
            confidence, 
            feature_dict.get('total_fwd_packets', 0),
            lstm_score
        )
        
        # Determine detection method
        if prediction_result["rf_prediction"] is not None and prediction_result["lstm_anomaly_score"] is not None:
            detection_method = "combined"
        elif prediction_result["rf_prediction"] is not None:
            detection_method = "rf_only"
        elif prediction_result["lstm_anomaly_score"] is not None:
            detection_method = "lstm_only"
        else:
            detection_method = "unknown"
        
        lstm_score_str = f"{lstm_score:.4f}" if lstm_score is not None else "N/A"
        logger.info(f"Prediction for {features.source_ip}: {attack_type} "
                   f"(confidence: {confidence:.2f}, severity: {severity}, "
                   f"LSTM anomaly: {lstm_score_str})")
        
        return PredictionResponse(
            is_attack=is_attack,
            attack_type=attack_type,
            confidence=round(confidence, 4),
            severity=severity,
            timestamp=datetime.now().isoformat(),
            model_version=ml_model.model_version,
            rf_confidence=round(prediction_result["rf_confidence"], 4) if prediction_result["rf_confidence"] else None,
            lstm_anomaly_score=round(prediction_result["lstm_anomaly_score"], 4) if prediction_result["lstm_anomaly_score"] else None,
            is_anomaly=prediction_result["is_anomaly"],
            detection_method=detection_method
        )
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


def _calculate_severity(attack_type: str, confidence: float, packet_count: float, lstm_score: float = None) -> str:
    """
    Calculate severity level based on attack type, confidence, traffic volume, and LSTM anomaly score
    Enhanced to be more aggressive in detecting threats
    """
    if attack_type == "BENIGN":
        # Check if LSTM detected high anomaly even though RF says benign
        if lstm_score is not None:
            if lstm_score > 150.0:
                return "HIGH"  # Very suspicious - likely attack
            elif lstm_score > 100.0:
                return "MEDIUM"  # Suspicious behavior
            elif lstm_score > 50.0:
                return "LOW"  # Slightly suspicious
        return "NORMAL"
    
    # For detected attacks, use aggressive severity classification
    # LSTM score significantly influences severity
    lstm_multiplier = 1.0
    if lstm_score is not None:
        if lstm_score > 200.0:
            lstm_multiplier = 1.5  # Critical anomaly
        elif lstm_score > 150.0:
            lstm_multiplier = 1.3  # High anomaly
        elif lstm_score > 100.0:
            lstm_multiplier = 1.2  # Medium anomaly
        elif lstm_score > 50.0:
            lstm_multiplier = 1.1  # Low anomaly
    
    # Apply LSTM boost to confidence
    effective_confidence = min(1.0, confidence * lstm_multiplier)
    
    # Packet count thresholds (lowered for more sensitivity)
    packet_critical = 50000   # 50K packets
    packet_high = 20000       # 20K packets
    packet_medium = 10000     # 10K packets
    packet_low = 5000         # 5K packets
    
    # Determine severity based on confidence and packet volume
    if effective_confidence >= 0.8 or packet_count >= packet_critical:
        return "CRITICAL"
    elif effective_confidence >= 0.6 or packet_count >= packet_high:
        return "HIGH"
    elif effective_confidence >= 0.5 or packet_count >= packet_medium:
        return "MEDIUM"
    elif effective_confidence >= 0.4 or packet_count >= packet_low:
        return "LOW"
    else:
        return "LOW"  # Any detected attack is at least LOW


@app.get("/model-info")
async def model_info():
    """Get information about the loaded models"""
    return {
        "rf_model_loaded": ml_model.rf_loaded,
        "scaler_loaded": ml_model.scaler_loaded,
        "lstm_model_loaded": ml_model.lstm_loaded,
        "scaler_loaded": ml_model.scaler_loaded,
        "model_version": ml_model.model_version,
        "feature_count": len(SELECTED_FEATURES),
        "features": SELECTED_FEATURES,
        "attack_types": ATTACK_TYPES,
        "model_type": "Random Forest Classifier",
        "scaling": "StandardScaler" if ml_model.scaler_loaded else "None"
    }


@app.post("/predict/fingerprint")
async def predict_fingerprint(data: FingerprintFeaturesModel):
    """
    Analyze fingerprint using ML to detect bots and anomalies.
    Returns bot probability, risk score, and recommendations.
    """
    try:
        # Extract features for ML analysis
        features = {
            'tls_cipher_count': len(data.tls_fingerprint.split('-')) if data.tls_fingerprint else 0,
            'http2_settings_count': len(data.http2_settings.split(',')) if data.http2_settings else 0,
            'tcp_window_size': data.tcp_window_size,
            'device_is_mobile': 1 if data.device_type == 'Mobile' else 0,
            'has_user_agent': 1 if data.user_agent else 0,
            'fingerprint_entropy': len(set(data.composite_fingerprint)) / max(len(data.composite_fingerprint), 1)
        }
        
        # Simple heuristic bot detection (can be replaced with trained model)
        bot_score = 0.0
        risk_factors = []
        
        # Check for automation signatures
        if 'headless' in data.user_agent.lower():
            bot_score += 0.4
            risk_factors.append("Headless browser detected")
        
        if any(tool in data.user_agent.lower() for tool in ['selenium', 'puppeteer', 'playwright', 'cypress']):
            bot_score += 0.3
            risk_factors.append("Automation tool detected")
        
        # Check TLS anomalies
        if features['tls_cipher_count'] < 3:
            bot_score += 0.15
            risk_factors.append("Unusual TLS configuration")
        
        # Check TCP window size (bots often have default values)
        if data.tcp_window_size in [65535, 8192, 16384]:
            bot_score += 0.1
            risk_factors.append("Default TCP window size")
        
        # Check fingerprint entropy (low entropy = suspicious)
        if features['fingerprint_entropy'] < 0.3:
            bot_score += 0.15
            risk_factors.append("Low fingerprint entropy")
        
        bot_score = min(bot_score, 1.0)
        
        # Calculate risk level
        if bot_score >= 0.7:
            risk_level = "HIGH"
            action = "BLOCK"
        elif bot_score >= 0.4:
            risk_level = "MEDIUM"
            action = "CHALLENGE"
        elif bot_score >= 0.2:
            risk_level = "LOW"
            action = "MONITOR"
        else:
            risk_level = "SAFE"
            action = "ALLOW"
        
        return {
            "bot_probability": round(bot_score, 3),
            "risk_level": risk_level,
            "recommended_action": action,
            "risk_factors": risk_factors,
            "device_type": data.device_type,
            "fingerprint_hash": data.composite_fingerprint[:16] + "...",
            "analysis": {
                "tls_anomaly": features['tls_cipher_count'] < 5,
                "tcp_anomaly": data.tcp_window_size in [65535, 8192, 16384],
                "user_agent_suspicious": bot_score > 0.3,
                "entropy_low": features['fingerprint_entropy'] < 0.3
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fingerprint analysis failed: {str(e)}")


@app.post("/enhance/forecast")
async def enhance_forecast(data: ForecastEnhancementModel):
    """
    Enhance forecast accuracy using ML-based pattern recognition.
    Adjusts predictions based on historical patterns and anomalies.
    """
    try:
        # Calculate traffic velocity and acceleration
        traffic_velocity = data.current_traffic - data.baseline
        traffic_acceleration = data.ema_5min - data.ema_15min if data.ema_5min and data.ema_15min else 0
        
        # Pattern recognition
        is_spike = data.current_traffic > data.baseline * 2
        is_sustained_growth = data.ema_5min > data.ema_15min > data.ema_30min if all([data.ema_5min, data.ema_15min, data.ema_30min]) else False
        is_volatile = abs(traffic_velocity) > data.baseline * 0.5
        
        # Adjust attack probability using ML insights
        ml_adjustment = 0.0
        confidence_factors = []
        
        # Spike detection boost
        if is_spike:
            ml_adjustment += 0.15
            confidence_factors.append("Traffic spike detected")
        
        # Sustained growth pattern
        if is_sustained_growth:
            ml_adjustment += 0.2
            confidence_factors.append("Sustained growth pattern")
        
        # High volatility
        if is_volatile:
            ml_adjustment += 0.1
            confidence_factors.append("High traffic volatility")
        
        # Anomaly score boost
        if data.anomaly_score > 100:
            ml_adjustment += min(data.anomaly_score / 500, 0.25)
            confidence_factors.append(f"High anomaly score: {data.anomaly_score}")
        
        # Calculate enhanced probability
        enhanced_probability = min(data.attack_probability + ml_adjustment, 1.0)
        
        # Determine confidence level
        if len(confidence_factors) >= 3:
            confidence = "HIGH"
        elif len(confidence_factors) >= 2:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"
        
        # Generate recommended timeframe for next check
        if enhanced_probability > 0.8:
            recommended_interval = "1min"
        elif enhanced_probability > 0.5:
            recommended_interval = "5min"
        else:
            recommended_interval = "15min"
        
        return {
            "enhanced_probability": round(enhanced_probability, 3),
            "original_probability": round(data.attack_probability, 3),
            "ml_adjustment": round(ml_adjustment, 3),
            "confidence": confidence,
            "confidence_factors": confidence_factors,
            "recommended_interval": recommended_interval,
            "pattern_analysis": {
                "spike_detected": is_spike,
                "sustained_growth": is_sustained_growth,
                "high_volatility": is_volatile,
                "traffic_velocity": traffic_velocity,
                "traffic_acceleration": round(traffic_acceleration, 2)
            },
            "metrics": {
                "current_traffic": data.current_traffic,
                "baseline": data.baseline,
                "deviation_percent": round((traffic_velocity / max(data.baseline, 1)) * 100, 2)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast enhancement failed: {str(e)}")


@app.post("/analyze/pattern")
async def analyze_attack_pattern(request: TrafficFeatures):
    """
    Analyze attack patterns using ML to identify attack types and techniques.
    Provides detailed classification and mitigation recommendations.
    """
    try:
        # Use existing prediction logic
        result = await predict(request)
        
        # Extract attack characteristics
        attack_type = result['attack_type']
        confidence = result['confidence']
        severity = result['severity']
        
        # Pattern-based analysis
        patterns_detected = []
        mitigation_strategies = []
        
        # Analyze based on attack type
        if attack_type == "DDoS":
            patterns_detected.append("Volumetric attack pattern")
            mitigation_strategies.extend([
                "Enable rate limiting",
                "Activate geo-blocking for suspicious regions",
                "Scale infrastructure horizontally"
            ])
        elif attack_type == "PortScan":
            patterns_detected.append("Reconnaissance activity")
            mitigation_strategies.extend([
                "Block scanning IP immediately",
                "Enable port knocking",
                "Reduce service exposure"
            ])
        elif attack_type in ["DoS Hulk", "DoS Slowloris", "DoS SlowHTTPTest", "DoS GoldenEye"]:
            patterns_detected.append("Application-layer exhaustion")
            mitigation_strategies.extend([
                "Implement connection limits",
                "Enable request timeout",
                "Deploy WAF rules"
            ])
        elif attack_type == "Botnet":
            patterns_detected.append("Coordinated bot activity")
            mitigation_strategies.extend([
                "Enable CAPTCHA challenges",
                "Implement device fingerprinting",
                "Block bot user-agents"
            ])
        
        # Additional pattern detection based on packet analysis
        packet_count = request.flow_packets_s
        if packet_count > 50000:
            patterns_detected.append("High packet rate attack")
            mitigation_strategies.append("Deploy packet filtering")
        
        # Threat intelligence correlation
        threat_indicators = {
            "high_packet_rate": packet_count > 20000,
            "abnormal_protocol": request.protocol not in [6, 17],  # TCP/UDP
            "suspicious_port": request.dst_port in [22, 23, 3389, 5900],  # SSH, Telnet, RDP, VNC
            "payload_anomaly": severity in ["CRITICAL", "HIGH"]
        }
        
        active_indicators = [k for k, v in threat_indicators.items() if v]
        
        return {
            "attack_type": attack_type,
            "confidence": confidence,
            "severity": severity,
            "patterns_detected": patterns_detected,
            "mitigation_strategies": mitigation_strategies,
            "threat_indicators": active_indicators,
            "threat_score": len(active_indicators) * 25,  # 0-100 scale
            "analysis": {
                "packet_rate": packet_count,
                "protocol": "TCP" if request.protocol == 6 else "UDP" if request.protocol == 17 else "Other",
                "destination_port": request.dst_port,
                "lstm_anomaly_score": result.get('lstm_score'),
                "prediction_timestamp": result['timestamp']
            },
            "recommendations": {
                "immediate_action": "BLOCK" if severity in ["CRITICAL", "HIGH"] else "MONITOR",
                "investigation_priority": "P1" if severity == "CRITICAL" else "P2" if severity == "HIGH" else "P3",
                "estimated_impact": "HIGH" if confidence > 0.8 else "MEDIUM" if confidence > 0.5 else "LOW"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pattern analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
