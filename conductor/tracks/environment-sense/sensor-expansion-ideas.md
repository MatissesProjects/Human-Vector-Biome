# Physical Sensor Expansion Plan: WiFi & BLE Mesh

By leveraging the dual-radio (WiFi + BLE) capabilities of the ESP32, we can extend the **Human-Vector-Biome** from a simple posture/CO₂ monitor into a fully contextual ambient and mobile biometric mesh.

This plan details how to split your extra ESP32s and sensors into **Indoor WiFi nodes** (stationary/room-aware) and **Outdoor/Mobile BLE nodes** (body-worn/portable), including their proposed API payloads.

---

## 1. Indoor Stationary Nodes (WiFi-Direct)

These nodes connect directly to your local router and POST JSON payloads to the Biome Hub on a loop.

```
[ ESP32 Room Node ] ──(WiFi POST)──> [ Biome Hub Server:3000 ]
```

### A. The Hydration Coaster (Smart Coaster)
*   **Purpose:** Tracks water intake by measuring the weight of your cup/bottle.
*   **Hardware:** ESP32 + **Load Cell (5kg)** + **HX711 Amplifier module**.
*   **Placement:** Placed under your glass or water bottle on your desk.
*   **Logic:** When weight decreases, the node calculates the difference (in grams/milliliters) and sends a hydration event.
*   **Proposed Endpoint:** `POST /api/events/hydration`
*   **Payload:**
    ```json
    {
      "timestamp": "2026-05-20T12:45:00Z",
      "amount_ml": 250,
      "current_vessel_weight_g": 350
    }
    ```

### B. Ambient Light & Sound Node (Eye/Ear Strain Monitor)
*   **Purpose:** Tracks desk light levels (lux) to prevent eye strain and ambient noise levels (dB) to monitor stress factors.
*   **Hardware:** ESP32 + **BH1750 Lux Sensor** (I2C) + **MAX4466 Microphone Amplifier** (Analog).
*   **Placement:** Mounted on your monitor bezel or desk shelf.
*   **Logic:** Aligns with `runInterventions()`. If Lux drops too low while sitting at the desk, trigger a notification to turn on desk lights.
*   **Proposed Endpoint:** `POST /api/events/ambient`
*   **Payload:**
    ```json
    {
      "timestamp": "2026-05-20T12:45:00Z",
      "lux": 150,           // Below 300 triggers eye-strain warning
      "noise_db": 55        // Constant noise > 70 dB increases cognitive stress
    }
    ```

### C. Desk Air Quality Upgrade (Particulate Matter)
*   **Purpose:** Integrates with the SCD40 to monitor PM2.5 and PM10 particles (dust, pollen, cooking smoke).
*   **Hardware:** ESP32 + **PMS5003 Particle Sensor** (UART Serial).
*   **Logic:** Combines with CO₂ alerts to suggest opening a window or turning on an air purifier.
*   **Endpoint:** Extends existing `POST /api/events/environment`
*   **Payload Extension:**
    ```json
    {
      "co2": 850,
      "pm25": 12,           // µg/m³
      "pm10": 18
    }
    ```

---

## 2. Outdoor & Mobile Nodes (BLE-to-Phone Bridge)

Outdoors, WiFi isn't available. The ESP32 acts as a **BLE Server (Peripheral)** or **BLE Broadcaster (Beacon)**. Your smartphone (acting as a mobile bridge) reads these packets and relays them to the Biome Hub via cellular data (or buffers them until you connect to home WiFi).

```
[ Wearable ESP32 ] ──(BLE Advertising)──> [ Smartphone Bridge App ] ──(Cellular/WiFi)──> [ Biome Hub ]
```

### A. Gait & Impact Insoles (Mobile Wearable)
*   **Purpose:** Real-time step kinematics, gait asymmetry, and foot impact analysis.
*   **Hardware:** 
    *   ESP32-S3-Mini (small footprint) + LiPo Battery charger.
    *   **MPU6050 / LSM6DS3 Accelerometer/Gyro** (velcroed to your ankle/laces).
    *   FSR pressure strip under your shoe insole (heel and toe strike zones).
*   **BLE Implementation:** The ESP32 advertises high-frequency accelerometer and pressure data using a custom BLE Service UUID.
*   **Proposed Endpoint:** `POST /api/events/gait`
*   **Payload:**
    ```json
    {
      "timestamp": "2026-05-20T12:45:00Z",
      "cadence_bpm": 120,
      "gait_asymmetry_pct": 3.5,  // Difference between left and right foot contact time
      "foot_strike_type": "MIDFOOT",
      "pronation_angle": -1.2
    }
    ```

### B. Portable Environment & UV Pod (Backpack Wearable)
*   **Purpose:** Tracks sun exposure and localized pollution levels while walking or running.
*   **Hardware:** ESP32-C3 (very low power) + **LTR390 UV Sensor** (I2C) + **SGP40 VOC (Volatile Organic Compound) sensor**.
*   **Placement:** Clipped to the shoulder strap of your backpack.
*   **Logic:** Tracks cumulative UV index to send alerts when sunscreen application is needed.
*   **Proposed Endpoint:** `POST /api/events/exposure`
*   **Payload:**
    ```json
    {
      "timestamp": "2026-05-20T12:45:00Z",
      "uv_index": 6.5,          // Above 6.0 triggers sun protection alert
      "ambient_temp": 24.5,
      "voc_index": 120          // Volatile organic compounds index (0-500)
    }
    ```

---

## 3. Recommended Expansion Roadmap

To keep implementation clean, we suggest executing these in logical waves:

### Wave 1: The Ambient Desk (WiFi)
Add the **Light/Sound (BH1750/MAX4466)** sensor onto your existing Desk ESP32 node. It uses the same WiFi connection and requires no extra microcontrollers.
*   *Difficulty:* Easy
*   *Impact:* High (direct impact on focus and eye strain)

### Wave 2: The Hydration Coaster (WiFi)
Build a standalone ESP32 coaster. This teaches you how to calibrate load cells using the HX711 library and manage low-power deep sleep (since a smart coaster only needs to wake up when weight changes, allowing it to run on a single charge for months).
*   *Difficulty:* Medium
*   *Impact:* Medium (excellent for automated dietary/intake logs)

### Wave 3: Mobile BLE Wearables
Build the UV/Environment Backpack Pod. Implement BLE advertising on the ESP32 and write a simple script or mobile bridge endpoint to listen to BLE packets and forward them to the Hub.
*   *Difficulty:* Hard
*   *Impact:* Extreme (links your outdoor environmental context directly to subjective symptoms like fatigue or headache)
