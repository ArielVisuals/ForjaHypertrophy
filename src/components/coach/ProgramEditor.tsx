import { useState, useEffect } from "react";
import { MUSCLE_GROUP_LABELS } from "../../lib/constants/programs";
import { TechniqueModal } from "../shared/TechniqueModal";

/**
 * Editor de programa de 7 dias (metadatos + prescripcion por dia).
 * Reusable: la Biblioteca lo usa para plantillas y el detalle del asesorado
 * para programas personalizados. El caller decide que hacer al guardar.
 */

export interface EditorExercise {
  name: string;
  muscleGroup: string;
  targetSets: number;
  repRange: string;
  rirTarget: number | null;
  notes: string;
}

export interface EditorDay {
  name: string;
  isRest: boolean;
  exercises: EditorExercise[];
}

export interface EditorDraft {
  name: string;
  description: string;
  level: string;
  focus: string;
  durationWeeks: number;
  days: EditorDay[];
}

interface ProgramEditorProps {
  initialDraft: EditorDraft;
  headerLabel: string;
  backLabel: string;
  submitLabel: string;
  onCancel: () => void;
  /** Devuelve un mensaje de error para mostrar, o null si todo salio bien. */
  onSubmit: (draft: EditorDraft) => Promise<string | null>;
}

const DAY_NAMES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
export const LEVELS = [
  { value: "Beginner",     label: "PRINCIPIANTE" },
  { value: "Intermediate", label: "INTERMEDIO" },
  { value: "Advanced",     label: "AVANZADO" },
  { value: "Elite",        label: "ELITE" },
];
export const FOCUSES = [
  { value: "Hypertrophy",   label: "HIPERTROFIA" },
  { value: "Strength",      label: "FUERZA" },
  { value: "Powerbuilding", label: "POWERBUILDING" },
];
const MUSCLE_OPTIONS = Object.entries(MUSCLE_GROUP_LABELS).filter(([k]) => k !== "cardio");

export const newExercise = (): EditorExercise => ({
  name: "",
  muscleGroup: "chest",
  targetSets: 3,
  repRange: "8-12",
  rirTarget: 2,
  notes: "",
});

export const emptyEditorDraft = (): EditorDraft => ({
  name: "",
  description: "",
  level: "Intermediate",
  focus: "Hypertrophy",
  durationWeeks: 8,
  days: Array.from({ length: 7 }, () => ({ name: "", isRest: true, exercises: [] })),
});

/** Convierte el schedule de la API (ProgramWithSchedule) a dias del editor. */
export function scheduleToEditorDays(schedule: any[]): EditorDay[] {
  return schedule.map((d: any) => ({
    name: d.isRest ? "" : d.name,
    isRest: d.isRest,
    exercises: (d.exercises ?? []).map((ex: any) => ({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      targetSets: ex.targetSets,
      repRange: ex.repRange,
      rirTarget: ex.rirTarget,
      notes: ex.notes ?? "",
    })),
  }));
}

