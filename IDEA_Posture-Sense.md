# Integration Idea: Posture-Sense -> Human-Vector-Biome

## Objective
Upgrade Posture-Sense to stream real-time skeletal and ergonomic data to the Human-Vector-Biome "Omni-Health" dashboard.

## Proposed Changes

### 1. WebSocket Client Implementation
- Add a new module `src/system/biome_client.py`.
- Use the `websockets` or `socketio-client` library to maintain a persistent connection to the Biome hub (default: `ws://localhost:3000`).
- Implement an async loop to stream data from the `pipeline.py` or `posture_analyzer.py`.

### 2. Data Payload Structure
Stream a JSON object every 100-200ms containing:
- `timestamp`: ISO-8601
- `posture_score`: Current RULA/REBA score.
- `skeletal_coords`: Simplified (x,y,z) map of key joints (shoulders, neck, spine).
- `fatigue_index`: From `fatigue_predictor.py`.
- `alerts`: Current active ergonomic warnings.

### 3. Remote Intervention Handler
- Listen for incoming WebSocket messages from the Biome hub.
- Integrate with `notification_manager.py` to trigger local UI nudges or "Shift your monitor" suggestions sent by the Biome hub.

### 4. Configuration
- Add `BIOME_HUB_URL` to the local `.env` file.
- Add a toggle in the Next.js dashboard to enable/disable remote telemetry.
