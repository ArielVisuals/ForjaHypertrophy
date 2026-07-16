import { useState } from "react";
import { MEAL_SLOT_LABELS, INGREDIENT_UNITS, type Ingredient } from "../../lib/constants/nutrition";

/**
 * Editor del plan alimenticio de un asesorado. Guardar reemplaza el plan
 * activo y sincroniza los objetivos diarios del atleta con las metas.
 */

interface DraftMeal {
  slot: string;
  name: string;
  ingredients: Ingredient[];
  description: string; // preparacion / notas
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

interface Draft {
  name: string;
  notes: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  meals: DraftMeal[];
}

interface InitialPlan {
  name: string;
  notes: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  meals: { slot: string; name: string; ingredients?: Ingredient[]; description: string | null; calories: number; proteinG: number; carbsG: number; fatsG: number }[];
}

const SLOTS = Object.entries(MEAL_SLOT_LABELS);

const newIngredient = (): Ingredient => ({ name: "", qty: 0, unit: "g" });

const newMeal = (slot = "desayuno"): DraftMeal => ({
  slot,
  name: "",
  ingredients: [newIngredient()],
  description: "",
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatsG: 0,
});

export function MealPlanEditor({ athleteId, athleteName, initialPlan }: {
  athleteId: string;
  athleteName: string;
  initialPlan: InitialPlan | null;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    initialPlan
      ? {
          name: initialPlan.name,
          notes: initialPlan.notes ?? "",
          calories: initialPlan.calories,
          proteinG: initialPlan.proteinG,
          carbsG: initialPlan.carbsG,
          fatsG: initialPlan.fatsG,
          meals: initialPlan.meals.map(m => ({
            ...m,
            ingredients: m.ingredients?.length ? m.ingredients : [newIngredient()],
            description: m.description ?? "",
          })),
        }
      : {
          name: `Plan de ${athleteName}`,
          notes: "",
          calories: 2500,
          proteinG: 180,
          carbsG: 300,
          fatsG: 70,
          meals: [newMeal("desayuno"), newMeal("comida"), newMeal("cena")],
        }
  );
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const patchMeal = (i: number, fields: Partial<DraftMeal>) =>
    setDraft(d => ({ ...d, meals: d.meals.map((m, j) => (j === i ? { ...m, ...fields } : m)) }));

  const patchIngredient = (mealIdx: number, ingIdx: number, fields: Partial<Ingredient>) =>
    setDraft(d => ({
      ...d,
      meals: d.meals.map((m, j) =>
        j === mealIdx
          ? { ...m, ingredients: m.ingredients.map((ing, k) => (k === ingIdx ? { ...ing, ...fields } : ing)) }
          : m
      ),
    }));

  const totals = draft.meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (Number(m.calories) || 0),
      prot: acc.prot + (Number(m.proteinG) || 0),
      carbs: acc.carbs + (Number(m.carbsG) || 0),
      fats: acc.fats + (Number(m.fatsG) || 0),
    }),
    { kcal: 0, prot: 0, carbs: 0, fats: 0 }
  );
  const kcalGap = draft.calories > 0 ? Math.abs(totals.kcal - draft.calories) / draft.calories : 0;

  const save = async () => {
    if (!draft.name.trim()) return setError("El plan necesita un nombre");
    if (!draft.meals.some(m => m.name.trim())) return setError("Agrega al menos una comida con nombre");
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", athleteId, ...draft }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al guardar el plan");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el plan");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setDeactivating(true);
    try {
      const res = await fetch("/api/coach/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate", athleteId }),
      });
      if (res.ok || res.status === 204) window.location.href = `/coach/athletes/${athleteId}`;
    } finally {
      setDeactivating(false);
    }
  };

  const numInput = (value: number, onChange: (v: number) => void, max = 10000) => (
    <input
      type="number"
      min={0}
      max={max}
      value={value || ""}
      placeholder="0"
      onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))}
      className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-xs font-bold text-white text-center placeholder:text-white/15 focus:outline-none focus:border-blue-500/50 transition-all tabular-nums"
    />
  );

  return (
    <div className="space-y-6">
      {/* Metadatos + metas */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-[#0A0A0B] border border-white/10 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Nombre del plan</label>
            <input
              type="text"
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Notas para el atleta</label>
            <input
              type="text"
              value={draft.notes}
              onChange={e => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Hidratacion, suplementos, indicaciones..."
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Metas diarias</label>
          <div className="grid grid-cols-4 gap-2 max-w-md">
            {([
              ["KCAL", draft.calories, (v: number) => setDraft({ ...draft, calories: v })],
              ["PROT (G)", draft.proteinG, (v: number) => setDraft({ ...draft, proteinG: v })],
              ["CARBS (G)", draft.carbsG, (v: number) => setDraft({ ...draft, carbsG: v })],
              ["GRASAS (G)", draft.fatsG, (v: number) => setDraft({ ...draft, fatsG: v })],
            ] as const).map(([label, value, set]) => (
              <div key={label}>
                <p className="text-[7px] font-black text-white/25 uppercase tracking-[0.25em] mb-1 text-center">{label}</p>
                {numInput(value, set)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comidas */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-[#0A0A0B] border border-white/10 space-y-4">
        <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.3em]">Comidas del dia</p>

        {draft.meals.map((meal, i) => (
          <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">

            {/* Franja + nombre + quitar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={meal.slot}
                onChange={e => patchMeal(i, { slot: e.target.value })}
                className="sm:w-36 rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-[10px] font-black uppercase text-white/70 focus:outline-none focus:border-blue-500/50 transition-all"
              >
                {SLOTS.map(([value, label]) => (
                  <option key={value} value={value} className="bg-[#0A0A0B]">{label}</option>
                ))}
              </select>
              <input
                type="text"
                value={meal.name}
                onChange={e => patchMeal(i, { name: e.target.value })}
                placeholder="Nombre de la comida (Ej. Avena con whey y platano)"
                className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, meals: d.meals.filter((_, j) => j !== i) }))}
                className="self-end sm:self-auto h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-red-300 hover:border-red-500/40 text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Quitar comida
              </button>
            </div>

            {/* Ingredientes: nombre + cantidad + unidad (dos lineas en movil) */}
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_76px_84px_32px] gap-2 px-1">
                {["Ingrediente", "Cantidad", "Unidad", ""].map((h, k) => (
                  <p key={k} className="text-[8px] font-black text-white/25 uppercase tracking-[0.3em]">{h}</p>
                ))}
              </div>
              {meal.ingredients.map((ing, k) => (
                <div key={k} className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={e => patchIngredient(i, k, { name: e.target.value })}
                    placeholder="Ingrediente (Ej. Avena en hojuelas)"
                    className="w-full sm:w-auto sm:flex-1 min-w-0 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={ing.qty || ""}
                    placeholder="Cant."
                    onChange={e => patchIngredient(i, k, { qty: Math.max(0, Number(e.target.value) || 0) })}
                    className="flex-1 sm:flex-none sm:w-[76px] min-w-0 rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-xs font-bold text-white text-center placeholder:text-white/15 focus:outline-none focus:border-blue-500/50 transition-all tabular-nums"
                  />
                  <select
                    value={ing.unit}
                    onChange={e => patchIngredient(i, k, { unit: e.target.value })}
                    className="flex-1 sm:flex-none sm:w-[84px] min-w-0 rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-2.5 text-[10px] font-black uppercase text-white/70 focus:outline-none focus:border-blue-500/50 transition-all"
                  >
                    {INGREDIENT_UNITS.map(u => (
                      <option key={u.value} value={u.value} className="bg-[#0A0A0B]">{u.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => patchMeal(i, { ingredients: meal.ingredients.filter((_, j) => j !== k) })}
                    className="h-9 w-9 shrink-0 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-red-300 hover:border-red-500/40 text-xs font-black transition-all"
                    aria-label="Quitar ingrediente"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => patchMeal(i, { ingredients: [...meal.ingredients, newIngredient()] })}
                className="w-full py-2 rounded-lg border border-dashed border-white/[0.08] text-[8px] font-black text-white/25 hover:text-white/55 hover:border-blue-500/40 uppercase tracking-widest transition-all"
              >
                Agregar ingrediente
              </button>
            </div>

            {/* Preparacion + macros de la comida */}
            <div className="grid grid-cols-2 md:grid-cols-[1fr_70px_60px_60px_60px] gap-2 items-end">
              <input
                type="text"
                value={meal.description}
                onChange={e => patchMeal(i, { description: e.target.value })}
                placeholder="Preparacion / notas (opcional)"
                className="col-span-2 md:col-span-1 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-xs font-bold text-white placeholder:text-white/15 focus:outline-none focus:border-blue-500/50 transition-all"
              />
              {([
                ["Kcal", meal.calories, (v: number) => patchMeal(i, { calories: v }), 10000],
                ["Prot", meal.proteinG, (v: number) => patchMeal(i, { proteinG: v }), 1000],
                ["Carbs", meal.carbsG, (v: number) => patchMeal(i, { carbsG: v }), 2000],
                ["Grasas", meal.fatsG, (v: number) => patchMeal(i, { fatsG: v }), 1000],
              ] as const).map(([label, value, set, max]) => (
                <div key={label}>
                  <p className="text-[7px] font-black text-white/25 uppercase tracking-[0.25em] mb-1 text-center">{label}</p>
                  {numInput(value, set, max)}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setDraft(d => ({ ...d, meals: [...d.meals, newMeal(d.meals[d.meals.length - 1]?.slot ?? "desayuno")] }))}
          className="w-full py-3 rounded-xl border border-dashed border-white/[0.1] text-[9px] font-black text-white/30 hover:text-white/60 hover:border-blue-500/40 uppercase tracking-widest transition-all"
        >
          Agregar comida
        </button>

        {/* Total vs metas */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Suma de las comidas</p>
          <p className={`text-[10px] font-black tabular-nums uppercase tracking-widest ${
            kcalGap > 0.1 ? "text-orange-400" : "text-emerald-400"
          }`}>
            {Math.round(totals.kcal)} kcal · {Math.round(totals.prot)}P · {Math.round(totals.carbs)}C · {Math.round(totals.fats)}G
            <span className="text-white/25"> / meta {draft.calories} kcal</span>
          </p>
        </div>
      </div>

      {error && <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        {initialPlan ? (
          <button
            type="button"
            onClick={deactivate}
            disabled={deactivating}
            className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/[0.03] border border-white/[0.08] text-white/35 hover:text-red-300 hover:border-red-500/40 transition-all disabled:opacity-40"
          >
            {deactivating ? "..." : "Retirar plan"}
          </button>
        ) : <span />}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-40"
        >
          {saved ? "Plan guardado" : saving ? "Guardando..." : "Guardar y asignar"}
        </button>
      </div>
    </div>
  );
}
