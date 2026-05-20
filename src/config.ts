import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import type { Application } from 'express';
import type { Server as SocketIOServer } from 'socket.io';
import type { ServerConfig } from './types.js';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

export const DEFAULT_CONFIG: ServerConfig = {
  // Posture / Neck
  neckAngleThreshold: 20,
  lookingDownTimeLimitMs: 15000,
  postureScoreBadThreshold: 40,

  // Stress
  baseStressThreshold: 0.8,
  stressThresholdFloor: 0.4,

  // Environment
  co2AlertThreshold: 1000,

  // Weather
  weatherRefreshIntervalMs: 15 * 60 * 1000,
};

/**
 * Load config from disk (config.json), merging with defaults so new fields
 * added to DEFAULT_CONFIG are always present even on old saved files.
 */
function loadConfig(): ServerConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(raw) as Partial<ServerConfig>;
      return { ...DEFAULT_CONFIG, ...saved };
    }
  } catch (err) {
    console.warn('[Config] Failed to load config.json, using defaults:', err);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(cfg: ServerConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Config] Failed to persist config.json:', err);
  }
}

// Singleton config object — mutated in place so all modules reading it get
// the latest value without needing to re-import.
export const config: ServerConfig = loadConfig();

/**
 * Register the settings REST endpoints on the express app.
 * Also emits a 'settings_update' event via socket.io when settings change.
 */
export function registerSettingsRoutes(app: Application, io: SocketIOServer): void {
  // GET /api/settings — return current config
  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json(config);
  });

  // POST /api/settings — merge and persist changes
  app.post('/api/settings', (req: Request, res: Response) => {
    const updates = req.body as Partial<ServerConfig>;

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ status: 'error', message: 'Body must be a JSON object' });
    }

    // Validate: only accept known keys with numeric values
    const allowedKeys = Object.keys(DEFAULT_CONFIG) as (keyof ServerConfig)[];
    const rejected: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.includes(key as keyof ServerConfig)) {
        rejected.push(key);
        continue;
      }
      if (typeof value !== 'number' || isNaN(value)) {
        return res.status(400).json({
          status: 'error',
          message: `Field "${key}" must be a number`,
        });
      }
      // Mutate singleton in place
      (config as unknown as Record<string, unknown>)[key] = value;
    }

    saveConfig(config);
    io.emit('settings_update', config);

    console.log('[Config] Settings updated:', updates);

    res.json({
      status: 'success',
      config,
      ...(rejected.length ? { ignoredUnknownKeys: rejected } : {}),
    });
  });
}
