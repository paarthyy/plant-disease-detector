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
import os

app = Flask(__name__)

# ============================================
# LOAD ALL MODELS AT STARTUP
# ============================================
print("Loading models...")

pldnet = tf.keras.models.load_model(
    'models/light_pldnet_final.h5',
    custom_objects={'AFpM': AFpM}
)

knn       = pickle.load(open('models/knn_model.pkl',    'rb'))
scaler    = pickle.load(open('models/knn_scaler.pkl',   'rb'))
label_map = pickle.load(open('models/knn_labels.pkl',   'rb'))
features  = pickle.load(open('models/knn_features.pkl', 'rb'))

print(f"✅ KNN features: {features}")
print(f"✅ Label map: {label_map}")
print("✅ All models loaded!")

PLDNET_CLASSES = [
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy'
]

TREATMENT = {
    'Early Blight': {
        'urgency': '⚠️ Act within 3-5 days',
        'color':   'orange',
        'steps': [
            'Remove infected leaves immediately',
            'Apply copper-based fungicide',
            'Avoid overhead irrigation',
            'Spray neem oil as organic option'
        ],
        'prevention': 'Rotate crops every season'
    },
    'Late Blight': {
        'urgency': '🚨 URGENT — act within 24 hours!',
        'color':   'red',
        'steps': [
            'Apply mancozeb IMMEDIATELY',
            'Remove and destroy infected plants',
            'Do NOT compost infected material',
            'Improve field drainage'
        ],
        'prevention': 'Use certified disease-free seed potatoes'
    },
    'Healthy': {
        'urgency': '✅ No action needed',
        'color':   'green',
        'steps': [
            'Continue regular monitoring',
            'Maintain proper irrigation',
            'Apply balanced NPK fertilizer',
            'Check again in 7-10 days'
        ],
        'prevention': 'Monitor weekly during humid weather'
    }
}


# ============================================
# HELPERS
# ============================================
def get_last_conv(mdl):
    for layer in reversed(mdl.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name

def run_gradcam(img_array, mdl):
    last_conv  = get_last_conv(mdl)
    grad_model = tf.keras.models.Model(
        inputs  = mdl.inputs,
        outputs = [mdl.get_layer(last_conv).output, mdl.output]
    )
    with tf.GradientTape() as tape:
        conv_out, preds = grad_model(img_array, training=False)
        pred_idx    = tf.argmax(preds[0])
        class_score = preds[:, pred_idx]

    grads        = tape.gradient(class_score, conv_out)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_out     = conv_out[0].numpy()
    pooled_grads = pooled_grads.numpy()

    for i in range(pooled_grads.shape[-1]):
        conv_out[:, :, i] *= pooled_grads[i]

    heatmap = np.mean(conv_out, axis=-1)
    heatmap = np.maximum(heatmap, 0)
    heatmap = heatmap / (np.max(heatmap) + 1e-8)
    return heatmap, pred_idx.numpy(), preds.numpy()

def overlay_to_base64(original, heatmap):
    h, w    = original.shape[:2]
    hm      = cv2.resize(heatmap, (w, h))
    hm_u8   = np.uint8(255 * hm)
    jet     = cm.get_cmap('jet')
    colors  = jet(np.arange(256))[:, :3]
    colored = np.uint8(colors[hm_u8] * 255)
    overlay = np.uint8(colored * 0.4 + original * 0.6)
    _, buf  = cv2.imencode(
        '.jpg', cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)
    )
    return "data:image/jpeg;base64," + \
           base64.b64encode(buf).decode('utf-8')

def map_pldnet_to_name(pred_raw):
    if 'Early' in pred_raw:  return 'Early Blight'
    elif 'Late' in pred_raw: return 'Late Blight'
    else:                    return 'Healthy'


# ============================================
# ROUTES
# ============================================
@app.route('/')
def home():
    return render_template('index.html')


