# Track: Subjective Logs (Morning Readiness & Symptom Tracking)

## Specification

### Overview
Enable user tracking of subjective states upon waking and throughout the day (such as mood, pain, gastrointestinal indicators, urine color, and sleep disturbances). This complements objective sensor data (like heart rate, HRV, and Muse stress index) to build a holistic biofeedback baseline.

### Goals
1. **Subjective Morning Readiness Form**: A form in the dashboard to submit subjective feelings when waking up.
2. **Symptom Tracker**: Capture pain levels, gastrointestinal symptoms, and sleep disturbances.
3. **Data Correlation**: Align objective sleep/readiness baselines with subjective wake-up metrics.

### Data Schema
The `SubjectiveLog` object will be structured as follows:

```typescript
export interface SubjectiveLog {
  timestamp: string;
  woke_up_feeling_alright: boolean;
  wakeups_during_night: number;
  pain: 'none' | 'mild' | 'moderate' | 'severe';
  pain_location?: string;
  vomit: boolean;
  bowel: 'normal' | 'constipated' | 'diarrhea' | 'none' | 'other';
  urine: 'normal' | 'dark' | 'frequent' | 'burning' | 'none' | 'other';
  feeling_duration?: 'quick' | 'few_hours' | 'half_day' | 'all_day';
  took_psyllium_husk?: boolean;
  notes?: string;
}
```

### API Endpoints
* **POST `/api/events/subjective`**: Submits a new subjective log via REST.
* **WebSocket `telemetry` (project: `'subjective'`)**: Emits live updates across client instances.
* **Outbound Webhook / WebSocket Broadcast**: When `took_psyllium_husk` is `true`, the hub emits a `pill_scheduler_shift` event to WebSocket clients and POSTs a webhook shift signal to the Dynamic Pill Scheduler endpoint (default: `http://localhost:3005/api/schedule/shift`).

### Persistence
* Subjective logs are appended to `logs/subjective.jsonl` as JSON lines.
