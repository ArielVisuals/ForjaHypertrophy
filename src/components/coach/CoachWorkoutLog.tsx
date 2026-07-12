import { useState } from "react";
import { MUSCLE_GROUP_LABELS } from "../../lib/constants/programs";

/**
 * Registro de entrenamiento de un asesorado, para el entrenador.
 * Sesiones expandibles con desglose por ejercicio, notas del atleta y
 * el analisis de El Arquitecto.
 */

interface SessionExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  volume: number;
  topWeight: number;
}

export interface CoachSession {
  id: string;
  name: string;
  startedAt: string;
  durationMinutes: number | null;
  overallRpe: number | null;
  notes: string | null;
  analysisSummary: string | null;
  totalSets: number;
  totalVolume: number;
  exercises: SessionExercise[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
}

export function CoachWorkoutLog({ sessions }: { sessions: CoachSession[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="p-8 rounded-[2rem] bg-[#0A0A0B] border border-white/10 text-center">
        <p className="text-sm font-black text-white/40 uppercase tracking-tight">
          Este atleta aun no registra entrenamientos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map(s => {
        const isOpen = expanded === s.id;
        return (
          <div key={s.id} className="rounded-[1.5rem] bg-[#0A0A0B] border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : s.id)}
              className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[9px] font-black text-white/25 uppercase tracking-widest">{formatDate(s.startedAt)}</p>
                <p className="text-base font-black text-white uppercase tracking-tighter truncate mt-0.5">{s.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[9px] font-black uppercase tracking-widest">
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/50 tabular-nums">
                  {s.totalSets} SETS
                </span>
                <span className="hidden sm:inline px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/50 tabular-nums">
                  {s.totalVolume.toLocaleString()} KG
                </span>
                {s.overallRpe != null && (
                  <span className={`px-2.5 py-1 rounded-lg border tabular-nums ${
                    s.overallRpe >= 9
                      ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                      : "bg-blue-600/15 border-blue-500/25 text-blue-300"
                  }`}>
                    RPE {s.overallRpe}
                  </span>
                )}
                <span className={`text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4">
                <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
                  {s.exercises.map((ex, i) => (
                    <li key={i} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white/85 uppercase tracking-tight truncate">{ex.name}</p>
                        <p className="text-[8px] font-black text-white/25 uppercase tracking-widest mt-0.5">
                          {MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[10px] font-black tabular-nums">
                        <span className="text-white/50">{ex.sets} sets</span>
                        <span className="text-white/50">{ex.topWeight} kg top</span>
                        <span className="text-white/30">{Math.round(ex.volume).toLocaleString()} kg vol</span>
                      </div>
                    </li>
                  ))}
                </ul>

                {s.notes && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.3em] mb-1.5">Notas del atleta</p>
                    <p className="text-xs font-bold text-white/70 leading-relaxed whitespace-pre-line">{s.notes}</p>
                  </div>
                )}

                {s.analysisSummary && (
                  <div className="p-4 rounded-xl bg-blue-600/[0.06] border border-blue-500/15">
                    <p className="text-[8px] font-black text-blue-400/70 uppercase tracking-[0.3em] mb-1.5">El Arquitecto</p>
                    <p className="text-xs font-medium text-white/60 leading-relaxed whitespace-pre-line">
                      {s.analysisSummary.replace(/\*\*/g, "")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
