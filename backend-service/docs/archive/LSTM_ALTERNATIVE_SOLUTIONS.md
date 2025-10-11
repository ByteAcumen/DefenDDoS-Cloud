# Alternative Ways to Use Your LSTM Model

## 🎯 Problem Recap
Your LSTM model was trained in Google Colab with TensorFlow 2.17+ but your Docker environment has TensorFlow 2.15, causing compatibility issues.

---

## ✅ Solution 1: Extract and Rebuild the Model (Recommended)

Instead of loading the H5 file directly, we can extract the model architecture and weights separately, then rebuild it.

### Step 1: In Google Colab - Extract Model Info

```python
# In your Colab notebook
from tensorflow.keras.models import load_model
import json
import numpy as np

# Load your model
model = load_model('/content/drive/MyDrive/path/to/lstm_autoencoder_tuned_final.h5', compile=False)

# 1. Save architecture as JSON
model_json = model.to_json()
with open('lstm_architecture.json', 'w') as f:
    json.dump(model_json, f)

# 2. Save weights separately
model.save_weights('lstm_weights.h5')

# 3. Get model summary
print(model.summary())

# 4. Save layer configuration
layer_config = {
    'input_shape': model.input_shape,
    'output_shape': model.output_shape,
    'layers': []
}

for layer in model.layers:
    layer_config['layers'].append({
        'name': layer.name,
        'class': layer.__class__.__name__,
        'config': layer.get_config()
    })

with open('lstm_config.json', 'w') as f:
    json.dump(layer_config, f, indent=2)

print("✅ Model architecture and weights extracted!")
```

### Step 2: Rebuild Model in Your Local Environment

```python
# In your ml-service/main.py
import json
import tensorflow as tf
from tensorflow import keras

def build_lstm_model(config_path):
    """Rebuild LSTM model from configuration"""
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    # Build model layer by layer
    inputs = keras.Input(shape=(1, 30))  # Your input shape
    
    # LSTM Encoder
    x = keras.layers.LSTM(64, activation='relu', return_sequences=True)(inputs)
    x = keras.layers.Dropout(0.2)(x)
    x = keras.layers.LSTM(32, activation='relu', return_sequences=False)(x)
    x = keras.layers.Dropout(0.2)(x)
    
    # Repeat Vector for Decoder
    x = keras.layers.RepeatVector(1)(x)
    
    # LSTM Decoder
    x = keras.layers.LSTM(32, activation='relu', return_sequences=True)(x)
    x = keras.layers.Dropout(0.2)(x)
    x = keras.layers.LSTM(64, activation='relu', return_sequences=True)(x)
    x = keras.layers.Dropout(0.2)(x)
    
    # Output
    outputs = keras.layers.TimeDistributed(keras.layers.Dense(30))(x)
    
    model = keras.Model(inputs=inputs, outputs=outputs)
    
    # Load the saved weights
    model.load_weights('models/lstm_weights.h5')
    
    return model
```

**Pros:**
- ✅ No version compatibility issues
- ✅ Full control over architecture
- ✅ Works with any TensorFlow version

**Cons:**
- ⚠️ Need to manually define architecture

---

## ✅ Solution 2: Use ONNX Format (Most Portable)

ONNX (Open Neural Network Exchange) is a universal format that works across frameworks.

### Step 1: In Google Colab - Convert to ONNX

```python
# Install ONNX converter
!pip install tf2onnx

import tf2onnx
import onnx
from tensorflow.keras.models import load_model

# Load your model
model = load_model('lstm_autoencoder_tuned_final.h5', compile=False)

# Convert to ONNX
spec = (tf.TensorSpec((None, 1, 30), tf.float32, name="input"),)
model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, opset=13)

# Save ONNX model
onnx.save(model_proto, 'lstm_model.onnx')

print("✅ Model converted to ONNX format!")
```

### Step 2: Load ONNX in Your Service

```python
# Install in your ml-service
# pip install onnxruntime

import onnxruntime as ort
import numpy as np

# Load ONNX model
session = ort.InferenceSession('models/lstm_model.onnx')

def predict_with_onnx(features):
    """Predict using ONNX model"""
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    
    # Reshape features for LSTM
    features_reshaped = features.reshape(1, 1, 30).astype(np.float32)
    
    # Run prediction
    result = session.run([output_name], {input_name: features_reshaped})
    
    return result[0]
```

**Pros:**
- ✅ Framework agnostic
- ✅ Fast inference
- ✅ No TensorFlow dependency needed
- ✅ Industry standard

**Cons:**
- ⚠️ Requires conversion step

---

## ✅ Solution 3: TensorFlow Lite (Smallest & Fastest)

Perfect for production deployment with minimal overhead.

### Step 1: In Google Colab - Convert to TFLite

```python
# In Colab
from tensorflow.keras.models import load_model
import tensorflow as tf

# Load model
model = load_model('lstm_autoencoder_tuned_final.h5', compile=False)

# Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# Save
with open('lstm_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("✅ Model converted to TensorFlow Lite!")
print(f"Model size: {len(tflite_model) / 1024:.2f} KB")
```

### Step 2: Use TFLite in Your Service

