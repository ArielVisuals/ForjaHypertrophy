/**
 * Opciones y etiquetas del Cuestionario de Evaluacion Inicial.
 * Fuente unica para el formulario del atleta (OnboardingForm) y la
 * vista de revision del entrenador (IntakeReview).
 */

export const PRIMARY_GOALS = [
  { value: "fat_loss",     label: "PERDER GRASA" },
  { value: "muscle_gain",  label: "GANAR MUSCULO" },
  { value: "recomp",       label: "RECOMPOSICION" },
  { value: "health",       label: "SALUD GENERAL" },
  { value: "performance",  label: "RENDIMIENTO" },
];

export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "SEDENTARIO",  desc: "Sin ejercicio en los ultimos meses" },
  { value: "light",     label: "LIGERO",      desc: "Ejercicio ocasional, 1-2 veces por semana" },
  { value: "moderate",  label: "MODERADO",    desc: "Entreno regular, 2-3 veces por semana" },
  { value: "active",    label: "ACTIVO",      desc: "Entreno constante, 4+ veces por semana" },
];

export const MEALS_PER_DAY = ["1-2", "3", "4", "5+"];
export const HYDRATION = ["MENOS DE 1L", "1-2L", "2-3L", "3L+"];
export const SLEEP_HOURS = ["MENOS DE 6H", "6-7H", "7-8H", "8H+"];
export const SESSION_MINUTES = ["30-45 MIN", "45-60 MIN", "60-90 MIN", "90+ MIN"];
export const PREFERRED_TIMES = ["MANANA", "MEDIODIA", "TARDE", "NOCHE"];

export const EQUIPMENT = [
  { value: "full_gym",   label: "GIMNASIO COMPLETO" },
  { value: "basic_gym",  label: "GIMNASIO BASICO" },
  { value: "home",       label: "EQUIPO EN CASA" },
  { value: "bodyweight", label: "SOLO PESO CORPORAL" },
];

/** Resuelve el label de una opcion por su value (para mostrar respuestas guardadas). */
export function intakeLabel(options: { value: string; label: string }[], value: string): string {
  return options.find(o => o.value === value)?.label ?? value;
}
