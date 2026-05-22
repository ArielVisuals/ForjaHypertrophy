import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MASTER_PROGRAMS, SPLIT_SCHEDULES, MUSCLE_GROUP_LABELS, type MasterProgram } from "../../lib/constants/programs";

const DAY_NAMES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

function WeeklyScheduleView({ splitType }: { splitType: string }) {
  const schedule = SPLIT_SCHEDULES[splitType];
  if (!schedule) return (
    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest text-center py-3">
      Esquema personalizado — ajusta en el entrenamiento
    </p>
  );

  return (
    <div className="grid grid-cols-7 gap-1 pt-2">
      {schedule.map((day, i) => (
        <div key={i} className={`rounded-xl p-2 text-center space-y-1.5 ${day ? "bg-blue-600/10 border border-blue-500/15" : "bg-white/[0.02] border border-white/[0.04]"}`}>
          <p className="text-[7px] font-black uppercase tracking-widest text-white/20">{DAY_NAMES[i]}</p>
          {day ? (
            <>
              <p className="text-[8px] font-black text-white uppercase tracking-tight leading-tight line-clamp-2">{day.shortName}</p>
              <div className="flex flex-wrap gap-0.5 justify-center">
                {day.focusMuscles.slice(0, 2).map(m => (
                  <span key={m} className="text-[6px] font-black text-blue-400/60 uppercase tracking-widest whitespace-nowrap">
                    {(MUSCLE_GROUP_LABELS[m] ?? m).slice(0, 4)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[7px] font-black text-white/10 uppercase tracking-widest">DESC</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Fase de periodización según semana relativa
function getPeriodizationPhase(week: number, total: number): { label: string; color: string; bg: string } {
  const pct = week / total;
  if (total >= 6 && week >= total - 1) return { label: "DELOAD", color: "text-purple-400",  bg: "bg-purple-500/20 border-purple-500/30" };
  if (pct < 0.5)  return { label: "ACUM",   color: "text-blue-400",    bg: "bg-blue-500/20 border-blue-500/30" };
  return            { label: "INTENS",  color: "text-orange-400",  bg: "bg-orange-500/20 border-orange-500/30" };
}

function PeriodizationTimeline({ currentWeek, durationWeeks }: { currentWeek: number; durationWeeks: number }) {
  const weeks = Array.from({ length: durationWeeks }, (_, i) => i + 1);

  return (
    <div className="space-y-2 mt-6">
      <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.35em]">PERIODIZACIÓN</p>
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map(w => {
          const phase   = getPeriodizationPhase(w, durationWeeks);
          const isCurrent = w === currentWeek;
          const isPast    = w < currentWeek;
          return (
            <div
              key={w}
              className="flex-1 min-w-[18px] flex flex-col items-center gap-1"
            >
              <div
                className={`w-full h-5 rounded-sm flex items-center justify-center transition-all ${
                  isCurrent
                    ? "bg-white/90 ring-1 ring-white/40"
                    : isPast
                    ? "bg-white/10"
                    : "bg-white/[0.03] border border-white/[0.05]"
                }`}
              >
                {isCurrent && (
                  <span className="text-[5px] font-black text-black uppercase">HOY</span>
                )}
              </div>
              {/* Phase color dot */}
              <div className={`w-1 h-1 rounded-full ${
                isCurrent ? "bg-white" :
                isPast ? "bg-white/20" :
                phase.label === "DELOAD" ? "bg-purple-500/40" :
                phase.label === "ACUM"   ? "bg-blue-500/40" : "bg-orange-500/40"
              }`} />
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        {[
          { color: "bg-blue-500",   label: "ACUMULACIÓN" },
          { color: "bg-orange-500", label: "INTENSIFICACIÓN" },
          { color: "bg-purple-500", label: "DELOAD" },
        ].map(p => (
          <div key={p.label} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${p.color} opacity-50`} />
            <span className="text-[7px] font-black text-white/15 uppercase tracking-widest">{p.label}</span>
          </div>
        ))}
        <span className="ml-auto text-[7px] font-black text-white/15 uppercase tracking-widest">
          SEM {currentWeek}/{durationWeeks}
        </span>
      </div>
    </div>
  );
}

interface ProgramManagerProps {
  userId: string;
}

interface UserProgram {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  currentWeek: number;
  active: boolean;
  level: string;
  splitType: string;
}

interface BuilderDraft {
  name: string;
  splitType: string;
  durationWeeks: number;
  level: string;
  focus: string;
}

const SPLIT_OPTIONS = [
  { value: "PPL",          label: "PPL" },
  { value: "Arnold",       label: "Arnold Split" },
  { value: "UpperLower",   label: "Upper / Lower" },
  { value: "FullBody",     label: "Full Body" },
  { value: "BroSplit",     label: "Bro Split" },
  { value: "Powerbuilding",label: "Powerbuilding" },
];
const DURATION_OPTIONS  = [4, 6, 8, 10, 12, 16];
const LEVEL_OPTIONS     = ["Principiante", "Intermedio", "Avanzado", "Elite"];
const FOCUS_OPTIONS     = ["Hipertrofia", "Fuerza", "Powerbuilding", "Recomposición"];

export function ProgramManager({ userId }: ProgramManagerProps) {
  const [activePrograms, setActivePrograms] = useState<UserProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "library">("active");
  const [showBuilder, setShowBuilder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [confirmingAdvance, setConfirmingAdvance] = useState<string | null>(null);
  const [draft, setDraft] = useState<BuilderDraft>({
    name: "",
    splitType: "PPL",
    durationWeeks: 8,
    level: "Intermedio",
    focus: "Hipertrofia",
  });

  useEffect(() => {
    loadUserPrograms();
  }, [userId]);

  const loadUserPrograms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/programs?userId=${userId}`);
      const data = await response.json();
      setActivePrograms(data);
      // Si no tiene programas, mostrar la biblioteca por defecto
      if (data.length === 0) setView("library");
    } catch (e) {
      console.error("Error loading programs:", e);
    } finally {
      setLoading(false);
    }
  };

  const activateTemplate = async (master: MasterProgram) => {
    try {
      const response = await fetch("/api/programs", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          userId,
          name: master.name,
          description: master.description,
          level: master.level,
          splitType: master.splitType,
          focus: master.focus,
          durationWeeks: master.durationWeeks,
          active: true, // Se activa inmediatamente
        }),
      });

      if (response.ok) {
        setView("active");
        loadUserPrograms();
      }
    } catch (e) {
      alert("Error al activar programa");
    }
  };

  const createCustomProgram = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:       "create",
          userId,
          name:         draft.name.toUpperCase().trim(),
          splitType:    draft.splitType,
          durationWeeks: draft.durationWeeks,
          level:        draft.level,
          focus:        draft.focus,
          active:       false,
          isMaster:     false,
        }),
      });
      if (res.ok) {
        setShowBuilder(false);
        setDraft({ name: "", splitType: "PPL", durationWeeks: 8, level: "Intermedio", focus: "Hipertrofia" });
        loadUserPrograms();
      }
    } catch {
      alert("Error al crear programa");
    } finally {
      setSaving(false);
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm("¿Eliminar este programa?")) return;
    await fetch(`/api/programs?id=${id}`, { method: "DELETE" });
    setActivePrograms(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div className="text-white/20 font-black uppercase tracking-[0.3em] py-20 text-center">Iniciando Biblioteca...</div>;

  return (
    <div className="space-y-12">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-fit">
        <button
          onClick={() => setView("active")}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all ${view === "active" ? "bg-blue-600 text-white" : "text-white/40 hover:text-white"}`}
        >
          MIS PROGRAMAS
        </button>
        <button
          onClick={() => setView("library")}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all ${view === "library" ? "bg-blue-600 text-white" : "text-white/40 hover:text-white"}`}
        >
          BIBLIOTECA DE HIERRO
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === "library" ? (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {MASTER_PROGRAMS.map((master, idx) => (
              <div key={idx} className="group relative p-[1px] rounded-[3rem] bg-gradient-to-b from-blue-500/50 via-blue-500/10 to-transparent transition-all duration-500 hover:scale-[1.02] flex flex-col h-full">
                <div className="relative h-full p-10 rounded-[2.9rem] bg-[#0A0A0B] flex flex-col overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-10"></div>
                   
                   <div className="relative z-10 space-y-8 flex-grow">
                      <div className="space-y-4">
                        <div className="inline-flex px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] font-black text-blue-400 uppercase tracking-widest">{master.level}</div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{master.name}</h3>
                        <p className="text-white/50 text-sm leading-relaxed">{master.description}</p>
                      </div>

                      <div className="py-6 border-t border-white/5 space-y-4">
                        {master.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 text-white/70">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{f}</span>
                          </div>
                        ))}
                      </div>
                   </div>

                   <button 
                    onClick={() => activateTemplate(master)}
                    className="group relative z-10 mt-8 w-full py-4 px-6 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-white bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 transition-all flex items-center justify-center gap-3 shadow-xl"
                   >
                     <span>Activar Programa</span>
                     <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                   </button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Header row with create button */}
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
                {activePrograms.length} PROGRAMA{activePrograms.length !== 1 ? "S" : ""}
              </p>
              <button
                onClick={() => setShowBuilder(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${
                  showBuilder
                    ? "bg-white/[0.04] border-white/15 text-white/50"
                    : "bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25"
                }`}
              >
                {showBuilder ? "✕ Cancelar" : "+ Crear Programa"}
              </button>
            </div>

            {/* Program Builder Form */}
            <AnimatePresence>
              {showBuilder && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-7 rounded-[2.5rem] bg-[#0A0A0B] border border-blue-500/20 space-y-6">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">NUEVO PROGRAMA PERSONALIZADO</p>

                    {/* Nombre */}
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Nombre del programa</label>
                      <input
                        type="text"
                        autoFocus
                        placeholder="MI PROGRAMA..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-white font-black text-sm uppercase tracking-tight outline-none focus:border-blue-500/40 transition-all placeholder-white/15"
                        value={draft.name}
                        onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && createCustomProgram()}
                      />
                    </div>

                    {/* Split type */}
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Tipo de Split</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SPLIT_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setDraft(d => ({ ...d, splitType: opt.value }))}
                            className={`py-3 px-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                              draft.splitType === opt.value
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-white/[0.02] border-white/8 text-white/30 hover:border-white/15 hover:text-white/60"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duración + Nivel + Objetivo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Duración</label>
                        <select
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white font-black text-sm outline-none appearance-none cursor-pointer focus:border-blue-500/30 transition-all"
                          value={draft.durationWeeks}
                          onChange={e => setDraft(d => ({ ...d, durationWeeks: Number(e.target.value) }))}
                        >
                          {DURATION_OPTIONS.map(w => (
                            <option key={w} value={w}>{w} semanas</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Nivel</label>
                        <select
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white font-black text-sm outline-none appearance-none cursor-pointer focus:border-blue-500/30 transition-all"
                          value={draft.level}
                          onChange={e => setDraft(d => ({ ...d, level: e.target.value }))}
                        >
                          {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Objetivo</label>
                        <select
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white font-black text-sm outline-none appearance-none cursor-pointer focus:border-blue-500/30 transition-all"
                          value={draft.focus}
                          onChange={e => setDraft(d => ({ ...d, focus: e.target.value }))}
                        >
                          {FOCUS_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={createCustomProgram}
                      disabled={!draft.name.trim() || saving}
                      className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.25em] text-[10px] hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {saving ? "Creando..." : "Crear Programa"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {activePrograms.length === 0 && !showBuilder ? (
               <div className="py-20 text-center space-y-6">
                  <p className="text-white/20 font-black uppercase tracking-widest">Sin programas — crea uno o explora la biblioteca</p>
                  <button onClick={() => setView("library")} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10">Explorar Biblioteca</button>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activePrograms.map(p => (
                  <div key={p.id} className={`p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-[#0A0A0B] border transition-all group relative ${p.active ? 'border-blue-500/30 shadow-[0_0_50px_-12px_rgba(59,130,246,0.2)]' : 'border-white/5'}`}>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteProgram(p.id)}
                      className="absolute top-5 right-5 w-8 h-8 rounded-xl flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 text-xs"
                    >
                      ✕
                    </button>

                    <div className="flex justify-between items-start mb-8 pr-8">
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{p.splitType} · SEM {p.currentWeek}/{p.durationWeeks}</div>
                        <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">{p.name}</h3>
                      </div>
                      {p.active && <div className="px-3 py-1 rounded-full bg-blue-500 text-[8px] font-black uppercase tracking-widest shrink-0">ACTIVO</div>}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-6 space-y-2">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-all duration-700 rounded-full"
                          style={{ width: `${Math.round((p.currentWeek / p.durationWeeks) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                        <span>SEM {p.currentWeek}</span>
                        <span className="text-blue-400">{Math.round((p.currentWeek / p.durationWeeks) * 100)}%</span>
                        <span>SEM {p.durationWeeks}</span>
                      </div>
                    </div>

                    {/* Stats + advance */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                        <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">FOCUS</div>
                        <div className="text-xs font-black text-white uppercase">{p.level}</div>
                      </div>
                      <div className="flex-1 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                        <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">DURACIÓN</div>
                        <div className="text-xs font-black text-white">{p.durationWeeks} SEM</div>
                      </div>
                      {!p.active && (
                        <button
                          onClick={async () => {
                            await fetch("/api/programs", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "toggle", programId: p.id, userId }),
                            });
                            loadUserPrograms();
                          }}
                          className="flex-1 p-4 rounded-xl bg-blue-600/15 border border-blue-500/25 text-center hover:bg-blue-600/30 transition-all cursor-pointer"
                        >
                          <div className="text-[8px] font-bold text-blue-400/60 uppercase tracking-widest mb-1">ACTIVAR</div>
                          <div className="text-xs font-black text-blue-400">↗</div>
                        </button>
                      )}
                      {p.active && p.currentWeek < p.durationWeeks && (
                        confirmingAdvance === p.id ? (
                          <div className="flex-1 flex items-center gap-1.5">
                            <button
                              onClick={async () => {
                                setConfirmingAdvance(null);
                                await fetch("/api/programs", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "advance-week", programId: p.id }),
                                });
                                loadUserPrograms();
                              }}
                              className="flex-1 p-4 rounded-xl bg-blue-600 border border-blue-500 text-center active:scale-95 cursor-pointer"
                            >
                              <div className="text-[8px] font-black text-white uppercase tracking-widest">SEM {p.currentWeek + 1} ✓</div>
                            </button>
                            <button
                              onClick={() => setConfirmingAdvance(null)}
                              className="w-10 h-[58px] rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 text-xs transition-all"
                            >✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingAdvance(p.id)}
                            className="flex-1 p-4 rounded-xl bg-blue-600/15 border border-blue-500/25 text-center hover:bg-blue-600/30 transition-all active:scale-95 cursor-pointer"
                          >
                            <div className="text-[8px] font-bold text-blue-400/60 uppercase tracking-widest mb-1">AVANZAR</div>
                            <div className="text-xs font-black text-blue-400">SEM {p.currentWeek + 1}</div>
                          </button>
                        )
                      )}
                      {p.active && p.currentWeek >= p.durationWeeks && (
                        <div className="flex-1 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <div className="text-[8px] font-bold text-emerald-400/60 uppercase tracking-widest mb-1">ESTADO</div>
                          <div className="text-xs font-black text-emerald-400">COMPLETO</div>
                        </div>
                      )}
                    </div>

                    {/* Periodization timeline */}
                    <PeriodizationTimeline
                      currentWeek={p.currentWeek}
                      durationWeeks={p.durationWeeks}
                    />

                    {/* Weekly schedule toggle */}
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedSchedule(expandedSchedule === p.id ? null : p.id)}
                        className="w-full flex items-center justify-between py-2.5 px-1 text-[8px] font-black text-white/20 uppercase tracking-widest hover:text-white/40 transition-colors"
                      >
                        <span>HORARIO SEMANAL</span>
                        <span className={`transition-transform duration-200 ${expandedSchedule === p.id ? "rotate-180" : ""}`}>▾</span>
                      </button>
                      <AnimatePresence>
                        {expandedSchedule === p.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <WeeklyScheduleView splitType={p.splitType} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
