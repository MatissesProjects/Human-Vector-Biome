# Few-Shot Action Recognition Plan

## Objective
To reliably detect specific human actions (e.g., "Drinking Water", "Slouching", "Taking a Pill") from real-time biometric telemetry (primarily skeletal posture data) using a minimal number of training samples (10-50 samples per action).

## The Challenge
Traditional deep learning approaches (like 3D Convolutional Neural Networks or LSTMs) require hundreds or thousands of labeled sequences to generalize well. Since we are building a personal OS, we want the system to learn a user's specific quirks quickly and accurately without a massive data collection burden.

## Proposed Strategy: Dynamic Time Warping (DTW) + KNN

For few-shot, time-series classification, **Dynamic Time Warping (DTW)** combined with a simple **K-Nearest Neighbors (KNN)** classifier is considered the gold standard.

### Why DTW?
Human actions happen at varying speeds. "Drinking water" might take 2 seconds one time, and 4 seconds the next. DTW measures the similarity between two temporal sequences, perfectly handling variations in speed and time. It stretches or compresses the time axis to find the optimal match between a new live stream and a saved training sample.

### Pipeline

#### 1. Feature Extraction (Dimensionality Reduction)
Raw skeletal data (e.g., 33 x,y,z coordinates from a webcam) is too noisy and high-dimensional. Before applying DTW, we reduce the data to a few highly descriptive features.
*   **For "Drinking Water":** 
    *   Distance between Right Hand (wrist/index) and Head (mouth/nose).
    *   Velocity of the Right Hand on the Y-axis.
*   **For "Slouching":**
    *   Angle between Shoulders and Hips relative to the vertical axis.
    *   Distance from Nose to the screen plane.

#### 2. Template Storage (The "Few Shots")
When the user records an action via the Dashboard:
1.  The Hub logs the raw JSONL stream.
2.  An offline script parses the stream, applies the feature extraction, and saves the resulting 1D or 2D time-series array as a "Template" for that label.
3.  We only need about 5-10 templates per action.

#### 3. Real-Time Inference
1.  The `src/server.ts` maintains a rolling window buffer (e.g., the last 3-5 seconds of posture telemetry).
2.  Every X milliseconds (or when triggered by a movement spike), the server passes the buffer to a Python sidecar process or an ONNX/WASM runtime.
3.  The runtime calculates the DTW distance between the live buffer and all saved Templates.
4.  Using **1-NN** (Nearest Neighbor), if the distance to the closest template is below a strict confidence threshold, the system emits an Action Event (`{ type: "ACTION_DETECTED", label: "Drinking Water" }`).

### Alternative: Lightweight 1D-CNN (If ~50+ samples are available)
If we can gather slightly more data, a very small 1D-CNN (with just 2-3 convolutional layers acting on the extracted 1D distance features) can be trained rapidly.
*   **Pros:** Inference is much faster than DTW ($O(1)$ vs $O(N^2)$).
*   **Cons:** Requires slightly more data to prevent overfitting, and needs a retraining step whenever a new sample is added.

## Implementation Next Steps
1.  **Data Gathering:** Use the newly built Dashboard UI to record ~10 samples of a target action.
2.  **Prototyping:** Create a simple Python script `scripts/dtw_classifier.py` using the `tslearn` or `dtaidistance` library.
3.  **Evaluation:** Replay the `capture_samples.jsonl` data through the script to tune the distance thresholds.
4.  **Integration:** Wrap the Python script in a lightweight FastAPI server or compile the logic to an ONNX model to run directly in Node.js on the Hub.