# Human-Vector-Biome Integration Architecture Plan

## Objective
Establish the Human-Vector-Biome as the central data aggregator ("Omni-Health" command center) and define the communication pathways (WebSockets vs. REST POST) for integrating six specialized sub-projects.

## Architecture Overview
The Human-Vector-Biome will act as a unified backend (Node.js/Express + Socket.io or native WebSockets) and frontend dashboard. 

### Data Flow Strategy
We categorize the data into two types to optimize network usage and system responsiveness:
1.  **High-Frequency / Real-Time Data (WebSockets):** Continuous streams of biometric or positional data.
2.  **Low-Frequency / Event-Driven Data (REST POST):** Discrete events, logs, or status updates.

## Sub-Project Integration Plans (To be generated as IDEA_{Project}.md)

### 1. Posture-Sense
*   **Current Role:** PC webcam-based posture detection.
*   **Integration Method:** **WebSockets**.
*   **Modifications:** Implement a WebSocket client to stream continuous skeletal tracking coordinate data (e.g., at 15-30 FPS) to the Biome hub. Accept WebSocket commands to trigger local UI warnings.

### 2. Heart-Sense
*   **Current Role:** Cardiovascular anomaly detection via smart watch.
*   **Integration Method:** **WebSockets** (Primary) / **POST** (Fallback/Sync).
*   **Modifications:** Stream live HR and HRV via WebSockets when active. Implement periodic POST requests for syncing historical sleep stages or aggregated SpO2 data.

### 3. Muse-Feedback
*   **Current Role:** Real-time EEG brainwave monitoring.
*   **Integration Method:** **WebSockets**.
*   **Modifications:** Establish a continuous WebSocket connection to stream Alpha, Beta, Delta, Gamma, and Theta wave intensities alongside head motion metrics. Listen for incoming biofeedback triggers.

### 4. EchoSense
*   **Current Role:** Adaptive hearing aid and contextual memory assistant.
*   **Integration Method:** **POST** (Logging) & **WebSockets** (Alerts).
*   **Modifications:** Send POST requests when significant contextual audio events or speech summaries are generated. Maintain a lightweight WebSocket connection to receive "Auditory Nudge" commands (e.g., posture reminders or binaural beat triggers).

### 5. Dynamic-Pill-Scheduler
*   **Current Role:** Personal OS data aggregator and scheduler.
*   **Integration Method:** **POST**.
*   **Modifications:** Send POST webhooks to the Biome hub whenever a schedule is updated, a pill is logged (via visual context), or an anomaly is detected.

### 6. Story-Generator
*   **Current Role:** Multi-PC story generation tool.
*   **Integration Method:** **POST**.
*   **Modifications:** Push narrative state changes, NPC actions, and dynamic weather events via POST to the Biome hub to allow the master dashboard to reflect the current narrative environment.

## Next Steps
1. Review and approve this integration architecture.
2. Generate the individual `IDEA_{Project_Name}.md` files in the root directory based on these guidelines.
3. Begin foundational setup for the Human-Vector-Biome server.