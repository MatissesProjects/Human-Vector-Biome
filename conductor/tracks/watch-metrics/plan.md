# Implementation Plan: Advanced Watch Metrics

### Phase 1: API Exploration
- [ ] Research Google Fit / Health Connect APIs for programmatic access to Skin Temperature and Sleep Stages.
- [ ] Investigate WearOS Sensor API for high-frequency raw accelerometer data.

### Phase 2: WearOS App Expansion (app-wear/)
- [ ] Implement a background service in the WearOS app to sample accelerometer data, run a Fast Fourier Transform (FFT), and count "fidget" events.
- [ ] Configure the app to fetch the previous night's sleep summary upon the first unlock of the day.

### Phase 3: Hub & Dashboard Updates
- [ ] **Types:** Add `SkinTempTelemetry`, `MovementTelemetry`, and `SleepBaseline` to `src/types.ts`.
- [ ] **Hub Backend:** Create handlers for the new telemetry events. Add logic to correlate fidgeting with the existing stress index.
- [ ] **UI:** Add a "Daily Baseline" summary to the Bio-Vitals tab, and add a sparkline for Skin Temp Variation.