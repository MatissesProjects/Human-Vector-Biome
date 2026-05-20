# Hardware Build Guide: Environment & Chair Sensors

This guide provides the Bill of Materials (BOM), wiring instructions, and
firmware for the **Environment Sense** track. The build is split into two
phases so you can get CO₂, temperature, humidity, and desk-height data
streaming **right now** with your existing parts, then bolt on the chair
pressure sensors when your FSRs arrive.

---

## Full Bill of Materials (BOM)

| # | Component | Status |
|---|---|---|
| 1 | ESP32 Development Board | ✅ Have it |
| 2 | **SCD40** (Sensirion) — NDIR CO₂, Temp, Humidity over I2C | ✅ Arriving soon |
| 3 | HC-SR04 Ultrasonic Range Finder — desk height | ✅ Have it |
| 4 | 4× 10 kΩ resistors — FSR voltage dividers | ✅ Have them |
| 5 | 4× FSR 402 Force Sensitive Resistors — chair pressure | ⏳ ~12 days |
| 6 | Breadboard, jumper wires, USB cable | ✅ Have them |

> [!IMPORTANT]
> The SCD40 is **not** the same as the SCD30 used in the original guide.
> It uses a different I2C library and has a different startup sequence.
> All firmware below targets the **SCD40** specifically.

---

## Phase 1 — Build Now (No FSRs Required)

**What works in Phase 1:**
- ✅ Live CO₂, temperature, humidity → `environment` stream
- ✅ Desk height + sitting/standing state → `desk` stream
- ⏳ Chair pressure → `chair` stream (Phase 2, when FSRs arrive)

### Wiring — Phase 1

#### SCD40 (Air Quality) — I2C

The SCD40 is a 3.3 V device. Most breakout boards have an onboard regulator,
but double-check your specific board's datasheet.

```
SCD40 VIN  →  ESP32 3.3V
SCD40 GND  →  ESP32 GND
SCD40 SCL  →  ESP32 GPIO 22  (standard I2C SCL)
SCD40 SDA  →  ESP32 GPIO 21  (standard I2C SDA)
```

> [!TIP]
> The SCD40 has internal pull-ups on the breakout board. If you're seeing
> I2C errors, add external 4.7 kΩ pull-ups from SDA/SCL to 3.3V.

#### HC-SR04 (Desk Height) — Digital

Mount this on the underside of your desk pointing straight down at the floor.

```
HC-SR04 VCC   →  ESP32 5V (VIN pin)
HC-SR04 GND   →  ESP32 GND
HC-SR04 TRIG  →  ESP32 GPIO 5
HC-SR04 ECHO  →  Voltage Divider → ESP32 GPIO 18
```

> [!WARNING]
> The HC-SR04 ECHO pin outputs **5V** logic. The ESP32 GPIO is only
> **3.3V tolerant**. Use a simple resistor voltage divider to protect it:
>
> ```
> ECHO pin ──── 1 kΩ ──── GPIO 18
>                    │
>                  2 kΩ
>                    │
>                  GND
> ```
> This drops 5V → ~3.3V. You have the resistors — use 2× for this divider.

---

### Firmware — Phase 1

**Required Libraries (install via Arduino IDE → Library Manager):**

| Library | Install Name |
|---|---|
| WiFi / HTTPClient | Built-in for ESP32 board package |
| ArduinoJson | `ArduinoJson` by Benoit Blanchon |
| SCD4x driver | `Sensirion I2C SCD4x` by Sensirion |

> [!NOTE]
> The correct library for the SCD40 is **"Sensirion I2C SCD4x"**, NOT the
> SparkFun SCD30 library. Search for it exactly in the Library Manager.
> Also install its dependency: **"Sensirion Core"**.