@app.route('/predict/image', methods=['POST'])
def predict_image():
    file     = request.files['image']
    img      = Image.open(file).convert('RGB').resize((224, 224))
    img_arr  = np.array(img)
    original = img_arr.copy()
    img_norm = np.expand_dims(img_arr / 255.0, axis=0)

    heatmap, pred_idx, probs = run_gradcam(img_norm, pldnet)
    pred_raw    = PLDNET_CLASSES[pred_idx]
    confidence  = float(probs[0][pred_idx]) * 100
    gradcam_b64 = overlay_to_base64(original, heatmap)
    disease     = map_pldnet_to_name(pred_raw)
    info        = TREATMENT[disease]

    return jsonify({
        'mode':       'image',
        'disease':    disease,
        'confidence': round(confidence, 1),
        'urgency':    info['urgency'],
        'color':      info['color'],
        'steps':      info['steps'],
        'prevention': info['prevention'],
        'gradcam':    gradcam_b64
    })


@app.route('/predict/text', methods=['POST'])
def predict_text():
    data = request.json
    feature_vector = np.array([[
        float(data['temperature']),
        float(data['humidity']),
        float(data['wind_speed']),
        float(data['wind_bearing']),
        float(data['visibility']),
        float(data['pressure'])
    ]])

    scaled     = scaler.transform(feature_vector)
    pred_num   = int(knn.predict(scaled)[0])
    proba      = knn.predict_proba(scaled)[0]
    disease    = label_map[pred_num]
    confidence = float(np.max(proba)) * 100

    # Map KNN output to treatment key
    if 'Early' in disease: treat_key = 'Early Blight'
    else:                  treat_key = 'Late Blight'
    info = TREATMENT[treat_key]

    return jsonify({
        'mode':       'text',
        'disease':    disease,
        'confidence': round(confidence, 1),
        'urgency':    info['urgency'],
        'color':      info['color'],
        'steps':      info['steps'],
        'prevention': info['prevention'],
        'gradcam':    None
    })


@app.route('/predict/fusion', methods=['POST'])
def predict_fusion():
    # Image side
    file     = request.files['image']
    img      = Image.open(file).convert('RGB').resize((224, 224))
    img_arr  = np.array(img)
    original = img_arr.copy()
    img_norm = np.expand_dims(img_arr / 255.0, axis=0)

    heatmap, img_pred_idx, img_probs = run_gradcam(img_norm, pldnet)
    gradcam_b64 = overlay_to_base64(original, heatmap)
    img_early   = float(img_probs[0][0])
    img_late    = float(img_probs[0][1])

    # Text side
    knn_feat = np.array([[
        float(request.form['temperature']),
        float(request.form['humidity']),
        float(request.form['wind_speed']),
        float(request.form['wind_bearing']),
        float(request.form['visibility']),
        float(request.form['pressure'])
    ]])
    scaled   = scaler.transform(knn_feat)
    knn_prob = knn.predict_proba(scaled)[0]
    classes  = list(knn.classes_)

    knn_late  = float(knn_prob[classes.index(0)]) \
                if 0 in classes else 0.0
    knn_early = float(knn_prob[classes.index(1)]) \
                if 1 in classes else 0.0

    # Fusion: 70% image + 30% text
    fused_early = 0.70 * img_early + 0.30 * knn_early
    fused_late  = 0.70 * img_late  + 0.30 * knn_late

    if fused_early > fused_late:
        disease    = 'Early Blight'
        confidence = fused_early * 100
    else:
        disease    = 'Late Blight'
        confidence = fused_late * 100

    info = TREATMENT[disease]

    return jsonify({
        'mode':        'fusion',
        'disease':     disease,
        'confidence':  round(confidence, 1),
        'image_conf':  round(max(img_early, img_late)*100, 1),
        'text_conf':   round(max(knn_early, knn_late)*100, 1),
        'urgency':     info['urgency'],
        'color':       info['color'],
        'steps':       info['steps'],
        'prevention':  info['prevention'],
        'gradcam':     gradcam_b64
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)