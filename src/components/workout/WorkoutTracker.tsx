import { useState, useEffect, useCallback, type ReactNode } from "react";
import { enqueue, syncQueue, removeByTempSession } from "@/lib/offlineQueue";
import { fetchExercisesCached } from "@/lib/exerciseCache";
import { saveActiveSession, getActiveSession, clearActiveSession, type PersistedSession } from "@/lib/sessionPersistence";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseSelector } from "./ExerciseSelector";
import { RestTimer } from "./RestTimer";
import { ExerciseHistoryDrawer } from "./ExerciseHistoryDrawer";
import NumberTicker from "../ui/NumberTicker";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { MUSCLE_GROUP_LABELS } from "@/lib/constants/programs";
import type { ScheduleDay } from "@/lib/db/programs";
import type { MuscleGroup } from "@/types/workout";

// Lightweight Markdown renderer for El Arquitecto output
function parseBold(text: string): ReactNode[] {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900 }}>{part}</strong>
      : part
  );
}

function ArchitectMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { nodes.push(<div key={i} style={{ height: "0.5rem" }} />); continue; }

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <p key={i} style={{ fontSize: "9px", fontWeight: 900, color: "rgba(129,140,248,0.8)", textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: "0.5rem", marginTop: i === 0 ? 0 : "1rem" }}>
          {trimmed.slice(3)}
        </p>
      );
    } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      nodes.push(
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span style={{ color: "rgba(129,140,248,0.5)", flexShrink: 0, fontSize: "11px" }}>›</span>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: 0 }}>
            {parseBold(trimmed.slice(2))}
          </p>
        </div>
      );
    } else {
      nodes.push(
        <p key={i} style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "0.375rem" }}>
          {parseBold(trimmed)}
        </p>
      );
    }
  }
  return <>{nodes}</>;
}

interface TodaySessionSummary {
  id: string;
  name: string;
  date: string;        // "YYYY-MM-DD" in user's local timezone
  completedAt: string;
  durationMinutes: number | null;
  overallRpe: number | null;
  analysisSummary?: string | null;
  exercises: {
    name: string;
    muscleGroup: string;
    sets: { weightKg: number; reps: number; rpe: number | null }[];
  }[];
}

interface WorkoutTrackerProps {
  initialProgram?: ActiveProgram | null;
  todaySession?: TodaySessionSummary | null;
}

interface SetLog {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rir: number;
  completed: boolean;
}

interface GhostSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number | null;
}

interface ExerciseSession {
  id: string;
  name: string;
  muscleGroup: string;
  sets: SetLog[];
  lastSessionSets?: GhostSet[];
  previousPerformance?: { weight: number; reps: number; date?: string };
  historicalMax?: number;
  estimatedOneRM?: number;
  suggestedWeight?: number;
  progressionDir?: "up" | "hold" | "down";
  notes?: string;
  prescribedRepRange?: string;
  prescribedRirTarget?: number;
}

interface PrAlert {
  exerciseName: string;
  weight: number;
  reps: number;
}

interface ActiveProgram {
  id: string;
  name: string;
  currentWeek: number;
  durationWeeks: number;
  /** 7 dias (0=Dom..6=Sab) con la prescripcion asignada por el entrenador */
  schedule: ScheduleDay[];
}

