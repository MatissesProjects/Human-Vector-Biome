# Android Build Guide: Pixel Phone Context Engine

This guide details how to build the background Android service for the Pixel 9 Pro to act as a "Digital Context Sense" node. This app will track ambient light and digital habits to correlate with physiological stress.

## 1. Project Setup
*   **Framework:** Android Native (Kotlin) is recommended over React Native for reliable, long-running background services and deep sensor access.
*   **Permissions:** You will need `PACKAGE_USAGE_STATS` (Requires special user granting via settings) and `ACTIVITY_RECOGNITION`.

## 2. Tracking Phone Context (Usage Stats)

To know if the user is doing "Deep Work" or "Doomscrolling", we can query the `UsageStatsManager`.

```kotlin
val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
val time = System.currentTimeMillis()

// Get usage stats for the last hour
val stats = usageStatsManager.queryUsageStats(
    UsageStatsManager.INTERVAL_DAILY, 
    time - 1000 * 60 * 60, 
    time
)

// You can map package names (e.g., "com.twitter.android") to categories.
```

## 3. Ambient Light Sensor (Lux)

The ambient environment heavily affects circadian rhythm and focus.

```kotlin
val sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
val lightSensor = sensorManager.getDefaultSensor(Sensor.TYPE_LIGHT)

val lightListener = object : SensorEventListener {
    override fun onSensorChanged(event: SensorEvent) {
        val lux = event.values[0]
        // Send this lux value to the Hub under the "digital-context" or "environment" stream
    }
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}
}

sensorManager.registerListener(lightListener, lightSensor, SensorManager.SENSOR_DELAY_NORMAL)
```

## 4. Synergy with the Watch
If the user leaves their phone on the desk and goes for a walk, the Phone's accelerometer will read `STATIONARY`, but the Watch will read `WALKING`. 

**The Hub Architecture:**
The Node.js Hub handles this conflict. The Hub should always prioritize the Watch's `motion_state` over the Phone's `motion_state` for determining physical activity, while relying on the Phone exclusively for `DigitalContext` (screen time) and `AmbientLightTelemetry`.