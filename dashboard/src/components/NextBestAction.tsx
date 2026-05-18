"use client";

import { useState } from "react";
import { Wind, X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NextBestAction({ stressIndex }: { stressIndex?: number | null }) {
  const [dismissed, setDismissed] = useState(false);
  const isStressed = stressIndex && stressIndex > 0.8;

  if (!isStressed || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="col-span-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md relative"
      >
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-zinc-400 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Wind className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-200">High Stress Detected</h3>
            <p className="text-sm text-zinc-300">Your resilience score is dropping. Would you like to switch to Calm Mode?</p>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all">
            <Play size={18} fill="currentColor" /> Start Box Breathing
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
