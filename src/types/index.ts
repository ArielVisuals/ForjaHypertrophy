/**
 * Tipos TypeScript para Forja Hypertrophy App
 */

import type { DayType, Phase, MuscleGroup } from "@/lib/constants";

// ============================================
// USUARIO Y PERFIL
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  // Datos físicos
  age: number;
  height: number; // cm
  weight_initial: number; // kg
  body_fat_initial?: number; // %
  experience_months: number;
  // Objetivos
  goal_mass_gain: number; // kg
  goal_weeks: number;
  // Preferencias entrenamiento
  training_days: number;
  session_duration: number; // minutos
  gym_access: "complete" | "basic" | "home";
}

// ============================================
// ENTRENAMIENTOS
// ============================================

export interface PreWorkoutCheck {
  sleep: number; // 1-10
  energy: number; // 1-10
  doms: number; // 1-10 (Delayed Onset Muscle Soreness)
  food_hours: number; // horas desde última comida
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  day_type: DayType;
  week_number: number;
  phase: Phase;
  duration_minutes?: number;
  overall_rpe?: number; // 1-10
  notes?: string;
  pre_workout?: PreWorkoutCheck;
  completed: boolean;
  created_at: string;
  exercises?: Exercise[];
}

export interface ExerciseSet {
  set_number: number;
  weight: number; // kg
  reps: number;
  rpe?: number; // 1-10
  rest_seconds?: number;
  notes?: string;
  completed: boolean;
}

export interface Exercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  exercise_order: number;
  sets: ExerciseSet[];
  target_sets: number;
  target_reps: string; // "6-8", "10-12", etc
  target_rpe: string; // "7-8", "8-9", etc
  technique_cues?: string[];
  muscle_group: MuscleGroup;
  completed: boolean;
}

// ============================================
// MEDIDAS CORPORALES
// ============================================

export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  // Perímetros (cm)
  neck?: number;
  shoulders?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arm_right_relaxed?: number;
  arm_right_flexed?: number;
  arm_left_relaxed?: number;
  arm_left_flexed?: number;
  forearm_right?: number;
  forearm_left?: number;
  thigh_right?: number;
  thigh_left?: number;
  calf_right?: number;
  calf_left?: number;
  // Fotos
  photos?: string[]; // URLs Supabase Storage
  created_at: string;
}

// ============================================
// NUTRICIÓN
// ============================================

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  meals_completed: number; // de 5
  protein_grams: number;
  calories_estimated: number;
  water_liters: number;
  post_workout_timing?: number; // minutos después de entreno
  notes?: string;
  created_at: string;
}

// ============================================
// RÉCORDS PERSONALES
// ============================================

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  record_type: "1RM" | "max_reps" | "volume";
  value: number;
  date_achieved: string;
  workout_id?: string;
  created_at: string;
}

// ============================================
// PROGRAMA/TEMPLATE
// ============================================

export interface ExerciseTemplate {
  exercise_name: string;
  exercise_order: number;
  target_sets: number;
  target_reps: string;
  target_rpe: string;
  technique_cues: string[];
  muscle_group: MuscleGroup;
}

export interface ProgramTemplate {
  id: string;
  user_id: string;
  week_number: number;
  day_type: DayType;
  phase: Phase;
  exercises: ExerciseTemplate[];
  created_at: string;
}

// ============================================
// LOGROS/ACHIEVEMENTS
// ============================================

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress?: number; // % para achievements progresivos
}

// ============================================
// ANALYTICS/STATS
// ============================================

export interface StrengthProgress {
  exercise_name: string;
  date: string;
  estimated_1rm: number;
  total_volume: number;
}

export interface VolumeByMuscle {
  muscle_group: MuscleGroup;
  total_sets: number;
  total_volume: number; // kg × reps × sets
  week_number: number;
}

export interface WeeklyStats {
  week_number: number;
  total_workouts: number;
  total_sets: number;
  total_volume: number;
  average_rpe: number;
  adherence_percentage: number;
}

// ============================================
// UI/COMPONENTS
// ============================================

export interface CalendarDay {
  date: string;
  day_type: DayType | "REST";
  completed: boolean;
  isToday: boolean;
}

export interface QuickStat {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// ============================================
// FORMS
// ============================================

export interface WorkoutLogForm {
  date: string;
  day_type: DayType;
  pre_workout: PreWorkoutCheck;
  exercises: {
    exercise_name: string;
    sets: Omit<ExerciseSet, "completed">[];
  }[];
  overall_rpe: number;
  notes?: string;
}

export interface MeasurementForm {
  date: string;
  weight: number;
  measurements: Partial<Omit<BodyMeasurement, "id" | "user_id" | "date" | "weight" | "photos" | "created_at">>;
  photos?: File[];
}

export interface NutritionForm {
  date: string;
  meals_completed: number;
  protein_grams: number;
  calories_estimated: number;
  water_liters: number;
  post_workout_timing?: number;
  notes?: string;
}

// ============================================
// CALCULADORAS
// ============================================

export interface OneRMCalculation {
  weight: number;
  reps: number;
  estimated_1rm: number;
  formula: "epley" | "brzycki" | "lombardi";
}

export interface PlateCalculation {
  total_weight: number;
  bar_weight: number;
  plates_per_side: Array<{
    weight: number;
    quantity: number;
  }>;
}

// ============================================
// HELPERS DE RESPUESTA SUPABASE
// ============================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
