from flask import Flask, request, jsonify, render_template
import tensorflow as tf
import numpy as np
import pickle
import cv2
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.cm as cm
from PIL import Image
from afpm_layer import AFpM

app = Flask(__name__)

# ============================================
# LOAD MODELS
# ============================================
print("Loading models...")

pldnet = tf.keras.models.load_model(
    'models/light_pldnet_final.h5',
    custom_objects={'AFpM': AFpM}
)

knn       = pickle.load(open('models/knn_model.pkl', 'rb'))
scaler    = pickle.load(open('models/knn_scaler.pkl', 'rb'))
label_map = pickle.load(open('models/knn_labels.pkl', 'rb'))

print("✅ Models loaded successfully!")

# ============================================
# CONSTANTS
# ============================================
PLDNET_CLASSES = [
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy'
]

TREATMENT = {
    'Early Blight': {
        'urgency': '⚠️ Act within 3-5 days',
        'color': 'orange',
        'steps': [
            'Remove infected leaves',
            'Apply fungicide',
            'Avoid overhead watering'
        ],
        'prevention': 'Crop rotation recommended'
    },
    'Late Blight': {
        'urgency': '🚨 URGENT (24 hours)',
        'color': 'red',
        'steps': [
            'Apply mancozeb immediately',
            'Destroy infected plants',
            'Improve drainage'
        ],
        'prevention': 'Use disease-free seeds'
    },
    'Healthy': {
        'urgency': '✅ No action needed',
        'color': 'green',
        'steps': [
            'Maintain irrigation',
            'Monitor weekly'
        ],
        'prevention': 'Keep regular check'
    }
}

# ============================================
# HELPER FUNCTIONS
# ============================================

def get_last_conv_layer(model):
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name


def run_gradcam(img_array):
    last_conv = get_last_conv_layer(pldnet)

    grad_model = tf.keras.models.Model(
        inputs=pldnet.inputs,
        outputs=[pldnet.get_layer(last_conv).output, pldnet.output]
    )

    with tf.GradientTape() as tape:
        conv_out, preds = grad_model(img_array)
        pred_index = tf.argmax(preds[0])
        class_channel = preds[:, pred_index]

    grads = tape.gradient(class_channel, conv_out)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_out = conv_out[0].numpy()
    pooled_grads = pooled_grads.numpy()

    for i in range(pooled_grads.shape[-1]):
        conv_out[:, :, i] *= pooled_grads[i]

    heatmap = np.mean(conv_out, axis=-1)
    heatmap = np.maximum(heatmap, 0)
    heatmap /= (np.max(heatmap) + 1e-8)

    return heatmap, pred_index.numpy(), preds.numpy()


def overlay_heatmap(original, heatmap):
    h, w = original.shape[:2]
    heatmap = cv2.resize(heatmap, (w, h))
    heatmap = np.uint8(255 * heatmap)

    jet = cm.get_cmap('jet')
    colors = jet(np.arange(256))[:, :3]
    colored = np.uint8(colors[heatmap] * 255)

    overlay = np.uint8(colored * 0.4 + original * 0.6)

    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode()


def map_class(label):
    if "Early" in label:
        return "Early Blight"
    elif "Late" in label:
        return "Late Blight"
    return "Healthy"


# ============================================
# ROUTES (UI)
# ============================================

@app.route('/')
def home():
    return render_template('home.html')


@app.route('/detect')
def detect():
    return render_template('detect.html')


# ============================================
# IMAGE PREDICTION
# ============================================

@app.route('/predict/image', methods=['POST'])
def predict_image():
    file = request.files['image']

    img = Image.open(file).convert('RGB').resize((224, 224))
    img_arr = np.array(img)
    original = img_arr.copy()

    img_norm = np.expand_dims(img_arr / 255.0, axis=0)

    heatmap, pred_idx, probs = run_gradcam(img_norm)

    pred_label = PLDNET_CLASSES[pred_idx]
    disease = map_class(pred_label)
    confidence = float(probs[0][pred_idx]) * 100

    gradcam = overlay_heatmap(original, heatmap)
    info = TREATMENT[disease]

    return jsonify({
        "mode": "image",
        "disease": disease,
        "confidence": round(confidence, 1),
        "urgency": info['urgency'],
        "color": info['color'],
        "steps": info['steps'],
        "prevention": info['prevention'],
        "gradcam": gradcam
    })


# ============================================
# WEATHER PREDICTION
# ============================================

@app.route('/predict/text', methods=['POST'])
def predict_text():
    data = request.json

    features = np.array([[
        float(data['temperature']),
        float(data['humidity']),
        float(data['wind_speed']),
        float(data['wind_bearing']),
        float(data['visibility']),
        float(data['pressure'])
    ]])

    scaled = scaler.transform(features)
    pred = knn.predict(scaled)[0]
    proba = knn.predict_proba(scaled)[0]

    disease = label_map[pred]
    confidence = float(np.max(proba)) * 100

    if "Early" in disease:
        disease = "Early Blight"
    else:
        disease = "Late Blight"

    info = TREATMENT[disease]

    return jsonify({
        "mode": "text",
        "disease": disease,
        "confidence": round(confidence, 1),
        "urgency": info['urgency'],
        "color": info['color'],
        "steps": info['steps'],
        "prevention": info['prevention'],
        "gradcam": None
    })


# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    app.run(debug=True)