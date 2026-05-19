# Implementation Plan: Advanced Biometrics

### Phase 1: API & SDK Exploration
- [ ] Research **Terra API** or **Rook** for unified CGM data ingestion (supports Dexcom, Abbott, etc., via cloud sync).
- [ ] Investigate **Presage SmartSpectra SDK** or open-source MediaPipe Face Mesh + OpenCV implementations for webcam-based rPPG (Contactless Vitals).
- [ ] Review Android Health Connect documentation for requesting `READ_MEDICAL_DATA` permissions (FHIR integration).

### Phase 2: Hub Integration & Middleware
- [ ] **Types:** Add `MetabolicTelemetry`, `ContactlessTelemetry`, and `ClinicalBaseline` to `src/types.ts`.
- [ ] **WebHook Receiver:** Create a dedicated Express route (`/api/webhooks/terra`) to ingest asynchronous data pushes from CGM cloud providers.
- [ ] **Python Sidecar (rPPG):** Write a lightweight Python script using OpenCV to capture the webcam feed, run the rPPG algorithm, and push `ContactlessTelemetry` to the Hub over WebSockets.

### Phase 3: Dashboard & UX Updates
- [ ] Add a new "Metabolic Engine" card to the Bio-Vitals tab, visualizing a live glucose curve (similar to a sparkline, but with distinct upper/lower bounds).
- [ ] Update the `runInterventions()` logic to cross-reference glucose crashes with the Muse `stress_index` to differentiate between physiological fatigue and psychological stress.