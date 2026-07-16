import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MUSCLE_GROUP_LABELS } from "../../lib/constants/programs";
import { TechniqueModal } from "../shared/TechniqueModal";

/**
 * Vista del programa asignado al atleta. Solo lectura: el programa lo
 * diseña y asigna el entrenador. La unica accion del atleta es avanzar
 * de semana conforme progresa su mesociclo.
 */

interface ScheduleDay {
  dayNumber: number;
  name: string;
  shortName: string;
  isRest: boolean;
  focusMuscles: string[];
  exercises: {
    name: string;
    muscleGroup: string;
    targetSets: number;
    repRange: string;
    rirTarget: number | null;
    notes: string | null;
  }[];
}

export interface AssignedProgramData {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  splitType: string | null;
  focus: string | null;
  durationWeeks: number;
  currentWeek: number;
  schedule: ScheduleDay[];
}

interface AssignedProgramProps {
  program: AssignedProgramData | null;
  coachName?: string | null;
}

const DAY_NAMES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export function AssignedProgram({ program, coachName }: AssignedProgramProps) {
  const reduceMotion = useReducedMotion();
  const todayIdx = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(todayIdx);
  const [advancing, setAdvancing] = useState(false);
  const [techniqueName, setTechniqueName] = useState<string | null>(null);
  const [week, setWeek] = useState(program?.currentWeek ?? 1);

  if (!program) {
    return (
      <div className="max-w-2xl mx-auto p-10 sm:p-14 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 text-center space-y-4">
        <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.4em]">SIN PROGRAMA</p>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">
          Tu entrenador aun no te asigna un programa
        </h2>
        <p className="text-white/30 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
          En cuanto revise tu evaluacion inicial diseñara tu plan de entrenamiento y aparecera aqui.
        </p>
      </div>
    );
  }

  const day = program.schedule[selectedDay];
  const trainingDays = program.schedule.filter(d => !d.isRest).length;
  const weekProgress = Math.min(100, Math.round((week / program.durationWeeks) * 100));

  const advanceWeek = async () => {
    if (week >= program.durationWeeks || advancing) return;
    setAdvancing(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance-week", programId: program.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWeek(updated.currentWeek ?? week + 1);
      }
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Cabecera del programa */}
      <div className="p-6 sm:p-10 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.4em]">
              {coachName ? `ASIGNADO POR ${coachName.toUpperCase()}` : "ASIGNADO POR TU ENTRENADOR"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-none">
              {program.name}
            </h2>
            {program.description && (
              <p className="text-white/30 text-xs font-bold uppercase tracking-wider leading-relaxed max-w-xl pt-1">
                {program.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            {[program.level, program.focus, `${trainingDays} DIAS/SEMANA`].filter(Boolean).map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-black text-white/40 uppercase tracking-widest text-center">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Progreso del mesociclo */}
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              Semana <span className="text-white">{week}</span> de {program.durationWeeks}
            </p>
            <button
              type="button"
              onClick={advanceWeek}
              disabled={week >= program.durationWeeks || advancing}
              className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/35 transition-all disabled:opacity-25 disabled:pointer-events-none"
            >
              {advancing ? "Avanzando..." : week >= program.durationWeeks ? "Mesociclo completo" : "Completar semana"}
            </button>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <motion.div
              className="h-full bg-blue-600"
              animate={{ width: `${weekProgress}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Calendario semanal + detalle del dia */}
      <div className="p-6 sm:p-10 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 space-y-6">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {program.schedule.map((d, i) => {
            const isToday = i === todayIdx;
            const isSelected = i === selectedDay;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDay(i)}
                className={`rounded-xl p-2 sm:p-3 text-center space-y-1.5 transition-all ${
                  isSelected
                    ? "bg-blue-600/30 border border-blue-500/60"
                    : d.isRest
                    ? "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05]"
                    : "bg-blue-600/10 border border-blue-500/15 hover:bg-blue-600/20"
                }`}
              >
                <p className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 ${isToday ? "text-blue-400" : "text-white/25"}`}>
                  {DAY_NAMES[i]}
                  {isToday && <span className="w-1 h-1 rounded-full bg-blue-500 inline-block shrink-0" />}
                </p>
                {d.isRest ? (
                  <p className="text-[8px] sm:text-[9px] font-black text-white/15 uppercase tracking-tight">Descanso</p>
                ) : (
                  <>
                    <p className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-tight leading-tight line-clamp-2">
                      {d.shortName}
                    </p>
                    <p className="hidden sm:block text-[7px] font-black text-blue-400/50 uppercase tracking-widest">
                      {d.exercises.length} EJ
                    </p>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Detalle del dia seleccionado */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-baseline justify-between border-t border-white/[0.06] pt-5">
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">
                {day.isRest ? "Dia de descanso" : day.name}
              </h3>
              {!day.isRest && (
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                  {day.focusMuscles.map(m => MUSCLE_GROUP_LABELS[m] ?? m).join(" / ")}
                </p>
              )}
            </div>

            {day.isRest ? (
              <p className="text-white/25 text-xs font-bold uppercase tracking-widest">
                Recuperacion. El musculo crece cuando descansas.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {day.exercises.map((ex, i) => (
                  <li key={i} className="py-3.5 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setTechniqueName(ex.name)}
                      className="min-w-0 text-left group"
                      title="Ver técnica"
                    >
                      <p className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-blue-300 transition-colors">
                        {ex.name}
                        <span className="ml-2 text-[8px] font-black text-blue-400/50 uppercase tracking-widest align-middle group-hover:text-blue-300">Técnica</span>
                      </p>
                      <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mt-0.5">
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                        {ex.notes ? ` · ${ex.notes}` : ""}
                      </p>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[10px] font-black text-white/70 tabular-nums">
                        {ex.targetSets} x {ex.repRange}
                      </span>
                      {ex.rirTarget != null && (
                        <span className="px-2.5 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/25 text-[10px] font-black text-blue-300 tabular-nums">
                          RIR {ex.rirTarget}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {techniqueName && (
        <TechniqueModal exerciseName={techniqueName} onClose={() => setTechniqueName(null)} />
      )}
    </div>
  );
}
