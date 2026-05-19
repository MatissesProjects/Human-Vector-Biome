# Hardware Build Guide: Gait Sense (Ankles & Insoles)

This guide provides the Bill of Materials (BOM), mounting instructions (for both shoes and barefoot), and boilerplate code to build the physical Gait Sense nodes. 

Instead of connecting directly to WiFi (which drains battery and limits use to the house), these nodes act as **Bluetooth Low Energy (BLE)** peripherals. Your phone will connect to them, read the gait data, and relay it back to the Human-Vector-Biome Hub.

## 1. Bill of Materials (BOM)

To build **two** nodes (Left and Right), you will need:

*   **Microcontroller:** 2x Seeed Studio XIAO ESP32C3 or nRF52840 (Extremely tiny, low-power, and built-in BLE and battery charging).
*   **IMU (Kinematics):** 2x MPU-6050 or BNO085 9-DOF sensors (I2C).
*   **Pressure Sensors:** 6x FSR 402 Force Sensitive Resistors (3 per foot: Heel, First Metatarsal, Fifth Metatarsal).
*   **Resistors:** 6x 10kΩ resistors.
*   **Battery:** 2x Tiny 3.7V LiPo batteries (e.g., 150mAh or 300mAh, small enough to strap to an ankle).
*   **Mounting:** Soft elastic bands, adhesive Velcro (hook-and-loop), thin foam craft sheets.

---

## 2. Mounting & Wearable Design

### The "Ankle Bracelet" (Holds the Brains)
Regardless of whether you are wearing shoes or barefoot, the main "brains" stay on your ankle.
1. Take a soft, wide elastic band and measure it around your ankle.
2. Sew or glue a Velcro patch to the ends to make a comfortable strap.
3. Attach the **XIAO Microcontroller**, the **IMU**, and the **Battery** to the outside of the strap using adhesive Velcro. 
4. *Important:* Make sure the IMU is aligned identically on both ankles (e.g., the X-axis points forward on both).

### Mode A: Shod (The Smart Insole)
1. Cut a piece of thin craft foam into the shape of your shoe's insole.
2. Tape 3 FSRs to the bottom of the foam: One under the heel, one under the big toe pad, one under the pinky toe pad.
3. Run thin, flexible wires up the side of your shoe (or inside the tongue) to plug into the Ankle Bracelet.

### Mode B: Barefoot
1. Create a second, smaller elastic strap that goes around the arch/midfoot.
2. Adhere the front two FSRs to the bottom of this midfoot strap.
3. Adhere the heel FSR directly to the bottom of the Ankle Bracelet so it rests under your heel.
4. This acts like a minimalist "sandal" purely for holding the sensors against the skin.

---

## 3. Wiring & Pinout (Per Node)

**IMU (MPU-6050):**
*   **VCC** -> XIAO 3.3V
*   **GND** -> XIAO GND
*   **SCL** -> XIAO SCL
*   **SDA** -> XIAO SDA

**FSRs (Voltage Dividers):**
Create a voltage divider (FSR + 10k resistor to GND) for each.
*   **Heel FSR** -> XIAO Analog Pin A0
*   **Inside Toe FSR** -> XIAO Analog Pin A1
*   **Outside Toe FSR** -> XIAO Analog Pin A2

---

## 4. Boilerplate Arduino Sketch (BLE Peripheral)

This code runs on the XIAO ESP32C3. It reads the IMU and FSRs, then broadcasts them over BLE using custom Characteristics.

**Required Libraries:**
*   `BLEDevice.h`, `BLEServer.h`, `BLEUtils.h` (Built-in for ESP32)
*   `Adafruit_MPU6050`

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

Adafruit_MPU6050 mpu;

// Unique UUIDs for this specific service
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define GAIT_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

const int FSR_HEEL = A0;
const int FSR_IN_TOE = A1;
const int FSR_OUT_TOE = A2;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Phone Connected!");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Phone Disconnected!");
      // Restart advertising
      BLEDevice::startAdvertising();
    }
};

void setup() {
  Serial.begin(115200);
  
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) { delay(10); }
  }

  // Set up BLE
  BLEDevice::init("Biome-Left-Ankle"); // Change to Right for the other node
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
                      GAIT_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();
  Serial.println("Waiting for phone connection...");
}

void loop() {
  if (deviceConnected) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    int heel = map(analogRead(FSR_HEEL), 0, 4095, 0, 100);
    int inToe = map(analogRead(FSR_IN_TOE), 0, 4095, 0, 100);
    int outToe = map(analogRead(FSR_OUT_TOE), 0, 4095, 0, 100);

    // Create a simple comma-separated string to save BLE bandwidth
    // Format: accelX, accelY, accelZ, gyroX, gyroY, gyroZ, heel, inToe, outToe
    char payload[100];
    snprintf(payload, sizeof(payload), "%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%d,%d,%d", 
             a.acceleration.x, a.acceleration.y, a.acceleration.z,
             g.gyro.x, g.gyro.y, g.gyro.z,
             heel, inToe, outToe);

    pCharacteristic->setValue(payload);
    pCharacteristic->notify();
  }

  delay(50); // High frequency (~20Hz) for accurate gait tracking
}
```

## 5. Next Steps
Once both nodes are built and broadcasting, you will update the **Android Background Service** on your Pixel Phone. The phone app will scan for `Biome-Left-Ankle` and `Biome-Right-Ankle`, parse the incoming comma-separated strings, package them into the `GaitTelemetry` JSON schema, and relay them over WiFi/Cellular to your Hub!