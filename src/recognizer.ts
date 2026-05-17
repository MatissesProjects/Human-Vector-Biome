import fs from 'fs';
import path from 'path';
import { PostureTelemetry, Vector3 } from './types.js';

export function euclideanDist3D(p1: Vector3, p2: Vector3): number {
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + 
        Math.pow(p1.y - p2.y, 2) + 
        Math.pow(p1.z - p2.z, 2)
    );
}

export function extractFeatures(pose: Record<string, Vector3>): number[] {
    // We use a few key distances as our 1D feature vector for DTW
    const nose = pose['nose'];
    const rShoulder = pose['right_shoulder'];
    const lShoulder = pose['left_shoulder'];
    const rElbow = pose['right_elbow'];
    const lElbow = pose['left_elbow'];

    return [
        nose && rShoulder ? euclideanDist3D(nose, rShoulder) : 0,
        nose && lShoulder ? euclideanDist3D(nose, lShoulder) : 0,
        nose && rElbow ? euclideanDist3D(nose, rElbow) : 0,
        nose && lElbow ? euclideanDist3D(nose, lElbow) : 0,
    ];
}

function computeDTW(seq1: number[][], seq2: number[][]): number {
    if (seq1.length === 0 || seq2.length === 0) return Infinity;
    const n = seq1.length;
    const m = seq2.length;
    
    const dtw = Array(n + 1).fill(null).map(() => Array(m + 1).fill(Infinity));
    dtw[0][0] = 0;

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const v1 = seq1[i - 1];
            const v2 = seq2[j - 1];
            const cost = Math.sqrt(v1.reduce((sum, val, k) => sum + Math.pow(val - v2[k], 2), 0));
            dtw[i][j] = cost + Math.min(
                dtw[i - 1][j],    // insertion
                dtw[i][j - 1],    // deletion
                dtw[i - 1][j - 1] // match
            );
        }
    }
    // Normalize by length path
    return dtw[n][m] / Math.max(n, m);
}

interface Template {
    id: string;
    label: string;
    features: number[][];
}

export class ActionRecognizer {
    templates: Template[] = [];
    buffer: number[][] = [];
    MAX_BUFFER_SIZE = 60; // Rolling window frame count
    THRESHOLD = 0.8; // Tunable DTW distance threshold
    cooldown = 0;

    constructor() {
        this.loadTemplates();
    }

    loadTemplates() {
        const logPath = path.join(process.cwd(), 'logs', 'capture_samples.jsonl');
        if (!fs.existsSync(logPath)) return;

        const lines = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);
        const grouped: Record<string, { label: string, frames: number[][] }> = {};

        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                if (entry.project === 'posture' && entry.data && entry.data.pose) {
                    if (!grouped[entry.actionId]) {
                        grouped[entry.actionId] = { label: entry.label, frames: [] };
                    }
                    grouped[entry.actionId].frames.push(extractFeatures(entry.data.pose));
                }
            } catch (e) {}
        }

        this.templates = Object.entries(grouped)
          .filter(([_, t]) => t.frames.length > 5) // Ignore overly short clicks
          .map(([id, t]) => ({
              id,
              label: t.label,
              features: t.frames
          }));
          
        console.log(`[Recognizer] Loaded ${this.templates.length} action templates for DTW matching.`);
    }

    processFrame(posture: PostureTelemetry): string | null {
        if (this.cooldown > 0) this.cooldown--;

        if (!posture.pose) return null;
        
        const f = extractFeatures(posture.pose);
        this.buffer.push(f);
        if (this.buffer.length > this.MAX_BUFFER_SIZE) {
            this.buffer.shift();
        }

        // Need a reasonable buffer size and no cooldown to evaluate
        if (this.buffer.length >= 10 && this.cooldown === 0 && this.templates.length > 0) {
            let bestMatch = null;
            let bestDist = Infinity;

            for (const t of this.templates) {
                // If buffer is larger than template, we might want to window it.
                // For simplicity, we just DTW the entire buffer vs the template. 
                // DTW will align them.
                const dist = computeDTW(this.buffer, t.features);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestMatch = t;
                }
            }

            if (bestMatch && bestDist < this.THRESHOLD) {
                console.log(`[Recognizer] Detected action: ${bestMatch.label} (DTW Distance: ${bestDist.toFixed(3)})`);
                this.cooldown = this.MAX_BUFFER_SIZE; // Cooldown for a full window
                return bestMatch.label;
            }
        }
        return null;
    }
}
