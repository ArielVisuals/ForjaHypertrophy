import { useState, useEffect } from "react";
import { getTodaysProgramDay, MUSCLE_GROUP_LABELS, type ProgramDaySchedule } from "@/lib/constants/programs";

interface ActiveProgram {
  name: string;
  splitType: string;
  currentWeek: number;
  durationWeeks: number;
}

interface TodayPlanBannerProps {
  activeProgram: ActiveProgram;
  lastCompletedAt?: string | null; // ISO timestamp of the most recent completed session
}

export function TodayPlanBanner({ activeProgram, lastCompletedAt }: TodayPlanBannerProps) {
  const [todayPlan] = useState<ProgramDaySchedule | null>(() =>
    getTodaysProgramDay(activeProgram.splitType)
  );

  // Start false (SSR-safe). useEffect runs only in the browser so
  // Date.getDate() uses the user's local timezone — no hydration mismatch.
  const [alreadyTrained, setAlreadyTrained] = useState(false);
  useEffect(() => {
    if (!lastCompletedAt) return;
    const completed = new Date(lastCompletedAt);
    const now = new Date();
    setAlreadyTrained(
      completed.getFullYear() === now.getFullYear() &&
      completed.getMonth()    === now.getMonth()    &&
      completed.getDate()     === now.getDate()
    );
  }, [lastCompletedAt]);

  const todayDayName = new Date()
    .toLocaleDateString("es-ES", { weekday: "long" })
    .toUpperCase();

  // ── Rest day ──────────────────────────────────────────────────────────────
  if (!todayPlan) {
    return (
      <div className="w-full rounded-[2.5rem] bg-[#0A0A0B] border border-white/8 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em]">HOY · {todayDayName} · DESCANSO</p>
            <p className="text-sm font-black text-white uppercase tracking-tight mt-0.5">Día de Recuperación Activa</p>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{activeProgram.name}</p>
          </div>
        </div>
        {!alreadyTrained && (
          <a href="/workout" className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all whitespace-nowrap">
            SESIÓN LIBRE →
          </a>
        )}
        {alreadyTrained && (
          <a href="/workout" className="px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">
            ✓ VER SESIÓN
          </a>
        )}
      </div>
    );
  }

  // ── Training day — already trained ────────────────────────────────────────
  if (alreadyTrained) {
    return (
      <div className="w-full rounded-[2.5rem] bg-[#0A0A0B] border border-emerald-500/20 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch">

          <div className="flex flex-col justify-center px-8 py-6 border-b lg:border-b-0 lg:border-r border-white/5 shrink-0 lg:w-72">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em]">HOY · {todayDayName} · COMPLETADO</span>
            </div>
            <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{todayPlan.name}</p>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">{activeProgram.name}</p>
          </div>

          <div className="flex flex-col justify-center px-8 py-6 flex-1 border-b lg:border-b-0 lg:border-r border-white/5">
            <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">
              SESIÓN REGISTRADA. DESCANSA Y RECUPERA.
            </p>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">
              Solo se permite un entrenamiento por día.
            </p>
          </div>

          <div className="flex flex-col justify-center items-center lg:items-end px-8 py-6 shrink-0 gap-3">
            <a href="/workout" className="px-8 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-[0.2em] text-[9px] hover:bg-emerald-500/20 transition-all whitespace-nowrap">
              VER RESUMEN →
            </a>
            <a href="/progress" className="text-[8px] font-black text-white/20 uppercase tracking-widest hover:text-white/40 transition-all">
              IR A PROGRESO →
            </a>
          </div>

        </div>
      </div>
    );
  }

  // ── Training day — pending ────────────────────────────────────────────────
  return (
    <div className="w-full rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-stretch">

        <div className="flex flex-col justify-center px-8 py-6 border-b lg:border-b-0 lg:border-r border-white/5 shrink-0 lg:w-72">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em]">HOY · {todayDayName}</span>
          </div>
          <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{todayPlan.name}</p>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">{activeProgram.name}</p>
        </div>

        <div className="flex flex-col justify-center px-8 py-6 flex-1 border-b lg:border-b-0 lg:border-r border-white/5">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-3">MÚSCULOS OBJETIVO</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {todayPlan.focusMuscles.map((m) => (
              <span key={m} className="px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/30 text-[9px] font-black text-blue-300 uppercase tracking-widest">
                {MUSCLE_GROUP_LABELS[m] ?? m}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {todayPlan.exercises.slice(0, 4).map((ex) => (
              <span key={ex.name} className="text-[9px] font-bold text-white/30 uppercase tracking-wide">· {ex.name}</span>
            ))}
            {todayPlan.exercises.length > 4 && (
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-wide">+{todayPlan.exercises.length - 4} más</span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center items-center lg:items-end px-8 py-6 shrink-0 gap-4">
          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-2xl font-black text-white tabular-nums">{todayPlan.exercises.length}</div>
              <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">EJERCICIOS</div>
            </div>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <div>
              <div className="text-2xl font-black text-white tabular-nums">
                {todayPlan.exercises.reduce((acc, e) => acc + e.targetSets, 0)}
              </div>
              <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">SETS PLAN</div>
            </div>
          </div>
          <a href="/workout" className="px-8 py-3 rounded-xl bg-blue-600 text-white font-black uppercase tracking-[0.25em] text-[9px] shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95 whitespace-nowrap">
            FORJAR AHORA →
          </a>
        </div>

      </div>
    </div>
  );
}
