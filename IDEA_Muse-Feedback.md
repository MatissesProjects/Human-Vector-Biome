# Integration Idea: Muse-Feedback -> Human-Vector-Biome

## Objective
Stream real-time EEG brainwave data and cognitive states to the Human-Vector-Biome for 3D visualization.

## Proposed Changes

### 1. WebSocket Streamer
- Refactor `main.py` or the `test_ws_client.py` logic to establish a production-ready WebSocket connection to the Biome hub.
- Use the existing `osc_simulator.py` logic to packetize EEG bands.

### 2. Telemetry Payload
Stream every 100ms:
- `alpha`, `beta`, `delta`, `gamma`, `theta`: (float intensities)
- `concentration_level`: (0.0 - 1.0)
- `stress_index`: (calculated from Beta/Alpha ratio)
- `head_motion`: (yaw, pitch, roll if available)

### 3. Biofeedback Feedback Loop
- Listen for `BIOFEEDBACK_CONFIG` messages from the Biome hub to adjust simulation parameters or trigger local visual/audio feedback within the Muse-Feedback interface.
