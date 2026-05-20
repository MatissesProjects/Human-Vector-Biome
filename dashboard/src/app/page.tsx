"use client";

import { useState } from "react";
import { useBiome } from "@/context/BiomeContext";
import { Activity, Brain, User, BookOpen, AlertCircle, AlertTriangle, Tag, Dumbbell, Cloud, Moon, Smile, Frown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonView from "@/components/SkeletonView";
import ActionCapture from "@/components/ActionCapture";
import Sparkline from "@/components/Sparkline";
import PulseOrb from "@/components/PulseOrb";
import NextBestAction from "@/components/NextBestAction";
import SubjectiveLogForm from "@/components/SubjectiveLogForm";
import { useIsStale } from "@/hooks/useIsStale";

type Tab = 'vitals' | 'training' | 'narrative';

export default function Home() {
  const state = useBiome();
  const isMuseStale = useIsStale(state?.muse?.timestamp);
  const [activeTab, setActiveTab] = useState<Tab>('vitals');
  const [forceShowForm, setForceShowForm] = useState(false);

  if (!state) return <div className="min-h-screen flex items-center justify-center text-zinc-500">Initializing Biome Hub...</div>;

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <header className="mb-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            OMNI-HEALTH DASHBOARD
          </h1>
          <p className="text-gray-400 mt-1">Human-Vector-Biome Central Command</p>
        </div>
      </header>

      <NextBestAction 
        stressIndex={isMuseStale ? null : state.muse?.stress_index} 
        subjective={state.subjective}
        baseline={state.baseline}
      />

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-zinc-800 pb-px overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('vitals')}
          className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'vitals' ? 'bg-zinc-800/80 text-white border-t border-x border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
        >
          <Activity size={16} className={activeTab === 'vitals' ? 'text-blue-400' : ''} />
          Bio-Vitals
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'training' ? 'bg-zinc-800/80 text-white border-t border-x border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
        >
          <Dumbbell size={16} className={activeTab === 'training' ? 'text-yellow-400' : ''} />
          Action Training
        </button>
        <button
          onClick={() => setActiveTab('narrative')}
          className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'narrative' ? 'bg-zinc-800/80 text-white border-t border-x border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
        >
          <BookOpen size={16} className={activeTab === 'narrative' ? 'text-emerald-400' : ''} />
          Narrative Sync
        </button>
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'vitals' && (
            <motion.div
              key="vitals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Muse Brainwaves */}
              <section className={`bg-zinc-900/50 border p-6 rounded-2xl flex flex-col transition-colors duration-500 ${isMuseStale ? 'border-zinc-800/50 opacity-70' : 'border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Brain className={isMuseStale ? "text-zinc-600" : "text-purple-500"} />
                    <h2 className="text-xl font-semibold">Muse Feedback</h2>
                  </div>
                  {isMuseStale && (
                    <span className="text-[10px] uppercase tracking-widest bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Offline / Charging
                    </span>
                  )}
                </div>
                
                {isMuseStale ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-8 border border-dashed border-zinc-800 rounded-xl bg-black/20">
                        <Brain size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Headband disconnected.</p>
                        <p className="text-xs mt-1">Waiting for telemetry stream...</p>
                    </div>
                ) : (
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
                )}
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

              {/* Posture Sense */}
              <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <User className="text-blue-500" />
                  <h2 className="text-xl font-semibold">Posture Sense</h2>
                </div>
                <div className="h-48 mb-4 flex-1">
                   <SkeletonView data={state.posture} />
                </div>
                {state.posture ? (
                    <div className="text-center bg-zinc-800/30 p-4 rounded-xl">
                      <p className={`text-3xl font-bold ${state.posture.analysis.score > 80 ? 'text-green-400' : 'text-orange-400'}`}>
                        {state.posture.analysis.score}%
                      </p>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Posture Score</p>
                      <p className="text-sm text-zinc-300 mt-2 italic">{state.posture.analysis.feedback}</p>
                    </div>
                ) : <p className="text-xs text-center italic text-zinc-600">Waiting for telemetry...</p>}
              </section>

              {/* Environment */}
              <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <Cloud className="text-cyan-500" />
                  <h2 className="text-xl font-semibold">Environment</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">CO2</p>
                    <p className={`text-3xl font-mono ${state.environment && state.environment.co2 > 1000 ? 'text-red-400' : 'text-cyan-400'}`}>
                      {state.environment?.co2 || "--"} <span className="text-xs">ppm</span>
                    </p>
                  </div>
                  <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Room Temp</p>
                    <p className="text-3xl font-mono">{state.environment?.temperature?.toFixed(1) || "--"} <span className="text-xs">°C</span></p>
                  </div>
                  <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Humidity</p>
                    <p className="text-3xl font-mono">{state.environment?.humidity?.toFixed(1) || "--"} <span className="text-xs">%</span></p>
                  </div>
                  {state.weather ? (
                    <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Outside</p>
                      <p className="text-3xl font-mono">{state.weather.temperature} <span className="text-xs">°C</span></p>
                      <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">{state.weather.location}</p>
                    </div>
                  ) : (
                    <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center opacity-50">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Weather</p>
                      <p className="text-sm font-mono italic">Loading...</p>
                    </div>
                  )}
                </div>
                {(state.chair || state.desk) && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {(state.chair && state.desk?.state !== 'STANDING') && (
                      <div className="bg-zinc-800/30 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2 text-center">Chair Pressure</p>
                        <div className="flex justify-between items-center px-2">
                          <span className="text-xs text-zinc-400">L: {state.chair.left_pressure.toFixed(0)}</span>
                          <span className="text-xs text-zinc-400">R: {state.chair.right_pressure.toFixed(0)}</span>
                        </div>
                      </div>
                    )}
                    {state.desk && (
                      <div className={`bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center ${state.desk.state === 'STANDING' ? 'col-span-2' : ''}`}>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1 text-center">Desk State</p>
                        <p className="text-sm font-bold text-white uppercase tracking-wider">{state.desk.state}</p>
                        <p className="text-[10px] text-zinc-500">{state.desk.height_cm.toFixed(1)} cm</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Daily Baseline */}
              {state.baseline && (
                <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-3 mb-4">
                    <Moon className="text-indigo-400" />
                    <h2 className="text-xl font-semibold">Daily Baseline</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Readiness</p>
                      <p className={`text-3xl font-bold ${state.baseline.readiness_score > 70 ? 'text-green-400' : 'text-orange-400'}`}>
                        {state.baseline.readiness_score}
                      </p>
                    </div>
                    <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Avg Heart Rate</p>
                      <p className="text-3xl font-mono">{state.baseline.overnight_avg_hr} <span className="text-xs">BPM</span></p>
                    </div>
                    <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Sleep Score</p>
                      <p className="text-3xl font-mono">{state.baseline.sleep_score}</p>
                    </div>
                    <div className="bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">SpO2</p>
                      <p className="text-3xl font-mono">{state.baseline.overnight_avg_spo2} <span className="text-xs">%</span></p>
                    </div>
                    <div className={`bg-zinc-800/30 p-4 rounded-xl flex flex-col justify-center items-center ${!state.baseline.muse_calibration_completed ? 'border border-yellow-500/50' : ''}`}>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2 text-center">Muse Focus</p>
                      {state.baseline.muse_calibration_completed ? (
                        <p className="text-3xl font-mono text-purple-400">{state.baseline.muse_baseline_stress?.toFixed(2)}</p>
                      ) : (
                        <p className="text-xs font-bold text-yellow-500 text-center uppercase tracking-wider animate-pulse pt-2">Needs Calibration</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Subjective Log Form or Summary */}
              {(!state.subjective || forceShowForm) ? (
                <section className="col-span-1 md:col-span-2 lg:col-span-3">
                  <SubjectiveLogForm />
                  {state.subjective && (
                    <button
                      onClick={() => setForceShowForm(false)}
                      className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline font-medium block mx-auto transition-colors"
                    >
                      Cancel and show logged metrics
                    </button>
                  )}
                </section>
              ) : (
                <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col col-span-1 md:col-span-2 lg:col-span-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        {state.subjective.woke_up_feeling_alright ? (
                          <Smile className="text-green-400" size={18} />
                        ) : (
                          <Frown className="text-orange-400" size={18} />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Morning Subjective Baseline</h2>
                        <p className="text-xs text-zinc-500">Logged at {new Date(state.subjective.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setForceShowForm(true)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-zinc-700/50"
                    >
                      Re-log Baseline
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Morning Wellness</p>
                      <span className={`text-base font-bold flex items-center gap-1.5 ${state.subjective.woke_up_feeling_alright ? 'text-green-400' : 'text-orange-400'}`}>
                        {state.subjective.woke_up_feeling_alright ? 'Alright' : 'Unwell'}
                      </span>
                    </div>

                    <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Night Wakeups</p>
                      <span className="text-base font-bold text-white flex items-center gap-1.5">
                        <Moon size={16} className="text-purple-400 font-bold" />
                        {state.subjective.wakeups_during_night} {state.subjective.wakeups_during_night === 1 ? 'disruption' : 'disruptions'}
                      </span>
                    </div>

                    <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Pain Severity</p>
                      <span className={`text-base font-bold capitalize flex items-center gap-1.5 ${
                        state.subjective.pain === 'none' ? 'text-zinc-400' : 
                        state.subjective.pain === 'mild' ? 'text-yellow-400' : 
                        state.subjective.pain === 'moderate' ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        <AlertCircle size={16} />
                        {state.subjective.pain}
                        {state.subjective.pain_location && <span className="text-xs text-zinc-500">({state.subjective.pain_location})</span>}
                      </span>
                    </div>

                    <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Nausea / Vomit</p>
                      <span className={`text-base font-bold flex items-center gap-1.5 ${state.subjective.vomit ? 'text-red-400' : 'text-green-400'}`}>
                        {state.subjective.vomit ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-center items-center text-center col-span-2">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Bowel Status</p>
                      <span className="text-sm font-semibold capitalize text-zinc-200">{state.subjective.bowel}</span>
                    </div>

                    <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-center items-center text-center col-span-2">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Urine Status</p>
                      <span className="text-sm font-semibold capitalize text-zinc-200">{state.subjective.urine}</span>
                    </div>

                    {state.subjective.feeling_duration && (
                      <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-center items-center text-center col-span-2">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Feeling Duration</p>
                        <span className="text-sm font-semibold capitalize text-indigo-400">
                          {state.subjective.feeling_duration === 'quick' ? 'Resolved quickly (<30m)' :
                           state.subjective.feeling_duration === 'few_hours' ? 'A few hours (1-2h)' :
                           state.subjective.feeling_duration === 'half_day' ? 'Half day' : 'All day'}
                        </span>
                      </div>
                    )}

                    <div className={`bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-center items-center text-center ${state.subjective.feeling_duration ? 'col-span-2' : 'col-span-4'}`}>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Psyllium Husk</p>
                      <span className={`text-sm font-bold flex items-center gap-1.5 ${state.subjective.took_psyllium_husk ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {state.subjective.took_psyllium_husk ? '🌾 Yes (Schedule Shifted +2h)' : 'No'}
                      </span>
                    </div>

                    {state.subjective.notes && (
                      <div className="col-span-full bg-zinc-800/10 border border-zinc-800/30 p-3 rounded-lg text-xs text-zinc-400 mt-2">
                        <span className="font-bold text-zinc-500 block mb-1">LOG NOTES</span>
                        "{state.subjective.notes}"
                      </div>
                    )}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {activeTab === 'training' && (
            <motion.div
              key="training"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Action Capture */}
              <div className="h-full">
                <ActionCapture />
              </div>

              {/* Alerts & Events */}
              <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl max-h-[500px] overflow-hidden flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-orange-500" />
                  <h2 className="text-xl font-semibold">Timeline</h2>
                </div>
                <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                  {state.actions.map((action, i) => (
                    <div key={action.id || i} className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex justify-between items-center group hover:bg-yellow-500/20 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-yellow-400 mb-1 text-xs uppercase tracking-wider">{action.type}</span>
                        <span className="text-sm text-white">{action.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono bg-black/30 px-2 py-1 rounded">{new Date(action.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {state.subjective?.took_psyllium_husk && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle size={12} /> Schedule Shifted
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono bg-black/30 px-2 py-1 rounded">Shifted +2h</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">Psyllium Husk Interaction Active</span>
                      <span className="text-xs text-zinc-400 font-medium">Scheduled pills delayed by 2 hours to avoid binding conflicts.</span>
                    </div>
                  )}
                  {state.lastPillEvent && (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-orange-400 text-xs uppercase tracking-wider">{state.lastPillEvent.type}</span>
                        <span className="text-[10px] text-zinc-500 font-mono bg-black/30 px-2 py-1 rounded">{new Date(state.lastPillEvent.timestamp || Date.now()).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-sm font-semibold">{state.lastPillEvent.pill_name}</span>
                      <span className="text-xs text-zinc-400">{state.lastPillEvent.details}</span>
                    </div>
                  )}
                  {state.actions.length === 0 && !state.lastPillEvent && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 opacity-50 py-12">
                      <Tag size={32} />
                      <p className="text-sm">No actions recorded yet.</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'narrative' && (
            <motion.div
              key="narrative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl"
            >
              {/* Story Generator */}
              <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col min-h-[400px]">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="text-emerald-500" />
                  <h2 className="text-xl font-semibold">Story Generator</h2>
                </div>
                
                {state.story ? (
                  <div className="flex-1 flex flex-col bg-black/40 p-6 rounded-xl border border-zinc-800">
                    <div className="flex justify-between items-start mb-6 border-b border-zinc-800 pb-4">
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">Current Atmosphere</p>
                        <p className="text-emerald-400 font-medium text-lg">{state.story.current_atmosphere}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">Active NPC</p>
                        <p className="text-zinc-300 font-medium">{state.story.active_npc}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center text-center px-4">
                      <p className="text-2xl md:text-3xl leading-relaxed italic text-zinc-200 font-serif">
                        "{state.story.world_event}"
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-zinc-800">
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-emerald-600 h-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(state.story.narrative_tension || 0) * 10}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 text-center mt-2 uppercase tracking-widest">Narrative Tension</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 bg-black/20 rounded-xl border border-dashed border-zinc-800">
                    <BookOpen size={48} className="mb-4 opacity-20" />
                    <p className="italic">No active narrative session...</p>
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}