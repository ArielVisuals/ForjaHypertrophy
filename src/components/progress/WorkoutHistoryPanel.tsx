import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MUSCLE_GROUP_LABELS } from "@/lib/constants/programs";

interface ExerciseGroup {
  name: string;
  muscleGroup: string;
  sets: number;
  volume: number;
  topWeight: number;
}

interface SessionSet {
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe: number | null;
}

interface WorkoutSession {
  id: string;
  name: string;
  startedAt: string;
  durationMinutes: number | null;
  overallRpe: number | null;
  notes: string | null;
  totalSets: number;
  totalVolume: number;
  exercises: ExerciseGroup[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
}

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "HOY";
  if (days === 1) return "AYER";
  return `HACE ${days}D`;
}

export function WorkoutHistoryPanel() {
  const [sessions, setSessions]         = useState<WorkoutSession[]>([]);
  const [loading, setLoading]           = useState(true);
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [sessionSets, setSessionSets]   = useState<Record<string, SessionSet[]>>({});
  const [loadingSets, setLoadingSets]   = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workouts?action=history")
      .then(r => r.json())
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    try {
      await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", sessionId }),
      });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (expanded === sessionId) setExpanded(null);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = async (sessionId: string) => {
    if (expanded === sessionId) {
      setExpanded(null);
      return;
    }
    setExpanded(sessionId);
    if (!sessionSets[sessionId]) {
      setLoadingSets(sessionId);
      try {
        const r = await fetch(`/api/workouts?action=session-sets&sessionId=${sessionId}`);
        const data = await r.json();
        setSessionSets(prev => ({ ...prev, [sessionId]: data }));
      } catch {
        setSessionSets(prev => ({ ...prev, [sessionId]: [] }));
      } finally {
        setLoadingSets(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-white/[0.03] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-10 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 text-center">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">SIN SESIONES REGISTRADAS</p>
        <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest mt-2">Completa tu primer entrenamiento para ver el historial</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">HISTORIAL DE MISIONES</p>
          <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest mt-0.5">{sessions.length} SESIONES COMPLETADAS</p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20">
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{sessions.length} TOTAL</span>
        </div>
      </div>

      {sessions.map((session, i) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.03 }}
        >
          {/* Session row */}
          <div className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04] transition-all group cursor-pointer"
            onClick={() => toggleExpand(session.id)}
          >
            {/* Date badge */}
            <div className="shrink-0 text-center w-12">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">{daysAgo(session.startedAt)}</p>
              <p className="text-[9px] font-bold text-white/30 uppercase mt-0.5">{formatDate(session.startedAt)}</p>
            </div>

            <div className="w-[1px] h-8 bg-white/[0.06] shrink-0" />

            {/* Session name */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white uppercase tracking-tight truncate">{session.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {session.exercises.slice(0, 3).map(ex => (
                  <span key={ex.name} className="text-[8px] font-bold text-white/20 uppercase tracking-wider truncate">
                    {ex.name.split(" ").slice(0, 2).join(" ")}
                  </span>
                ))}
                {session.exercises.length > 3 && (
                  <span className="text-[8px] font-bold text-white/15 uppercase">+{session.exercises.length - 3}</span>
                )}
              </div>
            </div>

            {/* Stats + delete */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white/50 tabular-nums">
                  {session.totalVolume > 0
                    ? `${(session.totalVolume / 1000).toFixed(1)}T`
                    : `${session.totalSets} sets`}
                </p>
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                  {session.durationMinutes ? `${session.durationMinutes}MIN` : ""}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                disabled={deletingId === session.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 text-xs shrink-0 disabled:opacity-30"
                title="Eliminar sesión"
              >
                {deletingId === session.id ? "…" : "✕"}
              </button>
              <svg
                className={`w-4 h-4 text-white/20 transition-transform duration-200 shrink-0 ${expanded === session.id ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Expanded detail */}
          <AnimatePresence>
            {expanded === session.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-2 pb-3 px-2 space-y-1.5">
                  {/* Session stats bar */}
                  <div className="flex items-center gap-6 py-3 px-4 rounded-xl bg-white/[0.02]">
                    <div className="text-center">
                      <p className="text-sm font-black text-white tabular-nums">{session.totalSets}</p>
                      <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">SETS</p>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div className="text-center">
                      <p className="text-sm font-black text-white tabular-nums">
                        {session.totalVolume > 0 ? `${session.totalVolume.toLocaleString("es-ES")} KG` : "--"}
                      </p>
                      <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">VOLUMEN</p>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div className="text-center">
                      <p className="text-sm font-black text-white tabular-nums">{session.durationMinutes ?? "--"}</p>
                      <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">MIN</p>
                    </div>
                    {session.overallRpe && (
                      <>
                        <div className="w-[1px] h-6 bg-white/10" />
                        <div className="text-center">
                          <p className="text-sm font-black text-blue-400 tabular-nums">RPE {session.overallRpe}</p>
                          <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">ESFUERZO</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Session notes */}
                  {session.notes && (
                    <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-[7px] font-black text-blue-400/50 uppercase tracking-[0.3em] mb-1">NOTAS</p>
                      <p className="text-[11px] font-bold text-white/40 leading-relaxed">{session.notes}</p>
                    </div>
                  )}

                  {/* Exercise breakdown with sets */}
                  {loadingSets === session.id ? (
                    <div className="py-4 text-center text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">
                      Cargando sets...
                    </div>
                  ) : sessionSets[session.id] ? (
                    (() => {
                      const grouped = sessionSets[session.id].reduce<Record<string, SessionSet[]>>((acc, s) => {
                        if (!acc[s.exerciseName]) acc[s.exerciseName] = [];
                        acc[s.exerciseName].push(s);
                        return acc;
                      }, {});
                      return Object.entries(grouped).map(([exName, sets], j) => (
                        <div key={j} className="rounded-xl bg-white/[0.015] overflow-hidden">
                          {/* Exercise header */}
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[8px] font-black text-white/15 w-4 tabular-nums">{j + 1}</span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-white/70 uppercase tracking-tight truncate">{exName}</p>
                                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                  {MUSCLE_GROUP_LABELS[sets[0].muscleGroup] ?? sets[0].muscleGroup}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[11px] font-black text-white/40 tabular-nums">{sets.length} SETS</p>
                              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                TOP {Math.max(...sets.map(s => s.weightKg))} KG
                              </p>
                            </div>
                          </div>
                          {/* Sets table */}
                          <div className="px-4 py-2 space-y-1">
                            {/* Column headers */}
                            <div className="grid grid-cols-4 gap-2 pb-1">
                              {["SET", "KG", "REPS", "RPE"].map(h => (
                                <span key={h} className="text-[7px] font-black text-white/15 uppercase tracking-widest text-center">{h}</span>
                              ))}
                            </div>
                            {sets.map((s, k) => (
                              <div key={k} className="grid grid-cols-4 gap-2 py-1">
                                <span className="text-[10px] font-black text-white/30 tabular-nums text-center">{s.setNumber}</span>
                                <span className="text-[10px] font-black text-white/60 tabular-nums text-center">{s.weightKg}</span>
                                <span className="text-[10px] font-black text-white/60 tabular-nums text-center">{s.reps}</span>
                                <span className="text-[10px] font-black text-blue-400/60 tabular-nums text-center">
                                  {s.rpe ?? "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    session.exercises.map((ex, j) => (
                      <div key={j} className="flex items-center justify-between px-4 py-2.5 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[8px] font-black text-white/15 w-4 tabular-nums">{j + 1}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-white/70 uppercase tracking-tight truncate">{ex.name}</p>
                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                              {MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-black text-white/40 tabular-nums">{ex.sets} SETS</p>
                          {ex.topWeight > 0 && (
                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">TOP {ex.topWeight} KG</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
