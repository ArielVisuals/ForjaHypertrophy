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
          <svg viewBox="0 0 200 430" className="w-44 sm:w-52">

            {/* ── Non-interactive base shapes ─────────────────── */}

            {/* Head */}
            <ellipse cx="100" cy="25" rx="19" ry="22"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />

            {/* Neck */}
            <path d="M91 45 L109 45 L108 60 L92 60 Z"
              fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />

            {/* Trapezius slope (neck → shoulders) */}
            <path d="M92 54 Q72 58 52 74 L60 78 Q78 68 100 66 Q122 68 140 78 L148 74 Q128 58 108 54 Z"
              fill="rgba(255,255,255,0.03)" />

            {/* Left forearm */}
            <path d="M22 163 Q14 192 18 220 Q22 232 36 234 Q50 232 54 220 Q58 192 50 163 Z"
              fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />

            {/* Right forearm */}
            <path d="M178 163 Q186 192 182 220 Q178 232 164 234 Q150 232 146 220 Q142 192 150 163 Z"
              fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />

            {/* Hip connector */}
            <path d="M70 176 Q68 193 76 207 L124 207 Q132 193 130 176 Z"
              fill="rgba(255,255,255,0.025)" />

            {/* Left calf */}
            <path d="M56 308 Q50 350 56 378 Q62 390 78 392 Q90 390 94 378 Q100 350 98 308 Z"
              fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />

            {/* Right calf */}
            <path d="M144 308 Q150 350 144 378 Q138 390 122 392 Q110 390 106 378 Q100 350 102 308 Z"
              fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />

            {/* ── Interactive muscle regions ───────────────────── */}

            {/* BACK — upper-back overlay (behind chest) */}
            <motion.path
              d="M70 66 Q54 76 48 100 L70 98 Q70 82 100 76 Q130 82 130 98 L152 100 Q146 76 130 66 Z"
              fill={muscleColor("back", getSets("back"))}
              style={{ filter: muscleGlow("back", getSets("back")), opacity: 0.38 }}
              onMouseEnter={() => setHovered("back")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            />

            {/* SHOULDERS — left deltoid */}
            <motion.ellipse
              cx="40" cy="88" rx="22" ry="20"
              fill={muscleColor("shoulders", getSets("shoulders"))}
              style={{ filter: muscleGlow("shoulders", getSets("shoulders")) }}
              onMouseEnter={() => setHovered("shoulders")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />
            {/* SHOULDERS — right deltoid */}
            <motion.ellipse
              cx="160" cy="88" rx="22" ry="20"
              fill={muscleColor("shoulders", getSets("shoulders"))}
              style={{ filter: muscleGlow("shoulders", getSets("shoulders")) }}
              onMouseEnter={() => setHovered("shoulders")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />

            {/* CHEST — left pec */}
            <motion.path
              d="M70 66 Q84 74 100 70 L100 112 Q82 118 68 112 Q60 90 70 66 Z"
              fill={muscleColor("chest", getSets("chest"))}
              style={{ filter: muscleGlow("chest", getSets("chest")) }}
              onMouseEnter={() => setHovered("chest")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />
            {/* CHEST — right pec */}
            <motion.path
              d="M130 66 Q116 74 100 70 L100 112 Q118 118 132 112 Q140 90 130 66 Z"
              fill={muscleColor("chest", getSets("chest"))}
              style={{ filter: muscleGlow("chest", getSets("chest")) }}
              onMouseEnter={() => setHovered("chest")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />
            {/* Sternum divider */}
            <line x1="100" y1="66" x2="100" y2="112" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />

            {/* ARMS — left upper (tapered path, wider at shoulder) */}
            <motion.path
              d="M42 82 Q28 96 22 136 Q20 158 26 167 Q34 173 44 169 Q54 165 56 144 Q60 106 56 82 Z"
              fill={muscleColor("arms", getSets("arms"))}
              style={{ filter: muscleGlow("arms", getSets("arms")) }}
              onMouseEnter={() => setHovered("arms")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />
            {/* ARMS — right upper */}
            <motion.path
              d="M158 82 Q172 96 178 136 Q180 158 174 167 Q166 173 156 169 Q146 165 144 144 Q140 106 144 82 Z"
              fill={muscleColor("arms", getSets("arms"))}
              style={{ filter: muscleGlow("arms", getSets("arms")) }}
              onMouseEnter={() => setHovered("arms")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />

            {/* CORE */}
            <motion.path
              d="M70 112 Q100 122 130 112 L130 176 Q100 184 70 176 Z"
              fill={muscleColor("core", getSets("core"))}
              style={{ filter: muscleGlow("core", getSets("core")) }}
              onMouseEnter={() => setHovered("core")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            />
            {/* Center line for abs */}
            <line x1="100" y1="112" x2="100" y2="176" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />

            {/* LEGS — left quad (meets center at x=100, no overlap) */}
            <motion.path
              d="M76 205 Q56 218 54 270 Q56 306 78 312 Q95 316 100 312 L100 203 Q88 199 76 205 Z"
              fill={muscleColor("legs", getSets("legs"))}
              style={{ filter: muscleGlow("legs", getSets("legs")) }}
              onMouseEnter={() => setHovered("legs")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />
            {/* LEGS — right quad */}
            <motion.path
              d="M124 205 Q144 218 146 270 Q144 306 122 312 Q105 316 100 312 L100 203 Q112 199 124 205 Z"
              fill={muscleColor("legs", getSets("legs"))}
              style={{ filter: muscleGlow("legs", getSets("legs")) }}
              onMouseEnter={() => setHovered("legs")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />

            {/* ── Outline silhouette ───────────────────────────── */}
            {/* Head */}
            <ellipse cx="100" cy="25" rx="19" ry="22"
              fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {/* Body + arms outline */}
            <path
              d="M92 45 Q74 50 54 72 Q32 80 18 90 Q10 114 14 156 Q18 172 32 174
                 Q14 198 18 224 Q22 234 38 236 Q54 236 58 222 Q62 198 50 170
                 Q60 172 70 112 L70 176 Q68 194 76 207
                 Q56 220 54 272 Q56 308 56 380 Q62 392 80 394 Q94 392 100 382
                 Q106 392 120 394 Q138 392 144 380 Q144 308 146 272
                 Q144 220 124 207 Q132 194 130 176 L130 112
                 Q140 172 150 170 Q138 198 142 222 Q146 236 162 236 Q178 236 182 224
                 Q186 198 168 174 Q182 172 186 156 Q190 114 182 90
                 Q168 80 146 72 Q126 50 108 45 Z"
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
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
