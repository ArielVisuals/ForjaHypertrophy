import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  PRIMARY_GOALS,
  ACTIVITY_LEVELS,
  MEALS_PER_DAY,
  HYDRATION,
  SLEEP_HOURS,
  SESSION_MINUTES,
  PREFERRED_TIMES,
  EQUIPMENT,
} from "../../lib/constants/intake";

/**
 * Cuestionario de Evaluacion Inicial: se responde una sola vez al crear cuenta.
 * El entrenador usa estas respuestas para disenar el plan del atleta.
 * Borrador persistido en localStorage hasta el envio.
 */

const DRAFT_KEY = "forja_intake_draft";

interface IntakeDraft {
  goals: {
    primaryGoal: string;
    specificGoal: string;
    motivation: string;
    previousObstacles: string;
  };
  health: {
    injuries: string;
    conditions: string;
    medications: string;
    recentActivityLevel: string;
  };
  lifestyle: {
    nutritionHabits: string;
    mealsPerDay: string;
    hydrationLitersPerDay: string;
    sleepHours: string;
    sleepQuality: number;
    stressLevel: number;
  };
  availability: {
    daysPerWeek: number;
    minutesPerSession: string;
    preferredTime: string;
    likedExercises: string;
    dislikedExercises: string;
    equipment: string;
  };
}

const EMPTY_DRAFT: IntakeDraft = {
  goals: { primaryGoal: "", specificGoal: "", motivation: "", previousObstacles: "" },
  health: { injuries: "", conditions: "", medications: "", recentActivityLevel: "" },
  lifestyle: { nutritionHabits: "", mealsPerDay: "", hydrationLitersPerDay: "", sleepHours: "", sleepQuality: 5, stressLevel: 5 },
  availability: { daysPerWeek: 0, minutesPerSession: "", preferredTime: "", likedExercises: "", dislikedExercises: "", equipment: "" },
};

const STEPS = [
  { id: "goals",        num: "01", title: "OBJETIVOS",      subtitle: "Que quieres lograr y por que" },
  { id: "health",       num: "02", title: "SALUD",          subtitle: "Tu historial y condicion actual" },
  { id: "lifestyle",    num: "03", title: "HABITOS",        subtitle: "Alimentacion, sueño y estres" },
  { id: "availability", num: "04", title: "DISPONIBILIDAD", subtitle: "Tu tiempo y preferencias" },
] as const;

// ─── UI primitives ────────────────────────────────────────────────────────────

function FieldLabel({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="flex items-baseline gap-2 mb-2">
      <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">{children}</span>
      {optional && <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">OPCIONAL</span>}
    </label>
  );
}

function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all resize-none"
    />
  );
}

