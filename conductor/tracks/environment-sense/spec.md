# Track: Environment Sense (Arduinos & Custom Sensors)

## Specification

### Overview
Expand the Human-Vector-Biome to track environmental and localized physical factors that heavily influence physiological states. This involves building hardware nodes (e.g., ESP32/Arduino) to stream data to the Hub.

### Goals
1.  **Air Quality Monitoring:** Track CO2, Temperature, and Humidity (e.g., using SCD30). High CO2 correlates with drowsiness and poor focus.
2.  **Smart Chair Integration:** Embed Force Sensitive Resistors (FSRs) into a chair cushion to measure weight distribution and detect localized posture issues (e.g., leaning, leg crossing).
3.  **Peripheral GSR:** Attach a Galvanic Skin Response sensor to a computer mouse or keyboard to measure micro-sweat and acute stress during computer usage.

### Data Schemas
*   `EnvironmentTelemetry`: CO2 (ppm), Temp (C), Humidity (%)
*   `ChairTelemetry`: left_pressure, right_pressure, front_pressure, back_pressure
*   `PeripheralGSR`: skin_resistance (ohms)

### Intervention Hooks
*   **High CO2 ->** Hub triggers a dashboard alert or audio nudge: "CO2 levels are high. Please open a window to restore focus."
*   **Asymmetric Weight ->** Hub triggers haptic feedback on the watch indicating bad posture, cross-referenced with the webcam's skeletal tracking.