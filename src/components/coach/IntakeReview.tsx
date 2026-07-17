import { useState } from "react";
import {
  PRIMARY_GOALS,
  ACTIVITY_LEVELS,
  OCCUPATIONS,
  EQUIPMENT,
  intakeLabel,
} from "../../lib/constants/intake";

/**
 * Vista del entrenador sobre el Cuestionario de Evaluacion Inicial de un
 * asesorado, con la accion de marcarlo como revisado.
 */

interface IntakeData {
  goals: {
    primaryGoal?: string;
    specificGoal?: string;
    motivation?: string;
    previousObstacles?: string;
  };
  health: {
    age?: number;
    heightCm?: number;
    injuries?: string;
    conditions?: string;
    medications?: string;
    recentActivityLevel?: string;
  };
  lifestyle: {
    nutritionHabits?: string;
    likedFoods?: string;
    dislikedFoods?: string;
    heavyFoods?: string;
    allergies?: string;
    mealsPerDay?: string;
    hydrationLitersPerDay?: string;
    sleepHours?: string;
    sleepQuality?: number;
    stressLevel?: number;
  };
  availability: {
    occupation?: string;
    occupationSchedule?: string;
    dailyRoutine?: string;
    daysPerWeek?: number;
    minutesPerSession?: string;
    preferredTime?: string;
    likedExercises?: string;
    dislikedExercises?: string;
    equipment?: string;
  };
}

interface IntakeReviewProps {
  athleteId: string;
  intake: IntakeData | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

function Answer({ label, value, alert = false }: { label: string; value: string | number | null | undefined; alert?: boolean }) {
  const text = value === undefined || value === null || value === "" ? "Sin respuesta" : String(value);
  const empty = text === "Sin respuesta";
  return (
    <div className="space-y-1">
      <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.3em]">{label}</p>
      <p className={`text-xs font-bold leading-relaxed ${
        empty ? "text-white/15 uppercase tracking-widest" : alert ? "text-orange-300" : "text-white/75"
      }`}>
        {text}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-black text-white uppercase tracking-tighter border-b border-white/[0.06] pb-2">
      {children}
    </h2>
  );
}

