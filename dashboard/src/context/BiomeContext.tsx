"use client";

import { useEffect, useState, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { BiomeState } from '../../src/types';

const BiomeContext = createContext<BiomeState | null>(null);

export const BiomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<BiomeState>({
    posture: null,
    heart: null,
    muse: null,
    story: null,
    lastPillEvent: null,
  });

  useEffect(() => {
    const socket = io('http://localhost:3000');

    const updateState = (payload: any) => {
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
