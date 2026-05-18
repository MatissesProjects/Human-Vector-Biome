# Implementation Plan: Environment Sense

### Phase 1: Hardware Prototyping
- [ ] Order necessary sensors: SCD30 (Air Quality), 4x FSRs (Chair), Grove GSR sensor.
- [ ] Set up an ESP32 or Arduino IDE project.
- [ ] Wire the SCD30 via I2C and read CO2/Temp/Humidity.
- [ ] Wire FSRs via voltage dividers to analog pins.

### Phase 2: Network Integration
- [ ] Configure the ESP32 to connect to the local WiFi network.
- [ ] Implement a lightweight Socket.IO client or HTTP POST routine on the ESP32 to send JSON payloads to the Biome Hub (`http://hub-ip:3000/api/events/environment`).

### Phase 3: Hub & Dashboard Updates
- [ ] **Types:** Add `EnvironmentTelemetry` and `ChairTelemetry` to `src/types.ts`.
- [ ] **Hub Backend:** Update `server.ts` to handle the `environment` and `chair` project keys.
- [ ] **Intervention Logic:** Add rules in `runInterventions()` for CO2 thresholds (e.g., > 1000 ppm).
- [ ] **UI:** Create an "Environment" card on the `vitals` tab of the dashboard to show a gauge for CO2 and a heat map for the chair.