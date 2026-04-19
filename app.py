from flask import Flask, jsonify, render_template, request
import base64
import json
import os
import pickle

import cv2
from flask_cors import CORS
import matplotlib
import matplotlib.cm as cm
import numpy as np
import tensorflow as tf
from PIL import Image

from afpm_layer import AFpM

matplotlib.use("Agg")

app = Flask(__name__)


def get_allowed_origins():
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw.strip():
        return "*"
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


CORS(
    app,
    resources={r"/predict/*": {"origins": get_allowed_origins()}, r"/health": {"origins": get_allowed_origins()}},
)


print("Loading models...")

LEAF_SCREEN_MODEL = tf.keras.models.load_model("models/potato_classifier.h5")
POTATO_IMAGE_MODEL = tf.keras.models.load_model(
    "models/light_pldnet.h5",
    custom_objects={"AFpM": AFpM},
)

TOMATO_MODEL_PATH = os.path.join("models", "tomato_light_pldnet.h5")
TOMATO_IMAGE_MODEL = None
if os.path.exists(TOMATO_MODEL_PATH):
    TOMATO_IMAGE_MODEL = tf.keras.models.load_model(
        TOMATO_MODEL_PATH,
        custom_objects={"AFpM": AFpM},
    )
    print("Tomato image model loaded.")
else:
    print("Tomato image model not found. Image support stays potato-only until model is added.")

# Fusion model remains disabled due to shape mismatch in the current project state.
fusion_model = None
print("Fusion model load skipped.")

knn_bundle = pickle.load(open("models/knn_bundle.pkl", "rb"))
knn = knn_bundle["model"]
scaler = knn_bundle["scaler"]
label_map = knn_bundle["encoder"].classes_
features = knn_bundle["features"]

print(f"KNN features: {features}")
print(f"Label map: {label_map}")
print("All models loaded.")


IMAGE_PIPELINES = {
    "potato": {
        "model": POTATO_IMAGE_MODEL,
        "classes": [
            "Potato___Early_blight",
            "Potato___Late_blight",
            "Potato___healthy",
        ],
        "scope": "Potato image pipeline",
        "note": "Image mode supports potato leaf diagnosis for early blight, late blight, and healthy classes.",
    },
    "tomato": {
        "model": TOMATO_IMAGE_MODEL,
        "classes": [
            "Tomato___Early_blight",
            "Tomato___Late_blight",
            "Tomato___healthy",
        ],
        "scope": "Tomato image pipeline",
        "note": "Tomato support is available only in image mode for early blight, late blight, and healthy classes.",
    },
}

TREATMENT = {
    "Early Blight": {
        "urgency": "Act within 3-5 days",
        "color": "orange",
        "steps": [
            "Remove infected leaves early to reduce spread.",
            "Apply a recommended fungicide such as a copper-based spray as per local guidance.",
            "Avoid overhead irrigation and keep leaves dry where possible.",
            "Continue field monitoring over the next few days.",
        ],
        "prevention": "Use crop rotation, clean field hygiene, and regular scouting during humid periods.",
    },
    "Late Blight": {
        "urgency": "Urgent: act within 24 hours",
        "color": "red",
        "steps": [
            "Remove heavily infected leaves or plants immediately.",
            "Apply a suitable blight-control fungicide according to local agricultural guidance.",
            "Do not compost infected plant material.",
            "Improve airflow and drainage to slow disease pressure.",
        ],
        "prevention": "Use disease-free planting material and inspect fields frequently during cool, wet weather.",
    },
    "Healthy": {
        "urgency": "No immediate action needed",
        "color": "green",
        "steps": [
            "Continue routine crop monitoring.",
            "Maintain balanced irrigation and nutrition.",
            "Check again after major rain, humidity spikes, or visible leaf change.",
            "Keep leaves clean and avoid unnecessary plant stress.",
        ],
        "prevention": "Weekly scouting helps detect any early shift from healthy tissue to disease symptoms.",
    },
    "Not a Leaf": {
        "urgency": "Input not recognized as a clear leaf image",
        "color": "gray",
        "steps": [
            "Retake the image with one leaf clearly centered.",
            "Use good lighting and avoid motion blur.",
            "Keep background clutter low so the leaf is easy to see.",
            "Try again with the correct crop selected.",
        ],
        "prevention": "Use a clear close-up image of a single leaf for best results.",
    },
}


