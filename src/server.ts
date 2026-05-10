import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

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

// REST Endpoints for low-frequency data
app.post('/api/events/:project', (req, res) => {
  const { project } = req.params;
  const eventData = req.body;
  
  console.log(`[REST] Received event from ${project}:`, eventData);
  
  // Broadcast to all dashboard clients
  io.emit('project_event', { project, ...eventData });
  
  res.status(200).json({ status: 'success', received: true });
});

// WebSocket connection for high-frequency data
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('telemetry', (data) => {
    // Expected format: { project: string, data: any }
    console.log(`[WS] Telemetry from ${data.project}:`, data.data);
    
    // Broadcast to dashboard clients
    socket.broadcast.emit('dashboard_update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Human-Vector-Biome Hub running on port ${PORT}`);
});
