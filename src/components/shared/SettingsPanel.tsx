import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SettingsPanelProps {
  userId: string;
  initialTargets?: { calories: number; proteinG: number; carbsG: number; fatsG: number } | null;
  /** Nombre del plan alimenticio activo; si existe, las metas las define el coach */
  lockedByPlan?: string | null;
}

type Goal = "bulk" | "cut" | "maintain" | "recomp";
type Level = "beginner" | "intermediate" | "advanced" | "elite";

const GOAL_CONFIG: Record<Goal, { label: string; desc: string; kcalMod: number; proteinMod: number }> = {
  bulk:     { label: "VOLUMEN",      desc: "Superávit para maximizar masa muscular",      kcalMod: +400, proteinMod: 2.0 },
  cut:      { label: "DEFINICIÓN",   desc: "Déficit para preservar músculo y perder grasa", kcalMod: -400, proteinMod: 2.4 },
  maintain: { label: "MANTENIMIENTO", desc: "Mantener composición corporal actual",        kcalMod: 0,    proteinMod: 1.8 },
  recomp:   { label: "RECOMPOSICIÓN", desc: "Perder grasa y ganar músculo simultáneamente", kcalMod: -200, proteinMod: 2.2 },
};

const LEVEL_CONFIG: Record<Level, { label: string; desc: string }> = {
  beginner:     { label: "PRINCIPIANTE",  desc: "Menos de 1 año entrenando" },
  intermediate: { label: "INTERMEDIO",    desc: "1-3 años de experiencia" },
  advanced:     { label: "AVANZADO",      desc: "3-5 años de experiencia" },
  elite:        { label: "ELITE",         desc: "5+ años, competidor" },
};

function calcTDEE(weightKg: number, heightCm: number, age: number, isMale: boolean, level: Level): number {
  const bmr = isMale
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const activityMultiplier = { beginner: 1.375, intermediate: 1.55, advanced: 1.725, elite: 1.9 }[level];
  return Math.round(bmr * activityMultiplier);
}

