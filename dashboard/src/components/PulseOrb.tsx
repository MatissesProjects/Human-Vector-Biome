"use client";

import { motion } from "framer-motion";

export default function PulseOrb({ heartRate }: { heartRate?: number | null }) {
  // Base duration is 1 second (60 bpm). If heart rate is 120, duration is 0.5s.
  const bpm = heartRate && heartRate > 0 ? heartRate : 60;
  const duration = 60 / bpm;

  return (
    <div className="flex items-center justify-center h-full w-full py-4">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Outer glowing halo */}
        <motion.div
          className="absolute w-full h-full rounded-full bg-red-500/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: duration, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Inner solid core */}
        <motion.div
          className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: duration, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Number overlay */}
        <span className="relative z-10 text-white font-bold text-lg font-mono">
          {heartRate || "--"}
        </span>
      </div>
    </div>
  );
}
