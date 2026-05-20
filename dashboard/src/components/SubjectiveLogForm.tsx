"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smile, Frown, Moon, AlertTriangle, Activity, 
  Check, Info, Sparkles 
} from "lucide-react";
import { SubjectiveLog } from "../../../src/types";

export default function SubjectiveLogForm() {
  const [wokeUpFeelingAlright, setWokeUpFeelingAlright] = useState<boolean>(true);
  const [wakeupsDuringNight, setWakeupsDuringNight] = useState<number>(0);
  const [pain, setPain] = useState<SubjectiveLog["pain"]>("none");
  const [painLocation, setPainLocation] = useState<string>("");
  const [vomit, setVomit] = useState<boolean>(false);
  const [bowel, setBowel] = useState<SubjectiveLog["bowel"]>("normal");
  const [urine, setUrine] = useState<SubjectiveLog["urine"]>("normal");
  const [feelingDuration, setFeelingDuration] = useState<SubjectiveLog["feeling_duration"]>("quick");
  const [tookPsylliumHusk, setTookPsylliumHusk] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const log: SubjectiveLog = {
      timestamp: new Date().toISOString(),
      woke_up_feeling_alright: wokeUpFeelingAlright,
      wakeups_during_night: wakeupsDuringNight,
      pain,
      pain_location: pain !== "none" ? painLocation : undefined,
      vomit,
      bowel,
      urine,
      feeling_duration: (!wokeUpFeelingAlright || pain !== "none" || vomit) ? feelingDuration : undefined,
      took_psyllium_husk: tookPsylliumHusk,
      notes: notes.trim() ? notes : undefined,
    };

    try {
      const response = await fetch("http://localhost:3000/api/events/subjective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });

      if (!response.ok) throw new Error("Failed to submit subjective log");
      
      toast.success("Subjective Log Saved", {
        description: "Your morning readiness baseline has been updated.",
        duration: 5000,
      });

      // Clear non-baseline values or keep defaults
      setNotes("");
      setPainLocation("");
    } catch (err) {
      console.error("Error submitting subjective log:", err);
      toast.error("Submission Failed", {
        description: "Could not sync subjective log with the Biome Hub.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementWakeups = () => setWakeupsDuringNight(prev => prev + 1);
  const decrementWakeups = () => setWakeupsDuringNight(prev => Math.max(0, prev - 1));

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="text-indigo-400" size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Subjective Readiness</h2>
            <p className="text-xs text-zinc-500">Record subjective morning baselines & health symptoms</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Woke Up Feeling Alright Toggle */}
        <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {wokeUpFeelingAlright ? (
              <Smile className="text-green-400" size={24} />
            ) : (
              <Frown className="text-orange-400" size={24} />
            )}
            <div>
              <p className="text-sm font-semibold text-zinc-200">Did you wake up feeling alright?</p>
              <p className="text-xs text-zinc-500">General systemic wellness feeling</p>
            </div>
          </div>
          <div className="flex bg-zinc-800 p-1 rounded-lg border border-zinc-700">
            <button
              type="button"
              onClick={() => setWokeUpFeelingAlright(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                wokeUpFeelingAlright 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setWokeUpFeelingAlright(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                !wokeUpFeelingAlright 
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Feeling Duration selector (only visible if any wellness issue reported) */}
        <AnimatePresence>
          {(!wokeUpFeelingAlright || pain !== "none" || vomit) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 space-y-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Info className="text-indigo-400" size={18} />
                <p className="text-sm font-semibold text-zinc-200">How long did that morning feeling last?</p>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-zinc-800 p-1 border border-zinc-700 rounded-lg">
                {([
                  { value: "quick", label: "< 30m" },
                  { value: "few_hours", label: "1-2 hrs" },
                  { value: "half_day", label: "Half Day" },
                  { value: "all_day", label: "All Day" }
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFeelingDuration(opt.value)}
                    className={`py-1.5 text-center text-xs font-semibold rounded transition-all ${
                      feelingDuration === opt.value
                        ? "bg-indigo-600 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wakeups During Night */}
        <div className="flex items-center justify-between bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30">
          <div className="flex items-center gap-3">
            <Moon className="text-purple-400" size={20} />
            <div>
              <p className="text-sm font-semibold text-zinc-200">Wakeups During Night</p>
              <p className="text-xs text-zinc-500">Number of sleep disruptions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg p-1">
            <button
              type="button"
              onClick={decrementWakeups}
              className="w-8 h-8 rounded hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              -
            </button>
            <span className="w-6 text-center font-mono text-sm text-white font-bold">{wakeupsDuringNight}</span>
            <button
              type="button"
              onClick={incrementWakeups}
              className="w-8 h-8 rounded hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Pain & Vomit Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pain Selector */}
          <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={pain !== "none" ? "text-red-400" : "text-zinc-500"} size={18} />
              <label className="text-sm font-semibold text-zinc-200">Pain Level</label>
            </div>
            <div className="grid grid-cols-4 gap-1 bg-zinc-800 p-1 border border-zinc-700 rounded-lg">
              {(["none", "mild", "moderate", "severe"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPain(level)}
                  className={`py-1.5 text-center text-xs font-semibold rounded capitalize transition-all ${
                    pain === level
                      ? level === "none"
                        ? "bg-zinc-700 text-white"
                        : level === "mild"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : level === "moderate"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {pain !== "none" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Pain Location</label>
                  <input
                    type="text"
                    value={painLocation}
                    onChange={(e) => setPainLocation(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    placeholder="e.g. Lower back, head, knee"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Vomit Toggle */}
          <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">Vomit / Nausea</p>
                <p className="text-xs text-zinc-500">Experienced vomit or strong nausea?</p>
              </div>
              <button
                type="button"
                onClick={() => setVomit(!vomit)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  vomit ? "bg-red-600" : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    vomit ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {vomit && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg">
                <AlertTriangle size={14} className="shrink-0 animate-pulse" />
                <span>Hydrate immediately. Stress thresholds lowered.</span>
              </div>
            )}
          </div>
        </div>

        {/* Excretion Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bowel Selector */}
          <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Bowel Status</label>
            <div className="flex flex-wrap gap-1">
              {(["normal", "constipated", "diarrhea", "none", "other"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setBowel(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize border transition-all ${
                    bowel === status
                      ? "bg-zinc-700 text-white border-zinc-600"
                      : "bg-zinc-800 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Urine Selector */}
          <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Urine Status</label>
            <div className="flex flex-wrap gap-1">
              {(["normal", "dark", "frequent", "burning", "none", "other"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setUrine(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize border transition-all ${
                    urine === status
                      ? "bg-zinc-700 text-white border-zinc-600"
                      : "bg-zinc-800 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Took Psyllium Husk Toggle */}
        <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/30 flex items-center justify-between">
          <div className="space-y-1 pr-4">
            <p className="text-sm font-semibold text-zinc-200">Took Psyllium Husk?</p>
            <p className="text-xs text-zinc-500">Delays scheduled pill intakes by 2 hours to prevent absorption interference</p>
          </div>
          <button
            type="button"
            onClick={() => setTookPsylliumHusk(!tookPsylliumHusk)}
            className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
              tookPsylliumHusk ? "bg-amber-600" : "bg-zinc-800 border border-zinc-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                tookPsylliumHusk ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* General Notes */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">General Notes / Context</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-zinc-800/40 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            placeholder="Add context (e.g. food eaten, specific medication details...)"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 text-sm"
        >
          {isSubmitting ? "Syncing baseline..." : "Save Subjective Baseline"}
        </button>
      </form>
    </div>
  );
}
