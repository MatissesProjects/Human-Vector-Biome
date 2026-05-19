import express from 'express';
import type { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import type { BiomeState, ProjectType, UserAction, TelemetryPayload, WeatherTelemetry } from './types.js';
import { ActionRecognizer } from './recognizer.js';

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
  baseline: null
};

let activeCapture: { id: string, label: string, streams: string[] } | null = null;

/**
 * Fetch Local Weather
 */
async function fetchLocalWeather() {
  try {
    // Example using Open-Meteo (no API key required) for a default location (e.g. SF or local)
    const lat = 37.7749;
    const lon = -122.4194;
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

// Initial fetch and interval (every 15 mins)
fetchLocalWeather();
setInterval(fetchLocalWeather, 15 * 60 * 1000);


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
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
  console.log(`[Persistence] Logged action: ${action.label} (${action.type})`);
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
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
}

/**
 * Intervention Brain
 * Logic that coordinates between projects
 */
function runInterventions() {
  // Determine stress threshold based on daily readiness baseline
  let baseStressThreshold = 0.8;
  if (state.baseline) {
    if (state.baseline.readiness_score < 60) baseStressThreshold -= 0.1;
    if (state.baseline.muse_calibration_completed && state.baseline.muse_baseline_stress) {
       // If their morning baseline is already known, trigger sooner if it spikes by 0.25
       baseStressThreshold = Math.min(baseStressThreshold, state.baseline.muse_baseline_stress + 0.25);
    }
  }

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
  if (state.posture && state.posture.analysis.score < 40) { // Using a score threshold (adjusted for logic)
     console.log('[Intervention] Bad Posture detected. Sending Haptic Alert to Watch.');
     io.emit('intervention', {
       target: 'heart',
       type: 'HAPTIC_TAP',
       message: 'Straighten your back.'
     });
  }

  // 3. Environment -> Open Window
  if (state.environment && state.environment.co2 > 1000) {
    console.log('[Intervention] High CO2 detected. Sending Alert.');
    io.emit('intervention', {
      target: 'dashboard',
      type: 'ENVIRONMENT_WARNING',
      message: 'CO2 levels are high (>1000ppm). Please open a window to improve focus and air quality.'
    });
  }
}

// REST Endpoints for low-frequency data
app.post('/api/events/:project', (req: Request, res: Response) => {
  const { project } = req.params as { project: ProjectType };
  const eventData = req.body;
  
  console.log(`[REST] Received event from ${project}:`, eventData);
  
  // Update state for event-driven projects
  if (project === 'story') state.story = eventData;
  if (project === 'pills') state.lastPillEvent = eventData;

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

// WebSocket connection for high-frequency data
io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  socket.on('telemetry', (payload: TelemetryPayload) => {
    const { project, data } = payload;
    
    // Update local state
    if (project === 'posture') {
        state.posture = data;

        
        // Feed frame to recognizer
        const detectedAction = recognizer.processFrame(data);
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
    if (project === 'heart') state.heart = data;
    if (project === 'muse') state.muse = data;
    if (project === 'story') state.story = data;
    if (project === 'environment') state.environment = data;
    if (project === 'chair') state.chair = data;
    if (project === 'desk') state.desk = data;
    if (project === 'baseline') state.baseline = data;

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

server.listen(PORT, () => {
  console.log(`Human-Vector-Biome Hub running on port ${PORT}`);
});
