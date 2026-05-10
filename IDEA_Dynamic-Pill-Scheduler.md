# Integration Idea: Dynamic-Pill-Scheduler (PHOS) -> Human-Vector-Biome

## Objective
Integrate the PHOS scheduler with the Human-Vector-Biome hub to provide a unified view of medication adherence and health context.

## Proposed Changes

### 1. Adherence Webhooks (POST)
- Update the `conductor/` logic to trigger a **POST** request to the Biome hub (`/api/events/pill-scheduler`) whenever:
  - A pill is taken (Logged).
  - A pill is missed (Alert).
  - A `Collision Logic` conflict is detected.
  - A `Temporal Offset` shifts the schedule significantly.

### 2. Context Injection (POST)
- Receive context from the Biome hub (e.g., "User is fatigued" from Posture-Sense) to inform the `core-intelligence/` engine for PRN recommendations.

### 3. Haptic Integration
- Use the Biome hub's command channel to trigger `PILL_REMINDER` haptics on the WearOS module (`app-wear/`) when the Biome dashboard detects a critical time-sensitive need.
