# Hardware Build Guide: Environment & Chair Sensors

This guide provides the Bill of Materials (BOM), wiring instructions, and boilerplate code to build the physical sensor nodes for the **Environment Sense** track. The goal is to build a small, WiFi-enabled node that streams CO2, Temperature, Humidity, and Chair Pressure data directly to the Human-Vector-Biome Hub.

## 1. Bill of Materials (BOM)

To build the combined Environment and Chair node, you will need:

*   **Microcontroller:** ESP32 Development Board (Recommended over standard Arduino because it has built-in WiFi and plenty of Analog pins).
*   **Air Quality Sensor:** SCD30 (Sensirion) - An incredibly accurate NDIR CO2, Temperature, and Humidity sensor. It communicates over I2C.
*   **Chair Pressure Sensors:** 4x Force Sensitive Resistors (FSR 402 or similar).
*   **Resistors:** 4x 10kΩ resistors (for the FSR voltage dividers).
*   **Desk Height Sensor:** HC-SR04 Ultrasonic Range Finder.
*   **Misc:** Breadboard, jumper wires, a micro-USB/USB-C cable for power.

---

## 2. Wiring & Pinout

### The SCD30 (Air Quality)
The SCD30 uses the I2C protocol.
*   **VIN (VCC)** -> ESP32 3.3V or 5V (Check your specific breakout board, most are 3.3V compatible).
*   **GND** -> ESP32 GND
*   **SCL** -> ESP32 GPIO 22 (Standard SCL)
*   **SDA** -> ESP32 GPIO 21 (Standard SDA)

### The HC-SR04 (Desk Height)
Mount this pointing directly down at the floor from the underside of the desk.
*   **VCC** -> ESP32 5V (or VIN)
*   **GND** -> ESP32 GND
*   **TRIG** -> ESP32 GPIO 5
*   **ECHO** -> ESP32 GPIO 18 (Note: HC-SR04 Echo output is 5V. Use a logic level converter or a simple voltage divider (1kΩ and 2kΩ) to drop it to 3.3V before connecting to GPIO 18 to protect the ESP32).

### The FSRs (Smart Chair)
An FSR acts like a variable resistor; the harder you press, the lower the resistance. We need to create a "Voltage Divider" circuit for each of the 4 sensors to read this as an analog voltage.

For *each* of the 4 FSRs:
1. Connect one leg of the FSR to **ESP32 3.3V**.
2. Connect the other leg of the FSR to an **Analog Pin** (e.g., GPIO 32, 33, 34, 35).
3. Also connect that same second leg to a **10kΩ resistor**.
4. Connect the other end of the 10kΩ resistor to **GND**.

*Pin Map Example:*
*   Left Pressure (FSR 1): GPIO 32
*   Right Pressure (FSR 2): GPIO 33
*   Front Pressure (FSR 3): GPIO 34
*   Back Pressure (FSR 4): GPIO 35

---

## 3. Boilerplate Arduino Sketch (C++)

This code runs on the ESP32. It reads the sensors and POSTs a JSON payload to our Hub's `/api/events/:project` endpoints.

**Required Libraries (Install via Arduino Library Manager):**
*   `WiFi.h` (Built-in for ESP32)
*   `HTTPClient.h` (Built-in for ESP32)
*   `ArduinoJson` by Benoit Blanchon
*   `SparkFun_SCD30_Arduino_Library` (If using the Sparkfun breakout)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "SparkFun_SCD30_Arduino_Library.h"

// --- Configuration ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* hubIp = "http://192.168.1.XXX:3000"; // Replace with your Node.js server IP

// --- Pins ---
const int FSR_LEFT = 32;
const int FSR_RIGHT = 33;
const int FSR_FRONT = 34;
const int FSR_BACK = 35;

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

SCD30 airSensor;

void setup() {
  Serial.begin(115200);
  Wire.begin(); // Start I2C

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi!");

  // Initialize SCD30
  if (airSensor.begin() == false) {
    Serial.println("Air sensor not detected. Please check wiring.");
    while (1);
  }
}

void postTelemetry(String project, String jsonPayload) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(hubIp) + "/api/events/" + project;
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("POST [");
    Serial.print(project);
    Serial.print("] Status code: ");
    Serial.println(httpResponseCode);
    
    http.end();
  }
}

float getDeskHeightCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  // Speed of sound is 343 m/s = 0.0343 cm/us
  // Divide by 2 for the round trip
  return (duration * 0.0343) / 2.0;
}

void loop() {
  // --- 1. Read & Send Environment Data ---
  if (airSensor.dataAvailable()) {
    StaticJsonDocument<200> envDoc;
    envDoc["co2"] = airSensor.getCO2();
    envDoc["temperature"] = airSensor.getTemperature();
    envDoc["humidity"] = airSensor.getHumidity();
    
    String envJson;
    serializeJson(envDoc, envJson);
    postTelemetry("environment", envJson);
  }

  // --- 2. Read & Send Desk Data ---
  float height = getDeskHeightCm();
  String state = height > 90.0 ? "STANDING" : "SITTING"; // Adjust threshold as needed
  
  StaticJsonDocument<200> deskDoc;
  deskDoc["height_cm"] = height;
  deskDoc["state"] = state;
  
  String deskJson;
  serializeJson(deskDoc, deskJson);
  postTelemetry("desk", deskJson);

  // --- 3. Read & Send Chair Data (Only if Sitting) ---
  if (state == "SITTING") {
    int left = analogRead(FSR_LEFT);
    int right = analogRead(FSR_RIGHT);
    int front = analogRead(FSR_FRONT);
    int back = analogRead(FSR_BACK);

    StaticJsonDocument<200> chairDoc;
    chairDoc["left_pressure"] = map(left, 0, 4095, 0, 100);
    chairDoc["right_pressure"] = map(right, 0, 4095, 0, 100);
    chairDoc["front_pressure"] = map(front, 0, 4095, 0, 100);
    chairDoc["back_pressure"] = map(back, 0, 4095, 0, 100);
    
    String chairJson;
    serializeJson(chairDoc, chairJson);
    postTelemetry("chair", chairJson);
  }

  // Wait 4 seconds before next sample
  delay(4000); 
}
```

## 4. Next Steps
Once your ESP32 is powered on and connected to your WiFi, it will automatically begin streaming live sensor data to your local Hub. Because we already configured `src/types.ts` and the Dashboard UI to handle this exact JSON structure, your dashboard will instantly update from the mock data to real, physical telemetry without any further code changes on the web side!