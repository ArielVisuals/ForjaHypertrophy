import { useState } from "react";

/**
 * Asignacion de programa a un asesorado desde su detalle.
 * Clona la plantilla elegida al atleta y la activa (reemplaza la actual).
 */

interface TemplateOption {
  id: string;
  name: string;
  isMaster: boolean;
  trainingDays: number;
  durationWeeks: number;
}

interface AssignProgramProps {
  athleteId: string;
  templates: TemplateOption[];
  /** Nombre del programa activo actual, si existe (para advertir el reemplazo) */
  currentProgramName: string | null;
}

export function AssignProgram({ athleteId, templates, currentProgramName }: AssignProgramProps) {
  const [selected, setSelected] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = async () => {
    if (!selected || assigning) return;
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", programId: selected, athleteId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al asignar");
      }
      setDone(true);
      // Refresca el detalle para mostrar el nuevo programa activo
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al asignar");
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-white/[0.06] pt-4">
      <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.3em]">
        {currentProgramName ? "Cambiar programa" : "Asignar programa"}
      </p>
      <select
        aria-label="Programa a asignar"
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-[10px] font-black uppercase text-white/70 focus:outline-none focus:border-blue-500/50 transition-all"
      >
        <option value="" className="bg-[#0A0A0B]">Elige una plantilla...</option>
        {templates.map(t => (
          <option key={t.id} value={t.id} className="bg-[#0A0A0B]">
            {t.name} ({t.trainingDays}D / {t.durationWeeks}SEM)
          </option>
        ))}
      </select>
      {currentProgramName && selected && !done && (
        <p className="text-[9px] font-black text-orange-400/80 uppercase tracking-widest leading-relaxed">
          Reemplazara el programa actual ({currentProgramName}) y reiniciara en semana 1
        </p>
      )}
      {error && <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">{error}</p>}
      <button
        type="button"
        onClick={assign}
        disabled={!selected || assigning}
        className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-30"
      >
        {done ? "Programa asignado" : assigning ? "Asignando..." : "Asignar"}
      </button>
    </div>
  );
}