function ChipGroup({ options, value, onChange }: {
  options: { value: string; label: string }[] | string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = options.map(o => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            value === o.value
              ? "bg-blue-600/30 border border-blue-500/60 text-white"
              : "bg-white/[0.03] border border-white/[0.08] text-white/40 hover:bg-white/[0.06] hover:text-white/70"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ScaleSelector({ value, onChange, lowLabel, highLabel }: {
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`aspect-square rounded-lg text-[10px] font-black transition-all ${
              n === value
                ? "bg-blue-600/40 border border-blue-500/70 text-white"
                : n < value
                ? "bg-blue-600/15 border border-blue-500/20 text-blue-400/60"
                : "bg-white/[0.03] border border-white/[0.06] text-white/25 hover:bg-white/[0.06]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">{lowLabel}</span>
        <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">{highLabel}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState<IntakeDraft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restaurar borrador
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) setDraft({ ...EMPTY_DRAFT, ...JSON.parse(stored) });
    } catch {}
  }, []);

  // Persistir borrador
  useEffect(() => {
    if (draft !== EMPTY_DRAFT) {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
    }
  }, [draft]);

  const patch = <S extends keyof IntakeDraft>(section: S, fields: Partial<IntakeDraft[S]>) =>
    setDraft(d => ({ ...d, [section]: { ...d[section], ...fields } }));

  const stepValid = (() => {
    switch (STEPS[step].id) {
      case "goals":
        return !!draft.goals.primaryGoal && draft.goals.specificGoal.trim().length > 0;
      case "health":
        return !!draft.health.recentActivityLevel;
      case "lifestyle":
        return !!draft.lifestyle.mealsPerDay && !!draft.lifestyle.sleepHours;
      case "availability":
        return draft.availability.daysPerWeek > 0 && !!draft.availability.minutesPerSession && !!draft.availability.preferredTime;
    }
  })();

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al enviar el cuestionario");
      }
      localStorage.removeItem(DRAFT_KEY);
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar el cuestionario");
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[380px_1fr] gap-10 xl:gap-16 items-start">

      {/* ── Riel izquierdo: marca, titulo y pasos (sticky en desktop) ── */}
      <aside className="lg:sticky lg:top-10 space-y-8">
        <div className="flex items-center gap-3">
          <img src="/isotipo.png" alt="FORJA" width="2048" height="2048" className="h-8 w-auto" />
          <span className="text-lg font-extrabold text-white tracking-tighter">FORJA</span>
        </div>

        <div className="space-y-3">
          <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.4em]">CONSULTA INICIAL</p>
          <h1 className="text-4xl xl:text-5xl font-black text-white uppercase tracking-tighter leading-[0.95]">
            Evaluacion<span className="text-white/20"> Inicial</span>
          </h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-xs">
            Tu entrenador usara estas respuestas para diseñar tu plan. Responde con honestidad.
          </p>
        </div>

        {/* Lista vertical de pasos - solo desktop */}
        <ol className="hidden lg:block border-l border-white/[0.07]">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => { if (i < step) setStep(i); }}
                disabled={i > step}
                className={`w-full flex items-center gap-4 py-3 pl-5 -ml-px border-l-2 text-left transition-all ${
                  i === step
                    ? "border-blue-500"
                    : i < step
                    ? "border-blue-500/30 cursor-pointer hover:border-blue-500/60"
                    : "border-transparent"
                }`}
              >
                <span className={`text-[10px] font-black tabular-nums ${
                  i === step ? "text-blue-400" : i < step ? "text-blue-400/50" : "text-white/20"
                }`}>
                  {s.num}
                </span>
                <span>
                  <span className={`block text-[11px] font-black uppercase tracking-widest ${
                    i === step ? "text-white" : i < step ? "text-white/50" : "text-white/25"
                  }`}>
                    {s.title}
                  </span>
                  <span className={`block text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                    i === step ? "text-white/35" : "text-white/15"
                  }`}>
                    {s.subtitle}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      {/* ── Panel del formulario ── */}
      <div className="space-y-6">

        {/* Pasos compactos - solo movil/tablet */}
        <div className="flex lg:hidden items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { if (i < step) setStep(i); }}
              className={`flex-1 h-9 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                i === step
                  ? "bg-blue-600/30 border-blue-500/70 text-white"
                  : i < step
                  ? "bg-blue-600/15 border-blue-500/30 text-blue-400"
                  : "bg-white/[0.03] border-white/[0.08] text-white/25"
              }`}
            >
              {s.num}
            </button>
          ))}
        </div>

      {/* Paso actual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduceMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 overflow-hidden"
        >
          {/* Barra de progreso integrada al panel */}
          <div className="h-1 bg-white/[0.05]">
            <motion.div
              className="h-full bg-blue-600"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.4 }}
            />
          </div>

          <div className="p-6 sm:p-10 space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-none">
              {STEPS[step].title}
            </h2>
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest pt-1">
              {STEPS[step].subtitle}
            </p>
          </div>

          {STEPS[step].id === "goals" && (
            <div className="space-y-6">
              <div>
                <FieldLabel>Tu objetivo principal</FieldLabel>
                <ChipGroup
                  options={PRIMARY_GOALS}
                  value={draft.goals.primaryGoal}
                  onChange={v => patch("goals", { primaryGoal: v })}
                />
              </div>
              <div>
                <FieldLabel>Que quieres lograr exactamente</FieldLabel>
                <TextArea
                  value={draft.goals.specificGoal}
                  onChange={v => patch("goals", { specificGoal: v })}
                  placeholder="Ej. Ganar 5 kg de musculo, marcar el abdomen, subir mi press de banca..."
                />
              </div>
              <div>
                <FieldLabel>Por que es importante para ti</FieldLabel>
                <TextArea
                  value={draft.goals.motivation}
                  onChange={v => patch("goals", { motivation: v })}
                  placeholder="Tu motivacion real: salud, confianza, rendimiento..."
                />
              </div>
              <div>
                <FieldLabel>Que te ha impedido lograrlo hasta ahora</FieldLabel>
                <TextArea
                  value={draft.goals.previousObstacles}
                  onChange={v => patch("goals", { previousObstacles: v })}
                  placeholder="Falta de tiempo, constancia, lesiones, no saber como entrenar..."
                />
              </div>
            </div>
          )}

          {STEPS[step].id === "health" && (
            <div className="space-y-6">
              <div>
                <FieldLabel>Nivel de actividad fisica reciente</FieldLabel>
                <div className="grid sm:grid-cols-2 gap-2">
                  {ACTIVITY_LEVELS.map(a => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => patch("health", { recentActivityLevel: a.value })}
                      className={`p-4 rounded-xl text-left transition-all ${
                        draft.health.recentActivityLevel === a.value
                          ? "bg-blue-600/25 border border-blue-500/60"
                          : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06]"
                      }`}
                    >
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{a.label}</p>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider mt-1">{a.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel optional>Lesiones pasadas o actuales</FieldLabel>
                <TextArea
                  value={draft.health.injuries}
                  onChange={v => patch("health", { injuries: v })}
                  placeholder="Ej. Dolor lumbar, hombro operado en 2022, tendinitis de rodilla..."
                />
              </div>
              <div>
                <FieldLabel optional>Enfermedades o condiciones medicas</FieldLabel>
                <TextArea
                  value={draft.health.conditions}
                  onChange={v => patch("health", { conditions: v })}
                  placeholder="Ej. Hipertension, diabetes, asma... Escribe NINGUNA si no aplica"
                />
              </div>
              <div>
                <FieldLabel optional>Medicamentos actuales</FieldLabel>
                <TextArea
                  value={draft.health.medications}
                  onChange={v => patch("health", { medications: v })}
                  placeholder="Medicamentos que tomas regularmente"
                />
              </div>
            </div>
          )}

          {STEPS[step].id === "lifestyle" && (
            <div className="space-y-6">
              <div>
                <FieldLabel optional>Como es tu alimentacion habitual</FieldLabel>
                <TextArea
                  value={draft.lifestyle.nutritionHabits}
                  onChange={v => patch("lifestyle", { nutritionHabits: v })}
                  placeholder="Describe un dia tipico: que desayunas, comes y cenas, antojos, comida fuera de casa..."
                />
              </div>
              <div>
                <FieldLabel>Comidas al dia</FieldLabel>
                <ChipGroup
                  options={MEALS_PER_DAY}
                  value={draft.lifestyle.mealsPerDay}
                  onChange={v => patch("lifestyle", { mealsPerDay: v })}
                />
              </div>
              <div>
                <FieldLabel optional>Agua al dia</FieldLabel>
                <ChipGroup
                  options={HYDRATION}
                  value={draft.lifestyle.hydrationLitersPerDay}
                  onChange={v => patch("lifestyle", { hydrationLitersPerDay: v })}
                />
              </div>
              <div>
                <FieldLabel>Horas de sueño</FieldLabel>
                <ChipGroup
                  options={SLEEP_HOURS}
                  value={draft.lifestyle.sleepHours}
                  onChange={v => patch("lifestyle", { sleepHours: v })}
                />
              </div>
              <div>
                <FieldLabel>Calidad de tu sueño</FieldLabel>
                <ScaleSelector
                  value={draft.lifestyle.sleepQuality}
                  onChange={v => patch("lifestyle", { sleepQuality: v })}
                  lowLabel="Muy mala"
                  highLabel="Excelente"
                />
              </div>
              <div>
                <FieldLabel>Nivel de estres diario</FieldLabel>
                <ScaleSelector
                  value={draft.lifestyle.stressLevel}
                  onChange={v => patch("lifestyle", { stressLevel: v })}
                  lowLabel="Relajado"
                  highLabel="Muy estresado"
                />
              </div>
            </div>
          )}

          {STEPS[step].id === "availability" && (
            <div className="space-y-6">
              <div>
                <FieldLabel>Dias por semana que puedes entrenar</FieldLabel>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => patch("availability", { daysPerWeek: n })}
                      className={`aspect-square rounded-xl text-sm font-black transition-all ${
                        draft.availability.daysPerWeek === n
                          ? "bg-blue-600/40 border border-blue-500/70 text-white"
                          : "bg-white/[0.03] border border-white/[0.08] text-white/30 hover:bg-white/[0.06]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Tiempo por sesion</FieldLabel>
                <ChipGroup
                  options={SESSION_MINUTES}
                  value={draft.availability.minutesPerSession}
                  onChange={v => patch("availability", { minutesPerSession: v })}
                />
              </div>
              <div>
                <FieldLabel>Horario preferido</FieldLabel>
                <ChipGroup
                  options={PREFERRED_TIMES}
                  value={draft.availability.preferredTime}
                  onChange={v => patch("availability", { preferredTime: v })}
                />
              </div>
              <div>
                <FieldLabel optional>Equipamiento disponible</FieldLabel>
                <ChipGroup
                  options={EQUIPMENT}
                  value={draft.availability.equipment}
                  onChange={v => patch("availability", { equipment: v })}
                />
              </div>
              <div>
                <FieldLabel optional>Ejercicios que te gustan</FieldLabel>
                <TextArea
                  value={draft.availability.likedExercises}
                  onChange={v => patch("availability", { likedExercises: v })}
                  placeholder="Ej. Sentadilla, press de banca, dominadas..."
                />
              </div>
              <div>
                <FieldLabel optional>Ejercicios que detestas</FieldLabel>
                <TextArea
                  value={draft.availability.dislikedExercises}
                  onChange={v => patch("availability", { dislikedExercises: v })}
                  placeholder="Ej. Burpees, cardio en cinta, peso muerto..."
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</p>
          )}

          {/* Navegacion */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || submitting}
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/[0.03] border border-white/[0.08] text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!stepValid || submitting}
              className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              {submitting ? "Enviando..." : step === STEPS.length - 1 ? "Enviar evaluacion" : "Continuar"}
            </button>
          </div>
          </div>
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}
