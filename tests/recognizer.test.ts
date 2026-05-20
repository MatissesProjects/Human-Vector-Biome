import { describe, it, expect, vi, beforeEach } from 'vitest';
import { euclideanDist3D, extractFeatures, ActionRecognizer } from '../src/recognizer.js';
import type { PostureTelemetry, Vector3 } from '../src/types.js';
import fs from 'fs';
import path from 'path';

vi.mock('fs');

describe('Recognizer Utilities', () => {
  describe('euclideanDist3D', () => {
    it('should calculate the distance between two points correctly', () => {
      const p1: Vector3 = { x: 0, y: 0, z: 0 };
      const p2: Vector3 = { x: 3, y: 4, z: 0 };
      expect(euclideanDist3D(p1, p2)).toBe(5);
    });

    it('should handle negative coordinates', () => {
      const p1: Vector3 = { x: -1, y: -1, z: -1 };
      const p2: Vector3 = { x: 1, y: 1, z: 1 };
      // sqrt(2^2 + 2^2 + 2^2) = sqrt(4+4+4) = sqrt(12)
      expect(euclideanDist3D(p1, p2)).toBeCloseTo(Math.sqrt(12));
    });
  });

  describe('extractFeatures', () => {
    it('should extract features from a pose record', () => {
      const pose: Record<string, Vector3> = {
        nose: { x: 0, y: 0, z: 0 },
        right_shoulder: { x: 1, y: 0, z: 0 },
        left_shoulder: { x: -1, y: 0, z: 0 },
        right_elbow: { x: 2, y: 0, z: 0 },
        left_elbow: { x: -2, y: 0, z: 0 },
      };
      const features = extractFeatures(pose);
      expect(features).toEqual([1, 1, 2, 2]);
    });

    it('should handle missing landmarks by returning 0', () => {
      const pose: Record<string, Vector3> = {
        nose: { x: 0, y: 0, z: 0 },
      };
      const features = extractFeatures(pose);
      expect(features).toEqual([0, 0, 0, 0]);
    });
  });
});

describe('ActionRecognizer', () => {
  let recognizer: ActionRecognizer;

  beforeEach(() => {
    vi.resetAllMocks();
    // Mock fs.existsSync to return false by default to avoid loading real files
    (vi.mocked(fs.existsSync) as any).mockReturnValue(false);
    recognizer = new ActionRecognizer();
  });

  it('should initialize with empty templates if no log file exists', () => {
    expect(recognizer.templates).toEqual([]);
  });

  it('should load templates from capture_samples.jsonl if it exists', () => {
    (vi.mocked(fs.existsSync) as any).mockReturnValue(true);
    
    const entry = JSON.stringify({
      actionId: '1',
      label: 'Wave',
      project: 'posture',
      data: {
        pose: {
          nose: { x: 0, y: 0, z: 0 },
          right_shoulder: { x: 1, y: 0, z: 0 },
          left_shoulder: { x: -1, y: 0, z: 0 },
          right_elbow: { x: 2, y: 0, z: 0 },
          left_elbow: { x: -2, y: 0, z: 0 },
        }
      }
    });

    const manyLines = Array(10).fill(entry).join('\n') + '\n';
    (vi.mocked(fs.readFileSync) as any).mockReturnValue(manyLines);
    
    recognizer.loadTemplates();
    expect(recognizer.templates.length).toBe(1);
    expect(recognizer.templates[0].label).toBe('Wave');
    expect(recognizer.templates[0].features.length).toBe(10);
  });

  it('should detect an action when buffer matches a template', () => {
    // Setup a template
    recognizer.templates = [{
        id: '1',
        label: 'Test Action',
        features: Array(10).fill([1, 1, 1, 1])
    }];

    // Feed frames that match the template
    for (let i = 0; i < 9; i++) {
        const result = recognizer.processFrame({
            timestamp: '',
            pose: {
                nose: { x: 0, y: 0, z: 0 },
                right_shoulder: { x: 1, y: 0, z: 0 },
                left_shoulder: { x: -1, y: 0, z: 0 },
                right_elbow: { x: 1, y: 0, z: 0 },
                left_elbow: { x: -1, y: 0, z: 0 },
            },
            analysis: { score: 100, slouch_detected: false }
        });
        expect(result).toBeNull();
    }

    // 10th frame should trigger detection
    const result = recognizer.processFrame({
        timestamp: '',
        pose: {
            nose: { x: 0, y: 0, z: 0 },
            right_shoulder: { x: 1, y: 0, z: 0 },
            left_shoulder: { x: -1, y: 0, z: 0 },
            right_elbow: { x: 1, y: 0, z: 0 },
            left_elbow: { x: -1, y: 0, z: 0 },
        },
        analysis: { score: 100, slouch_detected: false }
    });
    expect(result).toBe('Test Action');
  });

  it('should respect cooldown after detecting an action', () => {
    recognizer.templates = [{
        id: '1',
        label: 'Test Action',
        features: Array(10).fill([1, 1, 1, 1])
    }];

    // Trigger detection
    for (let i = 0; i < 10; i++) {
        recognizer.processFrame({
            timestamp: '',
            pose: {
                nose: { x: 0, y: 0, z: 0 },
                right_shoulder: { x: 1, y: 0, z: 0 },
                left_shoulder: { x: -1, y: 0, z: 0 },
                right_elbow: { x: 1, y: 0, z: 0 },
                left_elbow: { x: -1, y: 0, z: 0 },
            },
            analysis: { score: 100, slouch_detected: false }
        });
    }

    // Next frame should be null due to cooldown
    const result = recognizer.processFrame({
        timestamp: '',
        pose: {
            nose: { x: 0, y: 0, z: 0 },
            right_shoulder: { x: 1, y: 0, z: 0 },
            left_shoulder: { x: -1, y: 0, z: 0 },
            right_elbow: { x: 1, y: 0, z: 0 },
            left_elbow: { x: -1, y: 0, z: 0 },
        },
        analysis: { score: 100, slouch_detected: false }
    });
    expect(result).toBeNull();
    expect(recognizer.cooldown).toBeGreaterThan(0);
  });
});
