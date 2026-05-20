import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, state } from '../src/server.js';
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
});