export function ProgramEditor({ initialDraft, headerLabel, backLabel, submitLabel, onCancel, onSubmit }: ProgramEditorProps) {
  const [draft, setDraft] = useState<EditorDraft>(initialDraft);
  const [selectedDay, setSelectedDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<{ name: string; muscleGroup?: string; gifUrl?: string | null }[]>([]);
  const [techniqueName, setTechniqueName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/exercises")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCatalog(d); })
      .catch(() => {});
  }, []);

  const patchDay = (i: number, fields: Partial<EditorDay>) =>
    setDraft(d => ({ ...d, days: d.days.map((day, j) => (j === i ? { ...day, ...fields } : day)) }));

  const patchExercise = (dayIdx: number, exIdx: number, fields: Partial<EditorExercise>) =>
    setDraft(d => ({
      ...d,
      days: d.days.map((day, j) =>
        j === dayIdx
          ? { ...day, exercises: day.exercises.map((ex, k) => (k === exIdx ? { ...ex, ...fields } : ex)) }
          : day
      ),
    }));

  const save = async () => {
    if (!draft.name.trim()) return setError("El programa necesita un nombre");
    const hasTraining = draft.days.some(d => !d.isRest && d.exercises.some(ex => ex.name.trim()));
    if (!hasTraining) return setError("Agrega al menos un dia de entrenamiento con ejercicios");

    setSaving(true);
    setError(null);
    const submitError = await onSubmit(draft);
    if (submitError) {
      setError(submitError);
      setSaving(false);
    }
  };

  const day = draft.days[selectedDay];

  return (
    <div className="space-y-6">
      {/* Metadatos del programa */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-[#0A0A0B] border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.4em]">{headerLabel}</p>
          <button
            type="button"
            onClick={onCancel}
            className="text-[9px] font-black text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors"
          >
            {backLabel}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Nombre</label>
            <input
              type="text"
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder="Ej. Hipertrofia 4 dias - Juan"
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Descripcion</label>
            <input
              type="text"
              value={draft.description}
              onChange={e => setDraft({ ...draft, description: e.target.value })}
              placeholder="Objetivo y contexto del programa"
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Nivel</label>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, level: l.value })}
                  className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    draft.level === l.value
                      ? "bg-blue-600/30 border border-blue-500/60 text-white"
                      : "bg-white/[0.03] border border-white/[0.08] text-white/35 hover:text-white/60"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Enfoque</label>
            <div className="flex flex-wrap gap-1.5">
              {FOCUSES.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, focus: f.value })}
                  className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    draft.focus === f.value
                      ? "bg-blue-600/30 border border-blue-500/60 text-white"
                      : "bg-white/[0.03] border border-white/[0.08] text-white/35 hover:text-white/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Duracion (semanas)</label>
            <input
              type="number"
              min={1}
              max={52}
              value={draft.durationWeeks}
              onChange={e => setDraft({ ...draft, durationWeeks: Math.min(52, Math.max(1, Number(e.target.value) || 1)) })}
              className="w-28 rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Editor semanal */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-[#0A0A0B] border border-white/10 space-y-6">
        <div className="grid grid-cols-7 gap-1.5">
          {draft.days.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(i)}
              className={`rounded-xl p-2 text-center space-y-1 transition-all ${
                i === selectedDay
                  ? "bg-blue-600/30 border border-blue-500/60"
                  : d.isRest
                  ? "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05]"
                  : "bg-blue-600/10 border border-blue-500/15 hover:bg-blue-600/20"
              }`}
            >
              <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">{DAY_NAMES[i]}</p>
              <p className={`text-[8px] font-black uppercase tracking-tight leading-tight line-clamp-1 ${d.isRest ? "text-white/15" : "text-white"}`}>
                {d.isRest ? "Descanso" : d.name || `Dia ${i}`}
              </p>
            </button>
          ))}
        </div>

        {/* Dia seleccionado */}
        <div className="space-y-4 border-t border-white/[0.06] pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={() => patchDay(selectedDay, { isRest: !day.isRest, ...(day.isRest && day.exercises.length === 0 ? { exercises: [newExercise()] } : {}) })}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all shrink-0 ${
                day.isRest
                  ? "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {day.isRest ? "Convertir en dia de entrenamiento" : "Dia de entrenamiento"}
            </button>
            {!day.isRest && (
              <input
                type="text"
                value={day.name}
                onChange={e => patchDay(selectedDay, { name: e.target.value })}
                placeholder={`Nombre del dia (Ej. Push, Piernas...)`}
                className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-2.5 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            )}
          </div>

          {day.isRest ? (
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest py-4">
              Dia de descanso. El atleta lo vera como recuperacion.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Encabezados */}
              <div className="hidden md:grid grid-cols-[1fr_140px_70px_90px_70px_90px_32px] gap-2 px-1">
                {["Ejercicio", "Musculo", "Series", "Reps", "RIR", "Notas", ""].map((h, i) => (
                  <p key={i} className="text-[8px] font-black text-white/25 uppercase tracking-[0.3em]">{h}</p>
                ))}
              </div>

              {day.exercises.map((ex, k) => (
                <div key={k} className="grid grid-cols-2 md:grid-cols-[1fr_140px_70px_90px_70px_90px_32px] gap-2 items-center">
                  <div className="col-span-2 md:col-span-1 flex items-center gap-1.5 min-w-0">
                    <input
                      type="text"
                      list="exercise-catalog"
                      value={ex.name}
                      onChange={e => {
                        const name = e.target.value;
                        const match = catalog.find(c => c.name.toLowerCase() === name.toLowerCase());
                        patchExercise(selectedDay, k, {
                          name,
                          ...(match?.muscleGroup ? { muscleGroup: match.muscleGroup } : {}),
                        });
                      }}
                      placeholder="Nombre del ejercicio"
                      className="flex-1 min-w-0 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                    {catalog.find(c => c.name.toLowerCase() === ex.name.toLowerCase())?.gifUrl && (
                      <button
                        type="button"
                        onClick={() => setTechniqueName(ex.name)}
                        title="Ver técnica"
                        className="shrink-0 h-9 px-2 rounded-lg bg-blue-600/10 border border-blue-500/25 text-[8px] font-black text-blue-300/80 hover:text-blue-200 uppercase tracking-widest transition-all"
                      >
                        GIF
                      </button>
                    )}
                  </div>
                  <select
                    value={ex.muscleGroup}
                    onChange={e => patchExercise(selectedDay, k, { muscleGroup: e.target.value })}
                    className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-[10px] font-black uppercase text-white/70 focus:outline-none focus:border-blue-500/50 transition-all"
                  >
                    {MUSCLE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value} className="bg-[#0A0A0B]">{label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={ex.targetSets}
                    onChange={e => patchExercise(selectedDay, k, { targetSets: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })}
                    className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-xs font-bold text-white text-center focus:outline-none focus:border-blue-500/50 transition-all tabular-nums"
                  />
                  <input
                    type="text"
                    value={ex.repRange}
                    onChange={e => patchExercise(selectedDay, k, { repRange: e.target.value })}
                    placeholder="8-12"
                    className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-xs font-bold text-white text-center focus:outline-none focus:border-blue-500/50 transition-all tabular-nums"
                  />
                  <select
                    value={ex.rirTarget ?? ""}
                    onChange={e => patchExercise(selectedDay, k, { rirTarget: e.target.value === "" ? null : Number(e.target.value) })}
                    className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-[10px] font-black text-white/70 focus:outline-none focus:border-blue-500/50 transition-all tabular-nums"
                  >
                    <option value="" className="bg-[#0A0A0B]">-</option>
                    {[0, 1, 2, 3, 4].map(n => (
                      <option key={n} value={n} className="bg-[#0A0A0B]">{n}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={ex.notes}
                    onChange={e => patchExercise(selectedDay, k, { notes: e.target.value })}
                    placeholder="Opcional"
                    className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-xs font-bold text-white placeholder:text-white/15 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => patchDay(selectedDay, { exercises: day.exercises.filter((_, j) => j !== k) })}
                    className="h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-red-300 hover:border-red-500/40 text-xs font-black transition-all"
                    aria-label="Quitar ejercicio"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => patchDay(selectedDay, { exercises: [...day.exercises, newExercise()] })}
                className="w-full py-3 rounded-xl border border-dashed border-white/[0.1] text-[9px] font-black text-white/30 hover:text-white/60 hover:border-blue-500/40 uppercase tracking-widest transition-all"
              >
                Agregar ejercicio
              </button>
            </div>
          )}
        </div>
      </div>

      <datalist id="exercise-catalog">
        {catalog.map(ex => <option key={ex.name} value={ex.name} />)}
      </datalist>

      {techniqueName && (
        <TechniqueModal exerciseName={techniqueName} onClose={() => setTechniqueName(null)} />
      )}

      {error && (
        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/[0.03] border border-white/[0.08] text-white/40 hover:text-white/70 transition-all"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-40"
        >
          {saving ? "Guardando..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
