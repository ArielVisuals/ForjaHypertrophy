import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { WEEKLY_VOLUME_TARGETS } from "@/lib/constants/programs";

interface MuscleVolume {
  muscleGroup: string;
  sets: number;
  lastTrained: string | null;
}

interface BodySymmetryMapProps {
  userId: string;
  initialData?: MuscleVolume[];
}

// Color based on volume vs target
function muscleColor(muscleGroup: string, sets: number): string {
  const target = WEEKLY_VOLUME_TARGETS[muscleGroup];
  if (!target || sets === 0) return "rgba(255,255,255,0.04)";
  if (sets < target.min)     return "rgba(249,115,22,0.55)";   // orange
  if (sets <= target.max)    return "rgba(16,185,129,0.60)";   // emerald
  return "rgba(59,130,246,0.65)";                               // blue
}

function muscleGlow(muscleGroup: string, sets: number): string {
  const target = WEEKLY_VOLUME_TARGETS[muscleGroup];
  if (!target || sets === 0) return "none";
  if (sets < target.min)     return "drop-shadow(0 0 8px rgba(249,115,22,0.5))";
  if (sets <= target.max)    return "drop-shadow(0 0 8px rgba(16,185,129,0.5))";
  return "drop-shadow(0 0 8px rgba(59,130,246,0.5))";
}

function statusLabel(muscleGroup: string, sets: number) {
  const target = WEEKLY_VOLUME_TARGETS[muscleGroup];
  if (!target || sets === 0) return { text: "SIN DATOS", color: "text-white/20" };
  if (sets < target.min)     return { text: "BAJO VOLUMEN", color: "text-orange-400" };
  if (sets <= target.max)    return { text: "ÓPTIMO", color: "text-emerald-400" };
  return { text: "ALTO VOLUMEN", color: "text-blue-400" };
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: "PECHO", back: "ESPALDA", legs: "PIERNAS",
  shoulders: "HOMBROS", arms: "BRAZOS", core: "CORE",
};

