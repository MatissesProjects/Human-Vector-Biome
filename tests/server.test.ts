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
        readFileSync: vi.fn().mockReturnValue(''),
    };
});

// Mock fetch for weather
global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({
        current_weather: {
            temperature: 20,
            weathercode: 0
        }
    })
}) as any;

describe('Server REST API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    state.posture = null;
    state.heart = null;
    state.muse = null;
    state.actions = [];
  });

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
        urine: 'normal'
      };
      const response = await request(app)
        .post('/api/events/subjective')
        .send(eventData);

      expect(response.status).toBe(200);
      expect(state.subjective).toEqual(eventData);
    });
  });

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
      expect(state.actions[0].label).toBe('Drinking Water');
    });

    it('should keep a buffer of recent actions', async () => {
      for (let i = 0; i < 60; i++) {
        await request(app)
          .post('/api/actions')
          .send({ label: `Action ${i}`, type: 'POINT' });
      }
      expect(state.actions.length).toBe(50); // Buffer limit is 50
      expect(state.actions[49].label).toBe('Action 59');
    });
  });

  describe('Intervention Logic and Subjective Logs', () => {
    it('should lower stress threshold and trigger intervention when subjective health is bad', async () => {
      // 1. Set stress index to 0.7 (below default 0.8 threshold)
      state.muse = { timestamp: new Date().toISOString(), stress_index: 0.7 };
      
      const spyEmit = vi.spyOn(io, 'emit');

      // Send telemetry/run interventions, should not trigger intervention
      await request(app)
        .post('/api/events/muse')
        .send(state.muse);

      expect(spyEmit).not.toHaveBeenCalledWith('intervention', expect.any(Object));

      // 2. Post a subjective log with severe pain (should reduce threshold to 0.6)
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

      // Now with stress at 0.7, it is above the new threshold of 0.6.
      // Send muse event again to run interventions
      await request(app)
        .post('/api/events/muse')
        .send(state.muse);

      // It should have triggered a RELAXATION_SUGGESTION
      expect(spyEmit).toHaveBeenCalledWith('intervention', expect.objectContaining({
        type: 'RELAXATION_SUGGESTION',
        target: 'story'
      }));

      spyEmit.mockRestore();
    });
  });
});
