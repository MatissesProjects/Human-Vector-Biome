export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PostureTelemetry {
  timestamp: string;
  posture_score: number; // RULA/REBA score
  skeletal_coords: Record<string, Vector3>;
  fatigue_index: number;
  alerts: string[];
}

export interface HeartBiometrics {
  timestamp: string;
  heart_rate: number;
  hrv: number;
  is_anomaly_detected: boolean;
  motion_state: 'STATIONARY' | 'WALKING' | 'RUNNING' | 'SITTING';
  spo2?: number;
}

export interface MuseBrainwaves {
  timestamp: string;
  alpha: number;
  beta: number;
  delta: number;
  gamma: number;
  theta: number;
  concentration_level: number;
  stress_index: number;
  head_motion?: { pitch: number; yaw: number; roll: number };
}

export interface NarrativeState {
  timestamp: string;
  current_atmosphere: string;
  active_npc: string;
  world_event: string;
  narrative_tension: number;
  assets?: {
    last_audio_url?: string;
    last_image_url?: string;
  };
}

export interface PillEvent {
  timestamp: string;
  type: 'TAKEN' | 'MISSED' | 'CONFLICT' | 'SHIFT';
  pill_name: string;
  details: string;
}

export interface BiomeState {
  posture: PostureTelemetry | null;
  heart: HeartBiometrics | null;
  muse: MuseBrainwaves | null;
  story: NarrativeState | null;
  lastPillEvent: PillEvent | null;
}

export type ProjectType = 'posture' | 'heart' | 'muse' | 'story' | 'pills' | 'echo';
