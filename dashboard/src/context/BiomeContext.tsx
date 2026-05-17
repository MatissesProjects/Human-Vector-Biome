"use client";

import { useEffect, useState, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { BiomeState, TelemetryPayload } from '../../../src/types';
import { toast } from 'sonner';

const BiomeContext = createContext<BiomeState | null>(null);

export const BiomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<BiomeState>({
    posture: null,
    heart: null,
    muse: null,
    story: null,
    lastPillEvent: null,
    actions: []
  });

  useEffect(() => {
    const socket = io('http://localhost:3000');

    const updateState = (payload: TelemetryPayload) => {
      setState((prev) => ({
        ...prev,
        [payload.project]: payload.data,
      }));
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
