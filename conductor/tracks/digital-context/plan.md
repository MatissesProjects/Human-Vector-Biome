# Implementation Plan: Digital Context Sense

### Phase 1: Phone Agent Development
- [ ] Scaffold a background Android service (or React Native / Flutter app) for the Pixel 9.
- [ ] Hook into the Android `SensorManager.SENSOR_LIGHT` to stream Lux values.
- [ ] Explore Android `UsageStatsManager` to categorize current app usage.

### Phase 2: Vocal Biomarker Integration
- [ ] Research lightweight on-device audio processing libraries (e.g., using Python via Chaquopy or native Android libraries) to extract pitch and tempo without sending raw audio to the cloud.

### Phase 3: Hub & Dashboard Updates
- [ ] **Types:** Add `AmbientLightTelemetry`, `VocalBiomarker`, and `DigitalContext` to `src/types.ts`.
- [ ] **Hub Backend:** Implement correlation logic (e.g., "Does Social Media use predict a drop in HRV 10 minutes later?").
- [ ] **UI:** Create a new "Context" card on the dashboard showing current Lux levels and active digital task category.