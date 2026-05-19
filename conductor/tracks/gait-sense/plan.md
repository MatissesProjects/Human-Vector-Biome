# Implementation Plan: Gait Sense

### Phase 1: Hardware Prototyping
- [ ] Source components: 2x Seeed Studio XIAO ESP32C3 (ultra-small, WiFi/BLE enabled), 2x MPU6050 IMUs, 6x FSRs, small LiPo batteries.
- [ ] Build the "Shoe Mode": Tape FSRs to a thin foam insole and wire them up the heel to the microcontroller.
- [ ] Build the "Barefoot Mode": Sew/glue velcro onto elastic bands that wrap around the ankle (holding the IMU and battery) and the midfoot (holding barefoot FSR pads).

### Phase 2: Embedded Software & Phone Relay
- [ ] Write BLE GATT server firmware for the Left and Right ankle nodes.
- [ ] Implement IMU DMP (Digital Motion Processor) or simple complementary filter to extract pitch/roll for foot swing.
- [ ] Update the Pixel Phone Android background service (from the `digital-context` track) to scan for and connect to the ankle nodes via BLE.
- [ ] The Android app relays the combined JSON payloads (`/api/events/gait`) to the Hub when connected to the network, or caches them locally if offline.

### Phase 3: Hub & Dashboard Updates
- [ ] **Types:** Add `GaitTelemetry` to `src/types.ts` encompassing both pressure and kinematics.
- [ ] **Hub Backend:** Update `server.ts` to handle the `gait` project key. Implement rolling averages to calculate `balance_symmetry`.
- [ ] **UI:** Create a "Gait Analysis" tab or card on the Dashboard showing a live visual of Left vs. Right foot strike pressure and a cadence sparkline.