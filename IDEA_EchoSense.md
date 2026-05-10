# Integration Idea: EchoSense -> Human-Vector-Biome

## Objective
Connect EchoSense to the Human-Vector-Biome to log environmental context and receive auditory nudge commands.

## Proposed Changes

### 1. Context Logging (POST)
- Modify the AI/ML modules (`on-device-summarization.md` context) to send a **POST** request to the Biome hub (`/api/events/echo-sense`) whenever a significant environmental event or speech summary is generated.
- Example: "Detected high-stress conversation", "Environmental noise levels exceeded 80dB".

### 2. WebSocket Alert Listener
- Implement a persistent WebSocket connection in the `app` module.
- Listen for `AUDITORY_NUDGE` events from the Biome hub.
- When received, play specific binaural beats or whispered reminders via the `AudioEnhancement` pipeline.

### 3. Data Flow
- **Biome -> EchoSense (WS):** Trigger binaural beats (Alpha/Theta) or voice reminders.
- **EchoSense -> Biome (POST):** Log detected voice activity, speech summaries, and ambient noise levels.
