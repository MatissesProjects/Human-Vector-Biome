# Implementation Plan: Subjective Logs

### Phase 1: Schema & Types
- [ ] Define `SubjectiveLog` interface in `src/types.ts`.
- [ ] Extend `BiomeState`, `ProjectType`, and `TelemetryPayload` in `src/types.ts` to support the `subjective` project type.

### Phase 2: Hub Backend Updates
- [ ] Implement `persistSubjectiveLog(log: SubjectiveLog)` in `src/server.ts` to persist subjective entries into `logs/subjective.jsonl`.
- [ ] Update `app.post('/api/events/:project')` in `src/server.ts` to handle and persist subjective logs.
- [ ] Update WebSocket server connection in `src/server.ts` to handle `subjective` telemetry packets and broadcast/persist them.
- [ ] Add backend endpoint/telemetry tests in `tests/server.test.ts`.

### Phase 3: Dashboard Integration
- [ ] Update frontend Types and state management in `dashboard/src/context/BiomeContext.tsx`.
- [ ] Create a premium `SubjectiveLogForm` component in the dashboard to capture user reports with a glassmorphic interface.
- [ ] Embed the form and latest status display within the dashboard workspace.

### Phase 4: Pill Scheduler Integration
- [ ] Send schedule shift signals (+2h) via Socket.io and webhook POST to Dynamic Pill Scheduler when Psyllium Husk is taken.
