# Track: Digital Context Sense (Pixel Phone)

## Specification

### Overview
Utilize the Pixel Phone as an ambient context engine, tracking the digital and physical environment without requiring explicit interaction.

### Goals
1.  **Ambient Light & Color Temperature:** Use the phone's ambient light sensor to detect indoor/outdoor settings, darkness, or exposure to blue light late at night.
2.  **Vocal Biomarkers:** Extend the `EchoSense` idea. Beyond summarizing speech, analyze *how* the user speaks (pitch, tempo, jitter) to detect fatigue or mood shifts.
3.  **Digital Screen Context:** Track broad category screen time (e.g., "Deep Work App" vs "Social Media Doomscrolling") to correlate digital habits with physiological changes.

### Data Schemas
*   `AmbientLightTelemetry`: lux, color_temp (K)
*   `VocalBiomarker`: pitch_variance, speech_rate (wpm), mood_inference
*   `DigitalContext`: current_app_category, session_duration (min)

### Intervention Hooks
*   **Dim Light Warning ->** Hub detects < 100 lux for 4 hours during the day and suggests a 5-minute outdoor walk via a dashboard toast.
*   **High Speech Rate / Jitter ->** Hub infers elevated stress during a meeting and subtly shifts the smart home lighting or plays a calming binaural frequency through Pixel Buds.