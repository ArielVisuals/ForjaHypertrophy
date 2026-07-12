import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MUSCLE_GROUP_LABELS, WEEKLY_VOLUME_TARGETS } from "@/lib/constants/programs";

interface MuscleVolume {
  muscleGroup: string;
  sets: number;
  lastTrained: string | null;
}

interface WeeklyVolumeWidgetProps {
  initialData?: MuscleVolume[];
}

const MUSCLE_ORDER = ["chest", "back", "legs", "shoulders", "arms", "core"];

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function volumeColor(sets: number, target: { min: number; max: number }): string {
  if (sets === 0)            return "bg-white/10";
  if (sets < target.min)     return "bg-orange-500";
  if (sets <= target.max)    return "bg-emerald-500";
  return "bg-blue-500";
}

function volumeGlow(sets: number, target: { min: number; max: number }): string {
  if (sets === 0)         return "";
  if (sets < target.min)  return "shadow-[0_0_12px_rgba(249,115,22,0.4)]";
  if (sets <= target.max) return "shadow-[0_0_12px_rgba(16,185,129,0.4)]";
  return "shadow-[0_0_12px_rgba(59,130,246,0.4)]";
}

function recoveryLabel(days: number | null): { text: string; color: string } {
  if (days === null)  return { text: "Sin datos", color: "text-white/20" };
  if (days === 0)     return { text: "Hoy",       color: "text-blue-400" };
  if (days === 1)     return { text: "Ayer",       color: "text-emerald-400" };
  if (days <= 3)      return { text: `${days}d`,   color: "text-emerald-400" };
  if (days <= 5)      return { text: `${days}d`,   color: "text-orange-400" };
  return               { text: `${days}d`,          color: "text-red-400" };
}

export function WeeklyVolumeWidget({ initialData = [] }: WeeklyVolumeWidgetProps) {
  const [data, setData] = useState<MuscleVolume[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);

  useEffect(() => {
    if (initialData.length > 0) return;
    fetch("/api/workouts?action=volume")
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Construir mapa de datos por músculo
  const dataMap: Record<string, MuscleVolume> = {};
  for (const row of data) dataMap[row.muscleGroup] = row;

  if (loading) {
    return (
      <div className="p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 animate-pulse">
        <div className="h-4 w-48 bg-white/5 rounded-full mb-8" />
        {MUSCLE_ORDER.map(m => (
          <div key={m} className="h-8 bg-white/[0.03] rounded-xl mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
            VOLUMEN SEMANAL POR MÚSCULO
          </p>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">
            ÚLTIMOS 7 DÍAS · SETS EFECTIVOS
          </p>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            BAJO
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            ÓPTIMO
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            ALTO
          </span>
        </div>
      </div>

      {/* Barras por músculo */}
      <div className="space-y-5">
        {MUSCLE_ORDER.map((muscle, i) => {
          const row      = dataMap[muscle];
          const sets     = row?.sets ?? 0;
          const target   = WEEKLY_VOLUME_TARGETS[muscle] ?? { min: 10, max: 20 };
          const pct      = Math.min(100, (sets / target.max) * 100);
          const days     = daysSince(row?.lastTrained ?? null);
          const recovery = recoveryLabel(days);
          const label    = MUSCLE_GROUP_LABELS[muscle] ?? muscle;

          return (
            <div key={muscle} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-white/20 w-4 tabular-nums">{i + 1}</span>
                  <span className="text-xs font-black text-white uppercase tracking-tight">{label}</span>
                </div>
                <div className="flex items-center gap-5">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${recovery.color}`}>
                    {recovery.text}
                  </span>
                  <span className="text-sm font-black text-white tabular-nums w-12 text-right">
                    {sets}
                    <span className="text-[9px] text-white/20 font-bold"> / {target.max}</span>
                  </span>
                </div>
              </div>

              {/* Barra */}
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                {/* Marcador de mínimo */}
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-white/20 z-10"
                  style={{ left: `${(target.min / target.max) * 100}%` }}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${volumeColor(sets, target)} ${volumeGlow(sets, target)}`}
                />
              </div>

              {/* Target range label */}
              <div className="flex justify-between text-[8px] font-bold text-white/10 uppercase tracking-widest">
                <span>0</span>
                <span className="text-white/20">META: {target.min}–{target.max} sets</span>
                <span>{target.max}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: resumen */}
      {data.length === 0 ? (
        <p className="text-center text-[10px] font-black text-white/10 uppercase tracking-widest pt-4">
          Sin entrenamientos registrados esta semana
        </p>
      ) : (
        <div className="pt-4 border-t border-white/5 flex justify-between text-[9px] font-black text-white/20 uppercase tracking-widest">
          <span>{data.reduce((a, r) => a + r.sets, 0)} SETS TOTALES ESTA SEMANA</span>
          <span>{data.filter(r => {
            const t = WEEKLY_VOLUME_TARGETS[r.muscleGroup];
            return t && r.sets >= t.min && r.sets <= t.max;
          }).length}/{MUSCLE_ORDER.length} GRUPOS EN RANGO</span>
        </div>
      )}
    </div>
  );
}
