# Integration Idea: Heart-Sense -> Human-Vector-Biome

## Objective
Enable Heart-Sense to push biometric anomalies and real-time heart rate data to the Human-Vector-Biome hub for centralized health tracking.

## Proposed Changes

### 1. Real-Time Telemetry (WearOS)
- Modify the `wear` module to include a `BiomeTelemetryWorker` or a foreground service that can optionally stream data via WebSockets when "Watching Closer Mode" is active.
- Payload: `heart_rate`, `hrv`, `is_anomaly_detected`, `motion_state`.

### 2. Event Dispatcher (Mobile)
- In the `mobile` module, implement an `IntegrationRepository`.
- When an anomaly alert is received from the watch, send a **POST** request to the Biome hub (`/api/events/heart-sense`).
- Payload:
  ```json
  {
    "type": "HEART_ANOMALY",
    "severity": "CRITICAL",
    "data": { "hr": 145, "hrv": 20, "context": "SITTING" },
    "timestamp": "..."
  }
  ```

### 3. Sync Service
- Periodically (e.g., once per hour) push aggregated health metrics (SpO2, Sleep Stages) to the Biome hub via **POST** `/api/sync/heart-sense`.

### 4. External Commands
- The Mobile app should listen for WebSockets from the Biome hub to trigger "Haptic Alerts" on the watch (e.g., for paced breathing exercises initiated by the Biome dashboard).