export function IntakeReview({ athleteId, intake, submittedAt, reviewedAt: initialReviewedAt }: IntakeReviewProps) {
  const [reviewedAt, setReviewedAt] = useState(initialReviewedAt);
  const [open, setOpen] = useState(!initialReviewedAt); // pendiente => abierto
  const [saving, setSaving] = useState(false);

  if (!intake) {
    return (
      <div className="p-6 rounded-[2rem] bg-[#0A0A0B] border border-white/10">
        <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.3em]">Evaluacion Inicial</p>
        <p className="text-sm font-black text-white/40 uppercase tracking-tight mt-2">
          El atleta aun no envia su cuestionario
        </p>
      </div>
    );
  }

  const markReviewed = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/coach/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId }),
      });
      if (res.ok) {
        const form = await res.json();
        setReviewedAt(form.reviewedAt);
      }
    } finally {
      setSaving(false);
    }
  };

  const hasHealthFlags = !!(
    intake.health.injuries?.trim() ||
    intake.health.conditions?.trim() ||
    intake.health.medications?.trim() ||
    intake.lifestyle.allergies?.trim()
  );

  return (
    <div className="rounded-[2rem] bg-[#0A0A0B] border border-white/10 overflow-hidden">
      {/* Cabecera colapsable */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div>
          <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.3em]">Evaluacion Inicial</p>
          <p className="text-lg font-black text-white uppercase tracking-tighter mt-1">
            Cuestionario del atleta
          </p>
          {submittedAt && (
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mt-1">
              Enviado el {new Date(submittedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {reviewedAt ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
              Revisado
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[8px] font-black text-orange-400 uppercase tracking-widest">
              Pendiente de revision
            </span>
          )}
          <span className={`text-white/30 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Objetivos */}
            <div className="space-y-4">
              <SectionTitle>Objetivos y motivacion</SectionTitle>
              <Answer label="Objetivo principal" value={intake.goals.primaryGoal ? intakeLabel(PRIMARY_GOALS, intake.goals.primaryGoal) : null} />
              <Answer label="Que quiere lograr exactamente" value={intake.goals.specificGoal} />
              <Answer label="Por que es importante" value={intake.goals.motivation} />
              <Answer label="Que se lo ha impedido" value={intake.goals.previousObstacles} />
            </div>

            {/* Salud */}
            <div className="space-y-4">
              <SectionTitle>Salud y estado fisico</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Answer label="Edad" value={intake.health.age ? `${intake.health.age} años` : null} />
                <Answer label="Estatura" value={intake.health.heightCm ? `${intake.health.heightCm} cm` : null} />
              </div>
              <Answer label="Actividad fisica reciente" value={intake.health.recentActivityLevel ? intakeLabel(ACTIVITY_LEVELS, intake.health.recentActivityLevel) : null} />
              <Answer label="Lesiones" value={intake.health.injuries} alert={!!intake.health.injuries?.trim()} />
              <Answer label="Condiciones medicas" value={intake.health.conditions} alert={!!intake.health.conditions?.trim()} />
              <Answer label="Medicamentos" value={intake.health.medications} alert={!!intake.health.medications?.trim()} />
            </div>

            {/* Habitos */}
            <div className="space-y-4">
              <SectionTitle>Habitos y nutricion</SectionTitle>
              <Answer label="Alimentacion habitual" value={intake.lifestyle.nutritionHabits} />
              <Answer label="Alergias alimentarias" value={intake.lifestyle.allergies} alert={!!intake.lifestyle.allergies?.trim()} />
              <Answer label="Comidas que le caen pesadas" value={intake.lifestyle.heavyFoods} alert={!!intake.lifestyle.heavyFoods?.trim()} />
              <div className="grid grid-cols-2 gap-4">
                <Answer label="Le gusta comer" value={intake.lifestyle.likedFoods} />
                <Answer label="No le gusta comer" value={intake.lifestyle.dislikedFoods} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Answer label="Comidas al dia" value={intake.lifestyle.mealsPerDay} />
                <Answer label="Hidratacion" value={intake.lifestyle.hydrationLitersPerDay} />
                <Answer label="Horas de sueño" value={intake.lifestyle.sleepHours} />
                <Answer label="Calidad de sueño" value={intake.lifestyle.sleepQuality != null ? `${intake.lifestyle.sleepQuality}/10` : null} />
                <Answer label="Estres" value={intake.lifestyle.stressLevel != null ? `${intake.lifestyle.stressLevel}/10` : null} />
              </div>
            </div>

            {/* Disponibilidad */}
            <div className="space-y-4">
              <SectionTitle>Disponibilidad y preferencias</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Answer label="Ocupacion" value={intake.availability.occupation ? intakeLabel(OCCUPATIONS, intake.availability.occupation) : null} />
                <Answer label="Horario de ocupacion" value={intake.availability.occupationSchedule} />
              </div>
              <Answer label="Tiempos en el dia" value={intake.availability.dailyRoutine} />
              <div className="grid grid-cols-2 gap-4">
                <Answer label="Dias por semana" value={intake.availability.daysPerWeek || null} />
                <Answer label="Tiempo por sesion" value={intake.availability.minutesPerSession} />
                <Answer label="Horario preferido" value={intake.availability.preferredTime} />
                <Answer label="Equipamiento" value={intake.availability.equipment ? intakeLabel(EQUIPMENT, intake.availability.equipment) : null} />
              </div>
              <Answer label="Ejercicios que le gustan" value={intake.availability.likedExercises} />
              <Answer label="Ejercicios que detesta" value={intake.availability.dislikedExercises} />
            </div>
          </div>

          {hasHealthFlags && !reviewedAt && (
            <p className="text-[9px] font-black text-orange-400/80 uppercase tracking-widest">
              Este atleta reporta antecedentes de salud. Revisalos antes de asignar su programa.
            </p>
          )}

          {!reviewedAt && (
            <button
              type="button"
              onClick={markReviewed}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-40"
            >
              {saving ? "Guardando..." : "Marcar como revisado"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