def get_last_conv(model):
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
    return None


def run_gradcam(img_array, model):
    last_conv = get_last_conv(model)
    grad_model = tf.keras.models.Model(
        inputs=model.inputs,
        outputs=[model.get_layer(last_conv).output, model.output],
    )

    with tf.GradientTape() as tape:
        conv_out, preds = grad_model(img_array, training=False)
        pred_idx = tf.argmax(preds[0])
        class_score = preds[:, pred_idx]

    grads = tape.gradient(class_score, conv_out)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_out = conv_out[0].numpy()
    pooled_grads = pooled_grads.numpy()

    for idx in range(pooled_grads.shape[-1]):
        conv_out[:, :, idx] *= pooled_grads[idx]

    heatmap = np.mean(conv_out, axis=-1)
    heatmap = np.maximum(heatmap, 0)
    heatmap = heatmap / (np.max(heatmap) + 1e-8)
    return heatmap, int(pred_idx.numpy()), preds.numpy()


def overlay_to_base64(original, heatmap):
    height, width = original.shape[:2]
    heatmap = cv2.resize(heatmap, (width, height))
    heatmap_u8 = np.uint8(255 * heatmap)
    jet = cm.get_cmap("jet")
    colors = jet(np.arange(256))[:, :3]
    colored = np.uint8(colors[heatmap_u8] * 255)
    overlay = np.uint8(colored * 0.4 + original * 0.6)
    _, buf = cv2.imencode(".jpg", cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")


def map_prediction_to_name(raw_name):
    if "Early" in raw_name:
        return "Early Blight"
    if "Late" in raw_name:
        return "Late Blight"
    return "Healthy"


def read_image_from_request():
    file = request.files["image"]
    img = Image.open(file).convert("RGB").resize((224, 224))
    img_arr = np.array(img)
    img_norm = np.expand_dims(img_arr / 255.0, axis=0)
    return img_arr, img_norm


def classify_leaf_image(crop_name, original, img_norm):
    pipeline = IMAGE_PIPELINES.get(crop_name)
    if pipeline is None:
        return None, ("Unsupported crop selection.", 400)

    model = pipeline["model"]
    if model is None:
        return None, (f"{crop_name.title()} image model is not available on this server yet.", 400)

    leaf_probs = LEAF_SCREEN_MODEL.predict(img_norm)
    leaf_conf = float(np.max(leaf_probs))

    if leaf_conf <= 0.7:
        return {
            "mode": "image",
            "crop": crop_name,
            "scope": pipeline["scope"],
            "note": pipeline["note"],
            "disease": "Not a Leaf",
            "confidence": round(leaf_conf * 100, 1),
            "urgency": TREATMENT["Not a Leaf"]["urgency"],
            "color": TREATMENT["Not a Leaf"]["color"],
            "steps": TREATMENT["Not a Leaf"]["steps"],
            "prevention": TREATMENT["Not a Leaf"]["prevention"],
            "gradcam": None,
        }, None

    heatmap, pred_idx, probs = run_gradcam(img_norm, model)
    pred_raw = pipeline["classes"][pred_idx]
    disease = map_prediction_to_name(pred_raw)
    info = TREATMENT.get(disease, TREATMENT["Healthy"])

    return {
        "mode": "image",
        "crop": crop_name,
        "scope": pipeline["scope"],
        "note": pipeline["note"],
        "disease": disease,
        "confidence": round(float(probs[0][pred_idx]) * 100, 1),
        "urgency": info["urgency"],
        "color": info["color"],
        "steps": info["steps"],
        "prevention": info["prevention"],
        "gradcam": overlay_to_base64(original, heatmap),
    }, None


def get_frontend_assets():
    manifest_path = os.path.join(app.static_folder, "frontend", ".vite", "manifest.json")
    assets = {"css": [], "js": None}

    if not os.path.exists(manifest_path):
        return assets

    with open(manifest_path, "r", encoding="utf-8") as manifest_file:
        manifest = json.load(manifest_file)

    entry = manifest.get("index.html") or manifest.get("src/main.jsx")
    if not entry:
        return assets

    assets["js"] = entry.get("file")
    assets["css"] = entry.get("css", [])
    return assets


@app.route("/")
def home():
    frontend_assets = get_frontend_assets()
    return render_template(
        "index.html",
        frontend_assets=frontend_assets,
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "plant-disease-detector-api",
    })


