# WearOS Build Guide: Pixel Watch Integration

This guide details how to build the companion WearOS app (for the Pixel Watch 3) to stream `HeartBiometrics` (including `motion_state` for walking/breaks) and deep metrics like `SkinTempTelemetry` to the Human-Vector-Biome Hub.

## 1. Project Setup
We will use **Jetpack Compose for Wear OS** and **Health Services / Health Connect**.

*   **IDE:** Android Studio (latest stable).
*   **SDK:** Minimum API 30 (Wear OS 3+).
*   **Permissions:** You must declare `BODY_SENSORS`, `ACTIVITY_RECOGNITION`, and potentially Health Connect read permissions in your `AndroidManifest.xml`.

## 2. Extracting Motion State (The "Walking Break" Trigger)

To detect if the user is `STATIONARY`, `WALKING`, or `RUNNING`, we don't need raw accelerometer math. We can use the Google Play Services **Activity Recognition API**.

```kotlin
// In your WearOS Background Service

val client = ActivityRecognition.getClient(context)

// Request updates every 5 seconds
client.requestActivityTransitionUpdates(
    ActivityTransitionRequest(
        listOf(
            ActivityTransition.Builder()
                .setActivityType(DetectedActivity.WALKING)
                .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
                .build(),
            ActivityTransition.Builder()
                .setActivityType(DetectedActivity.STILL)
                .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
                .build()
        )
    ),
    pendingIntent
)
```

When a transition occurs, your app will receive an Intent. You can map `DetectedActivity.WALKING` to our Hub's `motion_state: 'WALKING'`.

## 3. Streaming to the Hub

The WearOS app must run a foreground service (with an ongoing notification) to keep the connection alive while tracking. Use a lightweight WebSocket client (like OkHttp's WebSocket) to connect to `http://<hub-ip>:3000`.

```kotlin
// Example JSON Payload to send over WebSocket ('telemetry' event)
val payload = """
{
  "project": "heart",
  "data": {
    "timestamp": "${Instant.now()}",
    "heart_rate": $currentHr,
    "hrv": $currentHrv,
    "is_anomaly_detected": false,
    "motion_state": "$currentMotionState" // 'WALKING' or 'STATIONARY'
  }
}
"""
```

## 4. Intervention Haptics
When the Hub determines the user needs a break (e.g., sitting for > 2 hours), it emits an `intervention` event.

Your WearOS app should listen to the WebSocket for:
```json
{
  "target": "heart",
  "type": "HAPTIC_TAP",
  "message": "Time for a 5-minute walk."
}
```

Upon receiving this, trigger the vibrator:
```kotlin
val vibrator = context.getSystemService(Vibrator::class.java)
val effect = VibrationEffect.createPredefined(VibrationEffect.EFFECT_DOUBLE_CLICK)
vibrator.vibrate(effect)
```

When the user stands up and starts walking, the Activity Recognition API will detect `WALKING`, send it to the Hub, and the Hub will automatically log the "Walking Break" as a successful action!