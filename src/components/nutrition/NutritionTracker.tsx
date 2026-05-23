import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NumberTicker from "../ui/NumberTicker";
import { NutritionWeeklyChart } from "./NutritionWeeklyChart";

interface NutritionTrackerProps {
  userId: string;
}

interface NutritionLog {
  id: string;
  mealName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  loggedAt: string;
}

interface NutritionTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

interface NutritionStaple {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

interface FoodResult {
  id: string;
  name: string;
  brand: string;
  per100: { kcal: number; prot: number; carbs: number; fats: number };
}

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2800,
  proteinG: 200,
  carbsG: 350,
  fatsG: 70,
};

const DEFAULT_STAPLES: NutritionStaple[] = [
  { id: "s1", name: "BATIDO PRO",   calories: 250, proteinG: 45, carbsG: 20, fatsG: 4 },
  { id: "s2", name: "POLLO/ARROZ",  calories: 650, proteinG: 55, carbsG: 70, fatsG: 10 },
  { id: "s3", name: "OMELETTE",     calories: 450, proteinG: 30, carbsG: 5,  fatsG: 32 },
  { id: "s4", name: "AVENA NOCT",   calories: 500, proteinG: 25, carbsG: 75, fatsG: 8 },
];

export function NutritionTracker({ userId }: NutritionTrackerProps) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [targets, setTargets] = useState<NutritionTargets>(DEFAULT_TARGETS);
  const [staples, setStaples] = useState<NutritionStaple[]>(DEFAULT_STAPLES);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<"search" | "manual">("search");
  const [editingTargets, setEditingTargets] = useState(false);
  const [targetDraft, setTargetDraft] = useState<NutritionTargets>(DEFAULT_TARGETS);
  const [savingTargets, setSavingTargets] = useState(false);

  // Food search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [portionGrams, setPortionGrams] = useState("100");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    kcal: "",
    prot: "",
    carbs: "",
    fats: "",
  });
  const [saveFormAsStaple, setSaveFormAsStaple] = useState(false);
  const [loggingStapleId, setLoggingStapleId] = useState<string | null>(null);

  useEffect(() => {
    loadNutritionData();
  }, [userId]);

  const loadNutritionData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/nutrition?userId=${userId}`);
      const data = await response.json();

      setLogs(data.logs ?? []);

      if (data.targets) {
        setTargets({
          calories: Number(data.targets.calories),
          proteinG: Number(data.targets.proteinG),
          carbsG:   Number(data.targets.carbsG),
          fatsG:    Number(data.targets.fatsG),
        });
      }

      if (data.staples && data.staples.length > 0) {
        setStaples(
          data.staples.map((s: any) => ({
            id:       s.id,
            name:     s.name,
            calories: Number(s.calories),
            proteinG: Number(s.proteinG),
            carbsG:   Number(s.carbsG),
            fatsG:    Number(s.fatsG),
          }))
        );
      }
    } catch (e) {
      console.error("Error loading nutrition:", e);
    } finally {
      setLoading(false);
    }
  };

  const totals = logs.reduce(
    (acc, log) => ({
      kcal:  acc.kcal  + Number(log.calories),
      prot:  acc.prot  + Number(log.proteinG  ?? 0),
      carbs: acc.carbs + Number(log.carbsG    ?? 0),
      fats:  acc.fats  + Number(log.fatsG     ?? 0),
    }),
    { kcal: 0, prot: 0, carbs: 0, fats: 0 }
  );

  const addMeal = async () => {
    if (!formData.name || !formData.kcal) return alert("Nombre y Calorías requeridos");
    const payload = {
      userId,
      mealName:  formData.name,
      calories:  parseFloat(formData.kcal),
      proteinG:  parseFloat(formData.prot)  || 0,
      carbsG:    parseFloat(formData.carbs) || 0,
      fatsG:     parseFloat(formData.fats)  || 0,
    };
    try {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        if (saveFormAsStaple) {
          await fetch("/api/nutrition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action:   "add-staple",
              userId,
              name:     formData.name,
              calories: payload.calories,
              proteinG: payload.proteinG,
              carbsG:   payload.carbsG,
              fatsG:    payload.fatsG,
            }),
          });
        }
        setFormData({ name: "", kcal: "", prot: "", carbs: "", fats: "" });
        setSaveFormAsStaple(false);
        setShowAddForm(false);
        loadNutritionData();
      }
    } catch (e) {
      alert("Error al registrar combustible");
    }
  };

  const logStaple = async (s: NutritionStaple) => {
    setLoggingStapleId(s.id);
    try {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mealName:  s.name,
          calories:  s.calories,
          proteinG:  s.proteinG,
          carbsG:    s.carbsG,
          fatsG:     s.fatsG,
        }),
      });
      if (response.ok) loadNutritionData();
    } catch (e) {
      console.error("Error logging staple:", e);
    } finally {
      setLoggingStapleId(null);
    }
  };

  const searchFoods = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=true&page_size=8&fields=id,product_name,brands,nutriments`;
      const res = await fetch(url);
      const data = await res.json();
      const products: FoodResult[] = (data.products ?? [])
        .filter((p: any) => p.product_name && p.nutriments?.["energy-kcal_100g"])
        .slice(0, 6)
        .map((p: any) => ({
          id:    p.id ?? p._id ?? Math.random().toString(),
          name:  p.product_name,
          brand: p.brands ?? "",
          per100: {
            kcal:  Math.round(p.nutriments["energy-kcal_100g"] ?? 0),
            prot:  Math.round((p.nutriments["proteins_100g"] ?? 0) * 10) / 10,
            carbs: Math.round((p.nutriments["carbohydrates_100g"] ?? 0) * 10) / 10,
            fats:  Math.round((p.nutriments["fat_100g"] ?? 0) * 10) / 10,
          },
        }));
      setSearchResults(products);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setSelectedFood(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchFoods(q), 350);
  };

  const selectFood = (food: FoodResult) => {
    setSelectedFood(food);
    setSearchResults([]);
    setPortionGrams("100");
  };

  const portionMacros = selectedFood
    ? {
        kcal:  Math.round((selectedFood.per100.kcal  * Number(portionGrams)) / 100),
        prot:  Math.round((selectedFood.per100.prot  * Number(portionGrams)) / 100 * 10) / 10,
        carbs: Math.round((selectedFood.per100.carbs * Number(portionGrams)) / 100 * 10) / 10,
        fats:  Math.round((selectedFood.per100.fats  * Number(portionGrams)) / 100 * 10) / 10,
      }
    : null;

  const logFromSearch = async () => {
    if (!selectedFood || !portionMacros) return;
    try {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mealName:  selectedFood.name.toUpperCase(),
          calories:  portionMacros.kcal,
          proteinG:  portionMacros.prot,
          carbsG:    portionMacros.carbs,
          fatsG:     portionMacros.fats,
        }),
      });
      if (response.ok) {
        setSelectedFood(null);
        setSearchQuery("");
        setPortionGrams("100");
        setShowAddForm(false);
        loadNutritionData();
      }
    } catch {
      alert("Error al registrar combustible");
    }
  };

  const saveTargets = async () => {
    setSavingTargets(true);
    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-targets", userId, ...targetDraft }),
      });
      setTargets(targetDraft);
      setEditingTargets(false);
    } catch {
      alert("Error al guardar objetivos");
    } finally {
      setSavingTargets(false);
    }
  };

  const saveAsStaple = async () => {
    if (!selectedFood || !portionMacros) return;
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:   "add-staple",
          userId,
          name:     selectedFood.name.toUpperCase().slice(0, 40),
          calories: portionMacros.kcal,
          proteinG: portionMacros.prot,
          carbsG:   portionMacros.carbs,
          fatsG:    portionMacros.fats,
        }),
      });
      if (res.ok) {
        const newStaple = await res.json();
        setStaples(prev => [{
          id:       newStaple.id,
          name:     newStaple.name,
          calories: Number(newStaple.calories),
          proteinG: Number(newStaple.proteinG),
          carbsG:   Number(newStaple.carbsG),
          fatsG:    Number(newStaple.fatsG),
        }, ...prev]);
      }
    } catch {
      console.error("Error guardando staple");
    }
  };

  const deleteStaple = async (id: string) => {
    await fetch(`/api/nutrition?stapleId=${id}`, { method: "DELETE" });
    setStaples(prev => prev.filter(s => s.id !== id));
  };

  const loadStaple = (s: NutritionStaple) => {
    setFormData({
      name:  s.name,
      kcal:  s.calories.toString(),
      prot:  s.proteinG.toString(),
      carbs: s.carbsG.toString(),
      fats:  s.fatsG.toString(),
    });
    setAddMode("manual");
    setShowAddForm(true);
  };

  if (loading)
    return (
      <div className="text-white/20 font-black uppercase tracking-[0.3em] py-20 text-center text-xs">
        Iniciando Fuel Lab...
      </div>
    );

  return (
    <div className="space-y-12">

      {/* Macro Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Calorías */}
        <div className="lg:col-span-1 p-8 sm:p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="text-[10px] font-black text-white/30 tracking-widest uppercase">(01) ENERGÍA TOTAL</div>
            <button
              onClick={() => { setTargetDraft(targets); setEditingTargets(v => !v); }}
              className="text-[8px] font-black text-white/20 uppercase tracking-widest hover:text-blue-400 transition-colors"
            >
              {editingTargets ? "✕" : "EDITAR"}
            </button>
          </div>

          {editingTargets ? (
            <div className="space-y-4">
              {[
                { key: "calories", label: "KCAL META", step: 50, min: 1000 },
                { key: "proteinG", label: "PROTEÍNA (G)", step: 5, min: 50 },
                { key: "carbsG",   label: "CARBOS (G)",   step: 10, min: 50 },
                { key: "fatsG",    label: "GRASAS (G)",   step: 5, min: 20 },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">{field.label}</label>
                  <input
                    type="number"
                    step={field.step}
                    min={field.min}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white font-black text-sm outline-none focus:border-blue-500/30 transition-all"
                    value={(targetDraft as any)[field.key]}
                    onChange={e => setTargetDraft(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
              <button
                onClick={saveTargets}
                disabled={savingTargets}
                className="w-full py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all disabled:opacity-40"
              >
                {savingTargets ? "Guardando..." : "Guardar Objetivos"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <NumberTicker value={totals.kcal} className="text-7xl font-black text-white tracking-tighter" />
                <span className="text-xl font-bold text-white/20">KCAL</span>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000"
                    style={{ width: `${Math.min(100, (totals.kcal / targets.calories) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-blue-400">META: {targets.calories}</span>
                  <span className="text-white/20">{Math.round((totals.kcal / targets.calories) * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Macros */}
        <div className="lg:col-span-3 p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 relative overflow-hidden">
          <div className="text-[10px] font-black text-white/30 tracking-widest uppercase mb-8">(02) DISTRIBUCIÓN DE MACROS</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {[
              { label: "PROTEÍNA",  value: totals.prot,  target: targets.proteinG, color: "bg-emerald-500", shadow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",  sub: "RECUPERACIÓN Y SÍNTESIS" },
              { label: "CARBOS",    value: totals.carbs, target: targets.carbsG,   color: "bg-orange-500",  shadow: "shadow-[0_0_15px_rgba(249,115,22,0.5)]",   sub: "VOLUMEN Y RENDIMIENTO" },
              { label: "GRASAS",    value: totals.fats,  target: targets.fatsG,    color: "bg-purple-500",  shadow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]",   sub: "EQUILIBRIO HORMONAL" },
            ].map((macro) => (
              <div key={macro.label} className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-white uppercase tracking-tighter">{macro.label}</span>
                  <span className="text-xl font-black text-white">
                    {Math.round(macro.value)}
                    <span className="text-[10px] text-white/20 ml-1">/ {macro.target}G</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${macro.color} ${macro.shadow} transition-all duration-1000`}
                    style={{ width: `${Math.min(100, (macro.value / macro.target) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase">{macro.sub}</p>
              </div>
            ))}

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

        {/* Columna izquierda: Registro rápido + Staples */}
        <div className="lg:col-span-1 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em]">REGISTRO RÁPIDO</h2>
          </div>

          {!showAddForm ? (
            <button
              onClick={() => { setShowAddForm(true); setAddMode("search"); }}
              className="w-full py-6 rounded-[2rem] bg-white/5 border border-dashed border-white/20 text-white/40 font-black uppercase tracking-widest text-xs hover:border-blue-500/50 hover:text-white transition-all"
            >
              + Añadir Combustible
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-[2.5rem] bg-[#0A0A0B] border border-white/15 space-y-5"
            >
              {/* Mode tabs */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => setAddMode("search")}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${addMode === "search" ? "bg-blue-600 text-white" : "text-white/30 hover:text-white"}`}
                >
                  Buscar
                </button>
                <button
                  onClick={() => setAddMode("manual")}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${addMode === "manual" ? "bg-blue-600 text-white" : "text-white/30 hover:text-white"}`}
                >
                  Manual
                </button>
              </div>

              {addMode === "search" ? (
                <div className="space-y-4">
                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar alimento..."
                      autoFocus
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all placeholder-white/20"
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                    />
                    {searching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Results */}
                  {searchResults.length > 0 && !selectedFood && (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {searchResults.map(food => (
                        <button
                          key={food.id}
                          onClick={() => selectFood(food)}
                          className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                        >
                          <p className="text-[11px] font-black text-white uppercase tracking-tight leading-tight truncate">{food.name}</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                            {food.brand && `${food.brand} · `}{food.per100.kcal} KCAL | {food.per100.prot}G P por 100G
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected food + portion */}
                  {selectedFood && portionMacros && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20">
                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-tight leading-tight">{selectedFood.name}</p>
                        {selectedFood.brand && (
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{selectedFood.brand}</p>
                        )}
                        <button
                          onClick={() => { setSelectedFood(null); setSearchQuery(""); }}
                          className="text-[8px] font-black text-blue-400/60 uppercase tracking-widest mt-1 hover:text-blue-400 transition-colors"
                        >
                          Cambiar
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Porción (Gramos)</label>
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xl text-center outline-none focus:border-blue-500/50 transition-all"
                          value={portionGrams}
                          onChange={e => setPortionGrams(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "KCAL",  value: portionMacros.kcal },
                          { label: "P",     value: `${portionMacros.prot}G` },
                          { label: "C",     value: `${portionMacros.carbs}G` },
                          { label: "F",     value: `${portionMacros.fats}G` },
                        ].map(m => (
                          <div key={m.label} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                            <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">{m.label}</p>
                            <p className="text-[11px] font-black text-white mt-0.5">{m.value}</p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={logFromSearch}
                        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all"
                      >
                        Registrar {Number(portionGrams)}G
                      </button>

                      <button
                        onClick={saveAsStaple}
                        className="w-full py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white/30 font-black uppercase tracking-widest text-[9px] hover:border-orange-500/30 hover:text-orange-400 transition-all"
                      >
                        ★ Guardar como Staple
                      </button>
                    </div>
                  )}

                  {!searching && searchQuery.length >= 2 && searchResults.length === 0 && !selectedFood && (
                    <p className="text-center text-[9px] font-black text-white/20 uppercase tracking-widest py-4">
                      Sin resultados — prueba manual
                    </p>
                  )}
                </div>
              ) : (
                /* Manual form */
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="NOMBRE DE COMIDA"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white font-black text-xs tracking-widest outline-none focus:border-blue-500/50 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "kcal",  label: "KCAL" },
                      { key: "prot",  label: "PROT (G)" },
                      { key: "carbs", label: "CARBOS (G)" },
                      { key: "fats",  label: "GRASAS (G)" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[8px] font-black text-white/20 tracking-widest ml-1 uppercase">{label}</label>
                        <input
                          type="number"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-black text-lg outline-none focus:border-blue-500/50 transition-all"
                          value={(formData as any)[key]}
                          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setSaveFormAsStaple(v => !v)}
                    className={`w-full py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      saveFormAsStaple
                        ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                        : "bg-white/[0.02] border-white/8 text-white/25 hover:border-white/15 hover:text-white/50"
                    }`}
                  >
                    <span>{saveFormAsStaple ? "★" : "☆"}</span>
                    <span>{saveFormAsStaple ? "Guardar como Staple" : "Guardar como Staple"}</span>
                  </button>
                  <button
                    onClick={addMeal}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all"
                  >
                    Sincronizar Log
                  </button>
                </div>
              )}

              <button
                onClick={() => { setShowAddForm(false); setSelectedFood(null); setSearchQuery(""); setSearchResults([]); }}
                className="w-full py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-white/20 font-black text-[9px] uppercase tracking-widest hover:text-white/50 transition-all"
              >
                Cancelar
              </button>
            </motion.div>
          )}

          {/* Staples */}
          <div className="space-y-4">
            <p className="text-[9px] font-black text-white/20 tracking-widest uppercase ml-4">
              IRON STAPLES ({staples.length})
            </p>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {staples.map((s) => (
                <div
                  key={s.id}
                  className="relative rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all group overflow-hidden"
                >
                  {/* One-tap log button (main area) */}
                  <button
                    onClick={() => logStaple(s)}
                    disabled={loggingStapleId === s.id}
                    className="w-full text-left p-4 pb-2 disabled:opacity-50"
                  >
                    <div className="text-[9px] font-black text-white tracking-widest uppercase group-hover:text-blue-400 transition-colors truncate pr-4">
                      {loggingStapleId === s.id ? "..." : s.name}
                    </div>
                    <div className="text-[8px] font-bold text-white/20 mt-0.5">
                      {s.calories} KCAL · {s.proteinG}G P
                    </div>
                  </button>
                  {/* Bottom action bar */}
                  <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => loadStaple(s)}
                      className="text-[7px] font-black text-white/20 uppercase tracking-widest hover:text-white/50 transition-colors"
                    >
                      editar
                    </button>
                    <button
                      onClick={() => deleteStaple(s.id)}
                      className="text-[7px] font-black text-red-400/30 uppercase tracking-widest hover:text-red-400 transition-colors"
                    >
                      eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha: Weekly chart + Timeline del día */}
        <div className="lg:col-span-2 space-y-8">

          {/* Weekly nutrition chart */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[#0A0A0B] border border-white/10">
            <NutritionWeeklyChart
              userId={userId}
              targetKcal={targets.calories}
              targetProt={targets.proteinG}
            />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em]">LOG DE HOY</h2>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              {logs.length} ENTRADAS
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {logs.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                  <p className="text-white/10 font-black uppercase tracking-widest text-[10px]">
                    No hay combustible registrado hoy
                  </p>
                </div>
              ) : (
                logs.map((log, idx) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-5 sm:p-6 rounded-[2rem] bg-[#0A0A0B] border border-white/10 flex justify-between items-center group hover:border-white/20 transition-all"
                  >
                    <div className="flex gap-4 sm:gap-6 items-center min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-white/20 text-[10px] shrink-0">
                        {(idx + 1).toString().padStart(2, "0")}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest truncate">
                          {log.mealName}
                        </h4>
                        <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                          {Math.round(Number(log.calories))} KCAL
                          {" | "}{Math.round(Number(log.proteinG ?? 0))}G P
                          {" | "}{Math.round(Number(log.carbsG   ?? 0))}G C
                          {" | "}{Math.round(Number(log.fatsG    ?? 0))}G F
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[9px] font-black text-white/10 uppercase tracking-widest hidden sm:block">
                        {new Date(log.loggedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={async () => {
                          await fetch(`/api/nutrition?id=${log.id}`, { method: "DELETE" });
                          setLogs(prev => prev.filter(l => l.id !== log.id));
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
