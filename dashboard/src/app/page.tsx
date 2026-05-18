"use client";

import { useBiome } from "@/context/BiomeContext";
import { Activity, Brain, User, BookOpen, AlertCircle, Tag } from "lucide-react";
import { motion } from "framer-motion";
import SkeletonView from "@/components/SkeletonView";
import ActionCapture from "@/components/ActionCapture";
import Sparkline from "@/components/Sparkline";
import PulseOrb from "@/components/PulseOrb";
import NextBestAction from "@/components/NextBestAction";

export default function Home() {
  const state = useBiome();

  if (!state) return <div>Initializing Biome Hub...</div>;

  return (
    <main className="min-h-screen p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <header className="col-span-full mb-4">
        <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          OMNI-HEALTH DASHBOARD
        </h1>
        <p className="text-gray-400">Human-Vector-Biome Central Command</p>
      </header>

      <NextBestAction stressIndex={state.muse?.stress_index} />

      {/* Muse Brainwaves */}
      <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="text-purple-500" />
          <h2 className="text-xl font-semibold">Muse Feedback</h2>
        </div>
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Stress Index</span>
            <span className={`font-mono text-xl ${state.muse?.stress_index && state.muse.stress_index > 0.7 ? 'text-red-500' : 'text-green-500'}`}>
              {state.muse?.stress_index.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
            <motion.div 
              className="bg-purple-600 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${(state.muse?.stress_index || 0) * 100}%` }}
            />
          </div>
          <div className="h-24 w-full bg-zinc-800/30 rounded-xl mt-4">
            <Sparkline data={state.history.stressIndex} color="#a855f7" />
          </div>
        </div>
      </section>

      {/* Posture Sense */}
      <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-blue-500" />
          <h2 className="text-xl font-semibold">Posture Sense</h2>
        </div>
        <div className="h-64 mb-4">
           <SkeletonView data={state.posture} />
        </div>
        {state.posture ? (
            <div className="text-center">
              <p className={`text-3xl font-bold ${state.posture.analysis.score > 80 ? 'text-green-400' : 'text-orange-400'}`}>
                {state.posture.analysis.score}%
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Posture Score</p>
              <p className="text-sm text-zinc-300 mt-2 italic">{state.posture.analysis.feedback}</p>
            </div>
        ) : <p className="text-xs text-center italic text-zinc-600">Waiting for telemetry...</p>}
      </section>

      {/* Heart Sense */}
      <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="text-red-500" />
          <h2 className="text-xl font-semibold">Heart Sense</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
          <div className="bg-zinc-800/30 p-4 rounded-xl flex items-center justify-center">
            <PulseOrb heartRate={state.heart?.heart_rate} />
          </div>
          <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
            <p className="text-xs text-gray-500 uppercase font-bold mb-2">HRV</p>
            <p className="text-4xl font-mono">{state.heart?.hrv || "--"}</p>
          </div>
        </div>
        <div className="h-24 w-full bg-zinc-800/30 rounded-xl mt-auto">
          <Sparkline data={state.history.heartRate} color="#ef4444" />
        </div>
      </section>

      {/* Action Capture */}
      <ActionCapture />

      {/* Story Generator */}
      <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-emerald-500" />
          <h2 className="text-xl font-semibold">Story Generator</h2>
        </div>
        <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 h-32 overflow-y-auto">
          {state.story ? (
            <div>
              <p className="text-emerald-400 font-bold uppercase text-xs tracking-widest">{state.story.current_atmosphere}</p>
              <p className="text-lg mt-1 italic">"{state.story.world_event}"</p>
              <p className="text-sm text-gray-500 mt-2">— Active NPC: {state.story.active_npc}</p>
            </div>
          ) : <p className="text-zinc-600 italic">No active narrative session...</p>}
        </div>
      </section>

      {/* Alerts & Events */}
      <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl max-h-[400px] overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-orange-500" />
          <h2 className="text-xl font-semibold">Timeline</h2>
        </div>
        <div className="space-y-2 overflow-y-auto pr-2 flex-1">
          {state.actions.map((action, i) => (
            <div key={action.id || i} className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm flex justify-between items-center">
              <div>
                <span className="font-bold text-yellow-400">[{action.type}]</span> {action.label}
              </div>
              <span className="text-[10px] text-zinc-500">{new Date(action.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
          {state.lastPillEvent && (
            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg text-sm">
              <span className="font-bold text-orange-400">[{state.lastPillEvent.type}]</span> {state.lastPillEvent.pill_name}: {state.lastPillEvent.details}
            </div>
          )}
          <p className="text-xs text-zinc-600 text-center py-4">Live event stream active...</p>
        </div>
      </section>
    </main>
  );
}
