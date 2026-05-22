/**
 * Tipos para el sistema de tracking de workouts
 */

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment?: string;
  instructions?: string;
  created_at: string;
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "full_body";

export interface WorkoutSession {
  id: string;
  user_id: string;
  program_id?: string;
  name: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg?: number;
  rest_seconds?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  created_at: string;
}

export interface TemplateExercise {
  exercise_id: string;
  order: number;
  target_sets: number;
  target_reps: number;
  rest_seconds: number;
}

// Tipo para el estado de un workout en progreso
export interface ActiveWorkout {
  session: WorkoutSession;
  exercises: Array<{
    exercise: Exercise;
    sets: WorkoutSet[];
    currentSet: number;
  }>;
  startTime: Date;
  elapsedTime: number;
}
