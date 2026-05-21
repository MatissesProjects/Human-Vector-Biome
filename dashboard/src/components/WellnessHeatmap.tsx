"use client";

import React, { useState, useEffect } from "react";
import { Smile, Meh, Frown, AlertCircle, GitCommit, ChevronRight, Activity, Brain, User, Calendar, Database, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommitInfo {
  hash: string;
  message: string;
}

interface DayData {
  date: string;
  commits: number;
  linesAdded: number;
  linesDeleted: number;
  commitList: CommitInfo[];
  hasWellness: boolean;
  wellnessScore?: number;
  wellnessCategory?: "positive" | "neutral" | "negative" | "none";
  subjective?: {
    timestamp: string;
    woke_up_feeling_alright: boolean;
    wakeups_during_night: number;
    pain: "none" | "mild" | "moderate" | "severe";
    pain_location?: string;
    vomit: boolean;
    bowel: string;
    urine: string;
    took_psyllium_husk?: boolean;
    notes?: string;
  };
  biometrics?: {
    avgPostureScore: number | null;
    avgStressIndex: number | null;
    avgHRV: number | null;
  };
}

export default function WellnessHeatmap() {
  const [data, setData] = useState<{ actual: Record<string, DayData>; simulated: Record<string, DayData> } | null>(null);
  const [useSimulated, setUseSimulated] = useState(true); // Default to simulated to show off the visual graph right away
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/history/wellness");
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      
      // Auto-select today if available
      const todayStr = new Date().toISOString().split("T")[0];
      const activeData = useSimulated ? json.simulated : json.actual;
      if (activeData && activeData[todayStr]) {
        setSelectedDay(activeData[todayStr]);
      } else {
        // Fallback to first available date with wellness
        const wellnessDays = Object.values(activeData as Record<string, DayData>).filter(d => d.hasWellness);
        if (wellnessDays.length > 0) {
          setSelectedDay(wellnessDays[0]);
        }
      }
      setError(null);
    } catch (err: any) {
      console.error("Failed to load wellness history:", err);
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Sync selected day when toggling data mode
  useEffect(() => {
    if (!data) return;
    const activeData = useSimulated ? data.simulated : data.actual;
    if (selectedDay) {
      if (activeData[selectedDay.date]) {
        setSelectedDay(activeData[selectedDay.date]);
      } else {
        setSelectedDay(activeData[new Date().toISOString().split("T")[0]] || null);
      }
    }
  }, [useSimulated, data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium">Analyzing biological telemetry and code commits...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-2xl text-center max-w-lg mx-auto my-12">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-semibold text-white mb-1">Failed to Load History</h3>
        <p className="text-sm text-red-400/80 mb-4">{error}</p>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const activeData = useSimulated ? data.simulated : data.actual;

  // Generate date range (Sunday 364 days ago to today)
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(todayMidnight);
  start.setDate(todayMidnight.getDate() - 364);
  const dayOfWeek = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - dayOfWeek);

  const dates: Date[] = [];
  const current = new Date(gridStart);
  while (current <= todayMidnight) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Calculate Month Labels
  const monthLabels: { index: number; label: string }[] = [];
  let prevMonth = -1;
  for (let i = 0; i < dates.length; i += 7) {
    const d = dates[i];
    const m = d.getMonth();
    if (m !== prevMonth) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthLabels.push({ index: i / 7, label: monthNames[m] });
      prevMonth = m;
    }
  }

  const getCellClass = (day: DayData) => {
    const { hasWellness, wellnessCategory, commits } = day;

    if (!hasWellness) {
      if (commits === 0) return "bg-zinc-900/60 border border-zinc-800/20";
      if (commits <= 2) return "bg-zinc-800 border border-zinc-700/50";
      if (commits <= 5) return "bg-zinc-700";
      return "bg-zinc-500";
    }

    if (wellnessCategory === "positive") {
      if (commits === 0) return "bg-emerald-950/60 border border-emerald-900/40 text-emerald-300";
      if (commits <= 2) return "bg-emerald-900 border border-emerald-800/80 text-emerald-200";
      if (commits <= 5) return "bg-emerald-700 border border-emerald-600/80 text-emerald-100";
      return "bg-emerald-500 border border-emerald-400 text-emerald-950";
    }

    if (wellnessCategory === "neutral") {
      if (commits === 0) return "bg-amber-950/60 border border-amber-900/40 text-amber-300";
      if (commits <= 2) return "bg-amber-900 border border-amber-800/80 text-amber-200";
      if (commits <= 5) return "bg-amber-700 border border-amber-600/80 text-amber-100";
      return "bg-amber-500 border border-amber-400 text-amber-950";
    }

    if (wellnessCategory === "negative") {
      if (commits === 0) return "bg-rose-950/60 border border-rose-900/40 text-rose-300";
      if (commits <= 2) return "bg-rose-900 border border-rose-800/80 text-rose-200";
      if (commits <= 5) return "bg-rose-700 border border-rose-600/80 text-rose-100";
      return "bg-rose-500 border border-rose-400 text-rose-950";
    }

    return "bg-zinc-900/60 border border-zinc-800/20";
  };

  const handleMouseEnter = (day: DayData, e: React.MouseEvent) => {
    setHoveredDay(day);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + window.scrollX + 15,
      y: rect.top + window.scrollY - 45
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setTooltipPos(null);
  };

  const getWellnessIcon = (category: string | undefined) => {
    if (category === "positive") return <Smile className="text-green-400" size={18} />;
    if (category === "neutral") return <Meh className="text-amber-400" size={18} />;
    if (category === "negative") return <Frown className="text-rose-400" size={18} />;
    return <AlertCircle className="text-zinc-500" size={18} />;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" />
            Wellness & Git Commit Heatmap
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Correlation of daily subjective symptoms, posture, and git commits</p>
        </div>

        {/* Data Source Selector */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setUseSimulated(false)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${!useSimulated ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Database size={12} className="inline mr-1" />
            Real Data
          </button>
          <button
            onClick={() => setUseSimulated(true)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 ${useSimulated ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Sparkles size={12} />
            Demo / Simulated
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative">
        <div className="flex gap-2 p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/80 overflow-x-auto select-none custom-scrollbar">
          {/* Days of Week Labels */}
          <div className="grid grid-rows-7 pr-2 pt-[18px] text-[9px] text-zinc-600 font-bold h-[106px] items-center text-right select-none w-8">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Months & Graph Container */}
          <div className="flex-1 flex flex-col gap-1 min-w-[700px] select-none">
            {/* Month Labels */}
            <div className="h-4 relative text-[9px] text-zinc-500 font-bold select-none">
              {monthLabels.map((lbl, idx) => (
                <span
                  key={idx}
                  className="absolute"
                  style={{ left: `${lbl.index * 13.5}px` }}
                >
                  {lbl.label}
                </span>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-rows-7 grid-flow-col gap-[3.5px]">
              {dates.map((date) => {
                const dateStr = date.toISOString().split("T")[0];
                const dayData = activeData[dateStr] || {
                  date: dateStr,
                  commits: 0,
                  linesAdded: 0,
                  linesDeleted: 0,
                  commitList: [],
                  hasWellness: false
                };

                const isSelected = selectedDay?.date === dateStr;
                const cellClass = getCellClass(dayData);

                return (
                  <div
                    key={dateStr}
                    onMouseEnter={(e) => handleMouseEnter(dayData, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setSelectedDay(dayData)}
                    className={`w-2.5 h-2.5 rounded-[2px] transition-all cursor-pointer ${cellClass} ${
                      isSelected ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-black scale-110 z-10" : "hover:scale-110"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 px-2 text-[10px] text-zinc-500 font-medium">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-zinc-900 border border-zinc-800/30" />
              <span>No Logs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
              <span>Positive Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-500" />
              <span>Neutral Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-rose-500" />
              <span>Negative Day</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Fewer Commits</span>
            <span className="w-2 h-2 rounded-[2px] bg-emerald-950/60" />
            <span className="w-2 h-2 rounded-[2px] bg-emerald-800" />
            <span className="w-2 h-2 rounded-[2px] bg-emerald-600" />
            <span className="w-2 h-2 rounded-[2px] bg-emerald-500" />
            <span>More Commits</span>
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredDay && tooltipPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute z-50 bg-zinc-950/95 border border-zinc-800 p-2.5 rounded-xl shadow-2xl pointer-events-none text-xs text-zinc-300 w-52 flex flex-col gap-1 backdrop-blur-md"
              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
            >
              <div className="font-bold text-white flex justify-between border-b border-zinc-800 pb-1 mb-1">
                <span>{new Date(hoveredDay.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Wellness State:</span>
                <span className={`capitalize font-semibold flex items-center gap-1 ${
                  hoveredDay.wellnessCategory === "positive" ? "text-green-400" :
                  hoveredDay.wellnessCategory === "neutral" ? "text-amber-400" :
                  hoveredDay.wellnessCategory === "negative" ? "text-rose-400" : "text-zinc-500"
                }`}>
                  {hoveredDay.wellnessCategory || "None"}
                  {hoveredDay.wellnessScore && ` (${hoveredDay.wellnessScore}%)`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Git Commits:</span>
                <span className="font-mono text-white font-bold">{hoveredDay.commits} commits</span>
              </div>
              {(hoveredDay.linesAdded > 0 || hoveredDay.linesDeleted > 0) && (
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span>Lines Changed:</span>
                  <span>
                    <span className="text-green-500">+{hoveredDay.linesAdded}</span>{" "}
                    <span className="text-rose-500">-{hoveredDay.linesDeleted}</span>
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Details Panel */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={selectedDay.date + (useSimulated ? "-sim" : "-real")}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80"
          >
            {/* Header / Wellness Category Card */}
            <div className="col-span-full border-b border-zinc-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Detail Inspector</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {new Date(selectedDay.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h3>
              </div>

              {selectedDay.hasWellness ? (
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2.5 font-bold text-sm ${
                  selectedDay.wellnessCategory === "positive" ? "bg-green-500/10 border border-green-500/20 text-green-400" :
                  selectedDay.wellnessCategory === "neutral" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                  "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                }`}>
                  {getWellnessIcon(selectedDay.wellnessCategory)}
                  <span className="uppercase tracking-wider">Wellness Sentiment: {selectedDay.wellnessCategory} ({selectedDay.wellnessScore}%)</span>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-zinc-800/40 border border-zinc-700/30 text-zinc-500 font-semibold text-sm">
                  NO WELLNESS DATA RECORDED
                </div>
              )}
            </div>

            {/* Subjective Logs Section */}
            <div className="bg-zinc-950/30 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
              <h4 className="text-xs uppercase tracking-widest font-black text-zinc-500 flex items-center gap-2">
                <Smile size={14} className="text-indigo-400" />
                Morning Subjective Report
              </h4>

              {selectedDay.subjective ? (
                <div className="space-y-3.5 text-sm flex-1">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-400">Sleep Status</span>
                    <span className={`font-semibold ${selectedDay.subjective.woke_up_feeling_alright ? "text-green-400" : "text-amber-400"}`}>
                      {selectedDay.subjective.woke_up_feeling_alright ? "Woke up feeling alright" : "Woke up feeling unwell"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-400">Sleep Disruptions</span>
                    <span className="font-semibold text-white">{selectedDay.subjective.wakeups_during_night} interruptions</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-400">Pain Level</span>
                    <span className={`capitalize font-semibold ${
                      selectedDay.subjective.pain === "none" ? "text-zinc-500" :
                      selectedDay.subjective.pain === "mild" ? "text-amber-400" :
                      selectedDay.subjective.pain === "moderate" ? "text-orange-400" : "text-rose-400"
                    }`}>
                      {selectedDay.subjective.pain}
                      {selectedDay.subjective.pain_location && ` (${selectedDay.subjective.pain_location})`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-400">Nausea / Vomiting</span>
                    <span className={`font-semibold ${selectedDay.subjective.vomit ? "text-rose-400" : "text-green-400"}`}>
                      {selectedDay.subjective.vomit ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-400">Bowel & Urine</span>
                    <span className="font-semibold text-zinc-300 capitalize">
                      {selectedDay.subjective.bowel} bowel / {selectedDay.subjective.urine} urine
                    </span>
                  </div>
                  {selectedDay.subjective.took_psyllium_husk && (
                    <div className="bg-amber-950/20 border border-amber-900/40 p-2 rounded-lg text-xs text-amber-300">
                      🌾 Took Psyllium Husk (Pill schedule delayed by 2h)
                    </div>
                  )}
                  {selectedDay.subjective.notes && (
                    <div className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-lg text-xs text-zinc-400 italic">
                      "{selectedDay.subjective.notes}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-850 rounded-xl bg-black/10 text-center py-10 text-zinc-600 italic">
                  No subjective log reported for this day.
                </div>
              )}
            </div>

            {/* Biometric Telemetry Section */}
            <div className="bg-zinc-950/30 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
              <h4 className="text-xs uppercase tracking-widest font-black text-zinc-500 flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" />
                Biometrics Snapshot
              </h4>

              {selectedDay.biometrics ? (
                <div className="space-y-4 text-sm flex-1">
                  {/* Posture Score */}
                  <div className="flex flex-col gap-1 border-b border-zinc-900 pb-3">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <User size={14} className="text-blue-500" />
                        Posture Score (avg)
                      </span>
                      {selectedDay.biometrics.avgPostureScore !== null ? (
                        <span className={`font-bold font-mono ${selectedDay.biometrics.avgPostureScore > 75 ? "text-green-400" : "text-amber-400"}`}>
                          {selectedDay.biometrics.avgPostureScore}%
                        </span>
                      ) : (
                        <span className="text-zinc-600">--</span>
                      )}
                    </div>
                    {selectedDay.biometrics.avgPostureScore !== null && (
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${selectedDay.biometrics.avgPostureScore > 75 ? "bg-green-500" : "bg-amber-500"}`}
                          style={{ width: `${selectedDay.biometrics.avgPostureScore}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Stress index */}
                  <div className="flex flex-col gap-1 border-b border-zinc-900 pb-3">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Brain size={14} className="text-purple-500" />
                        Stress index (avg)
                      </span>
                      {selectedDay.biometrics.avgStressIndex !== null ? (
                        <span className={`font-bold font-mono ${selectedDay.biometrics.avgStressIndex < 0.4 ? "text-green-400" : "text-rose-500"}`}>
                          {selectedDay.biometrics.avgStressIndex.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">--</span>
                      )}
                    </div>
                    {selectedDay.biometrics.avgStressIndex !== null && (
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${selectedDay.biometrics.avgStressIndex < 0.4 ? "bg-green-500" : "bg-purple-500"}`}
                          style={{ width: `${selectedDay.biometrics.avgStressIndex * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Heart HRV */}
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Activity size={14} className="text-red-500" />
                      HRV (avg)
                    </span>
                    <span className="font-bold text-white font-mono">
                      {selectedDay.biometrics.avgHRV ? `${selectedDay.biometrics.avgHRV} ms` : "--"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-850 rounded-xl bg-black/10 text-center py-10 text-zinc-600 italic">
                  No biometric snapshots recorded.
                </div>
              )}
            </div>

            {/* Git Productivity Section */}
            <div className="bg-zinc-950/30 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
              <h4 className="text-xs uppercase tracking-widest font-black text-zinc-500 flex items-center gap-2">
                <GitCommit size={14} className="text-indigo-400" />
                Git Commits & Lines
              </h4>

              <div className="space-y-3.5 text-sm flex-1 flex flex-col">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-zinc-400">Total Commits</span>
                  <span className="font-bold text-white font-mono">{selectedDay.commits}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-zinc-400">Impact Metrics</span>
                  <span className="font-mono font-bold text-xs">
                    <span className="text-green-500">+{selectedDay.linesAdded}</span>{" "}
                    <span className="text-rose-500">-{selectedDay.linesDeleted}</span>
                  </span>
                </div>

                {/* Commit Messages Scrollable List */}
                <div className="flex-1 flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 mt-2 custom-scrollbar">
                  {selectedDay.commitList && selectedDay.commitList.length > 0 ? (
                    selectedDay.commitList.map((c, i) => (
                      <div
                        key={c.hash || i}
                        className="bg-black/40 border border-zinc-850 p-2 rounded-lg flex gap-2 items-start"
                      >
                        <ChevronRight size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-zinc-500 font-mono">#{c.hash}</span>
                          <span className="text-xs text-zinc-300 font-medium leading-relaxed">{c.message}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-zinc-600 italic text-xs py-8">
                      No commits logged for this day.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
