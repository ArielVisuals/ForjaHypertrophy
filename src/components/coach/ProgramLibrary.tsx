import { useState } from "react";
import {
  ProgramEditor,
  emptyEditorDraft,
  scheduleToEditorDays,
  LEVELS,
  FOCUSES,
  type EditorDraft,
} from "./ProgramEditor";

/**
 * Biblioteca de plantillas del entrenador. Las maestras se usan como base
 * (clonar y ajustar); las propias se editan y eliminan. La asignacion al
 * atleta se hace desde su detalle (donde tambien se pueden crear programas
 * personalizados sin pasar por aqui).
 */

interface LibraryItem {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  focus: string | null;
  durationWeeks: number;
  isMaster: boolean;
  trainingDays: number;
}

interface EditingState {
  programId: string | null; // null = crear nueva plantilla
  initialDraft: EditorDraft;
}

export function ProgramLibrary({ initialLibrary }: { initialLibrary: LibraryItem[] }) {
  const [library, setLibrary] = useState(initialLibrary);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refreshLibrary = async () => {
    const res = await fetch("/api/coach/programs");
    if (res.ok) setLibrary(await res.json());
  };

  /** Carga una plantilla al editor. asBase=true la clona como nueva. */
  const openEditor = async (item: LibraryItem | null, asBase = false) => {
    if (!item) {
      setEditing({ programId: null, initialDraft: emptyEditorDraft() });
      return;
    }
    const res = await fetch(`/api/coach/programs?id=${item.id}`);
    if (!res.ok) return;
    const detail = await res.json();
    setEditing({
      programId: asBase ? null : item.id,
      initialDraft: {
        name: asBase ? `${detail.name} (COPIA)` : detail.name,
        description: detail.description ?? "",
        level: detail.level ?? "Intermediate",
        focus: detail.focus ?? "Hypertrophy",
        durationWeeks: detail.durationWeeks ?? 8,
        days: scheduleToEditorDays(detail.schedule),
      },
    });
  };

  const submit = async (draft: EditorDraft): Promise<string | null> => {
    try {
      const res = await fetch("/api/coach/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editing?.programId ? "update" : "create",
          programId: editing?.programId ?? undefined,
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
        return body?.error ?? "Error al guardar";
      }
      await refreshLibrary();
      setEditing(null);
      return null;
    } catch {
      return "Error al guardar";
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch("/api/coach/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", programId: id }),
      });
      if (res.ok) await refreshLibrary();
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  if (editing) {
    return (
      <ProgramEditor
        initialDraft={editing.initialDraft}
        headerLabel={editing.programId ? "EDITANDO PLANTILLA" : "NUEVA PLANTILLA"}
        backLabel="Volver a la biblioteca"
        submitLabel={editing.programId ? "Guardar cambios" : "Crear plantilla"}
        onCancel={() => setEditing(null)}
        onSubmit={submit}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
          {library.length} plantillas disponibles
        </p>
        <button
          type="button"
          onClick={() => openEditor(null)}
          className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all"
        >
          Nuevo programa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {library.map(item => (
          <div key={item.id} className="p-6 rounded-[2rem] bg-[#0A0A0B] border border-white/10 flex flex-col gap-4 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-tight">{item.name}</h3>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                item.isMaster
                  ? "bg-white/[0.04] border-white/[0.1] text-white/40"
                  : "bg-blue-600/15 border-blue-500/30 text-blue-300"
              }`}>
                {item.isMaster ? "Maestra" : "Propia"}
              </span>
            </div>
            {item.description && (
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {[
                item.level && LEVELS.find(l => l.value === item.level)?.label,
                item.focus && FOCUSES.find(f => f.value === item.focus)?.label,
                `${item.trainingDays} DIAS`,
                `${item.durationWeeks} SEM`,
              ].filter(Boolean).map(tag => (
                <span key={String(tag)} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[8px] font-black text-white/35 uppercase tracking-widest">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-auto pt-2">
              {item.isMaster ? (
                <button
                  type="button"
                  onClick={() => openEditor(item, true)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/35 transition-all"
                >
                  Usar como base
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/35 transition-all"
                  >
                    Editar
                  </button>
                  {confirmDelete === item.id ? (
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      disabled={deleting === item.id}
                      className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-red-600/25 border border-red-500/50 text-red-300 transition-all"
                    >
                      {deleting === item.id ? "..." : "Confirmar"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(item.id)}
                      className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/[0.03] border border-white/[0.08] text-white/35 hover:text-red-300 hover:border-red-500/40 transition-all"
                    >
                      Eliminar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
