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

            {/* ── NON-INTERACTIVE BASE ── */}

            {/* Head */}
            <ellipse cx="100" cy="22" rx="13" ry="17"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />

            {/* Neck */}
            <path d="M92 37 L108 37 L107 53 L93 53 Z"
              fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" />

            {/* Clavicles */}
            <path d="M93 53 Q78 56 62 66" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />
            <path d="M107 53 Q122 56 138 66" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />

            {/* Left forearm */}
            <path d="M34 178 Q26 196 30 214 Q34 222 44 224 Q54 222 58 212 Q62 198 54 178 Z"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />

            {/* Right forearm */}
            <path d="M166 178 Q174 196 170 214 Q166 222 156 224 Q146 222 142 212 Q138 198 146 178 Z"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />

            {/* Left calf */}
            <path d="M60 326 Q54 350 58 372 Q62 381 74 383 Q86 381 90 372 Q94 354 90 326 Z"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />

            {/* Right calf */}
            <path d="M140 326 Q146 350 142 372 Q138 381 126 383 Q114 381 110 372 Q106 354 110 326 Z"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />

            {/* Hip/crotch connector */}
            <path d="M76 178 Q74 190 76 202 L124 202 Q126 190 124 178 Z"
              fill="rgba(255,255,255,0.025)" />

            {/* ── INTERACTIVE MUSCLE REGIONS ── */}

            {/* BACK — upper traps, visible from front */}
            <motion.path
              d="M93 53 Q78 56 62 66 Q56 78 58 94 L68 92 Q66 78 100 72 Q134 78 132 92 L142 94 Q144 78 138 66 Q122 56 107 53 Z"
              fill={muscleColor("back", getSets("back"))}
              style={{ filter: muscleGlow("back", getSets("back")), opacity: 0.35 }}
              onMouseEnter={() => setHovered("back")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            />

            {/* SHOULDERS — left deltoid (path, not ellipse) */}
            <motion.path
              d="M62 66 Q48 68 40 80 Q34 92 38 106 Q44 114 54 110 Q64 106 66 92 Q68 76 62 66 Z"
              fill={muscleColor("shoulders", getSets("shoulders"))}
              style={{ filter: muscleGlow("shoulders", getSets("shoulders")) }}
              onMouseEnter={() => setHovered("shoulders")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />
            {/* SHOULDERS — right deltoid */}
            <motion.path
              d="M138 66 Q152 68 160 80 Q166 92 162 106 Q156 114 146 110 Q136 106 134 92 Q132 76 138 66 Z"
              fill={muscleColor("shoulders", getSets("shoulders"))}
              style={{ filter: muscleGlow("shoulders", getSets("shoulders")) }}
              onMouseEnter={() => setHovered("shoulders")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />

            {/* CHEST — left pec */}
            <motion.path
              d="M66 72 Q82 64 100 68 L100 126 Q84 132 68 124 Q62 104 66 72 Z"
              fill={muscleColor("chest", getSets("chest"))}
              style={{ filter: muscleGlow("chest", getSets("chest")) }}
              onMouseEnter={() => setHovered("chest")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />
            {/* CHEST — right pec */}
            <motion.path
              d="M134 72 Q118 64 100 68 L100 126 Q116 132 132 124 Q138 104 134 72 Z"
              fill={muscleColor("chest", getSets("chest"))}
              style={{ filter: muscleGlow("chest", getSets("chest")) }}
              onMouseEnter={() => setHovered("chest")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />
            <line x1="100" y1="68" x2="100" y2="126" stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />

            {/* ARMS — left bicep (narrow, elongated) */}
            <motion.path
              d="M40 108 Q32 126 30 152 Q30 168 36 176 Q44 180 52 174 Q60 168 60 152 Q62 126 56 108 Z"
              fill={muscleColor("arms", getSets("arms"))}
              style={{ filter: muscleGlow("arms", getSets("arms")) }}
              onMouseEnter={() => setHovered("arms")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />
            {/* ARMS — right bicep */}
            <motion.path
              d="M160 108 Q168 126 170 152 Q170 168 164 176 Q156 180 148 174 Q140 168 140 152 Q138 126 144 108 Z"
              fill={muscleColor("arms", getSets("arms"))}
              style={{ filter: muscleGlow("arms", getSets("arms")) }}
              onMouseEnter={() => setHovered("arms")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            />

            {/* CORE — abs with definition lines */}
            <motion.path
              d="M68 124 Q100 134 132 124 L128 178 Q100 184 72 178 Z"
              fill={muscleColor("core", getSets("core"))}
              style={{ filter: muscleGlow("core", getSets("core")) }}
              onMouseEnter={() => setHovered("core")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            />
            <line x1="100" y1="124" x2="100" y2="178" stroke="rgba(0,0,0,0.2)" strokeWidth="0.7" />
            <line x1="76" y1="143" x2="124" y2="143" stroke="rgba(0,0,0,0.14)" strokeWidth="0.6" />
            <line x1="74" y1="160" x2="126" y2="160" stroke="rgba(0,0,0,0.14)" strokeWidth="0.6" />

            {/* LEGS — left quad (narrower, athletic) */}
            <motion.path
              d="M60 202 Q52 218 50 266 Q50 306 56 324 Q62 336 76 336 Q90 334 96 324 Q100 310 100 266 Q100 218 98 202 Q80 198 60 202 Z"
              fill={muscleColor("legs", getSets("legs"))}
              style={{ filter: muscleGlow("legs", getSets("legs")) }}
              onMouseEnter={() => setHovered("legs")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />
            {/* LEGS — right quad */}
            <motion.path
              d="M140 202 Q148 218 150 266 Q150 306 144 324 Q138 336 124 336 Q110 334 104 324 Q100 310 100 266 Q100 218 102 202 Q120 198 140 202 Z"
              fill={muscleColor("legs", getSets("legs"))}
              style={{ filter: muscleGlow("legs", getSets("legs")) }}
              onMouseEnter={() => setHovered("legs")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            />

            {/* ── OUTLINE STROKES (top layer) ── */}
            <ellipse cx="100" cy="22" rx="13" ry="17"
              fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.9" />
            {/* Left arm outer */}
            <path d="M62 66 Q48 68 40 80 Q34 92 38 108 Q32 126 30 152 Q28 170 34 180
                     Q28 196 30 214 Q34 224 44 224 Q54 222 58 212 Q62 196 54 180
                     Q62 170 62 152 Q64 126 58 108 Q66 94 66 78 Q64 72 62 66"
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" strokeLinejoin="round" />
            {/* Right arm outer (mirror) */}
            <path d="M138 66 Q152 68 160 80 Q166 92 162 108 Q168 126 170 152 Q172 170 166 180
                     Q172 196 170 214 Q166 224 156 224 Q146 222 142 212 Q138 196 146 180
                     Q138 170 138 152 Q136 126 142 108 Q134 94 134 78 Q136 72 138 66"
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" strokeLinejoin="round" />
            {/* Torso + legs outline */}
            <path d="M62 66 Q64 78 66 94 Q66 130 68 178 Q74 192 76 202
                     Q58 218 50 268 Q48 308 54 326 Q50 368 56 382 Q60 385 74 385
                     Q86 383 90 374 Q94 356 92 326 Q98 336 100 340
                     Q102 336 108 326 Q106 356 110 374 Q114 383 126 385
                     Q140 383 144 374 Q150 356 146 326 Q152 308 150 268
                     Q142 218 124 202 Q126 192 132 178 Q134 130 134 94
                     Q136 78 138 66"
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" strokeLinejoin="round" />
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
