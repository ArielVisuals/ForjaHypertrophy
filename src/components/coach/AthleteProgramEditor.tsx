import { useState } from "react";
import {
  ProgramEditor,
  emptyEditorDraft,
  scheduleToEditorDays,
  type EditorDraft,
} from "./ProgramEditor";

/**
 * Programa personalizado de un asesorado: el coach lo crea o edita aqui
 * directo, sin pasar por la Biblioteca. Puede partir de cero, de una
 * plantilla como base, o editar el programa actual del atleta en su lugar
 * (conservando la semana en la que va).
 */

interface TemplateOption {
  id: string;
  name: string;
  trainingDays: number;
  durationWeeks: number;
}

interface CurrentProgram {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  focus: string | null;
  durationWeeks: number;
  currentWeek: number;
  schedule: any[];
}

interface AthleteProgramEditorProps {
  athleteId: string;
  athleteName: string;
  currentProgram: CurrentProgram | null;
  templates: TemplateOption[];
}

export function AthleteProgramEditor({ athleteId, athleteName, currentProgram, templates }: AthleteProgramEditorProps) {
  // Modo edicion del programa actual (conserva semana) o creacion de uno nuevo
  const [editingCurrent, setEditingCurrent] = useState(!!currentProgram);
  const [initialDraft, setInitialDraft] = useState<EditorDraft>(() =>
    currentProgram
      ? {
          name: currentProgram.name,
          description: currentProgram.description ?? "",
          level: currentProgram.level ?? "Intermediate",
          focus: currentProgram.focus ?? "Hypertrophy",
          durationWeeks: currentProgram.durationWeeks,
          days: scheduleToEditorDays(currentProgram.schedule),
        }
      : { ...emptyEditorDraft(), name: `Programa de ${athleteName}` }
  );
  const [editorKey, setEditorKey] = useState(0); // remonta el editor al cambiar de base
  const [loadingBase, setLoadingBase] = useState(false);

  const startFromScratch = () => {
    setEditingCurrent(false);
    setInitialDraft({ ...emptyEditorDraft(), name: `Programa de ${athleteName}` });
    setEditorKey(k => k + 1);
  };

  const startFromTemplate = async (templateId: string) => {
    if (!templateId) return;
    setLoadingBase(true);
    try {
      const res = await fetch(`/api/coach/programs?id=${templateId}`);
      if (!res.ok) return;
      const detail = await res.json();
      setEditingCurrent(false);
      setInitialDraft({
        name: `${detail.name} - ${athleteName}`,
        description: detail.description ?? "",
        level: detail.level ?? "Intermediate",
        focus: detail.focus ?? "Hypertrophy",
        durationWeeks: detail.durationWeeks ?? 8,
        days: scheduleToEditorDays(detail.schedule),
      });
      setEditorKey(k => k + 1);
    } finally {
      setLoadingBase(false);
    }
  };

  const submit = async (draft: EditorDraft): Promise<string | null> => {
    try {
      const res = await fetch("/api/coach/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-athlete",
          athleteId,
          // solo edita en su lugar si seguimos sobre el programa actual
          programId: editingCurrent ? currentProgram?.id : undefined,
          name: draft.name,
          description: draft.description,
          level: draft.level,
          focus: draft.focus,
          durationWeeks: draft.durationWeeks,
          schedule: draft.days.map((d, i) => ({
            dayNumber: i,
            name: d.isRest ? "Descanso" : d.name || `Dia ${i}`,
            shortName: d.isRest ? "Descanso" : d.name || `Dia ${i}`,
            isRest: d.isRest,
            exercises: d.exercises,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        return body?.error ?? "Error al guardar el programa";
      }
      window.location.href = `/coach/athletes/${athleteId}`;
      return null;
    } catch {
      return "Error al guardar el programa";
    }
  };

  return (
    <div className="space-y-6">
      {/* Punto de partida */}
      <div className="p-5 sm:p-6 rounded-[2rem] bg-[#0A0A0B] border border-white/10 space-y-3">
        <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.3em]">Punto de partida</p>
        <div className="flex flex-col sm:flex-row gap-2">
          {currentProgram && (
            <button
              type="button"
              onClick={() => {
                setEditingCurrent(true);
                setInitialDraft({
                  name: currentProgram.name,
                  description: currentProgram.description ?? "",
                  level: currentProgram.level ?? "Intermediate",
                  focus: currentProgram.focus ?? "Hypertrophy",
                  durationWeeks: currentProgram.durationWeeks,
                  days: scheduleToEditorDays(currentProgram.schedule),
                });
                setEditorKey(k => k + 1);
              }}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                editingCurrent
                  ? "bg-blue-600/30 border-blue-500/60 text-white"
                  : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70"
              }`}
            >
              Editar programa actual (semana {currentProgram.currentWeek})
            </button>
          )}
          <button
            type="button"
            onClick={startFromScratch}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
              !editingCurrent && !loadingBase
                ? "bg-white/[0.05] border-white/[0.12] text-white/70"
                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70"
            }`}
          >
            Nuevo desde cero
          </button>
          <select
            aria-label="Usar plantilla como base"
            defaultValue=""
            onChange={e => { startFromTemplate(e.target.value); e.target.value = ""; }}
            disabled={loadingBase}
            className="flex-1 sm:max-w-xs rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-[10px] font-black uppercase text-white/70 focus:outline-none focus:border-blue-500/50 transition-all"
          >
            <option value="" className="bg-[#0A0A0B]">
              {loadingBase ? "Cargando plantilla..." : "Usar plantilla como base..."}
            </option>
            {templates.map(t => (
              <option key={t.id} value={t.id} className="bg-[#0A0A0B]">
                {t.name} ({t.trainingDays}D / {t.durationWeeks}SEM)
              </option>
            ))}
          </select>
        </div>
        {editingCurrent && currentProgram && (
          <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest">
            Editando en su lugar: el atleta conserva su semana {currentProgram.currentWeek} y su historial
          </p>
        )}
        {!editingCurrent && currentProgram && (
          <p className="text-[9px] font-black text-orange-400/80 uppercase tracking-widest">
            Al guardar se reemplaza el programa actual ({currentProgram.name}) y reinicia en semana 1
          </p>
        )}
      </div>

      <ProgramEditor
        key={editorKey}
        initialDraft={initialDraft}
        headerLabel={`PROGRAMA DE ${athleteName.toUpperCase()}`}
        backLabel="Volver al asesorado"
        submitLabel={editingCurrent ? "Guardar cambios" : "Guardar y asignar"}
        onCancel={() => { window.location.href = `/coach/athletes/${athleteId}`; }}
        onSubmit={submit}
      />
    </div>
  );
}
