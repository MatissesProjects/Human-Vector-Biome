"use client";

import { useState } from 'react';
import { Tag, Play, Square, CheckSquare, Square as SquareOutline } from 'lucide-react';

type Stream = 'posture' | 'heart' | 'muse';

export default function ActionCapture() {
  const [label, setLabel] = useState('Drinking Water');
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedStreams, setSelectedStreams] = useState<Stream[]>(['posture']);

  const toggleStream = (stream: Stream) => {
    setSelectedStreams(prev => 
      prev.includes(stream) 
        ? prev.filter(s => s !== stream)
        : [...prev, stream]
    );
  };

  const handleAction = async (type: 'START' | 'STOP' | 'POINT') => {
    if (type === 'START') setIsCapturing(true);
    if (type === 'STOP') setIsCapturing(false);

    try {
      const response = await fetch('http://localhost:3000/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, type, streams: selectedStreams })
      });
      if (!response.ok) throw new Error('Failed to log action');
    } catch (err) {
      console.error('Error logging action:', err);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Tag className="text-yellow-500" />
        <h2 className="text-xl font-semibold">Action Capture</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Label for Training</label>
          <input 
            type="text" 
            value={label} 
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 text-white"
            placeholder="Action label (e.g., Drinking Water)"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Target Streams</label>
          <div className="flex gap-4">
            {(['posture', 'heart', 'muse'] as Stream[]).map(stream => (
              <label key={stream} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input 
                  type="checkbox" 
                  checked={selectedStreams.includes(stream)}
                  onChange={() => toggleStream(stream)}
                  className="hidden"
                />
                {selectedStreams.includes(stream) ? <CheckSquare size={16} className="text-yellow-500" /> : <SquareOutline size={16} className="text-zinc-600" />}
                <span className="capitalize">{stream}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isCapturing ? (
            <button 
              onClick={() => handleAction('START')}
              className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              disabled={selectedStreams.length === 0}
            >
              <Play size={16} fill="black" /> Start Capture
            </button>
          ) : (
            <button 
              onClick={() => handleAction('STOP')}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Square size={16} fill="white" /> Stop Capture
            </button>
          )}
          <button 
             onClick={() => handleAction('POINT')}
             className="px-4 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-xs transition-colors"
          >
            Instant Log
          </button>
        </div>
        
        <p className="text-[10px] text-zinc-500 text-center italic">
          Captures current biometric state snapshot for ML dataset.
        </p>
      </div>
    </div>
  );
}