@app.route("/predict/image", methods=["POST"])
def predict_image():
    crop = request.form.get("crop", "potato").strip().lower()
    original, img_norm = read_image_from_request()
    response, error = classify_leaf_image(crop, original, img_norm)
    if error:
        message, status = error
        return jsonify({"error": message}), status
    return jsonify(response)


@app.route("/predict/text", methods=["POST"])
def predict_text():
    data = request.json
    feature_vector = np.array([[
        float(data["temperature"]),
        float(data["humidity"]),
        float(data["wind_speed"]),
        float(data["wind_bearing"]),
        float(data["visibility"]),
        float(data["pressure"]),
    ]])

    scaled = scaler.transform(feature_vector)
    pred_num = int(knn.predict(scaled)[0])
    proba = knn.predict_proba(scaled)[0]
    disease = label_map[pred_num]
    confidence = float(np.max(proba)) * 100

    treat_key = "Early Blight" if "Early" in disease else "Late Blight"
    info = TREATMENT[treat_key]

    return jsonify({
        "mode": "text",
        "crop": "potato",
        "scope": "Potato text pipeline",
        "note": "Text-based prediction is currently available only for potato because tomato weather CSV data has not been integrated yet.",
        "disease": disease,
        "confidence": round(confidence, 1),
        "urgency": info["urgency"],
        "color": info["color"],
        "steps": info["steps"],
        "prevention": info["prevention"],
        "gradcam": None,
    })


@app.route("/predict/fusion", methods=["POST"])
def predict_fusion():
    original, img_norm = read_image_from_request()

    leaf_probs = LEAF_SCREEN_MODEL.predict(img_norm)
    leaf_conf = float(np.max(leaf_probs))
    if leaf_conf <= 0.7:
        info = TREATMENT["Not a Leaf"]
        return jsonify({
            "mode": "fusion",
            "crop": "potato",
            "scope": "Potato fusion pipeline",
            "note": "Fusion is currently available only for potato image plus potato text features.",
            "disease": "Not a Leaf",
            "confidence": round(leaf_conf * 100, 1),
            "image_conf": 0,
            "text_conf": 0,
            "urgency": info["urgency"],
            "color": info["color"],
            "steps": info["steps"],
            "prevention": info["prevention"],
            "gradcam": None,
        })

    img_probs = POTATO_IMAGE_MODEL.predict(img_norm)

    knn_feat = np.array([[
        float(request.form["temperature"]),
        float(request.form["humidity"]),
        float(request.form["wind_speed"]),
        float(request.form["wind_bearing"]),
        float(request.form["visibility"]),
        float(request.form["pressure"]),
    ]])
    scaled = scaler.transform(knn_feat)
    knn_prob = knn.predict_proba(scaled)[0]

    img_early = float(img_probs[0][0])
    img_late = float(img_probs[0][1])
    knn_late = float(knn_prob[0]) if len(knn_prob) > 0 else 0.0
    knn_early = float(knn_prob[1]) if len(knn_prob) > 1 else 0.0

    fused_early = 0.70 * img_early + 0.30 * knn_early
    fused_late = 0.70 * img_late + 0.30 * knn_late

    pred_idx = 0 if fused_early > fused_late else 1
    confidence = max(fused_early, fused_late) * 100
    pred_raw = IMAGE_PIPELINES["potato"]["classes"][pred_idx]
    disease = map_prediction_to_name(pred_raw)
    info = TREATMENT.get(disease, TREATMENT["Healthy"])

    heatmap, _, _ = run_gradcam(img_norm, POTATO_IMAGE_MODEL)

    return jsonify({
        "mode": "fusion",
        "crop": "potato",
        "scope": "Potato fusion pipeline",
        "note": "Fusion currently combines potato image evidence with potato text evidence. Tomato fusion will be added after tomato textual data collection and retraining.",
        "disease": disease,
        "confidence": round(confidence, 1),
        "image_conf": round(float(np.max(img_probs)) * 100, 1),
        "text_conf": round(float(np.max(knn_prob)) * 100, 1),
        "urgency": info["urgency"],
        "color": info["color"],
        "steps": info["steps"],
        "prevention": info["prevention"],
        "gradcam": overlay_to_base64(original, heatmap),
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
