export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PostureTelemetry {
  timestamp: string;
  analysis: {
    score: number;
    status?: string;
    feedback?: string;
    nudge?: string;
    fatigue_index?: number;
    static_duration?: number;
  };
  pose: Record<string, Vector3>;
  workspace?: Record<string, unknown>;
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

export interface UserAction {
  id: string;
  timestamp: string;
  label: string;
  type: 'START' | 'STOP' | 'POINT';
  metadata?: Record<string, unknown>;
  stateSnapshot?: Partial<BiomeState>;
}

export interface EnvironmentTelemetry {
  timestamp: string;
  co2: number;
  temperature: number;
  humidity: number;
}

export interface ChairTelemetry {
  timestamp: string;
  left_pressure: number;
  right_pressure: number;
  front_pressure: number;
  back_pressure: number;
}

export interface DeskTelemetry {
  timestamp: string;
  height_cm: number;
  state: 'STANDING' | 'SITTING' | 'TRANSITIONING' | 'UNKNOWN';
}

export interface WeatherTelemetry {
  timestamp: string;
  temperature: number;
  condition: string;
  location: string;
}

export interface DailyBaseline {
  timestamp: string;
  sleep_score: number;
  deep_sleep_minutes: number;
  rem_sleep_minutes: number;
  light_sleep_minutes: number;
  overnight_avg_hr: number;
  overnight_lowest_hr: number;
  overnight_avg_spo2: number;
  readiness_score: number;
}

export interface BiomeState {
  posture: PostureTelemetry | null;
  heart: HeartBiometrics | null;
  muse: MuseBrainwaves | null;
  story: NarrativeState | null;
  lastPillEvent: PillEvent | null;
  actions: UserAction[];
  environment: EnvironmentTelemetry | null;
  chair: ChairTelemetry | null;
  desk: DeskTelemetry | null;
  weather: WeatherTelemetry | null;
  baseline: DailyBaseline | null;
}

export type ProjectType = 'posture' | 'heart' | 'muse' | 'story' | 'pills' | 'echo' | 'actions' | 'environment' | 'chair' | 'desk' | 'weather' | 'baseline';

export type TelemetryPayload = 
  | { project: 'posture'; data: PostureTelemetry }
  | { project: 'heart'; data: HeartBiometrics }
  | { project: 'muse'; data: MuseBrainwaves }
  | { project: 'story'; data: NarrativeState }
  | { project: 'pills'; data: PillEvent }
  | { project: 'actions'; data: UserAction }
  | { project: 'environment'; data: EnvironmentTelemetry }
  | { project: 'chair'; data: ChairTelemetry }
  | { project: 'desk'; data: DeskTelemetry }
  | { project: 'weather'; data: WeatherTelemetry }
  | { project: 'baseline'; data: DailyBaseline }
  | { project: 'echo'; data: unknown };
