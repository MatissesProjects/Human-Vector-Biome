import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to Biome Hub as Mock Client');

  // 1. Simulate Muse Brainwaves (Increasing Stress)
  setInterval(() => {
    const stress = Math.random() * 0.4 + 0.5; // Oscillate around 0.5 - 0.9
    console.log(`[Mock Muse] Sending stress_index: ${stress.toFixed(2)}`);
    socket.emit('telemetry', {
      project: 'muse',
      data: {
        timestamp: new Date().toISOString(),
        alpha: 0.2,
        beta: stress,
        delta: 0.1,
        gamma: 0.05,
        theta: 0.15,
        concentration_level: 0.6,
        stress_index: stress
      }
    });
  }, 2000);

  // 2. Simulate Posture (Bad Posture)
  setInterval(() => {
    const score = Math.floor(Math.random() * 5) + 5; // 5-10 score
    console.log(`[Mock Posture] Sending score: ${score}`);
    socket.emit('telemetry', {
      project: 'posture',
      data: {
        timestamp: new Date().toISOString(),
        posture_score: score,
        skeletal_coords: { neck: { x: 0, y: 1.2, z: -0.5 } },
        fatigue_index: 0.3,
        alerts: score > 7 ? ['SLOUCH_DETECTED'] : []
      }
    });
  }, 3000);
});

socket.on('intervention', (data) => {
  console.log('!!! [INTERVENTION RECEIVED] !!!');
  console.log(`Target: ${data.target}`);
  console.log(`Type: ${data.type}`);
  console.log(`Message: ${data.message}`);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Hub');
});
