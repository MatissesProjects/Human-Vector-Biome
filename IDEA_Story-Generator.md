# Integration Idea: Story-Generator -> Human-Vector-Biome

## Objective
Sync the local narrative state with the Human-Vector-Biome hub to reflect the "Atmosphere" and "World State" on the central dashboard.

## Proposed Changes

### 1. Narrative State Push (POST)
- Modify `simulation_manager.py` to send a **POST** request to the Biome hub (`/api/events/story-gen`) on every major "Simulation Tick" or narrative transition.
- Payload:
  ```json
  {
    "current_atmosphere": "TENSE",
    "active_npc": "Narrator",
    "world_event": "Storm approaching",
    "narrative_tension": 0.85
  }
  ```

### 2. Visual/Audio Sync
- Send metadata about generated assets (WAV files in `audio_output/`, images in `static/`) so the Biome dashboard can display or play them in sync with the story's progress.

### 3. Director Commands
- Allow the Biome hub to send "Intervention" commands to the `director.py` (e.g., "Increase entropy", "Trigger foreshadowing event") based on the user's real-time biometric state.

### 4. Biometric-Driven Engagement (Stress Relief)
- **Trigger**: When the Biome hub detects elevated stress levels (e.g., high `stress_index` from Muse-Feedback or anomalous HR from Heart-Sense).
- **Action**: The Biome hub sends a suggestion to the Story-Generator frontend/client to proactive start a "Calm/Relaxing" narrative session.
- **Goal**: Use interactive fiction and immersive world-building as a biofeedback tool to lower Beta waves and heart rate.
