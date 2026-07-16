import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { exerciseMediaUrl, EXERCISE_MEDIA_ATTRIBUTION } from "../../lib/constants/exerciseMedia";
import { MUSCLE_GROUP_LABELS } from "../../lib/constants/programs";

/**
 * Modal de tecnica de un ejercicio: GIF animado, musculo objetivo y
 * secundarios, equipo e instrucciones paso a paso en español.
 * Busca el detalle por id de ejercicio o por nombre exacto.
 */

interface Technique {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  gifUrl: string | null;
  imageUrl: string | null;
  target: string | null;
  secondaryMuscles: string[];
  instructionSteps: string[];
}

interface TechniqueModalProps {
  exerciseId?: string | null;
  exerciseName?: string | null;
  onClose: () => void;
}

export function TechniqueModal({ exerciseId, exerciseName, onClose }: TechniqueModalProps) {
  const [technique, setTechnique] = useState<Technique | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const param = exerciseId
      ? `exerciseId=${encodeURIComponent(exerciseId)}`
      : `name=${encodeURIComponent(exerciseName ?? "")}`;
    fetch(`/api/exercises?action=technique&${param}`)
      .then(r => r.json())
      .then(d => setTechnique(d && d.id ? d : null))
      .catch(() => setTechnique(null))
      .finally(() => setLoading(false));
  }, [exerciseId, exerciseName]);

  const gif = exerciseMediaUrl(technique?.gifUrl);
  const hasGuide = !!technique && (!!gif || technique.instructionSteps.length > 0);

  const body = (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] bg-[#0A0A0B] border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle movil */}
        <div className="flex sm:hidden justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.4em]">Técnica</p>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight mt-1">
                {technique?.name ?? exerciseName ?? "Ejercicio"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all font-black"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="py-14 text-center text-white/20 font-black uppercase tracking-widest text-[10px]">
              Cargando técnica...
            </div>
          ) : !hasGuide ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-black text-white/40 uppercase tracking-tight">
                Sin guía de técnica para este ejercicio
              </p>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                Los ejercicios del catálogo incluyen GIF e instrucciones
              </p>
            </div>
          ) : (
            <>
              {gif && (
                <div className="flex justify-center rounded-2xl bg-white p-3">
                  <img
                    src={gif}
                    alt={`Técnica de ${technique!.name}`}
                    width={280}
                    height={280}
                    loading="lazy"
                    className="w-full max-w-[280px] aspect-square object-contain rounded-xl"
                  />
                </div>
              )}

              {/* Musculos y equipo */}
              <div className="flex flex-wrap gap-1.5">
                {technique!.target && (
                  <span className="px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/40 text-[9px] font-black text-blue-300 uppercase tracking-widest">
                    {technique!.target}
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-black text-white/45 uppercase tracking-widest">
                  {MUSCLE_GROUP_LABELS[technique!.muscleGroup] ?? technique!.muscleGroup}
                </span>
                {technique!.equipment && (
                  <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-black text-white/45 uppercase tracking-widest">
                    {technique!.equipment}
                  </span>
                )}
                {technique!.secondaryMuscles.slice(0, 3).map(m => (
                  <span key={m} className="px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] text-[9px] font-black text-white/25 uppercase tracking-widest">
                    {m}
                  </span>
                ))}
              </div>

              {/* Pasos */}
              {technique!.instructionSteps.length > 0 && (
                <ol className="space-y-3">
                  {technique!.instructionSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-[10px] font-black text-blue-300 shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-xs font-bold text-white/70 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              )}

              <p className="text-[8px] font-bold text-white/15 uppercase tracking-widest text-center pt-1">
                {EXERCISE_MEDIA_ATTRIBUTION}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(body, document.body) : null;
}
