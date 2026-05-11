# Human-Vector-Biome Hub: Master Implementation Plan

## Objective
Build the central "Omni-Health" hub that orchestrates data from six specialized sub-projects, provides a unified visualization, and executes cross-project biofeedback interventions.

## Phase 1: Core Infrastructure & Data Ingestion (Backend)
- [x] Initialize Node.js/TypeScript server with Express and Socket.io.
- [ ] **Unified Data Schema**: Define TypeScript interfaces for each project's incoming data.
    - `PostureTelemetry`: Skeletal coords, RULA/REBA scores.
    - `HeartBiometrics`: HR, HRV, anomalies, motion.
    - `MuseBrainwaves`: Alpha/Beta/Delta/Gamma/Theta intensities, stress index.
    - `NarrativeState`: Current atmosphere, active NPCs, tension levels.
- [ ] **Event Routing Logic**: 
    - Implement specific handlers in `src/server.ts` to parse incoming `telemetry` (WS) and `events` (POST).
    - Store transient state (current values) in a central `BiomeState` object.
- [ ] **Persistence Layer**: (Optional) Add a simple SQLite/LowDB setup to log significant events for historical analysis.

## Phase 2: The "Omni-Health" Dashboard (Frontend)
- [ ] **Scaffold Frontend**: Create a Next.js or Vite/React application in a `dashboard/` directory.
- [ ] **Real-Time Visualizations**:
    - **Skeletal View**: Canvas/Three.js component to render 3D skeletons from `Posture-Sense`.
    - **Brainwave Field**: Particle system reacting to `Muse-Feedback` intensities.
    - **Heart Rhythm Chart**: Real-time line graph for `Heart-Sense` data.
    - **Narrative Feed**: A live log of world events and atmosphere from `Story-Generator`.
- [ ] **Global UI Alerts**: A unified notification system for cross-project warnings (e.g., "High Stress + Bad Posture Detected").

## Phase 3: Cross-Project Intervention Engine (The "Brain")
Implement the logic that allows projects to talk to each other through the hub:
- [ ] **Stress -> Relaxation Loop**: 
    - Logic: If `Muse.stress_index > 0.8` AND `Heart.hr > 100`, trigger `Story-Generator` relaxation nudge.
- [ ] **Posture -> Haptic Loop**:
    - Logic: If `Posture.slouch_detected` for > 30s, send haptic tap to `Pixel Watch` via `Heart-Sense` hub.
- [ ] **Narrative -> Environment Loop**:
    - Logic: If `Story.atmosphere == "TENSE"`, send command to `Muse-Feedback` UI to shift visual feedback colors to reinforce the mood.

## Phase 4: Validation & Integration
- [ ] **Mock Clients**: Create a script `scripts/mock_projects.ts` that simulates all projects sending data simultaneously to test hub stability.
- [ ] **Sub-Project Upgrades**: Begin applying the `IDEA_*.md` changes to the actual sibling repositories.
- [ ] **End-to-End Test**: Run all projects locally and verify the dashboard reflects real-time physical and mental state.

## Tracking Memory
- Current Status: Hub initialized, Integration ideas drafted.
- Next Task: Define Data Schemas and Scaffold Dashboard.
