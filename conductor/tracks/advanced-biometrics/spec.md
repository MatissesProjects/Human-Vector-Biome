# Track: Advanced Biometrics (Biohacking & Clinical APIs)

## Specification

### Overview
Expand the Human-Vector-Biome beyond structural and electrical tracking (heart rate, posture) into **molecular and clinical tracking**. This track focuses on integrating cutting-edge consumer sensors (Continuous Glucose Monitors, molecular biosensors) and leveraging the newly expanded Health Connect (FHIR) medical data APIs.

### Goals
1.  **Continuous Glucose Monitoring (CGM):** Integrate real-time metabolic data. Spikes or crashes in blood glucose directly correlate with brain fog, fatigue, and the need for narrative interventions.
2.  **Contactless Biometrics (rPPG):** Use the Pixel phone or webcam camera to extract respiratory rate and oxygen saturation (SpO2) without wearables, simply by analyzing micro-color shifts in the user's face while they work.
3.  **Medical Record Sync (Health Connect):** Utilize the new Android 16 Health Connect FHIR capabilities to securely sync clinical lab results (e.g., Vitamin D, Magnesium, Cortisol panels) to establish long-term physiological baselines.

### Data Schemas
*   `MetabolicTelemetry`: `glucose_mg_dl`, `trend` (RISING, FALLING, STABLE), `cortisol_estimate`
*   `ContactlessTelemetry`: `respiratory_rate_rpm`, `camera_spo2` (%)
*   `ClinicalBaseline`: `latest_lab_date`, `key_deficiencies` (string[])

### Intervention Hooks
*   **Glucose Crash ->** If `glucose_mg_dl` drops rapidly while `motion_state` is `STATIONARY`, the Hub infers an impending "sugar crash" (brain fog) and triggers a dashboard alert suggesting a high-protein snack, while simultaneously instructing the `Story-Generator` to lower cognitive load.
*   **Elevated Respiratory Rate ->** If the contactless rPPG detects a sustained increase in respiratory rate without physical movement, it acts as a leading indicator of a panic or anxiety response, immediately triggering the Box Breathing `NextBestAction`.