```cpp
// ============================================================
// Environment Sense — Phase 1 Firmware (SCD40 + HC-SR04)
// No FSRs required. Streams to Human-Vector-Biome Hub.
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <SensirionI2CScd4x.h>

// --- Configuration (edit these) ---
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* HUB_IP        = "http://192.168.1.XXX:3000"; // Your Node.js server LAN IP

// --- Pin Definitions ---
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// Desk height threshold in cm (distance from sensor to floor).
// Measure when sitting, measure when standing, pick a midpoint.
// Example: Sitting = 72 cm, Standing = 30 cm → threshold = 50 cm
const float STANDING_THRESHOLD_CM = 50.0;

// --- Globals ---
SensirionI2CScd4x scd4x;

// ---------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[Boot] Environment Sense Node starting...");

  // I2C
  Wire.begin(21, 22); // SDA=21, SCL=22

  // HC-SR04 pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  // WiFi
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(1000);
    Serial.print(".");
    retries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] FAILED — running offline. Check SSID/password.");
  }

  // SCD40 init
  scd4x.begin(Wire);

  // Stop any previous measurement (good practice on reset)
  uint16_t error;
  error = scd4x.stopPeriodicMeasurement();
  if (error) {
    Serial.println("[SCD40] Warning: stopPeriodicMeasurement error (ok on first boot)");
  }
  delay(500);

  // Start periodic measurement (reads every ~5 seconds internally)
  error = scd4x.startPeriodicMeasurement();
  if (error) {
    Serial.println("[SCD40] ERROR: Could not start measurement. Check wiring!");
    Serial.println("  → Is SCD40 VIN connected to 3.3V?");
    Serial.println("  → Is SCL on GPIO 22, SDA on GPIO 21?");
  } else {
    Serial.println("[SCD40] Sensor started. First reading in ~5 seconds.");
  }
}

// ---------------------------------------------------------------
void postTelemetry(const char* project, String& jsonPayload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipped — WiFi not connected.");
    return;
  }

  HTTPClient http;
  String url = String(HUB_IP) + "/api/events/" + project;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  int code = http.POST(jsonPayload);
  Serial.print("[HTTP] POST /api/events/");
  Serial.print(project);
  Serial.print(" → ");
  Serial.println(code > 0 ? String(code) : "ERROR " + String(code));

  http.end();
}

// ---------------------------------------------------------------
float getDeskHeightCm() {
  // Send 10 µs trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo duration (timeout at 30 ms = ~5 m max range)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1.0; // Timeout / no object detected

  // Convert to cm: speed of sound 0.0343 cm/µs, divide by 2 for round-trip
  return (duration * 0.0343f) / 2.0f;
}

// ---------------------------------------------------------------
void loop() {
  // ---- 1. SCD40 — Environment ----
  bool isDataReady = false;
  uint16_t error = scd4x.getDataReadyFlag(isDataReady);

  if (!error && isDataReady) {
    uint16_t co2Raw;
    float temperature, humidity;
    error = scd4x.readMeasurement(co2Raw, temperature, humidity);

    if (!error && co2Raw > 0) {
      StaticJsonDocument<128> envDoc;
      envDoc["co2"]         = co2Raw;
      envDoc["temperature"] = round(temperature * 10.0f) / 10.0f; // 1 decimal
      envDoc["humidity"]    = round(humidity * 10.0f) / 10.0f;

      String envJson;
      serializeJson(envDoc, envJson);
      postTelemetry("environment", envJson);

      Serial.print("[ENV] CO2: ");
      Serial.print(co2Raw);
      Serial.print(" ppm | Temp: ");
      Serial.print(temperature, 1);
      Serial.print(" °C | Humidity: ");
      Serial.print(humidity, 1);
      Serial.println(" %");
    } else if (co2Raw == 0) {
      Serial.println("[SCD40] Warming up... (co2=0 means sensor is still stabilising)");
    }
  }

  // ---- 2. HC-SR04 — Desk State ----
  float heightCm = getDeskHeightCm();
  String deskState;

  if (heightCm < 0) {
    deskState = "UNKNOWN"; // Sensor timeout / out of range
  } else if (heightCm < STANDING_THRESHOLD_CM) {
    deskState = "STANDING";
  } else {
    deskState = "SITTING";
  }

  StaticJsonDocument<128> deskDoc;
  deskDoc["height_cm"] = heightCm;
  deskDoc["state"]     = deskState;

  String deskJson;
  serializeJson(deskDoc, deskJson);
  postTelemetry("desk", deskJson);

  Serial.print("[DESK] Height: ");
  Serial.print(heightCm, 1);
  Serial.print(" cm | State: ");
  Serial.println(deskState);

  // ---- 3. Chair placeholder (FSRs not yet installed) ----
  // The hub expects chair data only when sitting, but will function fine
  // without it — the dashboard chair section just won't populate.
  // Remove this comment block and uncomment Phase 2 code when FSRs arrive.

  // Wait before next loop (SCD40 updates every ~5s internally anyway)
  delay(4500);
}
```

---

### Calibrating the Desk Height Threshold

The `STANDING_THRESHOLD_CM` value in the sketch is the **distance from the
sensor to the floor**. You need to set this once after mounting:

1. Flash the sketch, open the **Serial Monitor** (115200 baud)
2. Sit at your desk → note the distance printed (e.g., `72.3 cm`)
3. Stand at your desk → note the distance (e.g., `28.1 cm`)
4. Set `STANDING_THRESHOLD_CM` to a midpoint, e.g., `50.0`
5. Reflash

---

## Phase 2 — Adding Chair Pressure (When FSRs Arrive)

When your FSR 402s arrive, wire each one as a voltage divider:

```
3.3V ──── FSR ──── Analog Pin (GPIO 32 / 33 / 34 / 35)
                        │
                      10 kΩ
                        │
                       GND
```

| FSR Position | Analog Pin |
|---|---|
| Left seat | GPIO 32 |
| Right seat | GPIO 33 |
| Front seat | GPIO 34 |
| Back seat | GPIO 35 |

Then **add this block** inside `loop()` after the desk section,
replacing the Phase 1 placeholder comment:

```cpp
  // ---- 3. FSR — Chair Pressure (Phase 2) ----
  if (deskState == "SITTING") {
    int left  = analogRead(32);
    int right = analogRead(33);
    int front = analogRead(34);
    int back  = analogRead(35);

    StaticJsonDocument<128> chairDoc;
    chairDoc["left_pressure"]  = map(left,  0, 4095, 0, 100);
    chairDoc["right_pressure"] = map(right, 0, 4095, 0, 100);
    chairDoc["front_pressure"] = map(front, 0, 4095, 0, 100);
    chairDoc["back_pressure"]  = map(back,  0, 4095, 0, 100);

    String chairJson;
    serializeJson(chairDoc, chairJson);
    postTelemetry("chair", chairJson);
  }
```

No other code or hub changes needed — the `chair` endpoint and dashboard
panel are already wired up and waiting.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Air sensor not started` in Serial | Wrong library or bad wiring | Confirm you installed **Sensirion I2C SCD4x**, not SCD30 library |
| CO2 reads `0` for 30+ seconds | Normal warm-up | Wait — SCD40 needs ~30 s to produce first valid reading |
| Desk always reads `UNKNOWN` | ECHO pin 5V → frying GPIO | Add the 1 kΩ + 2 kΩ voltage divider on ECHO pin |
| Desk height wildly wrong | Sensor pointed at angle | Mount flush and level, parallel to floor |
| Hub rejects POST (non-200) | Wrong IP or hub not running | Check `HUB_IP`, run `npm start` in the repo root |
| WiFi keeps failing | Wrong creds or 5 GHz network | ESP32 only supports 2.4 GHz |