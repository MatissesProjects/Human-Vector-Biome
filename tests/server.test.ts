import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, state, io } from '../src/server.js';
import fs from 'fs';

vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs')>();
    return {
        ...actual,
        appendFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
        // Return empty string by default so config.ts and recognizer don't
        // try to parse real disk files during tests.
        readFileSync: vi.fn().mockReturnValue(''),
        writeFileSync: vi.fn(),
    };
});

// Mock fetch for weather and pill-scheduler calls
global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
        current_weather: {
            temperature: 20,
            weathercode: 0
        }
    })
}) as any;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMuse(stressIndex: number) {
    return {
        timestamp: new Date().toISOString(),
        stress_index: stressIndex,
        alpha: 0.5,
        beta: 0.3,
        delta: 0.1,
        gamma: 0.05,
        theta: 0.2,
        concentration_level: 0.6,
    };
}

function makePosture(score: number, pose?: Record<string, { x: number; y: number; z: number }>) {
    return {
        timestamp: new Date().toISOString(),
        analysis: { score },
        pose: pose ?? {
            nose: { x: 0, y: 1.2, z: -0.4 },
            left_shoulder: { x: -0.5, y: 1.0, z: -0.4 },
            right_shoulder: { x: 0.5, y: 1.0, z: -0.4 },
        },
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Server REST API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global state between tests
    state.posture = null;
    state.heart = null;
    state.muse = null;
    state.story = null;
    state.lastPillEvent = null;
    state.actions = [];
    state.environment = null;
    state.subjective = null;
    state.baseline = null;
    state.git = null;
  });

  // -------------------------------------------------------------------------
  describe('POST /api/events/:project', () => {
    it('should update state and return success for story events', async () => {
      const eventData = { scene: 'forest', mood: 'calm' };
      const response = await request(app)
        .post('/api/events/story')
        .send(eventData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(state.story).toEqual(eventData);
    });

    it('should return 400 for empty event data', async () => {
      const response = await request(app)
        .post('/api/events/story')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should update state and return success for git events', async () => {
      const eventData = {
        timestamp: new Date().toISOString(),
        commits_today: 5,
        lines_added_today: 150,
        lines_deleted_today: 30,
        last_commit_message: 'feat: add git poller',
        last_commit_hash: 'a1b2c3d'
      };
      const response = await request(app)
        .post('/api/events/git')
        .send(eventData);

      expect(response.status).toBe(200);
      expect(state.git).toEqual(eventData);
    });

    it('should update state and return success for pills events', async () => {
      const eventData = { pill: 'Vitamin C', taken: true };
      const response = await request(app)
        .post('/api/events/pills')
        .send(eventData);

      expect(response.status).toBe(200);
      expect(state.lastPillEvent).toEqual(eventData);
    });

    it('should update state and return success for subjective events', async () => {
      const eventData = {
        timestamp: new Date().toISOString(),
        woke_up_feeling_alright: true,
        wakeups_during_night: 0,
        pain: 'none',
        vomit: false,
        bowel: 'normal',
        urine: 'normal',
        feeling_duration: 'quick',
        took_psyllium_husk: true
      };
      const response = await request(app)
        .post('/api/events/subjective')
        .send(eventData);

      expect(response.status).toBe(200);
      expect(state.subjective).toEqual(eventData);
    });

    it('should send a signal to the dynamic pill scheduler when took_psyllium_husk is true', async () => {
      const eventData = {
        timestamp: new Date().toISOString(),
        woke_up_feeling_alright: false,
        wakeups_during_night: 1,
        pain: 'moderate',
        vomit: false,
        bowel: 'normal',
        urine: 'normal',
        feeling_duration: 'few_hours',
        took_psyllium_husk: true
      };

      (global.fetch as any).mockClear();

      const response = await request(app)
        .post('/api/events/subjective')
        .send(eventData);

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalled();
      
      const fetchCalls = (global.fetch as any).mock.calls;
      const pillSchedulerCall = fetchCalls.find((call: any[]) => call[0].includes('/api/schedule/shift'));
      expect(pillSchedulerCall).toBeDefined();
      expect(JSON.parse(pillSchedulerCall[1].body)).toEqual({
        shift_hours: 2,
        reason: 'Psyllium Husk taken - delay pills to avoid absorption interference'
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('POST /api/actions', () => {
    it('should return 400 for missing label or type', async () => {
      const response = await request(app)
        .post('/api/actions')
        .send({ label: 'Missing Type' });

      expect(response.status).toBe(400);
    });

    it('should start an action capture', async () => {
      const actionData = { label: 'Drinking Water', type: 'START', streams: ['posture'] };
      const response = await request(app)
        .post('/api/actions')
        .send(actionData);

      expect(response.status).toBe(200);
      expect(response.body.action.label).toBe('Drinking Water');
      expect(state.actions.length).toBe(1);
      expect(state.actions[0]!.label).toBe('Drinking Water');
    });

    it('should keep a buffer of recent actions', async () => {
      for (let i = 0; i < 60; i++) {
        await request(app)
          .post('/api/actions')
          .send({ label: `Action ${i}`, type: 'POINT' });
      }
      expect(state.actions.length).toBe(50); // Buffer limit is 50
      expect(state.actions[49]!.label).toBe('Action 59');
    });
  });

  // -------------------------------------------------------------------------
  describe('GET + POST /api/settings', () => {
    it('GET /api/settings returns a config object with expected keys', async () => {
      const response = await request(app).get('/api/settings');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('neckAngleThreshold');
      expect(response.body).toHaveProperty('baseStressThreshold');
      expect(response.body).toHaveProperty('co2AlertThreshold');
      expect(typeof response.body.neckAngleThreshold).toBe('number');
    });

    it('POST /api/settings updates a valid setting', async () => {
      const original = (await request(app).get('/api/settings')).body.neckAngleThreshold;
      
      const response = await request(app)
        .post('/api/settings')
        .send({ neckAngleThreshold: 30 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.config.neckAngleThreshold).toBe(30);

      // Restore
      await request(app).post('/api/settings').send({ neckAngleThreshold: original });
    });

    it('POST /api/settings returns 400 for a non-numeric value', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({ neckAngleThreshold: 'bad' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('POST /api/settings silently ignores unknown keys', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({ neckAngleThreshold: 22, notARealKey: 999 });

      expect(response.status).toBe(200);
      expect(response.body.ignoredUnknownKeys).toContain('notARealKey');
    });
  });

  // -------------------------------------------------------------------------
  describe('Intervention Logic and Subjective Logs', () => {
    it('should lower stress threshold and trigger intervention when subjective health is bad', async () => {
      // 1. Set stress index to 0.7 (below default 0.8 threshold)
      state.muse = makeMuse(0.7);
      
      const spyEmit = vi.spyOn(io, 'emit');

      // Send telemetry/run interventions — should NOT trigger intervention yet
      await request(app)
        .post('/api/events/muse')
        .send(state.muse);

      expect(spyEmit).not.toHaveBeenCalledWith('intervention', expect.any(Object));

      // 2. Post a subjective log with severe pain (reduces threshold to 0.65)
      const subjectiveLog = {
        timestamp: new Date().toISOString(),
        woke_up_feeling_alright: true,
        wakeups_during_night: 0,
        pain: 'severe',
        vomit: false,
        bowel: 'normal',
        urine: 'normal'
      };

      await request(app)
        .post('/api/events/subjective')
        .send(subjectiveLog);

      // Now with stress at 0.7, it is above the new effective threshold.
      await request(app)
        .post('/api/events/muse')
        .send(state.muse);

      expect(spyEmit).toHaveBeenCalledWith('intervention', expect.objectContaining({
        type: 'RELAXATION_SUGGESTION',
        target: 'story'
      }));

      spyEmit.mockRestore();
    });

    it('should trigger haptic alert when posture score is below bad threshold', async () => {
      const spyEmit = vi.spyOn(io, 'emit');

      await request(app)
        .post('/api/events/posture')
        .send(makePosture(20)); // well below 40 threshold

      expect(spyEmit).toHaveBeenCalledWith('intervention', expect.objectContaining({
        target: 'heart',
        type: 'HAPTIC_TAP',
        message: 'Straighten your back.'
      }));

      spyEmit.mockRestore();
    });

    it('should NOT trigger haptic alert when posture score is above threshold', async () => {
      const spyEmit = vi.spyOn(io, 'emit');

      await request(app)
        .post('/api/events/posture')
        .send(makePosture(85));

      expect(spyEmit).not.toHaveBeenCalledWith('intervention', expect.objectContaining({
        type: 'HAPTIC_TAP',
        message: 'Straighten your back.'
      }));

      spyEmit.mockRestore();
    });

    it('should trigger CO₂ environment warning when threshold is exceeded', async () => {
      const spyEmit = vi.spyOn(io, 'emit');

      await request(app)
        .post('/api/events/environment')
        .send({
          timestamp: new Date().toISOString(),
          co2: 1500,
          temperature: 22,
          humidity: 45
        });

      expect(spyEmit).toHaveBeenCalledWith('intervention', expect.objectContaining({
        target: 'dashboard',
        type: 'ENVIRONMENT_WARNING',
        message: expect.stringContaining('CO2')
      }));

      spyEmit.mockRestore();
    });

    it('should NOT trigger CO₂ warning when CO2 is below threshold', async () => {
      const spyEmit = vi.spyOn(io, 'emit');

      await request(app)
        .post('/api/events/environment')
        .send({
          timestamp: new Date().toISOString(),
          co2: 800,
          temperature: 22,
          humidity: 45
        });

      expect(spyEmit).not.toHaveBeenCalledWith('intervention', expect.objectContaining({
        type: 'ENVIRONMENT_WARNING',
      }));

      spyEmit.mockRestore();
    });

    it('applies baseline readiness reduction to stress threshold', async () => {
      // Set a low readiness score (< 60) — should reduce threshold by 0.1
      state.baseline = {
        timestamp: new Date().toISOString(),
        sleep_score: 55,
        deep_sleep_minutes: 40,
        rem_sleep_minutes: 60,
        light_sleep_minutes: 100,
        overnight_avg_hr: 58,
        overnight_lowest_hr: 50,
        overnight_avg_spo2: 96,
        readiness_score: 55, // below 60 → threshold drops to 0.7
        muse_calibration_completed: false,
      };

      state.muse = makeMuse(0.75); // would NOT trigger at 0.8 but SHOULD at 0.7

      const spyEmit = vi.spyOn(io, 'emit');

      await request(app)
        .post('/api/events/muse')
        .send(state.muse);

      expect(spyEmit).toHaveBeenCalledWith('intervention', expect.objectContaining({
        type: 'RELAXATION_SUGGESTION',
      }));

      spyEmit.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  describe('Posture Neck Angle and Bottom Monitor Alerts', () => {
    it('should calculate correct neck angle and set is_looking_down_too_long if threshold is exceeded', async () => {
      const { calculateNeckAngle } = await import('../src/server.js');
      
      const goodPose = {
        nose: { x: 0, y: 1.2, z: -0.4 },
        left_shoulder: { x: -0.5, y: 1.0, z: -0.4 },
        right_shoulder: { x: 0.5, y: 1.0, z: -0.4 }
      };
      
      const lookingDownPose = {
        nose: { x: 0, y: 1.05, z: -0.48 },
        left_shoulder: { x: -0.5, y: 1.0, z: -0.4 },
        right_shoulder: { x: 0.5, y: 1.0, z: -0.4 }
      };
      
      expect(calculateNeckAngle(goodPose)).toBe(0);
      expect(calculateNeckAngle(lookingDownPose)).toBe(58);

      const spyEmit = vi.spyOn(io, 'emit');

      // Send telemetry with good pose
      const goodResponse = await request(app)
        .post('/api/events/posture')
        .send({
          timestamp: new Date().toISOString(),
          analysis: { score: 90 },
          pose: goodPose
        });
      
      expect(goodResponse.status).toBe(200);
      expect(state.posture?.analysis.neck_angle).toBe(0);
      expect(state.posture?.analysis.is_looking_down_too_long).toBe(false);

      // Send looking down pose (first time - should start timer but not exceed limit)
      const lookDownResponse1 = await request(app)
        .post('/api/events/posture')
        .send({
          timestamp: new Date().toISOString(),
          analysis: { score: 85 },
          pose: lookingDownPose
        });

      expect(lookDownResponse1.status).toBe(200);
      expect(state.posture?.analysis.neck_angle).toBe(58);
      expect(state.posture?.analysis.is_looking_down_too_long).toBe(false);

      // Fake clock to simulate 16 seconds elapsed (> 15s default limit)
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 16000);

      // Send looking down pose again — should trigger alert!
      const lookDownResponse2 = await request(app)
        .post('/api/events/posture')
        .send({
          timestamp: new Date().toISOString(),
          analysis: { score: 85 },
          pose: lookingDownPose
        });

      expect(lookDownResponse2.status).toBe(200);
      expect(state.posture?.analysis.is_looking_down_too_long).toBe(true);
      expect(state.posture?.analysis.feedback).toContain('Looking down at bottom monitor');
      expect(spyEmit).toHaveBeenCalledWith('intervention', expect.objectContaining({
        target: 'heart',
        type: 'HAPTIC_TAP',
        message: expect.stringContaining('looking at the bottom monitor too long')
      }));

      vi.useRealTimers();
      spyEmit.mockRestore();
    });

    it('should return undefined from calculateNeckAngle when pose landmarks are missing', async () => {
      const { calculateNeckAngle } = await import('../src/server.js');
      expect(calculateNeckAngle({})).toBeUndefined();
      expect(calculateNeckAngle({ nose: { x: 0, y: 0, z: 0 } })).toBeUndefined();
    });

    it('should reset the looking-down timer when head returns to upright', async () => {
      const lookingDownPose = {
        nose: { x: 0, y: 1.05, z: -0.48 },
        left_shoulder: { x: -0.5, y: 1.0, z: -0.4 },
        right_shoulder: { x: 0.5, y: 1.0, z: -0.4 }
      };
      const uprightPose = {
        nose: { x: 0, y: 1.2, z: -0.4 },
        left_shoulder: { x: -0.5, y: 1.0, z: -0.4 },
        right_shoulder: { x: 0.5, y: 1.0, z: -0.4 }
      };

      // Start the looking-down timer
      await request(app).post('/api/events/posture').send({
        timestamp: new Date().toISOString(),
        analysis: { score: 80 },
        pose: lookingDownPose
      });
      expect(state.posture?.analysis.is_looking_down_too_long).toBe(false);

      // Return upright — timer resets
      await request(app).post('/api/events/posture').send({
        timestamp: new Date().toISOString(),
        analysis: { score: 95 },
        pose: uprightPose
      });
      expect(state.posture?.analysis.is_looking_down_too_long).toBe(false);

      // Now advance time and look down again — should start a fresh timer (not fire immediately)
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 16000);

      await request(app).post('/api/events/posture').send({
        timestamp: new Date().toISOString(),
        analysis: { score: 80 },
        pose: lookingDownPose
      });
      // Timer just restarted, so still false
      expect(state.posture?.analysis.is_looking_down_too_long).toBe(false);

      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------
  describe('processPostureTelemetry edge cases', () => {
    it('should handle posture data without a pose field gracefully', async () => {
      const response = await request(app)
        .post('/api/events/posture')
        .send({ timestamp: new Date().toISOString(), analysis: { score: 75 } });

      expect(response.status).toBe(200);
      expect(state.posture).toBeDefined();
    });
  });
});
