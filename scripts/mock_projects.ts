import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to Biome Hub as Mock Client');

  // Send a simulated daily baseline on connection
  socket.emit('telemetry', {
    project: 'baseline',
    data: {
      timestamp: new Date().toISOString(),
      sleep_score: 82,
      deep_sleep_minutes: 90,
      rem_sleep_minutes: 110,
      light_sleep_minutes: 240,
      overnight_avg_hr: 54,
      overnight_lowest_hr: 48,
      overnight_avg_spo2: 97,
      readiness_score: 55 // Setting this artificially low (<60) to test the dynamic threshold
    }
  });

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
        analysis: {
          score: score,
          status: score > 7 ? 'SLOUCHING' : 'GOOD',
          feedback: score > 7 ? 'Sit up straight!' : 'Perfect posture.',
          nudge: 'Correct your posture'
        },
        pose: {
          nose: { x: 0, y: 1.2, z: -0.5 },
          left_shoulder: { x: -0.5, y: 1.0, z: -0.4 },
          right_shoulder: { x: 0.5, y: 1.0, z: -0.4 },
          left_elbow: { x: -0.7, y: 0.5, z: -0.3 },
          right_elbow: { x: 0.7, y: 0.5, z: -0.3 },
          left_hip: { x: -0.3, y: 0.0, z: -0.2 },
          right_hip: { x: 0.3, y: 0.0, z: -0.2 }
        }
      }
    });
  }, 3000);

  // 3. Simulate Environment
  setInterval(() => {
    // Oscillate CO2 around 900 - 1100 to occasionally trigger the intervention
    const co2 = Math.floor(Math.random() * 300) + 800; 
    console.log(`[Mock Environment] Sending CO2: ${co2}ppm`);
    socket.emit('telemetry', {
      project: 'environment',
      data: {
        timestamp: new Date().toISOString(),
        co2: co2,
        temperature: 22.5 + (Math.random() * 1.5 - 0.75),
        humidity: 45 + (Math.random() * 5 - 2.5)
      }
    });
  }, 4000);

  // 4. Simulate Chair & Desk Height
  let isStanding = false;
  setInterval(() => {
    // Randomly switch between sitting and standing height to show UI changes every few cycles
    if (Math.random() > 0.8) {
      isStanding = !isStanding;
    }
    
    const height = isStanding ? 110.0 + Math.random() * 2 : 72.0 + Math.random() * 1;
    console.log(`[Mock Desk] Sending height: ${height.toFixed(1)}cm`);
    socket.emit('telemetry', {
      project: 'desk',
      data: {
        timestamp: new Date().toISOString(),
        height_cm: height,
        state: isStanding ? 'STANDING' : 'SITTING'
      }
    }, 8000);

    if (!isStanding) {
      console.log(`[Mock Chair] Sending pressure telemetry`);
      socket.emit('telemetry', {
        project: 'chair',
        data: {
          timestamp: new Date().toISOString(),
          left_pressure: Math.random() * 20 + 30, // Example: leaning right
          right_pressure: Math.random() * 20 + 50,
          front_pressure: Math.random() * 10 + 20,
          back_pressure: Math.random() * 20 + 40
        }
      });
    } else {
      console.log(`[Mock Chair] Standing - Pressure is 0`);
      socket.emit('telemetry', {
        project: 'chair',
        data: {
          timestamp: new Date().toISOString(),
          left_pressure: 0,
          right_pressure: 0,
          front_pressure: 0,
          back_pressure: 0
        }
      });
    }
  }, 4000);
});

socket.on('intervention', (data: { target: string, type: string, message: string }) => {
  console.log('!!! [INTERVENTION RECEIVED] !!!');
  console.log(`Target: ${data.target}`);
  console.log(`Type: ${data.type}`);
  console.log(`Message: ${data.message}`);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Hub');
});
