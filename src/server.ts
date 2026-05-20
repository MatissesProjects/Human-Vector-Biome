import express from 'express';
import type { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import type { BiomeState, ProjectType, UserAction, TelemetryPayload, WeatherTelemetry, SubjectiveLog, Vector3 } from './types.js';
import { ActionRecognizer } from './recognizer.js';
import { config, registerSettingsRoutes } from './config.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const LOG_DIR = path.join(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Initialize DTW Recognizer
const recognizer = new ActionRecognizer();

// Centralized state
const state: BiomeState = {
  posture: null,
  heart: null,
  muse: null,
  story: null,
  lastPillEvent: null,
  actions: [],
  environment: null,
  chair: null,
  desk: null,
  weather: null,
  baseline: null,
  subjective: null
};

let activeCapture: { id: string, label: string, streams: string[] } | null = null;
let lookingDownStartTime: number | null = null;

export function calculateNeckAngle(pose: Record<string, Vector3>): number | undefined {
  const nose = pose.nose;
  const left_shoulder = pose.left_shoulder;
  const right_shoulder = pose.right_shoulder;
  if (!nose || !left_shoulder || !right_shoulder) return undefined;

  const midX = (left_shoulder.x + right_shoulder.x) / 2;
  const midY = (left_shoulder.y + right_shoulder.y) / 2;
  const midZ = (left_shoulder.z + right_shoulder.z) / 2;

  const dx = nose.x - midX;
  const dy = nose.y - midY;
  const dz = nose.z - midZ;

  // Compute angle of head vector relative to the vertical Y axis (flexion/forward tilt)
  const angleRad = Math.atan2(Math.sqrt(dx * dx + dz * dz), dy);
  const angleDeg = Math.round(angleRad * (180 / Math.PI));
  return angleDeg;
}

export function processPostureTelemetry(data: any): any {
  if (data && data.pose) {
    const neckAngle = calculateNeckAngle(data.pose);
    if (neckAngle !== undefined) {
      data.analysis = data.analysis || {};
      data.analysis.neck_angle = neckAngle;
      
      if (neckAngle > config.neckAngleThreshold) {
        if (lookingDownStartTime === null) {
          lookingDownStartTime = Date.now();
          data.analysis.is_looking_down_too_long = false;
        } else if (Date.now() - lookingDownStartTime > config.lookingDownTimeLimitMs) {
          data.analysis.is_looking_down_too_long = true;
          data.analysis.feedback = 'Looking down at bottom monitor too long! Stretch your neck.';
          console.log(`[Intervention] Neck tilt exceeded ${config.lookingDownTimeLimitMs / 1000}s limit. Sending Haptic Alert to Watch.`);
          io.emit('intervention', {
            target: 'heart',
            type: 'HAPTIC_TAP',
            message: 'Chin up! You have been looking at the bottom monitor too long.'
          });
        } else {
          data.analysis.is_looking_down_too_long = false;
        }
      } else {
        lookingDownStartTime = null;
        data.analysis.is_looking_down_too_long = false;
      }
    }
  }
  return data;
}

/**
 * Fetch Local Weather
 */
async function fetchLocalWeather() {
  try {
    // Example using Open-Meteo (no API key required) for a default location (e.g. SF or local)
    const lat = process.env.WEATHER_LAT || 37.7749;
    const lon = process.env.WEATHER_LON || -122.4194;
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data: any = await res.json();
    
    if (data && data.current_weather) {
      const weatherData: WeatherTelemetry = {
        timestamp: new Date().toISOString(),
        temperature: data.current_weather.temperature,
        condition: `Code: ${data.current_weather.weathercode}`, // Using WMO code for simplicity
        location: 'San Francisco, CA' // Mocked location
      };
      state.weather = weatherData;
      io.emit('dashboard_update', { project: 'weather', data: weatherData });
      console.log(`[Weather] Updated: ${weatherData.temperature}°C`);
    }
  } catch (err) {
    console.error('[Weather] Failed to fetch local weather:', err);
  }
}

// Initial fetch and interval (controlled by config)
fetchLocalWeather();
setInterval(fetchLocalWeather, config.weatherRefreshIntervalMs);


/**
 * Persistence Layer for Training Data
 */
function persistAction(action: UserAction) {
  const filePath = path.join(LOG_DIR, 'actions.jsonl');
  const entry = {
    ...action,
    // Capture a snapshot of the biometric state for training correlation
    stateSnapshot: {
        posture: state.posture,
        heart: state.heart,
        muse: state.muse
    }
  };
  try {
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
    console.log(`[Persistence] Logged action: ${action.label} (${action.type})`);
  } catch (err) {
    console.error(`[Persistence] Failed to log action to ${filePath}:`, err);
  }
}

function persistSubjectiveLog(log: SubjectiveLog) {
  const filePath = path.join(LOG_DIR, 'subjective.jsonl');
  try {
    fs.appendFileSync(filePath, JSON.stringify(log) + '\n');
    console.log(`[Persistence] Logged subjective report at: ${log.timestamp}`);
  } catch (err) {
    console.error(`[Persistence] Failed to log subjective report to ${filePath}:`, err);
  }
}

function persistTelemetrySample(actionId: string, label: string, project: string, data: unknown) {
  const filePath = path.join(LOG_DIR, 'capture_samples.jsonl');
  const entry = {
    actionId,
    label,
    project,
    timestamp: new Date().toISOString(),
    data
  };
  try {
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error(`[Persistence] Failed to log telemetry sample to ${filePath}:`, err);
  }
}

/**
 * Intervention Brain
 * Logic that coordinates between projects
 */
function runInterventions() {
  // Determine stress threshold based on daily readiness baseline
  let baseStressThreshold = config.baseStressThreshold;
  if (state.baseline) {
    if (state.baseline.readiness_score < 60) baseStressThreshold -= 0.1;
    if (state.baseline.muse_calibration_completed && state.baseline.muse_baseline_stress) {
       // If their morning baseline is already known, trigger sooner if it spikes by 0.25
       baseStressThreshold = Math.min(baseStressThreshold, state.baseline.muse_baseline_stress + 0.25);
    }
  }

  // Adjust stress threshold dynamically based on subjective morning metrics
  if (state.subjective) {
    if (!state.subjective.woke_up_feeling_alright) {
      baseStressThreshold -= 0.05;
    }
    if (state.subjective.pain === 'mild') {
      baseStressThreshold -= 0.02;
    } else if (state.subjective.pain === 'moderate') {
      baseStressThreshold -= 0.05;
    } else if (state.subjective.pain === 'severe') {
      baseStressThreshold -= 0.15;
    }
    if (state.subjective.vomit) {
      baseStressThreshold -= 0.1;
    }
    if (state.subjective.wakeups_during_night > 2) {
      baseStressThreshold -= 0.05;
    }
  }
  baseStressThreshold = Math.max(config.stressThresholdFloor, baseStressThreshold);

  // 1. Stress -> Story Relaxation Nudge
  if (state.muse && state.muse.stress_index > baseStressThreshold) {
    console.log(`[Intervention] High Stress detected (Threshold: ${baseStressThreshold.toFixed(2)}). Sending Story relaxation nudge.`);
    io.emit('intervention', {
      target: 'story',
      type: 'RELAXATION_SUGGESTION',
      message: 'Your stress levels are climbing, especially considering your overnight baseline. Would you like to start a calming story session?'
    });
  }

  // 2. Posture -> Haptic Alert
  if (state.posture && state.posture.analysis.score < config.postureScoreBadThreshold) {
     console.log('[Intervention] Bad Posture detected. Sending Haptic Alert to Watch.');
     io.emit('intervention', {
       target: 'heart',
       type: 'HAPTIC_TAP',
       message: 'Straighten your back.'
     });
  }

  // 3. Environment -> Open Window
  if (state.environment && state.environment.co2 > config.co2AlertThreshold) {
    console.log('[Intervention] High CO2 detected. Sending Alert.');
    io.emit('intervention', {
      target: 'dashboard',
      type: 'ENVIRONMENT_WARNING',
      message: 'CO2 levels are high (>1000ppm). Please open a window to improve focus and air quality.'
    });
  }
}

// Settings endpoints
registerSettingsRoutes(app, io);

// REST Endpoints for low-frequency data
app.post('/api/events/:project', (req: Request, res: Response) => {
  const { project } = req.params as { project: ProjectType };
  const eventData = req.body;
  
  if (!eventData || Object.keys(eventData).length === 0) {
    return res.status(400).json({ status: 'error', message: 'Empty event data' });
  }
  
  console.log(`[REST] Received event from ${project}:`, eventData);
  
  // Update state for event-driven projects
  if (project === 'story') state.story = eventData;
  if (project === 'pills') state.lastPillEvent = eventData;
  if (project === 'posture') state.posture = processPostureTelemetry(eventData);
  if (project === 'environment') state.environment = eventData;
  if (project === 'chair') state.chair = eventData;
  if (project === 'desk') state.desk = eventData;
  if (project === 'baseline') state.baseline = eventData;
  if (project === 'muse') state.muse = eventData;
  if (project === 'heart') state.heart = eventData;
  if (project === 'subjective') {
    state.subjective = eventData;
    persistSubjectiveLog(eventData);

    if (eventData.took_psyllium_husk) {
      console.log('[Pill Scheduler] Psyllium Husk interaction: triggering schedule shift (+2h)');
      
      // Emit websocket event to any active clients (e.g. WearOS scheduler/Pixel Watch hub)
      io.emit('pill_scheduler_shift', {
        timestamp: new Date().toISOString(),
        shift_hours: 2,
        reason: 'Psyllium Husk taken'
      });

      const pillSchedulerUrl = process.env.PILL_SCHEDULER_URL || 'http://localhost:3005';
      fetch(`${pillSchedulerUrl}/api/schedule/shift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_hours: 2,
          reason: 'Psyllium Husk taken - delay pills to avoid absorption interference'
        })
      }).then((res) => {
        if (res.ok) {
          console.log('[Pill Scheduler] Shift signal successfully sent via Webhook');
        } else {
          console.warn(`[Pill Scheduler] Webhook responded with status: ${res.status}`);
        }
      }).catch((err) => {
        console.log(`[Pill Scheduler] Webhook shift skipped (scheduler at ${pillSchedulerUrl} not reachable)`);
      });
    }
  }

  // Broadcast to all dashboard clients
  io.emit('project_event', { project, ...eventData });
  
  // Run logic check
  runInterventions();

  res.status(200).json({ status: 'success', received: true });
});

/**
 * Specialized Action Capture Endpoint
 * Used for tagging actions for ML training
 */
app.post('/api/actions', (req: Request, res: Response) => {
  const { label, type, streams = ['posture'] } = req.body;

  if (!label || !type) {
    return res.status(400).json({ status: 'error', message: 'Label and type are required' });
  }
  const id = Math.random().toString(36).substr(2, 9);
  
  const action: UserAction = {
    id,
    timestamp: new Date().toISOString(),
    label,
    type,
    metadata: { streams }
  };

  if (type === 'START') {
    activeCapture = { id, label, streams };
    console.log(`[Capture] Started recording: ${label} on streams: ${streams.join(', ')}`);
  } else if (type === 'STOP') {
    activeCapture = null;
    console.log(`[Capture] Stopped recording: ${label}`);
    // Reload templates so the newly recorded action is immediately available for detection
    recognizer.loadTemplates();
  }

  state.actions.push(action);
  if (state.actions.length > 50) state.actions.shift(); // Keep recent buffer

  persistAction(action);
  io.emit('project_event', { project: 'actions', data: action });

  res.status(200).json({ status: 'success', action });
});

function detectWalkingBreak(prevMotion: string | undefined, newMotion: string) {
    if (prevMotion === 'STATIONARY' && newMotion === 'WALKING') {
        console.log('[Auto-Capture] Detected Walking Break started.');
        const actionEvent: UserAction = {
           id: Math.random().toString(36).substr(2, 9),
           timestamp: new Date().toISOString(),
           label: 'Walking Break',
           type: 'START',
           metadata: { source: 'MOTION_SENSOR' }
        };
        state.actions.push(actionEvent);
        if (state.actions.length > 50) state.actions.shift();
        io.emit('project_event', { project: 'actions', data: actionEvent });
    } else if (prevMotion === 'WALKING' && newMotion === 'STATIONARY') {
        console.log('[Auto-Capture] Detected Walking Break ended.');
        const actionEvent: UserAction = {
           id: Math.random().toString(36).substr(2, 9),
           timestamp: new Date().toISOString(),
           label: 'Walking Break',
           type: 'STOP',
           metadata: { source: 'MOTION_SENSOR' }
        };
        state.actions.push(actionEvent);
        if (state.actions.length > 50) state.actions.shift();
        io.emit('project_event', { project: 'actions', data: actionEvent });
    }
}

/**
 * WebSocket connection for high-frequency data
 */
io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  socket.on('telemetry', (payload: TelemetryPayload) => {
    const { project, data } = payload;
    
    // Update local state
    if (project === 'posture') {
        state.posture = processPostureTelemetry(data);
        
        // Feed frame to recognizer
        const detectedAction = recognizer.processFrame(state.posture!);
        if (detectedAction) {
             const actionEvent: UserAction = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
                label: detectedAction,
                type: 'POINT',
                metadata: { source: 'DTW_RECOGNIZER' }
             };
             state.actions.push(actionEvent);
             if (state.actions.length > 50) state.actions.shift();
             io.emit('project_event', { project: 'actions', data: actionEvent });
        }
    }
    if (project === 'heart') {
        const prevMotion = state.heart?.motion_state;
        const newMotion = (data as any).motion_state;
        
        state.heart = data;

        // Auto-detect Walking Breaks
        detectWalkingBreak(prevMotion, newMotion);
    }
    if (project === 'muse') state.muse = data;
    if (project === 'story') state.story = data;
    if (project === 'environment') state.environment = data;
    if (project === 'chair') state.chair = data;
    if (project === 'desk') state.desk = data;
    if (project === 'baseline') state.baseline = data;
    if (project === 'subjective') {
        state.subjective = data;
        persistSubjectiveLog(data);
    }

    // Capture telemetry if a session is active and stream is selected
    if (activeCapture && activeCapture.streams.includes(project as string)) {
        persistTelemetrySample(activeCapture.id, activeCapture.label, project, data);
    }

    // Broadcast to dashboard
    socket.broadcast.emit('dashboard_update', payload);

    // Periodically run interventions (could be throttled)
    runInterventions();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { app, server, io, state };

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Human-Vector-Biome Hub running on port ${PORT}`);
  });
}
