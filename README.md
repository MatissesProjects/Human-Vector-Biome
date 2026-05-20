# Human-Vector-Biome

**Human-Vector-Biome** is a next-generation "Quantified Self" Personal Operating System. It acts as a centralized biofeedback hub that aggregates high-frequency physiological and environmental data, visualizes it in a beautiful Omni-Health Dashboard, and runs automated, cross-domain interventions to optimize your daily life.

Instead of siloed health apps, this system connects your brainwaves, posture, heart rate, and room environment into a single, cohesive feedback loop.

---

## 🏗️ System Architecture

The project is divided into three main layers:

1. **The Hub (`src/server.ts`)**: A Node.js backend using Express and WebSockets (`socket.io`). It acts as the central router, ingesting high-frequency telemetry from various edge nodes, running the "Intervention Brain" logic, and saving few-shot machine learning datasets.
2. **The Dashboard (`dashboard/`)**: A modern, Next.js 16 application heavily utilizing React Three Fiber (3D), Tailwind CSS, Framer Motion, and Recharts to provide a clean, tabbed "glassmorphic" Heads-Up Display.
3. **Edge Nodes / Sensors**: The physical hardware streaming data to the Hub (e.g., Pixel Watch, Muse Headband, Arduino ESP32 nodes, Webcams).

---

## ✨ Core Features (Implemented)

*   🧠 **Muse Feedback:** Live EEG brainwave streaming. Tracks your "Stress Index" and prompts morning calibrations to set a dynamic daily baseline.
*   🫀 **Heart Sense:** Live Heart Rate, HRV, and Motion tracking. The dashboard features an organic, animated "Pulse Orb" that beats in sync with your live heart rate.
*   🚶 **Automated Break Tracking:** Monitors motion transitions (from `STATIONARY` to `WALKING`) via wearables to automatically log "Walking Breaks" to your timeline without manual input.
*   🦴 **Posture Sense:** Real-time 3D skeletal rendering using a webcam. The Hub can issue a haptic intervention if it detects severe slouching.
*   ☁️ **Environment Sense:** Integrates with local weather APIs and custom ESP32/Arduino hardware. Tracks room CO2, temperature, humidity, and Smart Chair pressure distribution.
*   🧍 **Desk Stance Logic:** Uses an ultrasonic range finder to detect if your standing desk is in `SITTING` or `STANDING` mode, intelligently adapting the dashboard UI.
*   🤖 **DTW Action Recognition:** A native TypeScript Dynamic Time Warping (DTW) ML engine. You can tag a few seconds of movement (e.g., "Drinking Water"), and the Hub will subsequently recognize that action in real-time and log it to your timeline using only a few training shots.
*   📖 **Story Generator / Narrative Sync:** An interactive fiction engine that adjusts its cognitive load and "Narrative Tension" based on your live stress metrics.

---

## 🚀 Getting Started (Simulation Mode)

You can run the entire system locally using the included mock data scripts, which simulate the hardware sensors.

### 1. Install Dependencies
```bash
# Install root dependencies (for the Hub)
npm install

# Install Dashboard dependencies
cd dashboard
npm install
cd ..
```

### 2. Start the Hub (Backend)
Open a terminal at the project root and run:
```bash
npm run start
```
*The Hub will start on `http://localhost:3000`.*

### 3. Start the Dashboard (Frontend)
Open a second terminal, navigate to the dashboard directory, and start the dev server:
```bash
cd dashboard
npm run dev
```
*The Dashboard will be available at `http://localhost:3001` (or 3000 if ports conflict).*

### 4. Run the Hardware Simulator
Open a third terminal at the project root and run the mock script to simulate the physical sensors (Muse, Watch, Arduino, etc.):
```bash
npx ts-node scripts/mock_projects.ts
```
*You will immediately see the Omni-Health Dashboard light up with live data!*

---

## 🗺️ Roadmap & Expansion Tracks

We have meticulously planned the future physical hardware and software expansions of the Biome. Detailed specifications, build guides, and wiring diagrams can be found in the `conductor/tracks/` directory:

*   🌱 **`environment-sense`**: Guide to building custom ESP32 nodes with SCD30 CO2 sensors and Force Sensitive Resistors (FSRs) for your chair.
*   ⌚ **`watch-metrics`**: Guide to building the WearOS companion app for the Pixel Watch to extract raw accelerometer data for tremor tracking and overnight sleep stages.
*   📱 **`digital-context`**: Guide to building an Android background service to track ambient light (Lux) and screen-time categories on the Pixel Phone.
*   🦶 **`gait-sense`**: Hardware build guide for creating Bluetooth Low Energy (BLE) Smart Insoles and Ankle IMUs to track physical fatigue and walking imbalances.
*   🧬 **`advanced-biometrics`**: Future integration plans for Continuous Glucose Monitors (CGM), webcam-based rPPG (contactless vitals), and clinical lab results via Android 16 Health Connect.

---

*Designed as part of the Human-Vector-Biome initiative.*