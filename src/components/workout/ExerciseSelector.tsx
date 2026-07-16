import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Exercise, MuscleGroup } from "@/types/workout";
import { fetchExercisesCached, type CachedExercise } from "@/lib/exerciseCache";
import { TechniqueModal } from "@/components/shared/TechniqueModal";
import { exerciseMediaUrl } from "@/lib/constants/exerciseMedia";

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
  onClose: () => void;
  initialFilter?: MuscleGroup | "all";
}

const muscleGroups: { value: MuscleGroup | "all"; label: string }[] = [
  { value: "all",       label: "Todos" },
  { value: "chest",     label: "Pecho" },
  { value: "back",      label: "Espalda" },
  { value: "legs",      label: "Piernas" },
  { value: "shoulders", label: "Hombros" },
  { value: "arms",      label: "Brazos" },
  { value: "core",      label: "Core" },
  { value: "cardio",    label: "Cardio" },
];

const MUSCLE_OPTIONS = muscleGroups.filter(m => m.value !== "all") as { value: MuscleGroup; label: string }[];

export function ExerciseSelector({
  onSelectExercise,
  onClose,
  initialFilter = "all",
}: ExerciseSelectorProps) {
  const [exercises, setExercises]                 = useState<CachedExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<CachedExercise[]>([]);
  const [selectedMuscle, setSelectedMuscle]       = useState<MuscleGroup | "all">(initialFilter);
  const [searchTerm, setSearchTerm]               = useState("");
  const [loading, setLoading]                     = useState(true);
  const [showCreate, setShowCreate]               = useState(false);
  const [newName, setNewName]                     = useState("");
  const [newMuscle, setNewMuscle]                 = useState<MuscleGroup>("chest");
  const [creating, setCreating]                   = useState(false);
  const [techniqueOf, setTechniqueOf]             = useState<CachedExercise | null>(null);

  useEffect(() => { loadExercises(); }, []);

  useEffect(() => { filterExercises(); }, [selectedMuscle, searchTerm, exercises]);

  useEffect(() => {
    if (showCreate) setNewName(searchTerm);
  }, [showCreate]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await fetchExercisesCached();
      setExercises(data);
      setFilteredExercises(data);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;
    if (selectedMuscle !== "all") {
      filtered = filtered.filter(
        ex => (ex as any).muscleGroup === selectedMuscle || ex.muscle_group === selectedMuscle
      );
    }
    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredExercises(filtered);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), muscleGroup: newMuscle }),
      });
      if (!r.ok) throw new Error("Failed");
      const created = await r.json();
      await loadExercises();
      onSelectExercise(created);
    } catch {
      // silently fail — could add error state
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Añadir Ejercicio</h2>
            {initialFilter !== "all" && (
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">
                Filtrado: {muscleGroups.find(m => m.value === initialFilter)?.label}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(c => !c)}
              title="Crear ejercicio personalizado"
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                showCreate
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              +
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all font-black"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 shrink-0">
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {/* Muscle group filter tabs */}
        <div className="px-4 pb-4 pt-2 flex gap-2 flex-wrap shrink-0">
          {muscleGroups.map(mg => (
            <button
              key={mg.value}
              onClick={() => setSelectedMuscle(mg.value)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                selectedMuscle === mg.value
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              {mg.label}
            </button>
          ))}
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden shrink-0"
            >
              <div className="px-4 pt-3 pb-4 border-b border-white/5 space-y-3">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">NUEVO EJERCICIO</p>
                <input
                  type="text"
                  placeholder="Nombre del ejercicio..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
                />
                <div className="flex gap-2 flex-wrap">
                  {MUSCLE_OPTIONS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setNewMuscle(m.value)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                        newMuscle === m.value
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="w-full py-3 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-blue-500 transition-all"
                >
                  {creating ? "CREANDO..." : "CREAR Y AÑADIR"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exercise list */}
        <div className="overflow-y-auto flex-1 px-4 pb-6">
          {loading ? (
            <div className="py-12 text-center text-white/20 font-black uppercase tracking-widest text-[10px]">
              Cargando ejercicios...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                Sin resultados{searchTerm ? ` para "${searchTerm}"` : ""}
              </p>
              {!showCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-5 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600/20 transition-all"
                >
                  + Crear "{searchTerm || "ejercicio"}"
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-4">
              {filteredExercises.map(ex => (
                <div
                  key={ex.id}
                  className="w-full p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-blue-500/30 transition-all group flex items-center gap-3"
                >
                  <button
                    onClick={() => onSelectExercise(ex as unknown as Exercise)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    {ex.imageUrl ? (
                      <img
                        src={exerciseMediaUrl(ex.imageUrl)!}
                        alt=""
                        width={44}
                        height={44}
                        loading="lazy"
                        className="w-11 h-11 rounded-xl bg-white object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors truncate">
                        {ex.name}
                      </p>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5">
                        {(ex as any).muscleGroup || ex.muscle_group}
                      </p>
                    </div>
                  </button>
                  {ex.gifUrl && (
                    <button
                      onClick={() => setTechniqueOf(ex)}
                      title="Ver técnica"
                      className="shrink-0 px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[8px] font-black text-white/35 hover:text-blue-300 hover:border-blue-500/40 uppercase tracking-widest transition-all"
                    >
                      Técnica
                    </button>
                  )}
                  <button
                    onClick={() => onSelectExercise(ex as unknown as Exercise)}
                    className="shrink-0"
                    aria-label={`Añadir ${ex.name}`}
                  >
                    <svg className="w-4 h-4 text-white/10 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {techniqueOf && (
        <TechniqueModal exerciseId={techniqueOf.id} onClose={() => setTechniqueOf(null)} />
      )}
    </div>
  );
}