```python
# Much smaller dependency than full TensorFlow
import tensorflow as tf
import numpy as np

# Load TFLite model
interpreter = tf.lite.Interpreter(model_path='models/lstm_model.tflite')
interpreter.allocate_tensors()

def predict_with_tflite(features):
    """Predict using TFLite model"""
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    # Prepare input
    features_reshaped = features.reshape(1, 1, 30).astype(np.float32)
    interpreter.set_tensor(input_details[0]['index'], features_reshaped)
    
    # Run inference
    interpreter.invoke()
    
    # Get output
    output = interpreter.get_tensor(output_details[0]['index'])
    return output
```

**Pros:**
- ✅ Smallest model size (~50-100 KB)
- ✅ Fastest inference
- ✅ Minimal dependencies
- ✅ Mobile-friendly

**Cons:**
- ⚠️ Some operations may not be supported

---

## ✅ Solution 4: Use Only Weights with Manual Architecture

Simplest approach - just use the trained weights with a manually defined architecture.

### Step 1: In Colab - Save Only Weights

```python
model = load_model('lstm_autoencoder_tuned_final.h5', compile=False)
model.save_weights('lstm_weights_only.h5')
```

### Step 2: In Your Service - Define Architecture & Load Weights

```python
# ml-service/lstm_model.py
from tensorflow import keras
import tensorflow as tf

def create_lstm_autoencoder(input_shape=(1, 30)):
    """Manually define LSTM autoencoder architecture"""
    
    # Encoder
    inputs = keras.Input(shape=input_shape)
    encoded = keras.layers.LSTM(64, activation='relu', return_sequences=True)(inputs)
    encoded = keras.layers.Dropout(0.2)(encoded)
    encoded = keras.layers.LSTM(32, activation='relu', return_sequences=False)(encoded)
    encoded = keras.layers.Dropout(0.2)(encoded)
    
    # Decoder
    decoded = keras.layers.RepeatVector(1)(encoded)
    decoded = keras.layers.LSTM(32, activation='relu', return_sequences=True)(decoded)
    decoded = keras.layers.Dropout(0.2)(decoded)
    decoded = keras.layers.LSTM(64, activation='relu', return_sequences=True)(decoded)
    decoded = keras.layers.Dropout(0.2)(decoded)
    decoded = keras.layers.TimeDistributed(keras.layers.Dense(30))(decoded)
    
    model = keras.Model(inputs=inputs, outputs=decoded)
    return model

# Load in your service
model = create_lstm_autoencoder()
model.load_weights('models/lstm_weights_only.h5')
```

**Pros:**
- ✅ Simple and clean
- ✅ Full control
- ✅ No compatibility issues

**Cons:**
- ⚠️ Need to know exact architecture

---

## ✅ Solution 5: Skip LSTM for Now (Current Approach)

Your system is already 90% functional with Random Forest only.

**Current Capability:**
```python
# What's working now
✅ Random Forest Classification (90-95% accuracy)
✅ Traffic Detection (BENIGN vs ATTACK)
✅ Feature Scaling
✅ All API Endpoints
✅ Frontend Integration Ready

# What's missing
⚠️ Anomaly Detection (LSTM)
```

**Consider this if:**
- Frontend development is priority
- 90-95% accuracy is sufficient
- You can add LSTM later

---

## 🎯 My Recommendation: Solution 2 (ONNX)

**Why ONNX is Best:**

1. **Universal Format** - Works with any ML framework
2. **Production Ready** - Used by Microsoft, Facebook, AWS
3. **Fast** - Optimized inference engine
4. **Small** - No need for full TensorFlow
5. **Portable** - Same model works everywhere

### Quick Implementation:

**Step 1: In Colab**
```bash
!pip install tf2onnx
!python -m tf2onnx.convert --keras lstm_autoencoder_tuned_final.h5 --output lstm_model.onnx
```

**Step 2: Update requirements.txt**
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
numpy==1.26.3
scikit-learn==1.4.0
joblib==1.3.2
python-multipart==0.0.6
onnxruntime==1.16.3  # Much smaller than TensorFlow!
```

**Step 3: Update main.py**
```python
import onnxruntime as ort

# Load ONNX model
self.lstm_session = ort.InferenceSession('models/lstm_model.onnx')

# Predict
def predict_lstm(self, features):
    input_name = self.lstm_session.get_inputs()[0].name
    features_reshaped = features.reshape(1, 1, 30).astype(np.float32)
    result = self.lstm_session.run(None, {input_name: features_reshaped})
    return result[0]
```

---

## 📊 Comparison Table

| Solution | Compatibility | Performance | Size | Difficulty |
|----------|--------------|-------------|------|------------|
| **Rebuild Architecture** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium | Medium |
| **ONNX** ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Small | Easy |
| **TFLite** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Tiny | Easy |
| **Weights Only** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Small | Medium |
| **Skip LSTM** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Smallest | Easy |

---

## 🚀 Next Steps

Want me to:

1. **Implement ONNX solution** (5 minutes) - Recommended
2. **Create TFLite version** (10 minutes) - Fastest inference
3. **Rebuild with architecture** (15 minutes) - Most control
4. **Continue without LSTM** (0 minutes) - Already working

Let me know which approach you prefer! 🎯