export function BodySymmetryMap({ userId, initialData = [] }: BodySymmetryMapProps) {
  const [data, setData]       = useState<MuscleVolume[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [error, setError]     = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const load = () => {
    setError(false);
    setLoading(true);
    fetch(`/api/workouts?action=volume&userId=${userId}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d: unknown) => setData(Array.isArray(d) ? d : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialData.length > 0) return;
    load();
  }, [userId]);

  const dataMap: Record<string, MuscleVolume> = {};
  for (const row of data) dataMap[row.muscleGroup] = row;

  const getSets = (m: string) => dataMap[m]?.sets ?? 0;

  const musclesInRange = ["chest", "back", "legs", "shoulders", "arms", "core"].filter(m => {
    const t = WEEKLY_VOLUME_TARGETS[m];
    const s = getSets(m);
    return t && s >= t.min && s <= t.max;
  });
  const score = Math.round((musclesInRange.length / 6) * 100);

  const hoveredData = hovered ? { sets: getSets(hovered), target: WEEKLY_VOLUME_TARGETS[hovered] } : null;

  if (loading) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 animate-pulse">
        <div className="h-4 w-48 bg-white/5 rounded mb-8" />
        <div className="h-64 bg-white/[0.03] rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 flex flex-col items-center justify-center gap-4 min-h-[160px]">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ERROR AL CARGAR MAPA MUSCULAR</p>
        <button onClick={load} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-all">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10">
      <div className="flex flex-col lg:flex-row gap-8 items-center">

        {/* Left: SVG body */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 200 420"
            className="w-48 sm:w-56"
            style={{ filter: "none" }}
          >
            {/* Body outline */}
            <ellipse cx="100" cy="30" rx="20" ry="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <rect x="84" y="52" width="32" height="14" rx="6" fill="rgba(255,255,255,0.04)" />

            {/* Shoulders */}
            <motion.ellipse
              cx="58" cy="82" rx="22" ry="18"
              fill={muscleColor("shoulders", getSets("shoulders"))}
              style={{ filter: muscleGlow("shoulders", getSets("shoulders")) }}
              onMouseEnter={() => setHovered("shoulders")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />
            <motion.ellipse
              cx="142" cy="82" rx="22" ry="18"
              fill={muscleColor("shoulders", getSets("shoulders"))}
              style={{ filter: muscleGlow("shoulders", getSets("shoulders")) }}
              onMouseEnter={() => setHovered("shoulders")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />

            {/* Chest */}
            <motion.path
              d="M76 68 Q100 74 124 68 Q130 90 124 108 Q100 116 76 108 Q70 90 76 68Z"
              fill={muscleColor("chest", getSets("chest"))}
              style={{ filter: muscleGlow("chest", getSets("chest")) }}
              onMouseEnter={() => setHovered("chest")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />

            {/* Arms (upper) */}
            <motion.ellipse
              cx="40" cy="118" rx="13" ry="32"
              fill={muscleColor("arms", getSets("arms"))}
              style={{ filter: muscleGlow("arms", getSets("arms")) }}
              onMouseEnter={() => setHovered("arms")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />
            <motion.ellipse
              cx="160" cy="118" rx="13" ry="32"
              fill={muscleColor("arms", getSets("arms"))}
              style={{ filter: muscleGlow("arms", getSets("arms")) }}
              onMouseEnter={() => setHovered("arms")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />

            {/* Forearms */}
            <ellipse cx="34" cy="168" rx="9" ry="24" fill="rgba(255,255,255,0.03)" />
            <ellipse cx="166" cy="168" rx="9" ry="24" fill="rgba(255,255,255,0.03)" />

            {/* Core */}
            <motion.path
              d="M79 110 Q100 116 121 110 L124 168 Q100 176 76 168Z"
              fill={muscleColor("core", getSets("core"))}
              style={{ filter: muscleGlow("core", getSets("core")) }}
              onMouseEnter={() => setHovered("core")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            />

            {/* Back indicator (behind) */}
            <motion.path
              d="M79 70 Q64 76 64 110 L76 110 Q76 90 100 84 Q124 90 124 110 L136 110 Q136 76 121 70Z"
              fill={muscleColor("back", getSets("back"))}
              style={{ filter: muscleGlow("back", getSets("back")), opacity: 0.4 }}
              onMouseEnter={() => setHovered("back")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            />

            {/* Legs (quads) */}
            <motion.ellipse
              cx="85" cy="238" rx="26" ry="54"
              fill={muscleColor("legs", getSets("legs"))}
              style={{ filter: muscleGlow("legs", getSets("legs")) }}
              onMouseEnter={() => setHovered("legs")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />
            <motion.ellipse
              cx="115" cy="238" rx="26" ry="54"
              fill={muscleColor("legs", getSets("legs"))}
              style={{ filter: muscleGlow("legs", getSets("legs")) }}
              onMouseEnter={() => setHovered("legs")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />

            {/* Calves */}
            <ellipse cx="83" cy="338" rx="16" ry="36" fill="rgba(255,255,255,0.03)" />
            <ellipse cx="117" cy="338" rx="16" ry="36" fill="rgba(255,255,255,0.03)" />

            {/* Outline body silhouette */}
            <path
              d="M80 54 L64 76 L36 96 L26 148 L32 196 L60 192 L76 168 L76 304 L64 300 L58 390 L82 392 L92 310 L108 310 L118 392 L142 390 L136 300 L124 304 L124 168 L140 192 L168 196 L174 148 L164 96 L136 76 L120 54 Z"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1.5"
            />
          </svg>

          {/* Hover tooltip */}
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0A0A0B] border border-white/15 rounded-xl px-4 py-2.5 shadow-2xl whitespace-nowrap z-10"
            >
              <p className="text-[9px] font-black text-white uppercase tracking-widest">{MUSCLE_LABELS[hovered]}</p>
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                {getSets(hovered)} / {WEEKLY_VOLUME_TARGETS[hovered]?.max ?? "?"} SETS
              </p>
            </motion.div>
          )}
        </div>

        {/* Right: Stats + score */}
        <div className="flex-1 w-full space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">MAPA MUSCULAR</p>
              <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mt-0.5">VOLUMEN SEMANAL</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-white tabular-nums">{score}%</p>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">SCORE SIMETRÍA</p>
            </div>
          </div>

          {/* Muscle rows */}
          <div className="space-y-2.5">
            {["chest", "back", "legs", "shoulders", "arms", "core"].map(muscle => {
              const sets   = getSets(muscle);
              const target = WEEKLY_VOLUME_TARGETS[muscle];
              const pct    = target ? Math.min(100, (sets / target.max) * 100) : 0;
              const color  = muscleColor(muscle, sets);
              const status = statusLabel(muscle, sets);

              return (
                <div
                  key={muscle}
                  onMouseEnter={() => setHovered(muscle)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex items-center gap-3 cursor-default transition-all ${hovered === muscle ? "opacity-100" : "opacity-80"}`}
                >
                  <span className="text-[9px] font-black text-white uppercase tracking-tight w-16 shrink-0">
                    {MUSCLE_LABELS[muscle]}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden relative">
                    {target && (
                      <div
                        className="absolute top-0 bottom-0 w-[1px] bg-white/20 z-10"
                        style={{ left: `${(target.min / target.max) * 100}%` }}
                      />
                    )}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-24 justify-end">
                    <span className="text-[8px] font-black text-white/40 tabular-nums">
                      {sets}<span className="text-white/15">/{target?.max}</span>
                    </span>
                    <span className={`text-[7px] font-black uppercase tracking-widest ${status.color} hidden sm:inline`}>
                      {status.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 pt-2 border-t border-white/[0.05]">
            {[
              { color: "bg-orange-500", label: "BAJO" },
              { color: "bg-emerald-500", label: "ÓPTIMO" },
              { color: "bg-blue-500", label: "ALTO" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
            <span className="ml-auto text-[8px] font-bold text-white/15 uppercase tracking-widest">
              {musclesInRange.length}/6 EN RANGO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
