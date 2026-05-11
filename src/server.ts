import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { BiomeState, ProjectType } from './types';

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

// Centralized state
const state: BiomeState = {
  posture: null,
  heart: null,
  muse: null,
  story: null,
  lastPillEvent: null
};

/**
 * Intervention Brain
 * Logic that coordinates between projects
 */
function runInterventions() {
  // 1. Stress -> Story Relaxation Nudge
  if (state.muse && state.muse.stress_index > 0.8) {
    console.log('[Intervention] High Stress detected. Sending Story relaxation nudge.');
    io.emit('intervention', {
      target: 'story',
      type: 'RELAXATION_SUGGESTION',
      message: 'Your stress levels are climbing. Would you like to start a calming story session?'
    });
  }

  // 2. Posture -> Haptic Alert
  if (state.posture && state.posture.posture_score > 7) { // High score = bad posture in some metrics
     console.log('[Intervention] Bad Posture detected. Sending Haptic Alert to Watch.');
     io.emit('intervention', {
       target: 'heart',
       type: 'HAPTIC_TAP',
       message: 'Straighten your back.'
     });
  }
}

// REST Endpoints for low-frequency data
app.post('/api/events/:project', (req, res) => {
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

// WebSocket connection for high-frequency data
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('telemetry', (payload: { project: ProjectType, data: any }) => {
    const { project, data } = payload;
    
    // Update local state
    if (project === 'posture') state.posture = data;
    if (project === 'heart') state.heart = data;
    if (project === 'muse') state.muse = data;
    if (project === 'story') state.story = data;

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
