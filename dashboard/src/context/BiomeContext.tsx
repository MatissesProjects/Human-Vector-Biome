"use client";

import { useEffect, useState, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { BiomeState, TelemetryPayload, HeartBiometrics, MuseBrainwaves } from '../../../src/types';
import { toast } from 'sonner';

export type DashboardState = BiomeState & {
  history: {
    heartRate: { time: string; value: number }[];
    stressIndex: { time: string; value: number }[];
  }
};

const BiomeContext = createContext<DashboardState | null>(null);

export const BiomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<DashboardState>({
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
    history: {
      heartRate: [],
      stressIndex: []
    }
  });

  useEffect(() => {
    const socket = io('http://localhost:3000');

    const updateState = (payload: TelemetryPayload) => {
      setState((prev) => {
        const next = { ...prev, [payload.project]: payload.data };
        
        let newHistory = prev.history;
        const now = new Date().toLocaleTimeString();

        if (payload.project === 'heart') {
            const hr = (payload.data as HeartBiometrics).heart_rate;
            if (hr) {
                newHistory = {
                   ...newHistory,
                   heartRate: [...newHistory.heartRate, { time: now, value: hr }].slice(-30)
                };
            }
        }
        if (payload.project === 'muse') {
            const stress = (payload.data as MuseBrainwaves).stress_index;
            if (stress !== undefined) {
                newHistory = {
                   ...newHistory,
                   stressIndex: [...newHistory.stressIndex, { time: now, value: stress }].slice(-30)
                };
            }
        }

        return { ...next, history: newHistory };
      });
    };

    // Listen for both event types
    socket.on('dashboard_update', updateState);
    socket.on('telemetry', updateState);

    socket.on('project_event', (payload) => {
        if (payload.project === 'pills') {
            setState(prev => ({ ...prev, lastPillEvent: payload }));
        }
        if (payload.project === 'story') {
            setState(prev => ({ ...prev, story: payload }));
        }
        if (payload.project === 'actions') {
            setState(prev => ({
                ...prev,
                actions: [payload.data, ...prev.actions].slice(0, 10)
            }));
        }
    });

    socket.on('intervention', (payload) => {
        // payload: { target, type, message }
        const formattedType = payload.type.replace(/_/g, ' ');
        toast.warning(`Intervention: ${formattedType}`, {
            description: payload.message,
            duration: 8000,
        });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BiomeContext.Provider value={state}>
      {children}
    </BiomeContext.Provider>
  );
};

export const useBiome = () => useContext(BiomeContext);
