import { pgTable, text, timestamp, uuid, integer, decimal, boolean, jsonb, date } from "drizzle-orm/pg-core";

// Tabla de ejercicios
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(), // 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body'
  equipment: text("equipment"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de sesiones de workout (anteriormente 'workouts' en algunos contextos, unificamos a workout_sessions)
export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Clerk userId (string)
  programId: uuid("program_id"),
  name: text("name").notNull(),
  date: date("date").notNull(), // Añadido para compatibilidad con la lógica anterior
  weekNumber: integer("week_number"), // Añadido para compatibilidad
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  overallRpe: integer("overall_rpe"), // Añadido para compatibilidad
  completed: boolean("completed").default(false), // Añadido para compatibilidad
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de sets
export const workoutSets = pgTable("workout_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutSessionId: uuid("workout_session_id")
    .references(() => workoutSessions.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id, { onDelete: "cascade" })
    .notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
  restSeconds: integer("rest_seconds"),
  rpe: integer("rpe"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de templates de workout
export const workoutTemplates = pgTable("workout_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Clerk userId (string)
  name: text("name").notNull(),
  description: text("description"),
  exercises: jsonb("exercises").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de programas de entrenamiento (Mesociclos)
export const trainingPrograms = pgTable("training_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"), // NULL si es un "Master Template" global
  name: text("name").notNull(),
  description: text("description"),
  
  // Metadatos Técnicos
  level: text("level"), // 'Beginner', 'Intermediate', 'Advanced', 'Elite'
  splitType: text("split_type"), // 'PPL', 'Arnold', 'UpperLower', 'FullBody', 'BroSplit'
  focus: text("focus"), // 'Hypertrophy', 'Strength', 'Powerbuilding', 'WeakPoint'
  
  durationWeeks: integer("duration_weeks").default(8),
  currentWeek: integer("current_week").default(1),
  active: boolean("active").default(false),
  isMaster: boolean("is_master").default(false), // Indica si es de la "Biblioteca de Hierro"
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de medidas corporales (Expandida para Hypertrofia)
export const bodyMeasurements = pgTable("body_measurements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  // Composición Básica
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }).notNull(),
  bodyFatPercentage: decimal("body_fat_percentage", { precision: 4, scale: 2 }),
  
  // Tren Superior
  neckCm: decimal("neck_cm", { precision: 5, scale: 2 }),
  shouldersCm: decimal("shoulders_cm", { precision: 5, scale: 2 }),
  chestCm: decimal("chest_cm", { precision: 5, scale: 2 }),
  
  // Brazos (Simetría)
  armLeftCm: decimal("arm_left_cm", { precision: 5, scale: 2 }),
  armRightCm: decimal("arm_right_cm", { precision: 5, scale: 2 }),
  forearmLeftCm: decimal("forearm_left_cm", { precision: 5, scale: 2 }),
  forearmRightCm: decimal("forearm_right_cm", { precision: 5, scale: 2 }),
  
  // Tronco y Cadera
  waistCm: decimal("waist_cm", { precision: 5, scale: 2 }),
  hipsCm: decimal("hips_cm", { precision: 5, scale: 2 }),
  
  // Piernas (Simetría)
  thighLeftCm: decimal("thigh_left_cm", { precision: 5, scale: 2 }),
  thighRightCm: decimal("thigh_right_cm", { precision: 5, scale: 2 }),
  calfLeftCm: decimal("calf_left_cm", { precision: 5, scale: 2 }),
  calfRightCm: decimal("calf_right_cm", { precision: 5, scale: 2 }),
  
  // Biofeedback (1-10)
  sleepQuality: integer("sleep_quality"),
  energyLevel: integer("energy_level"),
  stressLevel: integer("stress_level"),

  // Foto de progreso (base64 comprimida client-side)
  photoUrl: text("photo_url"),

  measuredAt: timestamp("measured_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de logs de nutrición
export const nutritionLogs = pgTable("nutrition_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  mealName: text("meal_name").notNull(),
  calories: decimal("calories", { precision: 7, scale: 2 }).notNull(),
  proteinG: decimal("protein_g", { precision: 6, scale: 2 }),
  carbsG: decimal("carbs_g", { precision: 6, scale: 2 }),
  fatsG: decimal("fats_g", { precision: 6, scale: 2 }),
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de objetivos nutricionales (Metas diarias)
export const nutritionTargets = pgTable("nutrition_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  calories: integer("calories").notNull().default(2500),
  proteinG: integer("protein_g").notNull().default(180),
  carbsG: integer("carbs_g").notNull().default(300),
  fatsG: integer("fats_g").notNull().default(70),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabla de comidas frecuentes (Staples)
export const nutritionStaples = pgTable("nutrition_staples", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  calories: decimal("calories", { precision: 7, scale: 2 }).notNull(),
  proteinG: decimal("protein_g", { precision: 6, scale: 2 }),
  carbsG: decimal("carbs_g", { precision: 6, scale: 2 }),
  fatsG: decimal("fats_g", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});