export function WorkoutTracker({ initialProgram, todaySession }: WorkoutTrackerProps) {
  const [session, setSession]             = useState<{ id: string; name: string } | null>(null);
  const [exercises, setExercises]         = useState<ExerciseSession[]>([]);
  const [startTime, setStartTime]         = useState<number | null>(null);
  const [elapsedTime, setElapsedTime]     = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration]   = useState(90);
  const [showRating, setShowRating]       = useState(false);
  const [showSummary, setShowSummary]     = useState(false);
  const [sessionVolume, setSessionVolume] = useState(0);
  const [sessionRpe, setSessionRpe]       = useState(7);
  const [sessionNotes, setSessionNotes]   = useState("");
  const [prAlert, setPrAlert]             = useState<PrAlert | null>(null);
  const [sessionPrs, setSessionPrs]       = useState<PrAlert[]>([]);
  const [activeProgram, setActiveProgram] = useState<ActiveProgram | null>(initialProgram ?? null);
  const [weekAdvanced, setWeekAdvanced]   = useState(false);
  const [todayPlan, setTodayPlan]         = useState<ScheduleDay | null>(() =>
    initialProgram ? initialProgram.schedule[new Date().getDay()] ?? null : null
  );
  const [selectorFilter, setSelectorFilter] = useState<MuscleGroup | "all">("all");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [templates, setTemplates]         = useState<{ id: string; name: string; exercises: any[] }[]>([]);
  const [templateName, setTemplateName]   = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [recoverySuggestions, setRecoverySuggestions] = useState<{ muscle: string; status: string; daysAgo: number | null }[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling]       = useState(false);
  const [drawerExercise, setDrawerExercise] = useState<ExerciseSession | null>(null);
  const [loadingPlan, setLoadingPlan]     = useState(false);
  const [architectAnalysis, setArchitectAnalysis] = useState<string | null>(null);
  const [analyzingSession, setAnalyzingSession]   = useState(false);
  const [isOffline, setIsOffline]                 = useState(false);
  const [interrupted, setInterrupted]             = useState<PersistedSession | null>(null);
  const [copyFormat, setCopyFormat]               = useState<"md" | "json">("md");
  const [copied, setCopied]                       = useState(false);

  // Programa activo: ya disponible desde SSR; solo hace fetch si faltó (sin programa activo server-side)
  useEffect(() => {
    if (!initialProgram) {
      fetch("/api/programs?action=active")
        .then(r => r.json())
        .then((program: ActiveProgram | null) => {
          if (!program) return;
          setActiveProgram(program);
          setTodayPlan(program.schedule[new Date().getDay()] ?? null);
        })
        .catch(console.error);
    }

    // Templates y recovery son secundarios — siguen siendo client-side
    fetch("/api/templates")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTemplates(data); })
      .catch(console.error);

    fetch("/api/workouts?action=recovery")
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) setRecoverySuggestions(data);
      })
      .catch(console.error);
  }, []);

  // Temporizador de sesión
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-dismiss PR alert tras 4 segundos
  useEffect(() => {
    if (!prAlert) return;
    const t = setTimeout(() => setPrAlert(null), 4000);
    return () => clearTimeout(t);
  }, [prAlert]);

  // On mount: check for interrupted session
  useEffect(() => {
    getActiveSession().then(saved => {
      if (!saved) return;
      const exs = Array.isArray(saved.exercises) ? saved.exercises : [];
      const valid = exs.length > 0 && exs.every((e: any) => Array.isArray(e?.sets));
      if (!valid) { clearActiveSession(); return; }
      setInterrupted(saved);
    }).catch(console.error);
  }, []);

  // Auto-save active session state on every exercise change
  useEffect(() => {
    if (!session || exercises.length === 0) return;
    const timer = setTimeout(() => {
      saveActiveSession({
        sessionId:    session.id,
        sessionName:  session.name,
        elapsedTime,
        savedAt:      Date.now(),
        exercises,
      }).catch(console.error);
    }, 800);
    return () => clearTimeout(timer);
  }, [session, exercises]); // elapsedTime intentionally omitted — captured on exercise events

  // Online/offline detection + auto-sync when reconnecting
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = async () => {
      setIsOffline(false);
      const { synced } = await syncQueue();
      if (synced > 0) console.log(`[FORJA] ${synced} operación(es) sincronizada(s)`);
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatTime = (s: number) => {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startFromTemplate = async (tmpl: { id: string; name: string; exercises: any[] }) => {
    await createSession(tmpl.name.toUpperCase());
    setLoadingPlan(true);
    try {
      const histResults = await Promise.all(
        tmpl.exercises.map(({ id }: any) =>
          Promise.all([
            fetch(`/api/exercises?action=history&exerciseId=${id}`)
              .then(r => r.json()).catch(() => null),
            fetch(`/api/exercises?action=last-sets&exerciseId=${id}`)
              .then(r => r.json()).catch(() => []),
          ])
        )
      );

      const exerciseList: ExerciseSession[] = tmpl.exercises.map((ex: any, i: number) => {
        const [hist, lastSets] = histResults[i];
        const defaultWeight = hist?.suggestedWeight ?? hist?.lastWeight ?? 0;
        const sets: SetLog[] = Array.from({ length: 3 }, (_, k) => ({
          id: crypto.randomUUID(), setNumber: k + 1,
          reps: 0, weightKg: defaultWeight, rir: 2, completed: false,
        }));
        return {
          id: ex.id, name: ex.name, muscleGroup: ex.muscleGroup, sets,
          lastSessionSets:    Array.isArray(lastSets) && lastSets.length > 0 ? lastSets : undefined,
          previousPerformance: hist?.lastWeight ? { weight: hist.lastWeight, reps: hist.lastReps, date: hist.lastDate } : undefined,
          historicalMax:       hist?.maxWeight,
          estimatedOneRM:      hist?.estimatedOneRM,
          suggestedWeight:     hist?.suggestedWeight,
          progressionDir:      hist?.progressionDir,
        };
      });
      setExercises(exerciseList);
    } catch {
      setExercises(tmpl.exercises.map((ex: any) => ({
        id: ex.id, name: ex.name, muscleGroup: ex.muscleGroup,
        sets: [{ id: crypto.randomUUID(), setNumber: 1, reps: 0, weightKg: 0, rir: 2, completed: false }],
      })));
    } finally {
      setLoadingPlan(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim() || exercises.length === 0) return;
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          exercises: exercises.map(e => ({ id: e.id, name: e.name, muscleGroup: e.muscleGroup })),
        }),
      });
      if (res.ok) {
        const newTmpl = await res.json();
        setTemplates(prev => [newTmpl, ...prev]);
        setTemplateName("");
      }
    } catch (e) {
      console.error("Error saving template:", e);
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const loadPlanExercises = async (planExercises: ScheduleDay["exercises"]) => {
    setLoadingPlan(true);
    try {
      // Cached-first: works online and offline
      const allExercises = await fetchExercisesCached();
      const nameMap = new Map(allExercises.map(ex => [ex.name.toLowerCase(), ex]));

      // Resolve or create each plan exercise
      const resolved: { id: string; name: string; muscleGroup: string; planEx: ScheduleDay["exercises"][number] }[] = [];
      for (const planEx of planExercises) {
        const existing = nameMap.get(planEx.name.toLowerCase());
        if (existing) {
          resolved.push({ id: existing.id, name: planEx.name, muscleGroup: planEx.muscleGroup, planEx });
        } else if (navigator.onLine) {
          try {
            const r = await fetch("/api/exercises", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: planEx.name, muscleGroup: planEx.muscleGroup }),
            });
            const created = await r.json();
            resolved.push({ id: created.id, name: planEx.name, muscleGroup: planEx.muscleGroup, planEx });
          } catch {
            resolved.push({ id: crypto.randomUUID(), name: planEx.name, muscleGroup: planEx.muscleGroup, planEx });
          }
        } else {
          resolved.push({ id: crypto.randomUUID(), name: planEx.name, muscleGroup: planEx.muscleGroup, planEx });
        }
      }

      // Batch-fetch history — skipped when offline (no data = default weights, still fully usable)
      const histResults = await Promise.all(
        resolved.map(({ id }) =>
          navigator.onLine
            ? Promise.all([
                fetch(`/api/exercises?action=history&exerciseId=${id}`)
                  .then(r => r.json()).catch(() => null),
                fetch(`/api/exercises?action=last-sets&exerciseId=${id}`)
                  .then(r => r.json()).catch(() => []),
              ])
            : Promise.resolve([null, []] as [null, never[]])
        )
      );

      const exerciseList: ExerciseSession[] = resolved.map(({ id, name, muscleGroup, planEx }, i) => {
        const [hist, lastSets] = histResults[i];
        const defaultWeight = hist?.suggestedWeight ?? hist?.lastWeight ?? 0;

        const sets: SetLog[] = Array.from({ length: planEx.targetSets }, (_, k) => ({
          id:        crypto.randomUUID(),
          setNumber: k + 1,
          reps:      0,
          weightKg:  defaultWeight,
          rir:       planEx.rirTarget ?? 2,
          completed: false,
        }));

        return {
          id, name, muscleGroup, sets,
          lastSessionSets: Array.isArray(lastSets) && lastSets.length > 0 ? lastSets : undefined,
          previousPerformance: hist?.lastWeight
            ? { weight: hist.lastWeight, reps: hist.lastReps, date: hist.lastDate }
            : undefined,
          historicalMax:       hist?.maxWeight,
          estimatedOneRM:      hist?.estimatedOneRM,
          suggestedWeight:     hist?.suggestedWeight,
          progressionDir:      hist?.progressionDir,
          prescribedRepRange:  planEx.repRange,
          prescribedRirTarget: planEx.rirTarget ?? undefined,
        };
      });

      setExercises(exerciseList);
    } catch (e) {
      console.error("Error loading plan exercises:", e);
    } finally {
      setLoadingPlan(false);
    }
  };

  const buildSessionName = useCallback(() => {
    if (activeProgram && todayPlan) {
      return `${activeProgram.name.toUpperCase()} · ${todayPlan.shortName.toUpperCase()} · SEM ${activeProgram.currentWeek}`;
    }
    if (activeProgram) {
      return `${activeProgram.name.toUpperCase()} · SEMANA ${activeProgram.currentWeek}`;
    }
    const dayName = new Date()
      .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })
      .toUpperCase();
    return `SESIÓN LIBRE — ${dayName}`;
  }, [activeProgram, todayPlan]);

  const createSession = async (name: string) => {
    setInterrupted(null);
    const localDate = new Date().toLocaleDateString("en-CA");
    if (!navigator.onLine) {
      const tempId = `OFFLINE_${crypto.randomUUID()}`;
      await enqueue("create-session", { action: "create", name, localDate }, tempId);
      const data = { id: tempId, name };
      setSession(data);
      setStartTime(Date.now());
      return data;
    }
    const response = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name, localDate }),
    });
    const data = await response.json();
    setSession(data);
    setStartTime(Date.now());
    return data;
  };

  const startFreeSession = async () => {
    await createSession(buildSessionName());
  };

  const startWithPlan = async () => {
    if (!todayPlan) return;
    await createSession(buildSessionName());
    if (!todayPlan.isRest && todayPlan.exercises.length > 0) {
      await loadPlanExercises(todayPlan.exercises);
    }
  };

  const addExercise = async (ex: any) => {
    const exerciseId = ex.id;
    let previousPerformance: ExerciseSession["previousPerformance"];
    let historicalMax: number | undefined;
    let estimatedOneRM: number | undefined;
    let suggestedWeight: number | undefined;
    let progressionDir: ExerciseSession["progressionDir"];
    let lastSessionSets: GhostSet[] | undefined;

    setLoadingHistory(true);
    try {
      const [histRes, lastRes] = await Promise.all([
        fetch(`/api/exercises?action=history&exerciseId=${exerciseId}`),
        fetch(`/api/exercises?action=last-sets&exerciseId=${exerciseId}`),
      ]);
      const hist = await histRes.json();
      const last = await lastRes.json();

      if (hist?.lastWeight) {
        previousPerformance = { weight: hist.lastWeight, reps: hist.lastReps, date: hist.lastDate };
        historicalMax       = hist.maxWeight;
        estimatedOneRM      = hist.estimatedOneRM;
        suggestedWeight     = hist.suggestedWeight;
        progressionDir      = hist.progressionDir;
      }
      if (Array.isArray(last) && last.length > 0) {
        lastSessionSets = last;
      }
    } catch (e) {
      console.error("No se pudo cargar historial del ejercicio:", e);
    } finally {
      setLoadingHistory(false);
    }

    setExercises(prev => [
      ...prev,
      {
        id:          exerciseId,
        name:        ex.name,
        muscleGroup: ex.muscleGroup || ex.muscle_group,
        sets: [{
          id:        crypto.randomUUID(),
          setNumber: 1,
          reps:      0,
          weightKg:  suggestedWeight ?? (previousPerformance?.weight ?? 0),
          rir:       2,
          completed: false,
        }],
        lastSessionSets,
        previousPerformance,
        historicalMax,
        estimatedOneRM,
        suggestedWeight,
        progressionDir,
      },
    ]);
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetLog, value: any) => {
    setExercises(prev =>
      prev.map((ex, i) =>
        i !== exIdx ? ex : {
          ...ex,
          sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: value }),
        }
      )
    );
  };

  const completeSet = async (exIdx: number, setIdx: number) => {
    const ex  = exercises[exIdx];
    const set = ex.sets[setIdx];
    const isCardio = ex.muscleGroup === "cardio";
    if (!isCardio && set.reps <= 0) return alert("Registra las repeticiones");
    if (!session) return;

    const setPayload = {
      workoutSessionId: session.id,
      exerciseId:       ex.id,
      setNumber:        set.setNumber,
      reps:             isCardio ? 1 : set.reps,
      weightKg:         (!isCardio && set.weightKg > 0) ? set.weightKg.toString() : null,
      rpe:              isCardio ? null : (10 - set.rir),
      completed:        true,
    };
    const isOfflineSession = session.id.startsWith("OFFLINE_");
    if (isOfflineSession || !navigator.onLine) {
      await enqueue("add-set", setPayload, isOfflineSession ? session.id : undefined);
    } else {
      try {
        await fetch("/api/workouts/sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setPayload),
        });
      } catch {
        await enqueue("add-set", setPayload);
      }
    }

    // Cardio: just mark completed, no PR detection, no rest timer
    if (isCardio) {
      setExercises(prev =>
        prev.map((exercise, i) =>
          i !== exIdx ? exercise : {
            ...exercise,
            sets: exercise.sets.map((s, j) => j !== setIdx ? s : { ...s, completed: true }),
          }
        )
      );
      return;
    }

    // 1RM-based PR using Epley formula (more accurate than raw weight)
    const current1RM = set.reps > 0 && set.weightKg > 0
      ? Math.round(set.weightKg * (1 + set.reps / 30))
      : 0;
    const prev1RM    = ex.estimatedOneRM ?? 0;
    const isPR1RM    = current1RM > 0 && prev1RM > 0 && current1RM > prev1RM;
    // Fallback: raw weight PR when no 1RM history yet
    const isPRWeight = prev1RM === 0
      && ex.historicalMax !== undefined && ex.historicalMax !== null
      && set.weightKg > ex.historicalMax;
    const isPR = isPR1RM || isPRWeight;

    setExercises(prev =>
      prev.map((exercise, i) =>
        i !== exIdx ? exercise : {
          ...exercise,
          historicalMax:  isPR ? Math.max(set.weightKg, exercise.historicalMax ?? 0) : exercise.historicalMax,
          estimatedOneRM: isPR1RM ? current1RM : exercise.estimatedOneRM,
          sets: exercise.sets.map((s, j) =>
            j !== setIdx ? s : { ...s, completed: true }
          ),
        }
      )
    );

    if (isPR) {
      const pr: PrAlert = { exerciseName: ex.name, weight: set.weightKg, reps: set.reps };
      setPrAlert(pr);
      setSessionPrs(prev => {
        const idx = prev.findIndex(p => p.exerciseName === ex.name);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = pr;
          return updated;
        }
        return [...prev, pr];
      });
    }

    const isCompound = ["chest", "back", "legs"].includes(ex.muscleGroup);
    setRestDuration(isCompound ? 180 : 90);
    setShowRestTimer(true);
  };

  const addSet = (exIdx: number) => {
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id:        crypto.randomUUID(),
              setNumber: ex.sets.length + 1,
              reps:      last?.reps     ?? 0,
              weightKg:  last?.weightKg ?? 0,
              rir:       last?.rir      ?? ex.prescribedRirTarget ?? 2,
              completed: false,
            },
          ],
        };
      })
    );
  };

  const cancelSession = async () => {
    if (!session) return;
    setCancelling(true);
    if (session.id.startsWith("OFFLINE_")) {
      await removeByTempSession(session.id);
    } else {
      try {
        await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", sessionId: session.id }),
        });
      } catch (e) {
        console.error("Error cancelando sesión:", e);
      }
    }
    await clearActiveSession();
    setSession(null);
    setExercises([]);
    setStartTime(null);
    setElapsedTime(0);
    setShowCancelConfirm(false);
    setCancelling(false);
    setSessionPrs([]);
  };

  const finishSession = () => {
    if (!session) return;
    const volume = exercises
      .flatMap(e => e.sets)
      .filter(s => s.completed && s.weightKg > 0)
      .reduce((acc, s) => acc + s.weightKg * s.reps, 0);
    setSessionVolume(volume);
    setShowRating(true);
  };

  const advanceWeek = async () => {
    if (!activeProgram || weekAdvanced) return;
    try {
      await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance-week", programId: activeProgram.id }),
      });
      setWeekAdvanced(true);
    } catch (e) {
      console.error("Error advancing week:", e);
    }
  };

  const submitRating = async () => {
    if (!session) return;
    setAnalyzingSession(true);
    const durationMinutes = Math.max(1, Math.floor(elapsedTime / 60));
    const exerciseNotesMap = exercises
      .filter(e => e.notes?.trim())
      .map(e => ({ name: e.name, notes: e.notes!.trim() }));

    const completePayload = {
      action:        "complete",
      sessionId:     session.id,
      sessionName:   session.name,
      duration:      durationMinutes,
      overallRpe:    sessionRpe,
      notes:         sessionNotes || undefined,
      exerciseNotes: exerciseNotesMap.length > 0 ? exerciseNotesMap : undefined,
    };
    const isOfflineSession = session.id.startsWith("OFFLINE_");

    if (!navigator.onLine) {
      // Truly offline: queue and show placeholder
      await enqueue("complete-session", completePayload, isOfflineSession ? session.id : undefined);
      setArchitectAnalysis("Sesión guardada offline. El Arquitecto analizará los datos cuando recuperes conexión.");
    } else if (isOfflineSession) {
      // Session was created offline but device is now online: sync the full queue
      // (create-session → add-sets → complete-session) and capture El Arquitecto analysis
      await enqueue("complete-session", completePayload, session.id);
      try {
        const { analysis } = await syncQueue();
        setArchitectAnalysis(analysis ?? null);
      } catch {
        setArchitectAnalysis(null);
      }
    } else {
      // Normal online session: direct call
      try {
        const res = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(completePayload),
        });
        const payload = await res.json().catch(() => ({}));
        setArchitectAnalysis(payload.analysis ?? null);
      } catch {
        await enqueue("complete-session", completePayload);
        setArchitectAnalysis("Sesión guardada offline. El Arquitecto analizará los datos cuando recuperes conexión.");
      }
    }
    await clearActiveSession();
    setStartTime(null);
    setAnalyzingSession(false);
    setShowRating(false);
    setShowSummary(true);
  };

  const resumeSession = () => {
    if (!interrupted) return;
    setSession({ id: interrupted.sessionId, name: interrupted.sessionName });
    setExercises(interrupted.exercises);
    setElapsedTime(interrupted.elapsedTime);
    setStartTime(Date.now() - interrupted.elapsedTime * 1000);
    setInterrupted(null);
  };

  const dismissInterrupted = async () => {
    await clearActiveSession();
    setInterrupted(null);
  };

  // ─── SESIÓN INTERRUMPIDA ───────────────────────────────────────────────────
  if (!session && interrupted) {
    const safeExs   = Array.isArray(interrupted.exercises) ? interrupted.exercises : [];
    const minsAgo   = Math.round((Date.now() - interrupted.savedAt) / 60000);
    const totalSets = safeExs.flatMap((e: any) => Array.isArray(e?.sets) ? e.sets : []).length;
    const doneSets  = safeExs.flatMap((e: any) => Array.isArray(e?.sets) ? e.sets : []).filter((s: any) => s?.completed).length;

    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.97)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚡</div>
            <p style={{ fontSize: "9px", fontWeight: 900, color: "rgba(245,158,11,0.7)", textTransform: "uppercase", letterSpacing: "0.35em", marginBottom: "0.5rem" }}>
              SESIÓN INTERRUMPIDA
            </p>
            <h2 style={{ fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "0.625rem" }}>
              {interrupted.sessionName}
            </h2>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>
              {doneSets} de {totalSets} sets completados
              {" · "}guardado hace {minsAgo < 1 ? "menos de 1 min" : `${minsAgo} min`}
            </p>
          </div>

          {/* Exercises list */}
          <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "8px", fontWeight: 900, color: "rgba(245,158,11,0.5)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "0.75rem" }}>
              EJERCICIOS EN PROGRESO
            </p>
            {safeExs.map((ex: any, i: number) => {
              const sets  = Array.isArray(ex?.sets) ? ex.sets : [];
              const done  = sets.filter((s: any) => s?.completed).length;
              const total = sets.length;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: i < safeExs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{ex.name}</span>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: done === total ? "#34d399" : done > 0 ? "#f59e0b" : "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {done}/{total} sets
                  </span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <button
            onClick={resumeSession}
            style={{ width: "100%", display: "block", padding: "1.125rem", borderRadius: "1.25rem", background: "#f59e0b", color: "#000", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "11px", border: "none", cursor: "pointer", marginBottom: "0.75rem", boxSizing: "border-box" }}
          >
            Retomar sesión →
          </button>
          <button
            onClick={dismissInterrupted}
            style={{ width: "100%", display: "block", padding: "1rem", borderRadius: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.25)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "10px", cursor: "pointer", boxSizing: "border-box" }}
          >
            Descartar
          </button>

        </div>
      </motion.div>,
      document.body
    );
  }

  // ─── UTILIDAD: copiar resumen ─────────────────────────────────────────────
  type SummaryExercise = { name: string; muscleGroup: string; sets: { weightKg: number; reps: number; rir?: number | null }[] };
  type SummaryData = {
    name: string;
    date?: string;
    durationMinutes: number;
    overallRpe: number;
    totalVolumeKg: number;
    notes?: string | null;
    exercises: SummaryExercise[];
    prs?: { exerciseName: string; weight: number; reps: number }[];
  };

  const triggerCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildMarkdown = (d: SummaryData): string => {
    const h = Math.floor(d.durationMinutes / 60), m = d.durationMinutes % 60;
    const dur = h > 0 ? `${h}h ${m}min` : `${m}min`;
    let md = `# ${d.name}\n`;
    if (d.date) md += `**Fecha:** ${d.date}  \n`;
    md += `**Duración:** ${dur}  \n**RPE:** ${d.overallRpe}/10  \n`;
    if (d.totalVolumeKg > 0) md += `**Volumen total:** ${Math.round(d.totalVolumeKg).toLocaleString("es-ES")} kg  \n`;
    if (d.notes) md += `**Notas:** ${d.notes}  \n`;
    md += `\n## Ejercicios\n`;
    d.exercises.forEach(ex => {
      if (ex.sets.length === 0) return;
      md += `\n### ${ex.name} (${MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup})\n`;
      ex.sets.forEach((s, i) => {
        const w = s.weightKg > 0 ? `${s.weightKg}kg` : "Peso corporal";
        const r = s.rir != null && s.rir >= 0 ? ` · RIR ${s.rir}` : "";
        md += `- Set ${i + 1}: ${w} × ${s.reps}${r}\n`;
      });
    });
    if (d.prs && d.prs.length > 0) {
      md += `\n## Nuevos récords\n`;
      d.prs.forEach(pr => { md += `- **${pr.exerciseName}**: ${pr.weight}kg × ${pr.reps}\n`; });
    }
    return md;
  };

  const buildJson = (d: SummaryData): string => JSON.stringify({
    session:           d.name,
    date:              d.date ?? null,
    duration_minutes:  d.durationMinutes,
    overall_rpe:       d.overallRpe,
    total_volume_kg:   Math.round(d.totalVolumeKg),
    notes:             d.notes ?? null,
    exercises:         d.exercises.map(ex => ({
      name:         ex.name,
      muscle_group: ex.muscleGroup,
      sets:         ex.sets.map((s, i) => ({ set: i + 1, weight_kg: s.weightKg, reps: s.reps, rir: s.rir ?? null })),
    })),
    personal_records: d.prs ?? [],
  }, null, 2);

  const CopyBar = ({ data }: { data: SummaryData }) => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem" }}>
      {(["md", "json"] as const).map(fmt => (
        <button
          key={fmt}
          onClick={() => setCopyFormat(fmt)}
          style={{
            padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "9px", fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: "pointer",
            background: copyFormat === fmt ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
            color:      copyFormat === fmt ? "#fff" : "rgba(255,255,255,0.3)",
            transition: "all 0.15s",
          }}
        >
          {fmt === "md" ? "Markdown" : "JSON"}
        </button>
      ))}
      <button
        onClick={() => triggerCopy(copyFormat === "md" ? buildMarkdown(data) : buildJson(data))}
        style={{
          marginLeft: "auto", padding: "0.375rem 1rem", borderRadius: "0.5rem", fontSize: "9px",
          fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "none",
          cursor: "pointer", transition: "all 0.15s",
          background: copied ? "rgba(52,211,153,0.15)" : "rgba(37,99,235,0.2)",
          color:      copied ? "#34d399"               : "#60a5fa",
        }}
      >
        {copied ? "✓ Copiado" : "Copiar"}
      </button>
    </div>
  );

  // ─── YA ENTRENASTE HOY ────────────────────────────────────────────────────
  // Start false (SSR-safe). useEffect fires only in the browser so the local
  // clock is always correct — no hydration mismatch / flip.
  const [alreadyTrainedToday, setAlreadyTrainedToday] = useState(false);
  useEffect(() => {
    if (!todaySession?.completedAt) return;
    // Use the actual timestamp, not the stored date string (which was set server-side in UTC).
    // Date.getDate/Month/FullYear always use the browser's local timezone.
    const completed = new Date(todaySession.completedAt);
    const now = new Date();
    const isToday =
      completed.getFullYear() === now.getFullYear() &&
      completed.getMonth()    === now.getMonth()    &&
      completed.getDate()     === now.getDate();
    setAlreadyTrainedToday(isToday);
  }, [todaySession]);

  if (alreadyTrainedToday && !session && todaySession) {
    const s = todaySession;
    const totalSets = s.exercises.reduce((a, e) => a + e.sets.length, 0);
    const totalVol  = s.exercises.reduce(
      (a, e) => a + e.sets.reduce((b, set) => b + set.weightKg * set.reps, 0), 0
    );
    const fmt = (min: number) => `${Math.floor(min / 60)}h ${min % 60}min`;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ width: "100%", maxWidth: "680px", margin: "0 auto", padding: "0 0 5rem" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ fontSize: "9px", fontWeight: 900, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.35em", marginBottom: "0.75rem" }}>MISIÓN COMPLETADA</p>
            <h2 style={{ fontSize: "clamp(1.75rem,5vw,2.5rem)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "0.5rem" }}>{s.name}</h2>
            <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              {new Date(s.completedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · HOY
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
            {[
              { label: "DURACIÓN", value: s.durationMinutes ? fmt(s.durationMinutes) : "—", color: "#fff" },
              { label: "SETS",     value: String(totalSets), color: "#34d399" },
              { label: "RPE",      value: s.overallRpe ? `${s.overallRpe}/10` : "—", color: "#60a5fa" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.25rem", padding: "1.25rem", textAlign: "center" }}>
                <p style={{ fontSize: "8px", fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>{stat.label}</p>
                <p style={{ fontSize: "clamp(1rem,3vw,1.5rem)", fontWeight: 900, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Volumen total */}
          {totalVol > 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "1rem", padding: "0.875rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "8px", fontWeight: 900, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.2em" }}>VOLUMEN TOTAL</span>
              <span style={{ fontSize: "1.125rem", fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>{Math.round(totalVol).toLocaleString("es-ES")} KG</span>
            </div>
          )}

          {/* El Arquitecto */}
          {s.analysisSummary && (
            <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.22)", borderRadius: "1.5rem", padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 8px rgba(129,140,248,0.8)", flexShrink: 0 }} />
                <p style={{ fontSize: "8px", fontWeight: 900, color: "rgba(129,140,248,0.7)", textTransform: "uppercase", letterSpacing: "0.35em" }}>
                  EL ARQUITECTO · ANÁLISIS DE SESIÓN
                </p>
              </div>
              <ArchitectMarkdown text={s.analysisSummary} />
            </div>
          )}

          {/* Ejercicios */}
          <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.25rem", overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.25em" }}>EJERCICIOS</p>
            </div>
            {s.exercises.map((ex, i) => {
              const bestSet = ex.sets.length > 0
                ? ex.sets.reduce((b, set) => set.weightKg > b.weightKg ? set : b, ex.sets[0])
                : null;
              return (
                <div key={i} style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>{ex.name}</p>
                      <p style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginTop: "2px" }}>
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                      </p>
                    </div>
                    <span style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.4)" }}>{ex.sets.length} SETS</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {ex.sets.map((set, si) => (
                      <span key={si} style={{
                        fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
                        padding: "2px 7px", borderRadius: "6px",
                        color:      set === bestSet ? "#34d399" : "rgba(255,255,255,0.35)",
                        background: set === bestSet ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)",
                        border:     `1px solid ${set === bestSet ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}>
                        {set.weightKg > 0 ? `${set.weightKg}kg` : "BW"} × {set.reps}
                        {set.rpe != null ? ` · RIR ${10 - set.rpe}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Copiar resumen */}
          <CopyBar data={{
            name:           s.name,
            date:           new Date(s.completedAt).toLocaleDateString("es-ES"),
            durationMinutes: s.durationMinutes ?? 0,
            overallRpe:     s.overallRpe ?? 0,
            totalVolumeKg:  totalVol,
            exercises:      s.exercises.map(ex => ({
              name:        ex.name,
              muscleGroup: ex.muscleGroup,
              sets:        ex.sets.map(set => ({ weightKg: set.weightKg, reps: set.reps, rir: set.rpe != null ? 10 - set.rpe : null })),
            })),
          }} />

          {/* CTA */}
          <div style={{ textAlign: "center" }}>
            <a href="/dashboard" style={{ display: "inline-block", padding: "0.875rem 2rem", borderRadius: "1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "10px", fontWeight: 900, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.2em", textDecoration: "none" }}>
              ← VOLVER AL CENTRO DE MANDO
            </a>
          </div>

        </div>
      </motion.div>
    );
  }

  // ─── PANTALLA DE INICIO ────────────────────────────────────────────────────
  if (!session) {
    // Día de entrenamiento con plan
    if (activeProgram && todayPlan && !todayPlan.isRest) {
      const totalPlanSets = todayPlan.exercises.reduce((acc, e) => acc + e.targetSets, 0);

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start pb-8"
        >
          {/* ── Left panel (desktop): Info header + stats + buttons ── */}
          {/* On mobile: just renders the info header; stats+buttons appear after exercise list */}
          <div className="lg:col-span-4 space-y-4">

            {/* Program badge */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] truncate">
                {activeProgram.name} · SEM {activeProgram.currentWeek}
              </p>
            </div>

            {/* Day name — responsive */}
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9]">
              {todayPlan.name}
            </h2>

            {/* Muscle chips */}
            <div className="flex flex-wrap gap-2">
              {todayPlan.focusMuscles.map(m => (
                <span
                  key={m}
                  className="px-3 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-[9px] font-black text-blue-300 uppercase tracking-widest"
                >
                  {MUSCLE_GROUP_LABELS[m] ?? m}
                </span>
              ))}
            </div>

            {/* Stats + Buttons: desktop only (mobile renders after exercise list) */}
            <div className="hidden lg:grid grid-cols-2 gap-3 pt-2">
              <div className="p-5 rounded-[1.5rem] bg-[#0A0A0B] border border-white/[0.07] text-center">
                <div className="text-3xl font-black text-white tabular-nums">{todayPlan.exercises.length}</div>
                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">Ejercicios</div>
              </div>
              <div className="p-5 rounded-[1.5rem] bg-[#0A0A0B] border border-white/[0.07] text-center">
                <div className="text-3xl font-black text-white tabular-nums">{totalPlanSets}</div>
                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">Sets Plan</div>
              </div>
            </div>

            <div className="hidden lg:block space-y-3">
              <button
                onClick={startWithPlan}
                className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-blue-600/25 hover:bg-blue-500 transition-all active:scale-95"
              >
                Iniciar con el Plan
              </button>
              <button
                onClick={startFreeSession}
                className="w-full py-4 bg-white/[0.03] border border-white/10 text-white/40 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:text-white hover:border-white/20 transition-all"
              >
                Sesión Libre
              </button>
            </div>
          </div>

          {/* ── Right panel: Exercise list + mobile CTA ── */}
          <div className="lg:col-span-8 space-y-2">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.35em] pb-2">
              EJERCICIOS DEL PLAN — {todayPlan.exercises.length} MOVIMIENTOS
            </p>

            {todayPlan.exercises.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#0A0A0B] border border-white/[0.06] hover:border-white/10 transition-all"
              >
                {/* Number */}
                <span className="text-[10px] font-black text-white/15 tabular-nums w-4 shrink-0 text-center">{i + 1}</span>

                {/* Name + muscle */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-white uppercase tracking-tight leading-tight">{ex.name}</p>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">
                    {MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                    {ex.notes && <span className="text-blue-400/40 ml-2">· {ex.notes}</span>}
                  </p>
                </div>

                {/* Sets × reps */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-white/60 tabular-nums">{ex.targetSets} × {ex.repRange}</p>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">RIR {ex.rirTarget}</p>
                </div>

                {/* Mini intensity bar — desktop only */}
                <div className="w-1.5 h-8 rounded-full bg-white/5 overflow-hidden hidden sm:flex flex-col justify-end shrink-0">
                  <div
                    className="w-full bg-blue-600/50 rounded-full"
                    style={{ height: `${Math.min(100, (ex.targetSets / 5) * 100)}%` }}
                  />
                </div>
              </motion.div>
            ))}

            {/* Mobile-only: stats + buttons (shown below exercise list) */}
            <div className="lg:hidden pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/[0.07] text-center">
                  <div className="text-2xl font-black text-white tabular-nums">{todayPlan.exercises.length}</div>
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-0.5">Ejercicios</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0A0A0B] border border-white/[0.07] text-center">
                  <div className="text-2xl font-black text-white tabular-nums">{totalPlanSets}</div>
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-0.5">Sets Plan</div>
                </div>
              </div>
              <button
                onClick={startWithPlan}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-blue-600/25 hover:bg-blue-500 transition-all active:scale-95"
              >
                Iniciar con el Plan
              </button>
              <button
                onClick={startFreeSession}
                className="w-full py-4 bg-white/[0.03] border border-white/10 text-white/40 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:text-white transition-all"
              >
                Sesión Libre
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    // Día de descanso
    if (activeProgram && todayPlan?.isRest) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-20 min-h-[55vh] pb-8"
        >
          <div className="space-y-5 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                {activeProgram.name} · HOY · DESCANSO
              </p>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9]">
              Día de<br/>Recuperación
            </h2>
            <p className="text-white/30 text-xs sm:text-sm font-bold uppercase tracking-widest max-w-sm leading-relaxed">
              La recuperación es donde ocurre el crecimiento real. Descansa, come y vuelve mañana más fuerte.
            </p>
            <button
              onClick={startFreeSession}
              className="w-full sm:w-auto px-10 py-4 bg-white/[0.03] border border-white/10 text-white/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white hover:border-white/20 transition-all active:scale-95"
            >
              Sesión Extra de Todas Formas
            </button>
          </div>
          <div className="flex items-center justify-center lg:justify-end shrink-0">
            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                <span className="text-5xl sm:text-6xl select-none">🛌</span>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Sin programa activo o programa sin día mapeado
    return (
      <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-20 min-h-[45vh] pb-4"
      >
        <div className="space-y-5 flex-1">
          {activeProgram && (
            <div className="inline-flex px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                {activeProgram.name} · SEMANA {activeProgram.currentWeek}
              </p>
            </div>
          )}
          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9]">
            Preparado<br/>para la Forja
          </h2>
          <p className="text-white/30 text-xs sm:text-sm font-bold uppercase tracking-widest max-w-sm leading-relaxed">
            Sesión libre — elige tus ejercicios y construye tu sesión de entrenamiento.
          </p>
          <button
            onClick={startFreeSession}
            className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95"
          >
            Iniciar Misión
          </button>
        </div>
        <div className="flex items-center justify-center lg:justify-end shrink-0">
          <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
              <span className="text-5xl sm:text-6xl select-none">⚔️</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recovery suggestions */}
      {recoverySuggestions.length > 0 && (() => {
        const fresh   = recoverySuggestions.filter(r => r.status === "fresh" || r.status === "ready");
        const recover = recoverySuggestions.filter(r => r.status === "recovering");
        if (fresh.length === 0) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-3"
          >
            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">MÚSCULOS LISTOS PARA ENTRENAR</p>
            <div className="flex flex-wrap gap-2">
              {fresh.map(r => (
                <div
                  key={r.muscle}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    {MUSCLE_GROUP_LABELS[r.muscle] ?? r.muscle}
                  </span>
                  {r.daysAgo !== null && (
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                      {r.daysAgo === 0 ? "Hoy" : `${r.daysAgo}d`}
                    </span>
                  )}
                </div>
              ))}
              {recover.map(r => (
                <div
                  key={r.muscle}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/8 border border-orange-500/15"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
                  <span className="text-[9px] font-black text-orange-400/60 uppercase tracking-widest">
                    {MUSCLE_GROUP_LABELS[r.muscle] ?? r.muscle}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Templates section */}
      {templates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-4"
        >
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">MIS TEMPLATES</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#0A0A0B] border border-white/[0.06] hover:border-blue-500/30 transition-all group">
                <button
                  onClick={() => startFromTemplate(tmpl)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-[12px] font-black text-white uppercase tracking-tight truncate group-hover:text-blue-300 transition-colors">{tmpl.name}</p>
                  <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest">{tmpl.exercises.length} EJERCICIOS</p>
                </button>
                <button
                  onClick={() => deleteTemplate(tmpl.id)}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-400/10 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      </div>
    );
  }

  // ─── PANTALLA DE VALORACIÓN ────────────────────────────────────────────────
  if (showRating) {
    const RPE_LABELS: Record<number, string> = {
      1: "MUY FÁCIL", 2: "FÁCIL", 3: "MODERADO", 4: "ALGO DURO",
      5: "DURO", 6: "MUY DURO", 7: "ESFUERZO ALTO", 8: "DIFÍCIL",
      9: "MÁXIMO", 10: "ABSOLUTO LÍMITE",
    };
    const rpeColor =
      sessionRpe <= 3 ? "text-emerald-400" :
      sessionRpe <= 6 ? "text-blue-400" :
      sessionRpe <= 8 ? "text-orange-400" : "text-red-400";

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto", padding: "0 0 5rem" }}>

          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "0.5rem" }}>
              MISIÓN COMPLETADA
            </p>
            <p style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 1 }}>
              Valorar Sesión
            </p>
          </div>

          {/* RPE Slider */}
          <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.5rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.75rem" }}>
                ESFUERZO PERCIBIDO (RPE)
              </p>
              <p className={`text-6xl font-black tabular-nums ${rpeColor}`} style={{ lineHeight: 1, marginBottom: "0.5rem" }}>
                {sessionRpe}
              </p>
              <p className={`text-[11px] font-black uppercase tracking-widest ${rpeColor}`}>
                {RPE_LABELS[sessionRpe]}
              </p>
            </div>

            <input
              type="range"
              min={1} max={10} step={1}
              value={sessionRpe}
              onChange={e => setSessionRpe(Number(e.target.value))}
              style={{ width: "100%", display: "block", accentColor: "#2563eb", cursor: "pointer" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem" }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.15)", textTransform: "uppercase", letterSpacing: "0.1em" }}>1 · FÁCIL</span>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.15)", textTransform: "uppercase", letterSpacing: "0.1em" }}>10 · LÍMITE</span>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.75rem" }}>
              NOTAS DE SESIÓN (OPCIONAL)
            </p>
            <textarea
              rows={4}
              placeholder="Sensaciones, técnica, próximos ajustes..."
              style={{ width: "100%", display: "block", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "0.875rem 1rem", color: "#fff", fontWeight: 700, fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box" }}
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
            />
          </div>

          <button
            onClick={submitRating}
            disabled={analyzingSession}
            style={{ width: "100%", display: "block", padding: "1.25rem", borderRadius: "1.25rem", background: analyzingSession ? "rgba(37,99,235,0.5)" : "#2563eb", color: "#fff", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "11px", border: "none", cursor: analyzingSession ? "default" : "pointer", boxSizing: "border-box", transition: "background 0.2s" }}
          >
            {analyzingSession ? "⚙ Procesando telemetría..." : "Finalizar Misión"}
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── PANTALLA DE RESUMEN ───────────────────────────────────────────────────
  if (showSummary) {
    const completedSets = exercises.flatMap(e => e.sets).filter(s => s.completed);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ width: "100%", maxWidth: "720px", margin: "0 auto", padding: "0 0 5rem" }}>

          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏆</div>
            <p style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.5rem" }}>
              Misión Cumplida
            </p>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              {session.name}
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "TIEMPO", value: formatTime(elapsedTime), color: "#fff" },
              {
                label: "VOLUMEN",
                value: completedSets.length > 0
                  ? `${completedSets.length} SETS`
                  : "—",
                sub: sessionVolume > 0
                  ? `${Math.round(sessionVolume).toLocaleString("es-ES")} KG TOTALES`
                  : undefined,
                color: "#34d399",
              },
              { label: "RPE", value: `${sessionRpe}/10`, color: "#60a5fa" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.25rem", padding: "1.25rem", textAlign: "center" }}>
                <p style={{ fontSize: "8px", fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>{stat.label}</p>
                <p style={{ fontSize: "clamp(1.1rem,3vw,1.75rem)", fontWeight: 900, color: stat.color }}>{stat.value}</p>
                {"sub" in stat && stat.sub && (
                  <p style={{ fontSize: "8px", fontWeight: 700, color: "rgba(52,211,153,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.25rem" }}>{stat.sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* ── EL ARQUITECTO — Análisis post-sesión ── */}
          <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.22)", borderRadius: "1.5rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 8px rgba(129,140,248,0.8)", flexShrink: 0 }} />
              <p style={{ fontSize: "8px", fontWeight: 900, color: "rgba(129,140,248,0.7)", textTransform: "uppercase", letterSpacing: "0.35em" }}>
                EL ARQUITECTO · ANÁLISIS DE SESIÓN
              </p>
            </div>
            {architectAnalysis ? (
              <ArchitectMarkdown text={architectAnalysis} />
            ) : (
              <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.2)", fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Sala de control temporalmente fuera de línea.
              </p>
            )}
          </div>

          {/* Exercise breakdown */}
          {exercises.length > 0 && (
            <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "1rem" }}>
                BREAKDOWN POR EJERCICIO
              </p>
              {exercises.map((ex, i) => {
                const doneSets = ex.sets.filter(s => s.completed);
                const exVol    = doneSets.reduce((a, s) => a + s.weightKg * s.reps, 0);
                // Best set by weight
                const bestSet  = doneSets.length > 0
                  ? doneSets.reduce((best, s) => s.weightKg > best.weightKg ? s : best, doneSets[0])
                  : null;
                return (
                  <div key={i} style={{ padding: "0.625rem 0", borderBottom: i < exercises.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>{ex.name}</p>
                        <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: "2px" }}>
                          {MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "12px", fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>
                          {doneSets.length} sets
                        </p>
                        {ex.estimatedOneRM && (
                          <p style={{ fontSize: "8px", fontWeight: 700, color: "#60a5fa", textTransform: "uppercase" }}>
                            1RM ~{ex.estimatedOneRM} KG
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Per-set breakdown */}
                    {doneSets.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.5rem" }}>
                        {doneSets.map((s, si) => (
                          <span key={si} style={{ fontSize: "9px", fontWeight: 700, color: s === bestSet ? "#34d399" : "rgba(255,255,255,0.35)", background: s === bestSet ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${s === bestSet ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "6px", padding: "2px 7px", textTransform: "uppercase" }}>
                            {s.weightKg > 0 ? `${s.weightKg}kg` : "BW"} × {s.reps}
                            {s.rir != null && s.rir >= 0 ? ` · RIR ${s.rir}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* PRs de sesión */}
          {sessionPrs.length > 0 && (
            <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "rgba(52,211,153,0.6)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "0.875rem" }}>
                🏆 NUEVOS RÉCORDS EN ESTA SESIÓN
              </p>
              {sessionPrs.map((pr, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: i < sessionPrs.length - 1 ? "1px solid rgba(16,185,129,0.08)" : "none" }}>
                  <p style={{ fontSize: "12px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{pr.exerciseName}</p>
                  <p style={{ fontSize: "13px", fontWeight: 900, color: "#34d399", tabularNums: true } as any}>
                    {pr.weight} <span style={{ fontSize: "9px", color: "rgba(52,211,153,0.5)", fontWeight: 700 }}>KG</span> × {pr.reps}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Save as template */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "8px", fontWeight: 900, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "0.75rem" }}>
              GUARDAR COMO TEMPLATE
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="Nombre del template..."
                style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", padding: "0.75rem 1rem", color: "#fff", fontWeight: 700, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveAsTemplate()}
              />
              <button
                onClick={saveAsTemplate}
                disabled={!templateName.trim() || savingTemplate}
                style={{ padding: "0.75rem 1.25rem", borderRadius: "0.75rem", background: "rgba(37,99,235,0.2)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", fontWeight: 900, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", opacity: (!templateName.trim() || savingTemplate) ? 0.3 : 1, whiteSpace: "nowrap" }}
              >
                {savingTemplate ? "..." : "Guardar"}
              </button>
            </div>
          </div>

          {/* Week advance prompt */}
          {activeProgram && activeProgram.currentWeek < activeProgram.durationWeeks && !weekAdvanced && (
            <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <p style={{ fontSize: "8px", fontWeight: 900, color: "rgba(96,165,250,0.6)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "0.25rem" }}>
                  {activeProgram.name}
                </p>
                <p style={{ fontSize: "13px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                  ¿Avanzar a semana {activeProgram.currentWeek + 1}?
                </p>
              </div>
              <button
                onClick={advanceWeek}
                style={{ padding: "0.625rem 1.25rem", borderRadius: "0.875rem", background: "#2563eb", color: "#fff", fontWeight: 900, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Avanzar →
              </button>
            </div>
          )}
          {weekAdvanced && (
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "1.25rem", padding: "1rem", marginBottom: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                ✓ Semana {activeProgram!.currentWeek + 1} desbloqueada
              </p>
            </div>
          )}

          {/* Copiar resumen */}
          {session && (() => {
            const doneExs = exercises.map(ex => ({
              name:        ex.name,
              muscleGroup: ex.muscleGroup,
              sets:        ex.sets.filter(s => s.completed).map(s => ({ weightKg: s.weightKg, reps: s.reps, rir: s.rir })),
            })).filter(ex => ex.sets.length > 0);
            const vol = doneExs.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.weightKg * s.reps, 0), 0);
            return (
              <CopyBar data={{
                name:            session.name,
                durationMinutes: Math.max(1, Math.floor(elapsedTime / 60)),
                overallRpe:      sessionRpe,
                totalVolumeKg:   vol,
                notes:           sessionNotes || null,
                exercises:       doneExs,
                prs:             sessionPrs,
              }} />
            );
          })()}

          <button
            onClick={() => { setSessionPrs([]); window.location.href = "/dashboard"; }}
            style={{ width: "100%", display: "block", padding: "1.25rem", borderRadius: "1.25rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "11px", cursor: "pointer", boxSizing: "border-box" }}
          >
            Volver al Centro de Mando
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── SESIÓN ACTIVA ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-12 pb-40">

      {/* Offline Banner */}
      {isOffline && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <span className="text-base shrink-0">⚡</span>
          <p className="text-[11px] font-bold m-0" style={{ color: "rgba(245,158,11,0.9)" }}>
            Sin conexión — los sets se guardan localmente y se sincronizan al recuperar señal
          </p>
        </div>
      )}

      {/* PR Alert */}
      <AnimatePresence>
        {prAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{   opacity: 0, y: -40,  scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={() => setPrAlert(null)}
            className="fixed top-24 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 cursor-pointer"
          >
            <div className="px-5 py-4 sm:px-8 sm:py-5 rounded-2xl sm:rounded-[2rem] bg-emerald-500 shadow-2xl shadow-emerald-500/40 flex items-center gap-4">
              <span className="text-2xl sm:text-3xl">🏆</span>
              <div>
                <p className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">NUEVO RÉCORD PERSONAL</p>
                <p className="text-base sm:text-xl font-black text-white uppercase tracking-tight">
                  {prAlert.exerciseName} — {prAlert.weight} KG × {prAlert.reps}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission Control Header */}
      <div className="sticky top-20 z-40 px-4 py-3 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-[#0A0A0B]/85 backdrop-blur-3xl border border-white/10 shadow-2xl">
        <AnimatePresence mode="wait">
          {showCancelConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
            >
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">ABANDONAR SESIÓN</p>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  Los sets guardados se perderán
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 font-black text-[9px] uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
                >
                  Seguir
                </button>
                <button
                  onClick={cancelSession}
                  disabled={cancelling}
                  className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {cancelling ? "..." : "Abandonar"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="normal"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="flex justify-between items-center gap-3"
            >
              <div className="flex gap-3 sm:gap-5 items-center min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20 shrink-0">
                  <span className="animate-pulse text-xs sm:text-base">●</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-lg font-black text-white uppercase tracking-tighter truncate">{session.name}</h2>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                    {formatTime(elapsedTime)} EN CURSO
                    {exercises.length > 0 &&
                      ` · ${exercises.flatMap(e => e.sets).filter(s => s.completed).length} SETS`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all text-sm"
                  title="Cancelar sesión"
                >
                  ✕
                </button>
                <button
                  onClick={finishSession}
                  className="px-4 sm:px-7 py-2.5 sm:py-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all whitespace-nowrap"
                >
                  Finalizar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exercise List */}
      <div className="space-y-8">

        {/* Plan loading state */}
        {loadingPlan && exercises.length === 0 && (
          <div className="p-8 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-3">
            <div className="flex items-center gap-3 pb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
                CARGANDO EJERCICIOS DEL PLAN...
              </p>
            </div>
            {todayPlan?.exercises.map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        <AnimatePresence>
          {exercises.map((ex, exIdx) => (
            <ErrorBoundary key={`${ex.id}-${exIdx}`} label={ex.name} compact>
            <motion.div
              key={`inner-${ex.id}-${exIdx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-[#0A0A0B] border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />

              {/* Exercise Header */}
              <div className="flex justify-between items-start gap-3 mb-6 sm:mb-10">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">
                    {MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                  </div>
                  <button
                    onClick={() => setDrawerExercise(ex)}
                    className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-tight text-left hover:text-blue-300 transition-colors group flex items-center gap-2"
                  >
                    {ex.name}
                    <span className="text-[10px] font-black text-white/15 group-hover:text-blue-400/60 uppercase tracking-widest transition-colors">↗</span>
                  </button>
                  {/* Prescribed objective badge + set progress dots */}
                  {ex.prescribedRepRange && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600/10 border border-blue-500/15 text-[8px] font-black text-blue-400/70 uppercase tracking-widest">
                        {ex.prescribedRepRange} REPS · RIR {ex.prescribedRirTarget}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {ex.sets.map((s, k) => (
                          <span key={k} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            s.completed
                              ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]"
                              : "bg-white/10"
                          }`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {ex.muscleGroup !== "cardio" && (
                  <div className="px-3 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 text-right space-y-0.5 shrink-0">
                    {ex.previousPerformance ? (
                      <>
                        <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest">ÚLTIMA VEZ</div>
                        <div className="text-sm font-black text-white/70 whitespace-nowrap">
                          {ex.previousPerformance.weight} KG × {ex.previousPerformance.reps}
                        </div>
                        {ex.estimatedOneRM && (
                          <div className="text-[8px] font-bold text-blue-400 uppercase tracking-widest whitespace-nowrap">
                            1RM ~{ex.estimatedOneRM} KG
                          </div>
                        )}
                        {ex.suggestedWeight && (
                          <div className={`text-[8px] font-bold uppercase tracking-widest whitespace-nowrap ${
                            ex.progressionDir === "up"   ? "text-emerald-400" :
                            ex.progressionDir === "down" ? "text-orange-400"  : "text-blue-400"
                          }`}>
                            {ex.progressionDir === "up"   ? `↑ ${ex.suggestedWeight} KG` :
                             ex.progressionDir === "down" ? `↓ ${ex.suggestedWeight} KG` :
                             `= ${ex.suggestedWeight} KG`}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">SIN HISTORIAL</div>
                    )}
                  </div>
                )}
              </div>

              {/* Column headers — hidden for cardio */}
              {ex.muscleGroup !== "cardio" && (
                <div className="grid grid-cols-12 gap-2 sm:gap-4 px-1 mb-2">
                  {["", "KG", "REPS", "RIR", ""].map((h, i) => (
                    <div key={i} className={i === 0 ? "col-span-1" : i === 4 ? "col-span-2" : "col-span-3"}>
                      <span className="text-[7px] sm:text-[8px] font-black text-white/20 tracking-widest uppercase ml-1">{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ghost sets — referencia sesión anterior (solo fuerza) */}
              {ex.muscleGroup !== "cardio" && ex.lastSessionSets && ex.lastSessionSets.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <p className="text-[7px] font-black text-white/15 uppercase tracking-[0.35em] px-1 mb-2">SESIÓN ANTERIOR</p>
                  {ex.lastSessionSets.map((ghost, gi) => (
                    <div key={gi} className="grid grid-cols-12 gap-2 sm:gap-4 opacity-25 pointer-events-none select-none">
                      <div className="col-span-1 flex items-center justify-center font-black text-white/40 text-[10px]">
                        S{ghost.setNumber}
                      </div>
                      <div className="col-span-3">
                        <div className="w-full bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-2.5 sm:p-4 text-white/40 font-black text-base sm:text-xl text-center">
                          {ghost.weightKg > 0 ? ghost.weightKg : "—"}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="w-full bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-2.5 sm:p-4 text-white/40 font-black text-base sm:text-xl text-center">
                          {ghost.reps}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="w-full bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-2.5 sm:p-4 text-white/40 font-black text-base sm:text-xl text-center">
                          {ghost.rpe != null ? 10 - ghost.rpe : "—"}
                        </div>
                      </div>
                      <div className="col-span-2" />
                    </div>
                  ))}
                  <div className="h-px bg-white/[0.05] mt-3 mb-1" />
                </div>
              )}

              {/* Sets */}
              <div className="space-y-3">
                {ex.sets.map((set, setIdx) => (
                  ex.muscleGroup === "cardio" ? (
                    /* ── Cardio set: solo botón completado ── */
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-2 sm:gap-4 transition-all ${
                        set.completed ? "opacity-35 grayscale pointer-events-none" : ""
                      }`}
                    >
                      <div className="col-span-1 flex items-center justify-center font-black text-white/20 text-[10px]">
                        S{set.setNumber}
                      </div>
                      <div className="col-span-11">
                        <button
                          onClick={() => completeSet(exIdx, setIdx)}
                          className="w-full h-11 sm:h-14 rounded-xl flex items-center justify-center gap-2 text-white font-black text-xs uppercase tracking-widest transition-all bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 active:scale-95"
                        >
                          <span>✓</span>
                          <span>Completado</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Fuerza: kg / reps / rir ── */
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-2 sm:gap-4 rounded-xl sm:rounded-2xl transition-all ${
                        set.completed ? "opacity-35 grayscale pointer-events-none" : ""
                      }`}
                    >
                      <div className="col-span-1 flex items-center justify-center font-black text-white/20 text-[10px]">
                        S{set.setNumber}
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number" step="0.5" min="0" inputMode="decimal"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 sm:p-4 text-white font-black text-base sm:text-xl text-center outline-none focus:border-blue-500/50 transition-all"
                          value={set.weightKg || ""}
                          onChange={e => updateSet(exIdx, setIdx, "weightKg", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number" min="1" inputMode="numeric"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 sm:p-4 text-white font-black text-base sm:text-xl text-center outline-none focus:border-blue-500/50 transition-all"
                          value={set.reps || ""}
                          onChange={e => updateSet(exIdx, setIdx, "reps", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 sm:p-4 text-white font-black text-base sm:text-xl text-center outline-none appearance-none cursor-pointer"
                          value={set.rir}
                          onChange={e => updateSet(exIdx, setIdx, "rir", parseInt(e.target.value))}
                        >
                          {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <button
                          onClick={() => completeSet(exIdx, setIdx)}
                          className="w-full h-11 sm:h-14 rounded-xl flex items-center justify-center text-white font-black text-xs uppercase tracking-widest transition-all bg-blue-600 hover:bg-blue-500 active:scale-95"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Exercise notes */}
              <div className="mt-5 sm:mt-6">
                <textarea
                  rows={1}
                  placeholder="Notas del ejercicio (técnica, sensaciones...)"
                  className="w-full bg-transparent border-0 border-b border-white/[0.06] py-2 px-1 text-white/40 font-bold text-xs outline-none focus:border-white/15 focus:text-white/70 transition-all resize-none placeholder-white/15"
                  value={ex.notes ?? ""}
                  onChange={e =>
                    setExercises(prev =>
                      prev.map((exercise, i) =>
                        i !== exIdx ? exercise : { ...exercise, notes: e.target.value }
                      )
                    )
                  }
                />
              </div>

              <button
                onClick={() => addSet(exIdx)}
                className="mt-4 sm:mt-6 w-full py-3.5 sm:py-4 border border-dashed border-white/[0.07] rounded-2xl text-[9px] font-black text-white/20 uppercase tracking-widest hover:border-white/15 hover:text-white/40 transition-all"
              >
                + AÑADIR SERIE
              </button>
            </motion.div>
            </ErrorBoundary>
          ))}
        </AnimatePresence>

        {/* Botón añadir ejercicio */}
        <button
          onClick={() => {
            setSelectorFilter("all");
            document.dispatchEvent(new CustomEvent("open-selector"));
          }}
          className="w-full py-8 sm:py-12 border border-dashed border-white/10 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center gap-3 group hover:border-blue-500/30 transition-all"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all">
            <span className="text-xl sm:text-2xl">+</span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.4em] group-hover:text-white transition-all">
            {loadingHistory ? "CARGANDO HISTORIAL..." : "AÑADIR EJERCICIO"}
          </span>
        </button>
      </div>

      <ExerciseSelectorPortal onSelect={addExercise} filter={selectorFilter} />
      {showRestTimer && (
        <RestTimer
          duration={restDuration}
          onComplete={() => setShowRestTimer(false)}
          onSkip={() => setShowRestTimer(false)}
        />
      )}
      {drawerExercise && (
        <ExerciseHistoryDrawer
          exerciseId={drawerExercise.id}
          exerciseName={drawerExercise.name}
          muscleGroup={drawerExercise.muscleGroup}
          historicalMax={drawerExercise.historicalMax}
          estimatedOneRM={drawerExercise.estimatedOneRM}
          onClose={() => setDrawerExercise(null)}
        />
      )}
    </div>
  );
}

function ExerciseSelectorPortal({
  onSelect,
  filter,
}: {
  onSelect: (ex: any) => void;
  filter: MuscleGroup | "all";
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    document.addEventListener("open-selector", handler);
    return () => document.removeEventListener("open-selector", handler);
  }, []);

  if (!isOpen) return null;
  return (
    <ExerciseSelector
      initialFilter={filter}
      onSelectExercise={ex => { onSelect(ex); setIsOpen(false); }}
      onClose={() => setIsOpen(false)}
    />
  );
}
