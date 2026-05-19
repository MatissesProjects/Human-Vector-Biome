# Track: Gait Sense (Insoles & Ankle Trackers)

## Specification

### Overview
Expand the physical tracking of the Human-Vector-Biome down to the feet. By measuring gait kinematics (how the leg swings) and foot strike pressure, the Hub can detect central nervous system fatigue, musculoskeletal imbalances, and early warning signs of joint injury.

### Goals
1.  **Smart Insoles (Pressure Mapping):** Track heel, midfoot, and toe pressure dynamically to detect pronation/supination and strike imbalances.
2.  **Ankle Kinematics (IMU):** Track stride length, foot clearance, and swing velocity. Reduced foot clearance is a primary indicator of physical fatigue.
3.  **Barefoot & Shod Compatibility:** The hardware must be modular. When wearing shoes, the FSRs act as insoles. When barefoot, the system utilizes soft, elastic velcro straps around the ankle and midfoot to hold the sensors against the skin/floor.

### Network Architecture
Because the user will have their phone on them during walks, the ankle nodes do not need a direct, power-hungry WiFi connection to the Hub. Instead, the ankle nodes act as **Bluetooth Low Energy (BLE) Peripherals**. The Android companion app on the Pixel Phone connects to them via BLE, gathers the telemetry, and relays it to the Hub (or caches it if the phone itself is offline).

### Data Schemas
*   `GaitPressureTelemetry`: `left_heel`, `left_toe`, `right_heel`, `right_toe`, `balance_symmetry` (%)
*   `GaitKinematicsTelemetry`: `cadence` (steps/min), `stride_length` (cm), `foot_clearance` (cm)

### Intervention Hooks
*   **High Asymmetry ->** If `balance_symmetry` shifts heavily to one side (e.g., 70% Right / 30% Left) during a walk, the Hub infers a latent injury or compensation and triggers an audio/haptic alert to stop the treadmill or take a break.
*   **Low Foot Clearance ->** If the IMU detects the user is shuffling their feet (clearance drops below a baseline), the Hub infers severe physical fatigue and triggers the `NextBestAction` widget suggesting rest.