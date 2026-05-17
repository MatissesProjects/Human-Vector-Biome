# Future Expansion & Next Steps

This document outlines the immediate priorities for the Human-Vector-Biome project, as well as long-term architectural inspiration gathered from the open-source "Quantified Self" and biofeedback communities.

## Immediate Next Steps (Actionable Now)

Based on the current state of the implementation, these are the highest-value features we can build next:

### 1. Global UI Interventions (The Missing Link)
*   **The Problem:** The Hub backend (`src/server.ts`) currently has an "Intervention Brain" that successfully detects cross-project issues (like High Stress + Bad Posture) and emits an `intervention` event via WebSockets. However, the frontend Dashboard completely ignores this event.
*   **The Fix:** Implement a global Toast Notification or Alert system in the dashboard that listens to `socket.on('intervention')`. When the Hub decides you need a "Relaxation Nudge" or a "Posture Correction", a prominent alert should pop up on the UI.

### 2. Upgrade the "Brain" to use the new DTW Recognizer
*   **The Problem:** Currently, the `runInterventions()` logic in the backend relies on simple, hardcoded data thresholds (e.g., `if posture.score < 40`).
*   **The Fix:** We just built a powerful few-shot `ActionRecognizer` using Dynamic Time Warping (DTW). We should update the Intervention Brain to listen to the *output* of this recognizer. If the DTW algorithm detects the "Slouching" action sequence, *that* should trigger the haptic alert. This bridges the gap between our ML feature and the actual biofeedback loop.

### 3. Live Sparkline Visualizations
*   **The Problem:** The dashboard looks great, but it currently only shows point-in-time static snapshots (e.g., a single number for Heart Rate or HRV). 
*   **The Fix:** Add a lightweight charting library (like `recharts` or `chart.js`) to the Next.js dashboard. Since the `BiomeContext` already receives a high-frequency stream of telemetry, we can keep a small rolling array in the React state and render live, animated sparklines for Heart Rate and Stress Index to make the dashboard feel truly "alive".

---

## Inspiration from the Open-Source Community

To guide the long-term vision of this project as a "Personal OS", we investigated existing open-source projects in the Quantified Self and Biofeedback space. Here are key takeaways and architectural patterns we can learn from:

### 1. Unified Data Interfaces (The "Personal API" Pattern)
*   **Inspiration:** Projects like **HPI (Human Programming Interface)** and **Dogsheep**.
*   **Takeaway:** Instead of forcing all projects (like `Heart-Sense` or `EchoSense`) to conform perfectly to a rigid SQL database schema from day one, we can treat the Hub as a "Personal API". The Hub simply ingests the raw data (like we do with JSONL logs currently) and provides programmatic wrappers to query it. This is exactly what we are doing with `BiomeState`, but we can extend this to historical querying.

### 2. Standardized Sensor Abstractions
*   **Inspiration:** **BrainFlow** (The underlying engine for many BCI projects).
*   **Takeaway:** Right now, our projects (like `Muse-Feedback`) have to write custom packet parsers. If we eventually migrate to a library like BrainFlow for our data ingestion edge nodes, we can easily swap between a Muse headband, an OpenBCI board, or a Polar H10 chest strap without rewriting our dashboard logic.

### 3. Visual Programming for Biofeedback
*   **Inspiration:** **neuromore Studio** and **BrainBay**.
*   **Takeaway:** These tools use "node-based" visual editors to define biofeedback logic (e.g., connecting a "Beta Wave" node to an "Audio Volume" node). 
*   **Future Goal:** While our `runInterventions()` function is currently hardcoded in TypeScript, a long-term goal could be building a drag-and-drop UI on the dashboard that allows the user to visually map incoming metrics (e.g., HRV) to outputs (e.g., `Story-Generator` atmosphere).

### 4. Time-Series Storage
*   **Inspiration:** **Grafana** + **InfluxDB**.
*   **Takeaway:** Our current `capture_samples.jsonl` approach is perfect for few-shot ML training. However, if we want to store *all* telemetry permanently to see how posture trends over a year, we should eventually replace the JSONL logs with a dedicated time-series database like InfluxDB or SQLite (following the Dogsheep pattern).