"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Settings, Save, RotateCcw, ChevronRight } from "lucide-react";

interface ServerConfig {
  neckAngleThreshold: number;
  lookingDownTimeLimitMs: number;
  postureScoreBadThreshold: number;
  baseStressThreshold: number;
  stressThresholdFloor: number;
  co2AlertThreshold: number;
  weatherRefreshIntervalMs: number;
}

const DEFAULT_CONFIG: ServerConfig = {
  neckAngleThreshold: 20,
  lookingDownTimeLimitMs: 15000,
  postureScoreBadThreshold: 40,
  baseStressThreshold: 0.8,
  stressThresholdFloor: 0.4,
  co2AlertThreshold: 1000,
  weatherRefreshIntervalMs: 900000,
};

type SettingDef = {
  key: keyof ServerConfig;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  format?: (v: number) => string;
};

const SETTING_GROUPS: { title: string; color: string; icon: string; settings: SettingDef[] }[] = [
  {
    title: "Posture & Neck",
    color: "#3b82f6",
    icon: "🧍",
    settings: [
      {
        key: "neckAngleThreshold",
        label: "Neck Angle Threshold",
        description: "Angle in degrees above which the \"looking down\" timer starts.",
        min: 5,
        max: 60,
        step: 1,
        unit: "°",
      },
      {
        key: "lookingDownTimeLimitMs",
        label: "Looking Down Time Limit",
        description: "How long you can look down before a haptic alert fires.",
        min: 5000,
        max: 120000,
        step: 1000,
        unit: "s",
        format: (v) => `${(v / 1000).toFixed(0)}`,
      },
      {
        key: "postureScoreBadThreshold",
        label: "Bad Posture Score",
        description: "Posture score below this triggers a haptic nudge on your watch.",
        min: 10,
        max: 80,
        step: 1,
        unit: "%",
      },
    ],
  },
  {
    title: "Stress & Brain",
    color: "#a855f7",
    icon: "🧠",
    settings: [
      {
        key: "baseStressThreshold",
        label: "Stress Alert Threshold",
        description: "Stress index (0–1) above which a relaxation nudge is sent. Adjusted down automatically based on your baseline.",
        min: 0.3,
        max: 1.0,
        step: 0.01,
        unit: "",
        format: (v) => v.toFixed(2),
      },
      {
        key: "stressThresholdFloor",
        label: "Stress Threshold Floor",
        description: "Minimum threshold after all baseline adjustments. Prevents over-triggering.",
        min: 0.2,
        max: 0.9,
        step: 0.01,
        unit: "",
        format: (v) => v.toFixed(2),
      },
    ],
  },
  {
    title: "Environment",
    color: "#06b6d4",
    icon: "🌿",
    settings: [
      {
        key: "co2AlertThreshold",
        label: "CO₂ Alert Threshold",
        description: "CO₂ level (ppm) above which you're prompted to open a window.",
        min: 400,
        max: 3000,
        step: 50,
        unit: "ppm",
      },
      {
        key: "weatherRefreshIntervalMs",
        label: "Weather Refresh Interval",
        description: "How often the server polls Open-Meteo for outside temperature.",
        min: 60000,
        max: 3600000,
        step: 60000,
        unit: "min",
        format: (v) => `${(v / 60000).toFixed(0)}`,
      },
    ],
  },
];

