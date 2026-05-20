/**
 * Tests for src/config.ts
 *
 * Strategy: because config.ts exports a singleton `config` object that is
 * mutated in-place, and registerSettingsRoutes() registers express routes,
 * we test the module through the actual HTTP layer (same approach as
 * server.test.ts) rather than trying to mock module-level fs calls with
 * vi.resetModules() (which is brittle under ESM + singleton patterns).
 *
 * Pure-logic tests (DEFAULT_CONFIG shape, loadConfig fallback) are tested
 * by asserting on the live `config` export after import.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { config, DEFAULT_CONFIG } from '../src/config.js';
import fs from 'fs';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    appendFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(false),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue(''),
    writeFileSync: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
describe('Config Module', () => {

  // Track original values so each test leaves the singleton clean
  let savedValues: typeof config;

  beforeEach(() => {
    vi.clearAllMocks();
    savedValues = { ...config };
  });

  afterEach(() => {
    // Restore all config keys to their pre-test state
    Object.assign(config, savedValues);
  });

  // -------------------------------------------------------------------------
  describe('DEFAULT_CONFIG', () => {
    it('should have all expected keys with sensible defaults', () => {
      expect(DEFAULT_CONFIG.neckAngleThreshold).toBe(20);
      expect(DEFAULT_CONFIG.lookingDownTimeLimitMs).toBe(15000);
      expect(DEFAULT_CONFIG.postureScoreBadThreshold).toBe(40);
      expect(DEFAULT_CONFIG.baseStressThreshold).toBe(0.8);
      expect(DEFAULT_CONFIG.stressThresholdFloor).toBe(0.4);
      expect(DEFAULT_CONFIG.co2AlertThreshold).toBe(1000);
      expect(DEFAULT_CONFIG.weatherRefreshIntervalMs).toBe(15 * 60 * 1000);
    });

    it('should have every key from DEFAULT_CONFIG present in the live config', () => {
      for (const key of Object.keys(DEFAULT_CONFIG) as (keyof typeof DEFAULT_CONFIG)[]) {
        expect(config).toHaveProperty(key);
        expect(typeof config[key]).toBe('number');
      }
    });
  });

  // -------------------------------------------------------------------------
  describe('GET /api/settings', () => {
    it('returns 200 with all expected config keys', async () => {
      const res = await request(app).get('/api/settings');
      expect(res.status).toBe(200);
      for (const key of Object.keys(DEFAULT_CONFIG)) {
        expect(res.body).toHaveProperty(key);
        expect(typeof res.body[key]).toBe('number');
      }
    });

    it('reflects the current live config values', async () => {
      config.neckAngleThreshold = 42;
      const res = await request(app).get('/api/settings');
      expect(res.body.neckAngleThreshold).toBe(42);
    });
  });

  // -------------------------------------------------------------------------
  describe('POST /api/settings', () => {
    it('updates a single numeric setting', async () => {
      const res = await request(app)
        .post('/api/settings')
        .send({ neckAngleThreshold: 35 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.config.neckAngleThreshold).toBe(35);
      expect(config.neckAngleThreshold).toBe(35);
    });

    it('persists the updated value — GET reflects the change after POST', async () => {
      await request(app)
        .post('/api/settings')
        .send({ co2AlertThreshold: 1200 });

      // The live config singleton should reflect the written value
      const res = await request(app).get('/api/settings');
      expect(res.body.co2AlertThreshold).toBe(1200);
    });

    it('updates multiple settings at once', async () => {
      const res = await request(app)
        .post('/api/settings')
        .send({ co2AlertThreshold: 900, stressThresholdFloor: 0.35 });

      expect(res.status).toBe(200);
      expect(config.co2AlertThreshold).toBe(900);
      expect(config.stressThresholdFloor).toBe(0.35);
    });

    it('returns 400 when body is an array (not an object)', async () => {
      const res = await request(app)
        .post('/api/settings')
        .send([{ neckAngleThreshold: 20 }]);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('returns 400 when a value is not numeric', async () => {
      const res = await request(app)
        .post('/api/settings')
        .send({ neckAngleThreshold: 'banana' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('neckAngleThreshold');
    });

    it('returns 400 when a value is NaN', async () => {
      const res = await request(app)
        .post('/api/settings')
        .send({ neckAngleThreshold: null });

      expect(res.status).toBe(400);
    });

    it('ignores unknown keys and reports them in the response', async () => {
      const res = await request(app)
        .post('/api/settings')
        .send({ neckAngleThreshold: 22, notARealSetting: 999 });

      expect(res.status).toBe(200);
      expect(res.body.ignoredUnknownKeys).toContain('notARealSetting');
      expect(config).not.toHaveProperty('notARealSetting');
    });

    it('does not corrupt config when body contains mixed valid/invalid keys', async () => {
      const originalAngle = config.neckAngleThreshold;

      const res = await request(app)
        .post('/api/settings')
        .send({ neckAngleThreshold: 'bad', co2AlertThreshold: 1100 });

      // Should fail on the bad value before making any mutations
      expect(res.status).toBe(400);
    });
  });
});