export function SettingsPanel({ userId, initialTargets, lockedByPlan }: SettingsPanelProps) {
  const [weightKg, setWeightKg]   = useState(80);
  const [heightCm, setHeightCm]   = useState(175);
  const [age, setAge]             = useState(25);
  const [isMale, setIsMale]       = useState(true);
  const [goal, setGoal]           = useState<Goal>("bulk");
  const [level, setLevel]         = useState<Level>("intermediate");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`forja_settings_${userId}`);
      if (stored) {
        const s = JSON.parse(stored);
        if (s.weightKg) setWeightKg(s.weightKg);
        if (s.heightCm) setHeightCm(s.heightCm);
        if (s.age)      setAge(s.age);
        if (s.isMale !== undefined) setIsMale(s.isMale);
        if (s.goal)     setGoal(s.goal);
        if (s.level)    setLevel(s.level);
      }
    } catch {}
  }, [userId]);

  const tdee     = calcTDEE(weightKg, heightCm, age, isMale, level);
  const goalCfg  = GOAL_CONFIG[goal];
  const protein  = Math.round(weightKg * goalCfg.proteinMod);
  const calories = tdee + goalCfg.kcalMod;
  const fats     = Math.round(weightKg * 0.8);
  const carbsKcal = calories - protein * 4 - fats * 9;
  const carbs    = Math.max(50, Math.round(carbsKcal / 4));

  const saveSettings = async () => {
    setSaving(true);
    try {
      localStorage.setItem(`forja_settings_${userId}`, JSON.stringify({ weightKg, heightCm, age, isMale, goal, level }));
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-targets",
          calories,
          proteinG: protein,
          carbsG:   carbs,
          fatsG:    fats,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 max-w-3xl">

      {/* Profile */}
      <div className="p-8 sm:p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-8">
        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">01. PERFIL FÍSICO</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "PESO (KG)", value: weightKg, setter: setWeightKg, step: 0.5, min: 40, max: 200 },
            { label: "TALLA (CM)", value: heightCm, setter: setHeightCm, step: 1,   min: 140, max: 220 },
            { label: "EDAD",       value: age,      setter: setAge,      step: 1,   min: 14,  max: 80  },
          ].map(f => (
            <div key={f.label} className="space-y-2">
              <label className="text-[8px] font-black text-white/25 uppercase tracking-widest">{f.label}</label>
              <input
                type="number"
                step={f.step} min={f.min} max={f.max}
                value={f.value}
                onChange={e => f.setter(Number(e.target.value))}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-3 text-white font-black text-lg text-center outline-none focus:border-blue-500/30 transition-all"
              />
            </div>
          ))}
          <div className="space-y-2">
            <label className="text-[8px] font-black text-white/25 uppercase tracking-widest">SEXO</label>
            <div className="flex gap-2">
              {[{ label: "M", val: true }, { label: "F", val: false }].map(s => (
                <button
                  key={s.label}
                  onClick={() => setIsMale(s.val)}
                  className={`flex-1 py-3 rounded-xl font-black text-sm border transition-all ${
                    isMale === s.val
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-white/[0.03] border-white/10 text-white/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Training level */}
      <div className="p-8 sm:p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-6">
        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">02. NIVEL DE EXPERIENCIA</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(LEVEL_CONFIG) as [Level, typeof LEVEL_CONFIG[Level]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setLevel(key)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                level === key
                  ? "bg-blue-600/15 border-blue-500/40"
                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/15"
              }`}
            >
              <p className={`text-[9px] font-black uppercase tracking-widest ${level === key ? "text-blue-300" : "text-white/40"}`}>{cfg.label}</p>
              <p className="text-[8px] font-bold text-white/20 mt-1 leading-tight">{cfg.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="p-8 sm:p-10 rounded-[3rem] bg-[#0A0A0B] border border-white/10 space-y-6">
        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">03. OBJETIVO ACTUAL</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(GOAL_CONFIG) as [Goal, typeof GOAL_CONFIG[Goal]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setGoal(key)}
              className={`p-5 rounded-2xl border text-left transition-all ${
                goal === key
                  ? "bg-blue-600/15 border-blue-500/40"
                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/15"
              }`}
            >
              <p className={`text-[10px] font-black uppercase tracking-widest ${goal === key ? "text-blue-300" : "text-white/50"}`}>{cfg.label}</p>
              <p className="text-[8px] font-bold text-white/25 mt-1 leading-tight">{cfg.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Calculated targets */}
      <div className="p-8 sm:p-10 rounded-[3rem] bg-[#0A0A0B] border border-blue-500/20 space-y-6">
        <div className="flex items-start justify-between">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">04. OBJETIVOS CALCULADOS</h2>
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">TDEE: {tdee} KCAL</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "CALORÍAS",  value: calories,  unit: "KCAL", color: "text-blue-400" },
            { label: "PROTEÍNA",  value: protein,   unit: "G",    color: "text-emerald-400" },
            { label: "CARBOS",    value: carbs,     unit: "G",    color: "text-orange-400" },
            { label: "GRASAS",    value: fats,      unit: "G",    color: "text-purple-400" },
          ].map(m => (
            <div key={m.label} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">{m.label}</p>
              <p className={`text-2xl font-black tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[8px] font-bold text-white/20 uppercase mt-0.5">{m.unit}</p>
            </div>
          ))}
        </div>

        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
          Proteína: {goalCfg.proteinMod}g/kg · {goalCfg.kcalMod >= 0 ? "+" : ""}{goalCfg.kcalMod} KCAL vs TDEE
        </p>

        {lockedByPlan ? (
          <div className="p-5 rounded-2xl bg-blue-600/[0.08] border border-blue-500/20 space-y-1">
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">
              Tus metas las define tu entrenador
            </p>
            <p className="text-[9px] font-bold text-white/35 uppercase tracking-wider leading-relaxed">
              Estan sincronizadas con tu plan alimenticio ({lockedByPlan}). La calculadora queda como referencia; si crees que tus metas deben cambiar, habla con tu coach.
            </p>
          </div>
        ) : (
          <motion.button
            onClick={saveSettings}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] transition-all ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-2xl shadow-blue-600/25"
            } disabled:opacity-50`}
          >
            {saved ? "¡Objetivos Guardados!" : saving ? "Guardando..." : "Aplicar Objetivos al Plan de Nutrición"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