function SettingRow({
  def,
  value,
  onChange,
}: {
  def: SettingDef;
  value: number;
  onChange: (key: keyof ServerConfig, v: number) => void;
}) {
  const displayValue = def.format ? def.format(value) : String(value);
  const percent = ((value - def.min) / (def.max - def.min)) * 100;

  return (
    <div className="setting-row">
      <div className="setting-header">
        <div className="setting-label-group">
          <span className="setting-label">{def.label}</span>
          <span className="setting-desc">{def.description}</span>
        </div>
        <div className="setting-value-box">
          <span className="setting-value-num">{displayValue}</span>
          {def.unit && <span className="setting-value-unit">{def.unit}</span>}
        </div>
      </div>
      <div className="slider-wrap">
        <div className="slider-track">
          <div
            className="slider-fill"
            style={{ width: `${percent}%` }}
          />
          <input
            type="range"
            min={def.min}
            max={def.max}
            step={def.step}
            value={value}
            onChange={(e) => onChange(def.key, parseFloat(e.target.value))}
            className="slider-input"
          />
        </div>
        <div className="slider-bounds">
          <span>{def.format ? def.format(def.min) : def.min}{def.unit}</span>
          <span>{def.format ? def.format(def.max) : def.max}{def.unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPanel() {
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [dirty, setDirty] = useState<Partial<ServerConfig>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/settings")
      .then((r) => r.json())
      .then((data: ServerConfig) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        setConfig({ ...DEFAULT_CONFIG });
        setLoading(false);
        toast.error("Could not load settings from server — showing defaults.");
      });
  }, []);

  const merged: ServerConfig = config ? { ...config, ...dirty } : { ...DEFAULT_CONFIG, ...dirty };

  function handleChange(key: keyof ServerConfig, value: number) {
    setDirty((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (Object.keys(dirty).length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("http://localhost:3000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dirty),
      });
      if (!res.ok) throw new Error(await res.text());
      const { config: updated } = await res.json();
      setConfig(updated);
      setDirty({});
      toast.success("Settings saved and applied!", { description: `${Object.keys(dirty).length} value(s) updated.` });
    } catch (err) {
      toast.error("Failed to save settings", { description: String(err) });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setDirty({ ...DEFAULT_CONFIG });
  }

  const hasDirty = Object.keys(dirty).length > 0;

  if (loading) {
    return (
      <div className="settings-loading">
        <Settings size={32} className="animate-spin opacity-30" />
        <p>Loading settings from server…</p>
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <style>{`
        .settings-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .settings-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .settings-icon-wrap {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .settings-subtitle {
          font-size: 0.75rem;
          color: #71717a;
          margin-top: 0.125rem;
        }

        .settings-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-reset {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: rgba(39,39,42,0.8);
          border: 1px solid rgba(63,63,70,0.6);
          border-radius: 0.625rem;
          color: #a1a1aa;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-reset:hover {
          background: rgba(63,63,70,0.8);
          color: #fff;
        }

        .btn-save {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: 1px solid rgba(139,92,246,0.3);
          border-radius: 0.625rem;
          color: #fff;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          opacity: 1;
        }
        .btn-save:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .btn-save:not(:disabled):hover {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 0 16px rgba(139,92,246,0.35);
          transform: translateY(-1px);
        }

        .dirty-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: rgba(234,179,8,0.1);
          border: 1px solid rgba(234,179,8,0.25);
          color: #fbbf24;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .settings-group {
          background: rgba(24,24,27,0.6);
          border: 1px solid rgba(63,63,70,0.5);
          border-radius: 1rem;
          overflow: hidden;
        }

        .group-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(63,63,70,0.4);
          background: rgba(39,39,42,0.3);
        }

        .group-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .group-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #e4e4e7;
          letter-spacing: -0.01em;
        }

        .group-accent {
          width: 0.2rem;
          height: 1.25rem;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .setting-row {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(39,39,42,0.6);
          transition: background 0.15s;
        }
        .setting-row:last-child {
          border-bottom: none;
        }
        .setting-row:hover {
          background: rgba(39,39,42,0.4);
        }

        .setting-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.875rem;
        }

        .setting-label-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .setting-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #e4e4e7;
        }

        .setting-desc {
          font-size: 0.75rem;
          color: #71717a;
          line-height: 1.5;
          max-width: 34rem;
        }

        .setting-value-box {
          display: flex;
          align-items: baseline;
          gap: 0.2rem;
          flex-shrink: 0;
          background: rgba(39,39,42,0.6);
          border: 1px solid rgba(63,63,70,0.5);
          border-radius: 0.5rem;
          padding: 0.3rem 0.75rem;
        }

        .setting-value-num {
          font-size: 1.125rem;
          font-weight: 700;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          color: #a78bfa;
        }

        .setting-value-unit {
          font-size: 0.7rem;
          color: #71717a;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .slider-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .slider-track {
          position: relative;
          height: 0.375rem;
          background: rgba(63,63,70,0.6);
          border-radius: 999px;
          cursor: pointer;
        }

        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          border-radius: 999px;
          pointer-events: none;
          transition: width 0.05s;
        }

        .slider-input {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          width: 100%;
          height: 1.5rem;
          opacity: 0;
          cursor: pointer;
          margin: 0;
        }

        .slider-bounds {
          display: flex;
          justify-content: space-between;
          font-size: 0.6875rem;
          color: #52525b;
          font-weight: 500;
          padding: 0 0.1rem;
        }

        .settings-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          min-height: 16rem;
          color: #52525b;
          font-size: 0.875rem;
        }
      `}</style>

      {/* Toolbar */}
      <div className="settings-toolbar">
        <div className="settings-title-group">
          <div className="settings-icon-wrap">
            <Settings size={18} className="text-indigo-400" />
          </div>
          <div>
            <p className="settings-title">Intervention Settings</p>
            <p className="settings-subtitle">Tune thresholds — changes apply immediately without restarting the server.</p>
          </div>
        </div>

        <div className="settings-actions">
          {hasDirty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="dirty-badge"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
              {Object.keys(dirty).length} unsaved
            </motion.div>
          )}
          <button className="btn-reset" onClick={handleReset} title="Restore all defaults">
            <RotateCcw size={13} />
            Defaults
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!hasDirty || saving}
          >
            <Save size={13} />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Groups */}
      {SETTING_GROUPS.map((group) => (
        <motion.div
          key={group.title}
          className="settings-group"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="group-header">
            <div className="group-accent" style={{ background: group.color }} />
            <span className="group-icon">{group.icon}</span>
            <span className="group-title">{group.title}</span>
          </div>

          {group.settings.map((def) => (
            <SettingRow
              key={def.key}
              def={def}
              value={merged[def.key]}
              onChange={handleChange}
            />
          ))}
        </motion.div>
      ))}

      {/* Server connection note */}
      <div className="flex items-center gap-2 text-xs text-zinc-600 px-1">
        <ChevronRight size={12} />
        Settings are persisted to <code className="text-zinc-500">config.json</code> and survive server restarts.
      </div>
    </div>
  );
}
