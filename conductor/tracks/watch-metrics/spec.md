# Track: Advanced Watch Metrics

## Specification

### Overview
Extract deeper, less-common metrics from the Pixel Watch beyond basic Heart Rate and HRV. This aims to leverage the watch's full sensor array for predictive health analysis.

### Goals
1.  **Skin Temperature Variation:** A leading indicator of illness, circadian rhythm shifts, and stress responses.
2.  **Micro-Movements & Tremors:** Utilize high-frequency accelerometer data to track fidgeting or hand tremors, correlating with anxiety, fatigue, or excessive caffeine intake.
3.  **Sleep Stage Baselines:** Fetch overnight sleep data (Deep, REM, Light) each morning to set a baseline for the day's expected cognitive performance and narrative atmosphere.

### Data Schemas
*   `SkinTempTelemetry`: baseline_deviation (C)
*   `MovementTelemetry`: tremor_frequency (Hz), fidget_count
*   `SleepBaseline`: deep_duration (min), rem_duration (min), light_duration (min), quality_score

### Intervention Hooks
*   **High Fidgeting ->** Hub infers anxiety/restlessness and triggers the "Calm Mode" NextBestAction widget on the dashboard, bypassing the need for Muse data.
*   **Poor Sleep Baseline ->** The Hub initializes the `Story-Generator` with a "Gentle/Low-Stakes" atmosphere for the morning to ease cognitive load.