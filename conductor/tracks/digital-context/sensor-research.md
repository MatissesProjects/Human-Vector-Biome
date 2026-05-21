# Mobile & Wearable Sensor Expansion Plan: Android + Wear OS

This document outlines how to utilize your **Pixel Phone** and **Pixel Watch (Wear OS)** to gather deep contextual biometrics and passive environmental data. 

By utilizing standard Android APIs, Health Connect, and local signal processing, we can expand the **digital-context** and **watch-metrics** tracks without needing any additional external hardware.

---

## 1. Pixel Watch (Wear OS) & Health Connect Integrations

Direct real-time raw PPG/HRV streaming is restricted on Wear OS to protect battery life. Instead, we can read high-fidelity processed vitals synced to **Health Connect** in the background on the phone.

```
[ Pixel Watch ] ──(Syncs Fitbit/Fit)──> [ Health Connect (Android) ] ──(Biome App Bridge)──> [ Hub API ]
```

### A. Heart Rate Variability (HRV - RMSSD)
*   **Metric:** Root Mean Square of Successive Differences (RMSSD) in milliseconds, logged during deep sleep.
*   **Source:** Health Connect `HeartRateVariabilityRmssdRecord`.
*   **Biome Integration:** Read this daily when the user wakes up. A low HRV indicates poor Autonomic Nervous System recovery. The Hub will automatically reduce the `baseStressThreshold` (e.g., from 0.8 to 0.65) for that day, making the biofeedback loops more sensitive to stress.

### B. Nocturnal Skin Temperature Deviation
*   **Metric:** Baseline temperature shifts (in °C/°F) relative to the user's historical baseline.
*   **Source:** Health Connect `SkinTemperatureRecord`.
*   **Biome Integration:** Correlate elevated skin temperature (which often precedes infection, fever, or heavy physical strain) with subjective pain logs or recovery scores.

### C. Advanced Sleep Architecture (Stages)
*   **Metric:** Exact time spent in Awake, REM, Light, and Deep sleep.
*   **Source:** Health Connect `SleepSessionRecord` (containing nested stages).
*   **Biome Integration:** Feeds into the `baseline` endpoint. Low deep/REM sleep percentages will scale up the "fatigue index" calculations in the posture monitoring loops.

---

## 2. Pixel Phone Passive Ambient Sensing

Modern smartphones contain medical-grade inertial and environmental sensors that require zero user action to read.

### A. Barometer (Micro-Elevation & Sit-Stand Logging)
*   **Sensor:** `Sensor.TYPE_PRESSURE` (Barometric Pressure).
*   **Accuracy:** Sensitive enough to detect a 10 cm change in height (approx. 0.01 hPa).
*   **Use Case:** Calibrate the phone's pressure sensor when sitting at your desk. When you stand up, the change in air pressure provides immediate confirmation of a posture shift, cross-verifying the ultrasonic desk sensor.
*   **Proposed Payload:**
    ```json
    {
      "pressure_hpa": 1013.25,
      "relative_altitude_delta_m": 1.1, // Indicates user stood up
      "floors_climbed": 0
    }
    ```

### B. Ambient Sound Exposure (Decibel Sampler)
*   **Sensor:** Android Microphone (Decibel wrapper).
*   **Processing:** A background worker samples the microphone for 1 second every 5 minutes, computing the Root Mean Square (RMS) to find the decibel (dB) level. *No audio is recorded or sent to protect privacy.*
*   **Use Case:** Detects high noise levels (e.g., construction, loud music) and correlates them with spikes in the user's Stress Index.
*   **Proposed Payload:**
    ```json
    {
      "ambient_noise_db": 62, // Continuous noise above 65 dB triggers a "take a break" prompt
      "noise_peak_db": 84
    }
    ```

### C. Vocal Biomarkers (Voice Stress Index)
*   **Sensor:** Microphone (Voice recording during Subjective Logs).
*   **Features Extracted:** Pitch (F0), Jitter (frequency instability), Shimmer (amplitude instability), and speech pause rate.
*   **How it works:** When entering subjective logs via voice dictation, the phone app extracts these acoustic features locally. Physical stress alters laryngeal muscle tension, which increases jitter and shimmer.
*   **Proposed Payload:**
    ```json
    {
      "vocal_jitter": 0.015,
      "vocal_shimmer": 0.035,
      "speech_rate_wpm": 110, // Slower rate often indicates fatigue/depression
      "calculated_vocal_stress_index": 0.72
    }
    ```

### D. Keyboard Interaction Dynamics (Cognitive Fatigue)
*   **Sensor:** Android Accessibility Service or Custom Keyboard IME.
*   **Metrics:** Flight time (time between key presses) and dwell time (time key is held down).
*   **Use Case:** As cognitive fatigue sets in, typing speed slows, and backspace usage increases. This provides a direct digital biomarker for fatigue.

---

## 3. Integrated Mobile Architecture

To bridge these sensors to the Node.js Biome Hub, we propose a lightweight Android App (written in Kotlin or Flutter):

```
+-----------------------------------------------------------+
|                     Android Phone App                     |
|                                                           |
|  +--------------------+   +----------------------------+  |
|  |   Health Connect   |   |     Background Workers     |  |
|  |  - Sleep Stages    |   |  - Barometer (Sit/Stand)   |  |
|  |  - Nocturnal Temp  |   |  - Mic (Ambient dB)        |  |
|  |  - HRV (Sleep)     |   |  - Keyboard Dynamics       |  |
|  +---------+----------+   +-------------+--------------+  |
|            |                            |                 |
|            +-------------+--------------+                 |
|                          |                                |
|                          v                                |
|             Local SQLite Database (Cache)                 |
|                          |                                |
|                          v                                |
|             HTTPS POST (Sync to Hub IP)                   |
+-----------------------------------------------------------+
```

### Next Steps to Implement:
1. **Health Connect Integration:** Create a `/api/events/health-connect` endpoint in the Node.js server.
2. **Android App Skeleton:** Create a basic Android app that requests Health Connect read permissions and schedules a `PeriodicWorkRequest` to push new records to the server every hour.
