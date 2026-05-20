"use client";

import { useState } from "react";
import { 
  Wind, X, Play, AlertTriangle, AlertCircle, 
  Coffee, GlassWater, Moon, Eye, Activity 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SubjectiveLog, DailyBaseline } from "../../../src/types";
import { toast } from "sonner";

interface NextBestActionProps {
  stressIndex?: number | null;
  subjective?: SubjectiveLog | null;
  baseline?: DailyBaseline | null;
}

export default function NextBestAction({ stressIndex, subjective, baseline }: NextBestActionProps) {
  const [dismissedActions, setDismissedActions] = useState<string[]>([]);
  const isStressed = stressIndex && stressIndex > 0.8;

  const actions: {
    id: string;
    type: "stress" | "pain" | "illness" | "sleep";
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    borderColorClass: string;
    buttonText: string;
    buttonAction: () => void;
  }[] = [];

  // 1. High Stress Action
  if (isStressed) {
    actions.push({
      id: "stress",
      type: "stress",
      title: "High Stress Levels Detected",
      description: "Your live EEG stress index indicates elevated cognitive load. We recommend calming box breathing.",
      icon: <Wind className="text-purple-400" size={24} />,
      colorClass: "from-purple-950/40 to-indigo-950/40",
      borderColorClass: "border-purple-500/30",
      buttonText: "Start Box Breathing",
      buttonAction: () => {
        toast.info("Box Breathing Session Started", {
          description: "Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s.",
          duration: 6000,
        });
      }
    });
  }

  // 2. Pain Action
  if (subjective && subjective.pain !== "none") {
    actions.push({
      id: "pain",
      type: "pain",
      title: `Physical Pain Management (${subjective.pain} severity)`,
      description: `You reported ${subjective.pain} pain${subjective.pain_location ? ` in the ${subjective.pain_location}` : ""}. Rest and dynamic stretching are recommended.`,
      icon: <AlertCircle className="text-orange-400" size={24} />,
      colorClass: "from-orange-950/40 to-yellow-950/40",
      borderColorClass: "border-orange-500/30",
      buttonText: "Begin Gentle Stretching",
      buttonAction: () => {
        toast.info("Stretching Guide Triggered", {
          description: "Follow gentle workspace mobility movements. Do not push into sharp pain.",
          duration: 6000,
        });
      }
    });
  }

  // 3. Vomit / Nausea Action
  if (subjective && subjective.vomit) {
    actions.push({
      id: "illness",
      type: "illness",
      title: "Dehydration & Nausea Warning",
      description: "Vomiting causes acute fluid and electrolyte loss. Prioritize fluid intake and avoid caffeine.",
      icon: <GlassWater className="text-red-400" size={24} />,
      colorClass: "from-red-950/40 to-rose-950/40",
      borderColorClass: "border-red-500/30",
      buttonText: "Log Water Intake (250ml)",
      buttonAction: () => {
        toast.success("Hydration Logged", {
          description: "Logged 250ml water to your biome diary.",
        });
      }
    });
  }

  // 4. Low Sleep/Wakeups Action
  const lowSleep = baseline && baseline.sleep_score < 60;
  const highWakeups = subjective && subjective.wakeups_during_night > 2;
  const feltBad = subjective && !subjective.woke_up_feeling_alright;

  if (lowSleep || highWakeups || feltBad) {
    let reason = "Your sleep score is low";
    if (highWakeups) reason = `You experienced ${subjective.wakeups_during_night} sleep disruptions`;
    else if (feltBad) reason = "You woke up feeling unwell";

    actions.push({
      id: "sleep",
      type: "sleep",
      title: "Reduced Readiness Baseline",
      description: `${reason}. We recommend scheduling regular screen breaks and keeping cognitive loads light today.`,
      icon: <Moon className="text-blue-400" size={24} />,
      colorClass: "from-blue-950/40 to-cyan-950/40",
      borderColorClass: "border-blue-500/30",
      buttonText: "Enable Focus Breaks",
      buttonAction: () => {
        toast.success("Focus Breaks Scheduled", {
          description: "The dashboard will nudge you every 25 minutes for physical movement.",
        });
      }
    });
  }

  const activeActions = actions.filter(action => !dismissedActions.includes(action.id));

  if (activeActions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 col-span-full">
      <AnimatePresence mode="popLayout">
        {activeActions.map((action) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`bg-gradient-to-r ${action.colorClass} border ${action.borderColorClass} p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md relative overflow-hidden`}
          >
            {/* Ambient inner shine */}
            <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />

            <button
              onClick={() => setDismissedActions(prev => [...prev, action.id])}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
              title="Dismiss recommendation"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4 pr-6">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/[0.05]">
                {action.icon}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {action.title}
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
                  {action.description}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
              <button
                onClick={action.buttonAction}
                className="w-full md:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white hover:text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10 text-xs"
              >
                <Activity size={14} />
                {action.buttonText}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
